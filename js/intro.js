// Intro: el logo se arma pieza por pieza y el cuadro ロ se abre como una ventana
// por la que la cámara entra a la página.
(function () {
  const raiz = document.documentElement;
  const idioma = raiz.lang || 'es';
  const T = (window.RONOVA_TEXTOS && (window.RONOVA_TEXTOS[idioma] || window.RONOVA_TEXTOS.es)) || {};
  const mundo = window.RonovaMundo;
  const L = window.RONOVA_LOGO;
  if (!raiz.classList.contains('con-intro') || !L) {
    mundo.alTerminarIntro();
    return;
  }

  const ns = 'http://www.w3.org/2000/svg';
  const MORADO = '#8B5CF6'; // morado del kit para fondos oscuros
  const temporizadores = [];
  const despues = (ms, fn) => temporizadores.push(setTimeout(fn, ms));
  let terminada = false;
  let cuadroAnimacion = 0;

  document.body.classList.add('en-intro');
  window.scrollTo(0, 0);

  const capa = document.createElement('div');
  capa.className = 'intro';
  capa.setAttribute('aria-hidden', 'true');
  capa.innerHTML = `
    <svg viewBox="${L.viewBox}">
      <defs>
        <mask id="intro-brocha" maskUnits="userSpaceOnUse" x="-20" y="-20" width="260" height="260">
          <path class="trazo" d="M181,-6 Q169,147 4,203" fill="none" stroke="#fff" stroke-width="46"
                stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>
        </mask>
        <clipPath id="intro-letras"><rect x="240" y="-8" width="700" height="122"/></clipPath>
      </defs>
      <g class="brocha-grupo"><path d="${L.brocha}" fill="#fff" mask="url(#intro-brocha)"/></g>
      <path class="cuadro" d="${L.cuadro}" fill="${MORADO}" fill-rule="evenodd"/>
      <g clip-path="url(#intro-letras)">${L.letras.map((d) => `<path class="letra" d="${d}" fill="#fff"/>`).join('')}</g>
      <g class="studio">${L.studio.map((d) => `<path d="${d}" fill="#fff"/>`).join('')}</g>
    </svg>
    <p class="intro__cuenta" aria-hidden="true">000</p>
    <p class="intro__meta intro__meta--izq" lang="ja">ロノヴァ・スタジオ</p>
    <p class="intro__meta intro__meta--der">Caracas 10°30′N — Tokio 35°41′N</p>
    <button class="intro__saltar" type="button">${T.saltarIntro || 'saltar intro'}</button>`;
  document.body.append(capa);

  const logo = capa.querySelector('svg');
  const cuadro = capa.querySelector('.cuadro');
  const trazo = capa.querySelector('.trazo');
  const letras = [...capa.querySelectorAll('.letra')];
  const studio = capa.querySelector('.studio');
  const salen = [capa.querySelector('.brocha-grupo'), studio, ...letras];
  const lleno = { fill: 'both' };

  [cuadro, ...letras, studio].forEach((el) => { el.style.transformBox = 'fill-box'; el.style.transformOrigin = 'center'; });

  const cuenta = capa.querySelector('.intro__cuenta');
  const metas = [...capa.querySelectorAll('.intro__meta')];
  const salida = (t) => 1 - Math.pow(1 - t, 3);

  // 0. El contador sube de 000 a 100 mientras carga la página.
  const CUENTA = 3200;
  const inicioCuenta = performance.now();
  (function contar(ahora) {
    if (terminada) return;
    const t = Math.min(1, (ahora - inicioCuenta) / CUENTA);
    cuenta.textContent = String(Math.round(salida(t) * 100)).padStart(3, '0');
    if (t < 1) requestAnimationFrame(contar);
  })(inicioCuenta);
  metas.forEach((m, k) => m.animate(
    [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
    { ...lleno, duration: 700, delay: 150 + k * 120, easing: 'cubic-bezier(.16,1,.3,1)' },
  ));

  // 1. El cuadro ロ se enciende como un neón de Tokio: parpadea y se queda.
  cuadro.animate(
    [
      { opacity: 0, transform: 'scale(.86)', filter: 'drop-shadow(0 0 0 #8B5CF6)' },
      { opacity: 1, offset: 0.12 },
      { opacity: 0.1, offset: 0.2 },
      { opacity: 1, offset: 0.3 },
      { opacity: 0.25, offset: 0.38 },
      { opacity: 1, offset: 0.48, filter: 'drop-shadow(0 0 22px #8B5CF6)' },
      { opacity: 1, transform: 'scale(1)', filter: 'drop-shadow(0 0 6px #8B5CF6)' },
    ],
    { ...lleno, duration: 1100, delay: 250, easing: 'linear' },
  );
  // 2. El trazo ノ se pinta de arriba abajo, como una pincelada.
  trazo.animate(
    [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
    { ...lleno, duration: 620, delay: 1100, easing: 'cubic-bezier(.65,0,.35,1)' },
  );
  // 3. Las letras de RONOVA suben desenfocadas y se enfocan.
  letras.forEach((letra, i) => letra.animate(
    [{ transform: 'translateY(130px)', filter: 'blur(10px)' }, { transform: 'translateY(0)', filter: 'blur(0)' }],
    { ...lleno, duration: 900, delay: 1450 + i * 75, easing: 'cubic-bezier(.16,1,.3,1)' },
  ));
  // 4. STUDIO entra comprimiéndose.
  studio.animate(
    [{ opacity: 0, transform: 'scaleX(1.7)' }, { opacity: 1, transform: 'scaleX(1)' }],
    { ...lleno, duration: 900, delay: 2150, easing: 'cubic-bezier(.16,1,.3,1)' },
  );
  // 5. Al llegar a 100 todo se va menos el cuadro.
  despues(3300, () => [...salen, cuenta, ...metas].forEach((el) => el.animate(
    [{ opacity: 1 }, { opacity: 0 }],
    { ...lleno, duration: 380, easing: 'ease-out' },
  )));
  // El neón se apaga un instante antes de abrirse, para que el cambio no se note.
  despues(3350, () => cuadro.animate(
    [{ filter: 'drop-shadow(0 0 6px #8B5CF6)' }, { filter: 'drop-shadow(0 0 0 #8B5CF6)' }],
    { ...lleno, duration: 300, easing: 'ease-out' },
  ));
  // 6. El cuadro se abre.
  despues(3700, abrir);

  // El mismo cuadro del logo se abre en su sitio: su hueco crece hasta cubrir
  // la pantalla y por él se ve la página.
  function abrir() {
    const r = cuadro.getBoundingClientRect();
    const W = window.innerWidth;
    const H = window.innerHeight;
    const s0 = r.width / 106;
    const x0 = r.left + r.width / 2;
    const y0 = r.top + r.height / 2;
    // Escala a la que el hueco (27 de radio) llega a la esquina más lejana.
    const lejos = Math.max(x0, W - x0, y0, H - y0) * 1.08;
    const K = lejos / 27;

    const ventana = document.createElementNS(ns, 'svg');
    ventana.setAttribute('class', 'ventana');
    ventana.setAttribute('viewBox', `0 0 ${W} ${H}`);
    ventana.setAttribute('preserveAspectRatio', 'none');
    ventana.innerHTML = `
      <g transform="translate(${x0} ${y0}) scale(${s0})">
        <path fill="#000" fill-rule="evenodd" d="M-9000,-9000H9000V9000H-9000Z M-53,-53V53H53V-53Z"/>
        <path class="ventana__marco" fill="${MORADO}" fill-rule="evenodd" d="M-53,-53H53V53H-53Z M-27,-27V27H27V-27Z"
/>
      </g>`;
    const g = ventana.querySelector('g');
    const marco = ventana.querySelector('.ventana__marco');
    // El cambio pasa en el mismo cuadro de pintura: nunca se ven dos cuadros.
    capa.append(ventana);
    cuadro.style.visibility = 'hidden';
    capa.classList.add('abierta');
    logo.style.visibility = 'hidden';

    const DURA = 1500;
    const inicio = performance.now();
    // Arranca despacio, como si tomara aire, y se lanza.
    const lanzar = (t) => (t < 0.18 ? 0.04 * (t / 0.18) : 0.04 + 0.96 * Math.pow((t - 0.18) / 0.82, 3));

    function paso(ahora) {
      const t = Math.min(1, (ahora - inicio) / DURA);
      const s = s0 * Math.pow(K / s0, lanzar(t));
      g.setAttribute('transform', `translate(${x0} ${y0}) scale(${s})`);
      marco.style.opacity = String(1 - Math.max(0, (t - 0.75) / 0.25));
      if (t < 1) cuadroAnimacion = requestAnimationFrame(paso);
      else terminar();
    }
    cuadroAnimacion = requestAnimationFrame(paso);
  }

  function terminar() {
    if (terminada) return;
    terminada = true;
    temporizadores.forEach(clearTimeout);
    cancelAnimationFrame(cuadroAnimacion);
    capa.remove();
    document.body.classList.remove('en-intro');
    document.removeEventListener('keydown', alTeclear);
    mundo.alTerminarIntro();
  }

  function alTeclear(e) {
    if (['Escape', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      terminar();
    }
  }
  capa.addEventListener('click', terminar);
  document.addEventListener('keydown', alTeclear);
})();
