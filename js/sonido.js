// Música de Ronova Studio, generada en vivo: nunca suena igual dos veces.
// Pads de acordes nocturnos, notas sueltas de escala pentatónica con eco (como un
// koto), un bajo suave y lluvia de fondo. Los navegadores no dejan sonar nada
// hasta que la persona toca la página, así que arranca con el primer clic.
(function () {
  const CLAVE = 'ronova-sonido';
  let ctx, maestro, reverb, eco, programador;
  let encendido = false;
  let acorde = 0;
  let siguienteAcorde = 0;
  let siguienteNota = 0;
  const avisos = new Set();

  const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
  // Fmaj9, Em7, Dm9, Cmaj7: una vuelta nocturna, sin resolver nunca del todo.
  const ACORDES = [
    [53, 57, 60, 64, 67],
    [52, 55, 59, 62],
    [50, 53, 57, 60, 64],
    [48, 52, 55, 59],
  ];
  const PENTATONICA = [69, 72, 74, 76, 79, 81, 84, 86];
  const COMPAS = 8; // segundos por acorde

  function montar() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    maestro = ctx.createGain();
    maestro.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    maestro.connect(comp).connect(ctx.destination);

    // Reverb: una sala larga hecha con ruido que se apaga.
    reverb = ctx.createConvolver();
    const largo = ctx.sampleRate * 3.2;
    const impulso = ctx.createBuffer(2, largo, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = impulso.getChannelData(c);
      for (let i = 0; i < largo; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / largo, 2.6);
    }
    reverb.buffer = impulso;
    const retorno = ctx.createGain();
    retorno.gain.value = 0.55;
    reverb.connect(retorno).connect(maestro);

    // Eco de las notas sueltas.
    eco = ctx.createDelay(1);
    eco.delayTime.value = 0.42;
    const realimenta = ctx.createGain();
    realimenta.gain.value = 0.38;
    const filtroEco = ctx.createBiquadFilter();
    filtroEco.type = 'lowpass';
    filtroEco.frequency.value = 2200;
    eco.connect(filtroEco).connect(realimenta).connect(eco);
    filtroEco.connect(reverb);
    filtroEco.connect(maestro);

    lluvia();
  }

  function lluvia() {
    const largo = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, largo, ctx.sampleRate);
    const d = buffer.getChannelData(0);
    for (let i = 0; i < largo; i++) d[i] = Math.random() * 2 - 1;
    const ruido = ctx.createBufferSource();
    ruido.buffer = buffer;
    ruido.loop = true;
    const banda = ctx.createBiquadFilter();
    banda.type = 'bandpass';
    banda.frequency.value = 2600;
    banda.Q.value = 0.6;
    const g = ctx.createGain();
    g.gain.value = 0.018;
    ruido.connect(banda).connect(g).connect(maestro);
    ruido.start();
  }

  function pad(t, notas) {
    const filtro = ctx.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.setValueAtTime(500, t);
    filtro.frequency.linearRampToValueAtTime(1300, t + COMPAS * 0.5);
    filtro.frequency.linearRampToValueAtTime(600, t + COMPAS + 2);
    filtro.Q.value = 0.8;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.05, t + 2.6);
    env.gain.setValueAtTime(0.05, t + COMPAS - 0.5);
    env.gain.linearRampToValueAtTime(0, t + COMPAS + 2.5);
    filtro.connect(env);
    env.connect(maestro);
    env.connect(reverb);
    notas.forEach((n) => {
      [-7, 7].forEach((cents) => {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = hz(n);
        o.detune.value = cents;
        o.connect(filtro);
        o.start(t);
        o.stop(t + COMPAS + 3);
      });
    });
    // Bajo: la raíz una octava abajo.
    const b = ctx.createOscillator();
    b.type = 'sine';
    b.frequency.value = hz(notas[0] - 12);
    const gb = ctx.createGain();
    gb.gain.setValueAtTime(0, t);
    gb.gain.linearRampToValueAtTime(0.09, t + 1.5);
    gb.gain.linearRampToValueAtTime(0, t + COMPAS + 1);
    b.connect(gb).connect(maestro);
    b.start(t);
    b.stop(t + COMPAS + 1.2);
  }

  function nota(t) {
    const n = PENTATONICA[Math.floor(Math.random() * PENTATONICA.length)];
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = hz(n);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.06, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0008, t + 1.6);
    const panorama = ctx.createStereoPanner();
    panorama.pan.value = Math.random() * 1.2 - 0.6;
    o.connect(g).connect(panorama);
    panorama.connect(maestro);
    panorama.connect(eco);
    o.start(t);
    o.stop(t + 1.8);
  }

  // Programa los sonidos un poco por delante del reloj del audio.
  function programar() {
    const ahora = ctx.currentTime;
    while (siguienteAcorde < ahora + 1) {
      pad(siguienteAcorde, ACORDES[acorde % ACORDES.length]);
      acorde++;
      siguienteAcorde += COMPAS;
    }
    while (siguienteNota < ahora + 1) {
      if (Math.random() < 0.7) nota(siguienteNota);
      siguienteNota += 0.42 * (2 + Math.floor(Math.random() * 6));
    }
  }

  function iniciar() {
    if (encendido || localStorage.getItem(CLAVE) === 'no') return;
    if (!ctx) montar();
    ctx.resume();
    encendido = true;
    siguienteAcorde = Math.max(siguienteAcorde, ctx.currentTime + 0.1);
    siguienteNota = Math.max(siguienteNota, ctx.currentTime + 2);
    clearInterval(programador);
    programador = setInterval(programar, 250);
    programar();
    maestro.gain.cancelScheduledValues(ctx.currentTime);
    maestro.gain.setTargetAtTime(0.7, ctx.currentTime, 1.2);
    avisar();
  }

  function apagar() {
    if (!encendido) return;
    encendido = false;
    maestro.gain.cancelScheduledValues(ctx.currentTime);
    maestro.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
    setTimeout(() => { if (!encendido) { clearInterval(programador); ctx.suspend(); } }, 1200);
    avisar();
  }

  function alternar() {
    if (encendido) {
      localStorage.setItem(CLAVE, 'no');
      apagar();
    } else {
      localStorage.removeItem(CLAVE);
      iniciar();
    }
  }

  // Ráfaga de aire al cambiar de sesión, hacia el lado del viaje.
  function whoosh(dx = 0, dy = 1) {
    if (!encendido) return;
    const t = ctx.currentTime;
    const largo = ctx.sampleRate * 0.9;
    const buffer = ctx.createBuffer(1, largo, ctx.sampleRate);
    const d = buffer.getChannelData(0);
    for (let i = 0; i < largo; i++) d[i] = Math.random() * 2 - 1;
    const ruido = ctx.createBufferSource();
    ruido.buffer = buffer;
    const banda = ctx.createBiquadFilter();
    banda.type = 'bandpass';
    banda.Q.value = 1.4;
    banda.frequency.setValueAtTime(dy ? 260 : 420, t);
    banda.frequency.exponentialRampToValueAtTime(dy ? 1800 : 2600, t + 0.55);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.16, t + 0.32);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.85);
    const panorama = ctx.createStereoPanner();
    panorama.pan.setValueAtTime(-dx * 0.7, t);
    panorama.pan.linearRampToValueAtTime(dx * 0.7, t + 0.8);
    ruido.connect(banda).connect(g).connect(panorama);
    panorama.connect(maestro);
    panorama.connect(reverb);
    ruido.start(t);
  }

  function avisar() { avisos.forEach((fn) => fn(encendido)); }

  window.RonovaSonido = {
    iniciar,
    alternar,
    whoosh,
    get encendido() { return encendido; },
    get silenciado() { return localStorage.getItem(CLAVE) === 'no'; },
    alCambiar(fn) { avisos.add(fn); fn(encendido); },
  };
})();
