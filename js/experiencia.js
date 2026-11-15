// Los detalles que se sienten: menú a pantalla completa, reloj Caracas–Tokio,
// botón de sonido, cursor ロ, botones magnéticos y el foco de color sobre las
// fotos de Tokio.
(function () {
  const raiz = document.documentElement;
  const idioma = raiz.lang || 'es';
  const T = (window.RONOVA_TEXTOS && (window.RONOVA_TEXTOS[idioma] || window.RONOVA_TEXTOS.es)) || {};
  const prefijo = /^(en|ja)$/.test(idioma) ? '../' : '';
  const fino = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sonido = window.RonovaSonido;

  // Qué sesión se ve ahora: los efectos de las demás se quedan quietos.
  let sesionVisible = 'inicio';
  document.addEventListener('ronova:sesion', (e) => { sesionVisible = e.detail; });
  const sesionDe = (el) => el.closest('.sesion')?.id;

  // ---------- Menú ----------
  // Se abre como un círculo que crece desde el botón y se cierra volviendo a él.
  // Cada animación cancela la anterior, así abrir y cerrar rápido nunca se enreda.
  const menu = document.getElementById('menu');
  const botonMenu = document.querySelector('.barra__menu');
  const enlaces = [...menu.querySelectorAll('.menu__nav a')];
  const lado = menu.querySelector('.menu__lado');
  const CORTINA = 'cubic-bezier(.77,0,.18,1)';
  const SUAVE = 'cubic-bezier(.16,1,.3,1)';
  let menuAbierto = false;
  let animaciones = [];

  function parar() {
    animaciones.forEach((a) => a.cancel());
    animaciones = [];
  }
  function circulo() {
    const r = botonMenu.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const radio = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    return [`circle(0px at ${x}px ${y}px)`, `circle(${radio}px at ${x}px ${y}px)`];
  }

  function abrir() {
    if (menuAbierto) return;
    menuAbierto = true;
    parar();
    menu.hidden = false;
    encenderRed();
    raiz.classList.add('menu-abierto');
    botonMenu.setAttribute('aria-expanded', 'true');
    botonMenu.textContent = T.cerrar || 'cerrar';
    if (!quieto) {
      const [chico, grande] = circulo();
      animaciones.push(menu.animate([{ clipPath: chico }, { clipPath: grande }], { duration: 760, easing: CORTINA }));
      enlaces.forEach((a, k) => animaciones.push(a.animate(
        [{ opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1 }],
        { duration: 700, delay: 260 + k * 60, easing: SUAVE, fill: 'backwards' },
      )));
      animaciones.push(menu.querySelector('.menu__conexiones').animate(
        [{ opacity: 0 }, { opacity: 1 }], { duration: 900, delay: 500, easing: 'ease-out', fill: 'backwards' },
      ));
      animaciones.push(lado.animate(
        [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }],
        { duration: 700, delay: 420, easing: SUAVE, fill: 'backwards' },
      ));
    }
    enlaces[0].focus({ preventScroll: true });
  }

  function cerrar(devolverFoco = true) {
    if (!menuAbierto) return;
    menuAbierto = false;
    parar();
    raiz.classList.remove('menu-abierto');
    botonMenu.setAttribute('aria-expanded', 'false');
    botonMenu.textContent = T.menu || 'menú';
    if (devolverFoco) botonMenu.focus({ preventScroll: true });
    if (quieto) { menu.hidden = true; return; }
    const [chico, grande] = circulo();
    enlaces.forEach((a, k) => animaciones.push(a.animate(
      [{ opacity: 1 }, { opacity: 0, scale: 0.8 }],
      { duration: 220, delay: k * 18, easing: 'ease-in', fill: 'forwards' },
    )));
    const cierre = menu.animate([{ clipPath: grande }, { clipPath: chico }], { duration: 560, delay: 120, easing: CORTINA, fill: 'forwards' });
    animaciones.push(cierre);
    // Solo se esconde si nadie lo volvió a abrir mientras se cerraba.
    cierre.onfinish = () => { if (!menuAbierto) { parar(); menu.hidden = true; } };
  }

  // ---------- La red de neuronas del menú ----------
  // Cada sesión es un nodo; las conexiones son curvas por donde viajan pulsos.
  const red = menu.querySelector('.menu__red');
  const svgRed = menu.querySelector('.menu__conexiones');
  const ns = 'http://www.w3.org/2000/svg';
  // Posiciones en % del área de la red: horizontal en PC, vertical en celular.
  // De arriba hacia abajo, en zigzag para que los nombres no choquen.
  const EN_PC = [[34, 4], [64, 14], [26, 25], [58, 35], [82, 45], [44, 55], [14, 65], [52, 75], [80, 85], [40, 96]];
  const EN_CELULAR = [[50, 5], [18, 15], [80, 22], [44, 33], [14, 45], [74, 50], [38, 63], [82, 72], [20, 82], [58, 94]];
  // El camino de la página (1→2→…→10) y algunos atajos, para que parezca una red.
  const CONEXIONES = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [0, 2], [1, 3], [1, 4], [3, 5], [4, 6], [5, 7], [6, 8], [6, 9], [2, 5]];
  // Las 9 primeras forman el camino de la página; el resto son atajos decorativos, sin pulso.
  const CAMINO = 9;
  const lineas = CONEXIONES.map((_, k) => { const p = document.createElementNS(ns, 'path'); p.setAttribute('class', k < CAMINO ? 'conexion camino' : 'conexion'); svgRed.append(p); return p; });
  const pulsos = CONEXIONES.map((_, k) => { const c = document.createElementNS(ns, 'circle'); c.setAttribute('class', 'pulso'); c.setAttribute('r', '2.6'); if (k >= CAMINO) c.style.display = 'none'; svgRed.append(c); return c; });
  // Los pulsos del camino salen uno detrás de otro: se lee como algo que avanza del 1 al 10.
  const desfase = CONEXIONES.map((_, k) => (1 - k * 0.11 + 10) % 1);
  let encendido = -1;
  let anchoRed = 0, altoRed = 0, cuadroRed = 0;
  enlaces.forEach((a, i) => {
    a.addEventListener('pointerenter', () => { encendido = i; });
    a.addEventListener('pointerleave', () => { if (encendido === i) encendido = -1; });
    a.addEventListener('focus', () => { if (a.matches(':focus-visible')) encendido = i; });
    a.addEventListener('blur', () => { if (encendido === i) encendido = -1; });
  });
  function medirRed() {
    anchoRed = red.offsetWidth; altoRed = red.offsetHeight;
    svgRed.setAttribute('viewBox', `0 0 ${anchoRed} ${altoRed}`);
  }
  function latir(ahora) {
    const t = ahora / 1000;
    const lugares = fino ? EN_PC : EN_CELULAR;
    // Cada neurona flota un poco, a su ritmo.
    const pts = lugares.map(([x, y], i) => [
      (x / 100) * anchoRed + (quieto ? 0 : Math.sin(t * 0.55 + i * 1.7) * 7),
      (y / 100) * altoRed + (quieto ? 0 : Math.cos(t * 0.45 + i * 2.3) * 6),
    ]);
    enlaces.forEach((a, i) => { a.style.transform = `translate3d(${pts[i][0]}px, ${pts[i][1]}px, 0)`; });
    CONEXIONES.forEach(([i, j], k) => {
      const [x1, y1] = pts[i], [x2, y2] = pts[j];
      // Curva suave: el punto de control se aparta de la recta, alternando el lado.
      const lado = k % 2 ? 1 : -1;
      const cx = (x1 + x2) / 2 - (y2 - y1) * 0.18 * lado;
      const cy = (y1 + y2) / 2 + (x2 - x1) * 0.18 * lado;
      lineas[k].setAttribute('d', `M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`);
      const viva = encendido === i || encendido === j;
      lineas[k].classList.toggle('viva', viva);
      pulsos[k].classList.toggle('viva', viva);
      // El pulso recorre la curva; en las conexiones encendidas va más rápido.
      const u = quieto ? 0.5 : (t * (viva ? 0.9 : 0.28) + desfase[k]) % 1;
      const v = 1 - u;
      pulsos[k].setAttribute('cx', v * v * x1 + 2 * v * u * cx + u * u * x2);
      pulsos[k].setAttribute('cy', v * v * y1 + 2 * v * u * cy + u * u * y2);
    });
    if (menuAbierto) cuadroRed = requestAnimationFrame(latir);
  }
  function encenderRed() {
    medirRed();
    cancelAnimationFrame(cuadroRed);
    cuadroRed = requestAnimationFrame(latir);
  }
  window.addEventListener('resize', () => { if (menuAbierto) medirRed(); });

  botonMenu.addEventListener('click', () => (menuAbierto ? cerrar() : abrir()));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrar(); });
  enlaces.forEach((a) => a.addEventListener('click', () => cerrar(false)));
  menu.querySelector('[data-whatsapp]').addEventListener('click', () => cerrar(false));


  // ---------- Tono del logo en modo apilado: según la sesión que pasa bajo la barra ----------
  raiz.dataset.tono = 'morado';
  if (!raiz.classList.contains('modo-mundo')) {
    const bajoBarra = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => { if (e.isIntersecting) raiz.dataset.tono = e.target.dataset.tono; });
    }, { rootMargin: '-40px 0px -92% 0px' });
    document.querySelectorAll('.sesion').forEach((s) => bajoBarra.observe(s));
  }

  // ---------- Pestaña: si se va, la pestaña la llama ----------
  const titulo = document.title;
  document.addEventListener('visibilitychange', () => {
    document.title = document.hidden ? (T.pestanaEspera || 'ロノ · tu web te espera') : titulo;
  });

  // ---------- Reloj Caracas–Tokio ----------
  const horas = [...document.querySelectorAll('[data-hora]')];
  function marcarHora() {
    const ahora = new Date();
    horas.forEach((el) => {
      el.textContent = ahora.toLocaleTimeString('es-VE', { timeZone: el.dataset.hora, hour: '2-digit', minute: '2-digit', hour12: false });
    });
  }
  marcarHora();
  setInterval(marcarHora, 15000);

  // ---------- Sonido ----------
  const botonSonido = document.querySelector('.barra__sonido');
  const textoSonido = botonSonido.querySelector('.barra__sonido-texto');
  sonido.alCambiar((on) => {
    botonSonido.setAttribute('aria-pressed', String(on));
    botonSonido.classList.toggle('sonando', on);
    textoSonido.textContent = on ? (T.sonido || 'sonido') : (T.silencio || 'silencio');
  });
  botonSonido.addEventListener('click', () => sonido.alternar());
  // En modo apilado no hay clic de "entrar": la música arranca con el primer toque.
  if (!raiz.classList.contains('modo-mundo')) {
    window.addEventListener('pointerdown', (e) => {
      if (!e.target.closest('.barra__sonido, [data-idioma-selector]')) sonido.iniciar();
    }, { once: true });
  }

  // ---------- Foco de color: al pasar el mouse, el farol recupera su color ----------
  // Un filtro sobre el propio video (barato), en vez de una capa que filtra lo de atrás.
  document.querySelectorAll('.inicio__foto').forEach((el) => {
    el.classList.add('foco');
    if (!fino) return;
    el.addEventListener('pointerenter', () => el.classList.add('encendido'));
    el.addEventListener('pointerleave', () => el.classList.remove('encendido'));
  });

  // ---------- Código vivo: el código real de esta página, de fondo ----------
  const pre = document.querySelector('.codigo-vivo');
  if (pre) {
    const PALABRAS = /\b(const|let|function|return|if|else|for|of|new|await|async|window|document|true|false)\b/g;
    const escapar = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const pintar = (texto) => texto.split('\n').map((linea) => {
      const comentario = linea.indexOf('//');
      const codigo = comentario >= 0 ? linea.slice(0, comentario) : linea;
      const nota = comentario >= 0 ? `<i>${escapar(linea.slice(comentario))}</i>` : '';
      return escapar(codigo)
        .replace(/('[^']*'|`[^`]*`)/g, '<s>$1</s>')
        .replace(PALABRAS, '<b>$1</b>') + nota;
    }).join('\n');
    const mostrarCodigo = (texto) => {
      // Dos copias seguidas: al subir la mitad, vuelve a empezar sin salto.
      const html = pintar(texto.trim());
      pre.innerHTML = html + '\n\n' + html;
      pre.style.setProperty('--duracion', Math.max(60, texto.split('\n').length * 0.9) + 's');
    };
    // Con file:// no se puede leer el archivo; queda un trozo fijo.
    Promise.all(['js/mundo.js', 'js/coreografia.js'].map((f) => fetch(prefijo + f).then((r) => (r.ok ? r.text() : Promise.reject()))))
      .then((textos) => mostrarCodigo(textos.join('\n\n')))
      .catch(() => mostrarCodigo(`// Un gesto = una sesión.
function irA(destino) {
  const A = enRuta(actual);
  const B = enRuta(destino);
  coreo.salir(sesiones[actual], dx, dy);
  coreo.entrar(sesiones[destino], dx, dy, DURA * 0.38);
}`));
  }

  // ---------- Inicio: la frase se convierte en código bajo el cursor ----------
  const campo = document.querySelector('.inicio__campo');
  const frase = campo?.querySelector('.inicio__titulo:not(.inicio__titulo--codigo)');
  if (campo && frase) {
    // Textura: líneas de código pequeñas que rellenan las letras.
    const LINEAS = T.lineasCodigo || [
      'const idea = escuchar(cliente);',
      'const boceto = dibujar(idea, { marca, colores });',
      'function construir(boceto) {',
      '  return codigo(boceto).probar().pulir();',
      '}',
      '// una idea convertida en software',
      'publicar(construir(boceto));',
      'if (funciona) celebrar();',
      'while (crece) mejorar(producto);',
      'export default ronova;',
    ];
    const lienzo = document.createElement('canvas');
    const escala = 2;
    lienzo.width = 360 * escala;
    lienzo.height = 480 * escala;
    const ctx = lienzo.getContext('2d');
    ctx.scale(escala, escala);
    ctx.fillStyle = '#2b1660';
    ctx.fillRect(0, 0, 360, 480);
    ctx.font = '600 11px ui-monospace, Menlo, Consolas, monospace';
    for (let y = 12, i = 0; y < 480; y += 13, i++) {
      const linea = LINEAS[i % LINEAS.length];
      const sangria = (i * 37) % 60;
      ctx.fillStyle = linea.startsWith('//') ? '#8b5cf6' : i % 3 === 0 ? '#ffffff' : '#c4b5fd';
      ctx.fillText(linea + '  ' + LINEAS[(i + 3) % LINEAS.length], 4 - sangria, y);
    }
    // La textura queda en la raíz: la usan la frase del inicio y el nombre de "sobre mí".
    raiz.style.setProperty('--textura-codigo', `url(${lienzo.toDataURL('image/png')})`);

    revelarCodigo(campo, frase);
    const revelaNombre = document.querySelector('.revela');
    if (revelaNombre) revelarCodigo(revelaNombre, revelaNombre.firstElementChild);
  }

  // Bajo el cursor, el texto se ve hecho de código. En celular, el círculo recorre
  // el texto solo; si pasas el dedo, te sigue.
  function revelarCodigo(caja, texto) {
    const apuntar = (cx, cy) => {
      const r = texto.getBoundingClientRect();
      // La cámara puede estar con zoom: se pasa de pantalla a medidas del texto.
      const z = r.width / texto.offsetWidth || 1;
      caja.style.setProperty('--tx', `${(cx - r.left) / z}px`);
      caja.style.setProperty('--ty', `${(cy - r.top) / z}px`);
    };
    let tocando = 0;
    if (fino) {
      texto.addEventListener('pointerenter', () => caja.classList.add('revelando'));
      texto.addEventListener('pointerleave', () => caja.classList.remove('revelando'));
      texto.addEventListener('pointermove', (e) => apuntar(e.clientX, e.clientY));
    } else {
      caja.addEventListener('touchmove', (e) => { tocando = performance.now(); apuntar(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
      if (!quieto) {
        caja.classList.add('revelando');
        const inicio = performance.now();
        let medio = false; // se actualiza un cuadro sí y otro no: igual de suave, la mitad de trabajo
        (function recorrer(ahora) {
          medio = !medio;
          if (medio && ahora - tocando > 1500 && sesionDe(caja) === sesionVisible) {
            const r = texto.getBoundingClientRect();
            const t = (ahora - inicio) / 1000;
            apuntar(r.left + r.width * (0.5 + 0.42 * Math.sin(t * 0.5)), r.top + r.height * (0.5 + 0.35 * Math.sin(t * 1.1)));
          }
          requestAnimationFrame(recorrer);
        })(inicio);
      }
    }
  }

  // ---------- Al llegar a una sesión (modo mundo) o verla (modo apilado) ----------
  const alLlegar = {};
  document.addEventListener('ronova:sesion', (e) => alLlegar[e.detail]?.());
  if (!raiz.classList.contains('modo-mundo')) {
    const ver = new IntersectionObserver((entradas) => entradas.forEach((e) => {
      if (!e.isIntersecting) return;
      raiz.dataset.sesion = e.target.id;
      document.dispatchEvent(new CustomEvent('ronova:sesion', { detail: e.target.id }));
    }), { threshold: 0.35 });
    document.querySelectorAll('.sesion').forEach((s) => ver.observe(s));
  }

  // ---------- Agentes de IA: una noche en el konbini ----------
  // Llegan clientes a distintas horas de la madrugada; el reloj de la tienda avanza
  // y el agente contesta cada uno. Mientras se ve la sesión, la noche se repite.
  const NOCHES = T.noches || {
    whatsapp: [
      ['11:58', 'p.m.', [['cliente', 'Hola, ¿tienen cupo mañana para un corte a domicilio?'], ['agente', '¡Hola! Sí: 10:00 a.m. o 4:00 p.m. ¿Cuál prefieres?'], ['cliente', 'A las 4, en Chacao 🙌']]],
      ['2:47', 'a.m.', [['cliente', '¿Cuánto cuesta el corte con barba?'], ['agente', 'Corte + barba: $12. Aceptamos Pago Móvil y efectivo.']]],
      ['5:30', 'a.m.', [['cliente', 'Buenas, ¿hacen envíos a Los Teques?'], ['agente', 'Sí, a partir de las 8:00 a.m. ¿Te reservo uno?']]],
    ],
    instagram: [
      ['12:20', 'a.m.', [['cliente', 'Vi tu publicación, ¿cómo agendo una consulta?'], ['agente', '¡Hola! ¿Es para un bebé, un niño o para ti?'], ['cliente', 'Para mi bebé de 8 meses']]],
      ['3:05', 'a.m.', [['cliente', '¿Atienden los sábados?'], ['agente', 'Sí, de 8:00 a.m. a 12:00 m. Te paso el enlace para elegir hora.']]],
      ['6:10', 'a.m.', [['cliente', '¿El tratamiento facial cuánto dura?'], ['agente', 'Unos 45 minutos. ¿Quieres que te aparte un cupo esta semana?']]],
    ],
  };
  const chat = document.querySelector('.chat');
  if (chat) {
    const lista = chat.querySelector('.chat__mensajes');
    const estadoChat = chat.querySelector('.chat__estado');
    const botonesCanal = [...document.querySelectorAll('[data-canal]')];
    const reloj = document.querySelector('.konbini__reloj');
    const horaEl = document.querySelector('[data-reloj]');
    const turnoEl = document.querySelector('[data-turno]');
    const atendidosEl = document.querySelector('[data-atendidos]');
    let canal = 'whatsapp';
    let turno = 0;
    let atendidos = 0;
    const espera = (ms) => new Promise((r) => setTimeout(r, ms));
    const sigue = (mio) => mio === turno && sesionVisible === 'agentes';

    function ponerHora(h, t) {
      horaEl.textContent = h;
      turnoEl.textContent = t;
      reencender(reloj, 'salta');
    }
    function contar() { atendidosEl.textContent = ++atendidos; }

    async function conversar() {
      const mio = ++turno;
      chat.dataset.canal = canal;
      while (true) {
        lista.replaceChildren();
        for (const [h, t, mensajes] of NOCHES[canal]) {
          ponerHora(h, t);
          const marca = document.createElement('li');
          marca.className = 'chat__hora';
          marca.textContent = `${h} ${t}`;
          lista.append(marca);
          for (const [quien, texto] of mensajes) {
            if (quieto) { agregar(quien, texto); continue; }
            if (quien === 'agente') {
              estadoChat.textContent = (T.chat && T.chat.escribiendo) || 'escribiendo…';
              const puntos = agregar('agente', '', true);
              await espera(800 + texto.length * 10);
              if (!sigue(mio)) return;
              puntos.remove();
              estadoChat.textContent = ((T.chat && T.chat.enLinea) || 'en línea · ') + canal;
            } else {
              await espera(800);
              if (!sigue(mio)) return;
            }
            agregar(quien, texto);
          }
          contar();
          if (quieto) continue;
          await espera(1600);
          if (!sigue(mio)) return;
        }
        if (quieto) return;
        await espera(2500);
        if (!sigue(mio)) return;
      }
    }
    function agregar(quien, texto, escribiendo = false) {
      const li = document.createElement('li');
      li.className = `chat__msj chat__msj--${quien}` + (escribiendo ? ' chat__msj--escribiendo' : '');
      li.innerHTML = escribiendo ? '<i></i><i></i><i></i>' : '';
      if (!escribiendo) li.textContent = texto;
      lista.append(li);
      lista.scrollTop = lista.scrollHeight;
      return li;
    }
    botonesCanal.forEach((b) => b.addEventListener('click', () => {
      canal = b.dataset.canal;
      botonesCanal.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
      conversar();
    }));
    // Arranca la cuenta en una noche ya empezada.
    atendidos = 34;
    atendidosEl.textContent = atendidos;
    estadoChat.textContent = ((T.chat && T.chat.enLinea) || 'en línea · ') + canal;
    alLlegar.agentes = conversar;
  }

  // ---------- Sobre mí: las herramientas orbitan alrededor de la foto ----------
  // Una elipse inclinada a la altura de los hombros. Lo que pasa por delante brilla
  // y muestra su nombre; lo de atrás se achica, se apaga y queda detrás de la foto.
  const escenaYo = document.querySelector('.yo__escena');
  if (escenaYo) {
    const items = [...escenaYo.querySelectorAll('.orbita__item')];
    const anillosAtras = escenaYo.querySelector('.anillos--atras');
    const anillosFrente = escenaYo.querySelector('.anillos--frente');
    const elipses = [...escenaYo.querySelectorAll('.anillo')];
    const VUELTA = 28000; // milisegundos por vuelta
    let W = 0, H = 0, cx = 0, cy = 0, rx = 0;
    let inclinar = 0.26, giroMouse = 0, metaInclinar = 0.26, metaGiro = 0;
    let visible = false;
    let ultimaFirma = '';
    const inicio = performance.now();

    function medir() {
      // offsetWidth/Height: tamaño real, sin el zoom de la vista general.
      W = escenaYo.offsetWidth; H = escenaYo.offsetHeight;
      cx = W / 2; cy = H * 0.5; // a la altura del cuello
      // El anillo sale un poco de la foto, sin pasarse de la columna.
      const columna = escenaYo.parentElement.offsetWidth;
      rx = Math.min(W * 0.66, columna / 2 - 34);
      [anillosAtras, anillosFrente].forEach((svg) => svg.setAttribute('viewBox', `0 0 ${W} ${H}`));
    }

    function pintarAnillos(ry) {
      elipses.forEach((e) => {
        // El punteado va un poco por dentro, así nunca se sale ni se corta en los bordes.
        const k = e.classList.contains('anillo--puntos') ? 0.86 : 1;
        e.setAttribute('cx', cx); e.setAttribute('cy', cy);
        e.setAttribute('rx', rx * k); e.setAttribute('ry', ry * k);
        e.setAttribute('transform', `rotate(${giroMouse} ${cx} ${cy})`);
      });
      // La mitad de arriba del anillo queda detrás de la foto; la de abajo, delante.
      anillosAtras.style.clipPath = `inset(0 0 ${H - cy}px 0)`;
      anillosFrente.style.clipPath = `inset(${cy}px 0 0 0)`;
    }

    function cuadro(ahora) {
      if (visible && sesionVisible === 'yo') {
        inclinar += (metaInclinar - inclinar) * 0.06;
        giroMouse += (metaGiro - giroMouse) * 0.06;
        if (!fino && !quieto) {
          const t = (ahora - inicio) / 1000;
          metaInclinar = 0.26 + Math.sin(t * 0.6) * 0.05;
          metaGiro = Math.sin(t * 0.4) * 4;
        }
        const ry = rx * inclinar;
        // Los anillos solo se redibujan si de verdad cambió la inclinación (no en cada cuadro).
        const firma = `${Math.round(ry * 10)}|${Math.round(giroMouse * 20)}|${Math.round(W)}`;
        if (firma !== ultimaFirma) { pintarAnillos(ry); ultimaFirma = firma; }
        const base = quieto ? 0.9 : ((ahora - inicio) / VUELTA) * Math.PI * 2;
        const rad = (giroMouse * Math.PI) / 180;
        let masAlFrente = null, mejor = -2;
        items.forEach((li, i) => {
          const a = base + (i / items.length) * Math.PI * 2;
          const px = Math.cos(a) * rx, py = Math.sin(a) * ry;
          const x = cx + px * Math.cos(rad) - py * Math.sin(rad);
          const y = cy + px * Math.sin(rad) + py * Math.cos(rad);
          const d = (Math.sin(a) + 1) / 2; // 0 = atrás, 1 = delante
          li.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${0.6 + d * 0.5})`;
          li.style.opacity = (0.3 + d * 0.7).toFixed(3);
          const capa = d > 0.5 ? '3' : '0';
          if (li.style.zIndex !== capa) li.style.zIndex = capa; // solo cuando cruza de atrás a adelante
          if (Math.sin(a) > mejor) { mejor = Math.sin(a); masAlFrente = li; }
        });
        items.forEach((li) => li.classList.toggle('al-frente', li === masAlFrente && mejor > 0.8));
      }
      if (!quieto) requestAnimationFrame(cuadro);
    }

    medir();
    new ResizeObserver(medir).observe(escenaYo);
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(escenaYo);
    visible = true;
    requestAnimationFrame(cuadro);

    // En PC, toda la órbita se inclina siguiendo al mouse.
    if (fino && !quieto) {
      const sesionYo = escenaYo.closest('.sesion');
      sesionYo.addEventListener('pointermove', (e) => {
        const r = sesionYo.getBoundingClientRect();
        const mx = (e.clientX - r.left) / r.width - 0.5;
        const my = (e.clientY - r.top) / r.height - 0.5;
        metaGiro = mx * 14;
        metaInclinar = 0.26 + my * 0.16;
      });
      sesionYo.addEventListener('pointerleave', () => { metaGiro = 0; metaInclinar = 0.26; });
    }
  }

  // ---------- Letreros que se encienden al llegar a su sesión ----------
  // Quita y vuelve a poner la clase para que la animación de encendido se repita.
  function reencender(el, clase) {
    el.classList.remove(clase);
    void el.offsetWidth;
    el.classList.add(clase);
  }
  [['estudio', '.estudio__marca', 'encendida'], ['servicios', '.maquina', 'encendida'], ['contacto', '.neon', 'encendido']]
    .forEach(([sesion, selector, clase]) => {
      const el = document.querySelector(selector);
      if (el) alLlegar[sesion] = () => reencender(el, clase);
    });

  // ---------- Verificador: el torniquete de una estación de Tokio ----------
  // Un comprobante entra al lector; la pantalla responde y las aletas se abren o no.
  const torniquete = document.querySelector('.torniquete');
  if (torniquete) {
    const ticket = torniquete.querySelector('.ticket');
    const msg = torniquete.querySelector('.torniquete__msg');
    const kanji = torniquete.querySelector('.torniquete__kanji');
    const detalle = torniquete.querySelector('.torniquete__detalle');
    const ref = torniquete.querySelector('.ticket__ref');
    const monto = torniquete.querySelector('.ticket__monto');
    const botones = [...torniquete.querySelectorAll('.torniquete__botones button')];
    // Las respuestas son las mismas del panel del verificador.
    const V = T.verificador || {};
    const CASOS = V.casos || {
      ok: { ref: 'Ref 004812', monto: 'Bs 1.250,00', kanji: '確認済', msg: 'verificado', detalle: 'el pago entró al banco: puede pasar' },
      usado: { ref: 'Ref 003377', monto: 'Bs 480,00', kanji: '使用済', msg: 'ya usado', detalle: 'esa referencia ya se verificó antes' },
      no: { ref: 'Ref 009150', monto: 'Bs 2.100,00', kanji: '未着', msg: 'no encontrado', detalle: 'ese pago todavía no llega al banco' },
    };
    let pasos = [];
    function probar(caso) {
      pasos.forEach(clearTimeout);
      const c = CASOS[caso];
      botones.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.caso === caso)));
      torniquete.dataset.caso = '';
      torniquete.classList.remove('abierto', 'rechazo');
      kanji.textContent = '改札';
      msg.textContent = V.leyendo || 'leyendo…';
      detalle.textContent = V.buscando || 'buscando la referencia en el banco';
      ref.textContent = c.ref;
      monto.textContent = c.monto;
      if (!quieto) {
        ticket.getAnimations().forEach((a) => a.cancel());
        // El comprobante baja hasta el lector y se queda un momento ahí.
        ticket.animate(
          [
            { opacity: 0, transform: 'translate(-30px, -50px) rotate(-14deg)' },
            { opacity: 1, transform: 'translate(0, 0) rotate(0deg)', offset: 0.35 },
            { opacity: 1, transform: 'translate(0, 4px) rotate(0deg)', offset: 0.8 },
            { opacity: 0, transform: 'translate(0, 8px) rotate(0deg)' },
          ],
          { duration: 1500, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' },
        );
      }
      pasos.push(setTimeout(() => {
        torniquete.dataset.caso = caso;
        kanji.textContent = c.kanji;
        msg.textContent = c.msg;
        detalle.textContent = c.detalle;
        torniquete.classList.add(caso === 'ok' ? 'abierto' : 'rechazo');
      }, quieto ? 0 : 900));
      // Después de un rato, el torniquete vuelve a esperar.
      pasos.push(setTimeout(() => {
        torniquete.classList.remove('abierto', 'rechazo');
      }, quieto ? 0 : 3600));
    }
    botones.forEach((b) => b.addEventListener('click', () => probar(b.dataset.caso)));

    // El tablero: cada pocos segundos llega un pago nuevo, mientras se ve la sesión.
    const filas = torniquete.querySelector('.tablero__filas');
    const EJEMPLOS = [['Ref 004812', '1.250,00'], ['Ref 007341', '320,00'], ['Ref 001958', '4.800,00'], ['Ref 006620', '95,50'], ['Ref 003104', '2.150,00'], ['Ref 008877', '640,00']];
    let siguiente = 0, reloj = 0;
    const hora = () => new Date().toLocaleTimeString('es-VE', { timeZone: 'America/Caracas', hour: '2-digit', minute: '2-digit', hour12: false });
    function llega(animar = true) {
      const [ref, bs] = EJEMPLOS[siguiente++ % EJEMPLOS.length];
      const li = document.createElement('li');
      li.innerHTML = `<span>${hora()}</span><span>${ref}</span><span class="monto">Bs ${bs}</span><span class="ok">確認済</span>`;
      if (animar && !quieto) li.classList.add('nueva');
      filas.prepend(li);
      while (filas.children.length > 3) filas.lastElementChild.remove();
    }
    for (let i = 0; i < 3; i++) llega(false);
    document.addEventListener('ronova:sesion', (e) => {
      clearInterval(reloj);
      if (e.detail === 'verificador' && !quieto) reloj = setInterval(llega, 3200);
    });
    alLlegar.verificador = () => probar('ok');
  }

  // ---------- Lo que dicen: la pila de cartas washi ----------
  // La de arriba se lee; al pasar, sale volando a un lado y va al fondo de la pila.
  const pila = document.querySelector('.buzon__pila');
  if (pila) {
    const cartasW = [...pila.querySelectorAll('.washi')];
    const actualEl = document.querySelector('[data-actual]');
    const totalEl = document.querySelector('.clientes__cuenta [data-total]');
    const total = cartasW.length;
    let arriba = 0;
    let autoW = 0;
    totalEl.textContent = String(total).padStart(3, '0');
    // Cada carta queda un poco torcida a su manera.
    cartasW.forEach((c, i) => c.style.setProperty('--r', `${[-1.5, 1.2, -0.6, 1.8, -1][i % 5]}deg`));
    function ordenar() {
      cartasW.forEach((c, i) => {
        const p = (i - arriba + total) % total;
        c.style.setProperty('--p', p);
        c.classList.toggle('oculta', p > 2);
        c.classList.toggle('arriba', p === 0);
        c.inert = p !== 0;
      });
      actualEl.textContent = String(arriba + 1).padStart(3, '0');
    }
    // Hacia adelante: la de arriba sale volando a la izquierda y reaparece al fondo.
    // Hacia atrás: la anterior entra volando desde la izquierda y queda arriba.
    // Mientras dura una animación no se acepta otra, para que nunca se pisen.
    let ocupado = false;
    // Se mueve completa y solo se desvanece al final, para que el texto nunca se mezcle.
    const FUERA = [{ translate: '-125% 60px', rotate: '-18deg', opacity: 0 }];
    function pasar(dir, desdeX = 0, desdeY = 0, desdeR = 0) {
      if (ocupado) return;
      if (quieto) { arriba = (arriba + dir + total) % total; ordenar(); return; }
      ocupado = true;
      if (dir > 0) {
        const c = cartasW[arriba];
        c.classList.add('volando');
        const vuelo = c.animate(
          [{ translate: `${desdeX}px ${desdeY}px`, rotate: `${desdeR}deg`, opacity: 1 }, { opacity: 1, offset: 0.7 }, ...FUERA],
          { duration: 520, easing: 'cubic-bezier(.55, 0, .25, 1)', fill: 'forwards' },
        );
        arriba = (arriba + 1) % total;
        ordenar();
        vuelo.onfinish = () => {
          // Se recoloca al fondo sin transición y aparece suave ahí.
          c.classList.add('sin-transicion');
          c.classList.remove('volando');
          vuelo.cancel();
          c.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 380, easing: 'ease-out' });
          void c.offsetWidth;
          c.classList.remove('sin-transicion');
          ocupado = false;
        };
      } else {
        arriba = (arriba - 1 + total) % total;
        const c = cartasW[arriba];
        c.classList.add('sin-transicion', 'volando');
        ordenar();
        const entrada = c.animate(
          [...FUERA, { opacity: 1, offset: 0.3 }, { translate: '0px 0px', rotate: '0deg', opacity: 1 }],
          { duration: 560, easing: 'cubic-bezier(.16, 1, .3, 1)' },
        );
        entrada.onfinish = () => { c.classList.remove('sin-transicion', 'volando'); ocupado = false; };
      }
    }
    document.querySelectorAll('.clientes__flecha').forEach((b) => b.addEventListener('click', () => { pasar(+b.dataset.dir); reiniciarAuto(); }));
    // Arrastrar la carta de arriba (con el mouse o el dedo): la sigue y, si la sueltas
    // lejos, sale volando y pasa a la siguiente; si no, vuelve a su sitio.
    let arrastre = null;
    pila.addEventListener('pointerdown', (e) => {
      const carta = e.target.closest('.washi');
      if (ocupado || !carta || carta !== cartasW[arriba] || e.target.closest('a, button')) return;
      arrastre = { carta, x0: e.clientX, y0: e.clientY, dx: 0, id: e.pointerId };
      carta.setPointerCapture(e.pointerId);
      carta.classList.add('arrastrando');
      clearInterval(autoW);
    });
    pila.addEventListener('pointermove', (e) => {
      if (!arrastre || e.pointerId !== arrastre.id) return;
      arrastre.dx = e.clientX - arrastre.x0;
      const dy = (e.clientY - arrastre.y0) * 0.3;
      arrastre.carta.style.translate = `${arrastre.dx}px ${dy}px`;
      arrastre.carta.style.rotate = `${arrastre.dx / 18}deg`;
    });
    const soltar = (e) => {
      if (!arrastre || e.pointerId !== arrastre.id) return;
      const { carta, dx } = arrastre;
      const dy = parseFloat((carta.style.translate || '0 0').split(' ')[1]) || 0;
      arrastre = null;
      carta.classList.remove('arrastrando');
      carta.style.translate = '';
      carta.style.rotate = '';
      if (Math.abs(dx) > 90 || Math.abs(dx) < 6) {
        // Lejos: sale volando desde donde la soltaste. Un clic también pasa a la siguiente.
        pasar(1, dx, dy, dx / 18);
      } else {
        // Cerca: vuelve a su sitio con suavidad.
        carta.animate(
          [{ translate: `${dx}px ${dy}px`, rotate: `${dx / 18}deg` }, { translate: '0px 0px', rotate: '0deg' }],
          { duration: 380, easing: 'cubic-bezier(.16, 1, .3, 1)' },
        );
      }
      reiniciarAuto();
    };
    pila.addEventListener('pointerup', soltar);
    pila.addEventListener('pointercancel', soltar);
    function reiniciarAuto() {
      clearInterval(autoW);
      if (!quieto && sesionVisible === 'clientes') autoW = setInterval(() => pasar(1), 6500);
    }
    document.addEventListener('ronova:sesion', (e) => { if (e.detail === 'clientes') reiniciarAuto(); else clearInterval(autoW); });
    pila.addEventListener('pointerenter', () => clearInterval(autoW));
    pila.addEventListener('pointerleave', reiniciarAuto);
    ordenar();
  }

  // ---------- Cómo trabajo: los pasos se encienden uno detrás de otro ----------
  const pasos = [...document.querySelectorAll('.proceso__paso')];
  let relevos = [];
  alLlegar.proceso = () => {
    relevos.forEach(clearTimeout);
    pasos.forEach((p) => p.classList.remove('llego'));
    if (quieto) { pasos.forEach((p) => p.classList.add('llego')); return; }
    relevos = pasos.map((p, k) => setTimeout(() => p.classList.add('llego'), 500 + k * 280));
  };

  // ---------- Videos: solo se reproducen los que se ven ----------
  // En la vista general solo se mueve el del inicio, para no cargar el celular.
  const videos = [...document.querySelectorAll('.escena video, .inicio__foto video')];
  const visibles = new Set();
  function actualizarVideos() {
    const general = raiz.classList.contains('en-general') || raiz.classList.contains('menu-abierto');
    videos.forEach((v) => {
      const delInicio = v.closest('#inicio');
      const toca = !quieto && visibles.has(v) && (!general || delInicio);
      if (toca && v.paused) v.play().catch(() => {});
      if (!toca && !v.paused) v.pause();
    });
  }
  const mirar = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => (e.isIntersecting ? visibles.add(e.target) : visibles.delete(e.target)));
    actualizarVideos();
  });
  videos.forEach((v) => {
    v.preload = v.closest('#inicio') ? 'auto' : 'metadata';
    mirar.observe(v);
  });
  new MutationObserver(actualizarVideos).observe(raiz, { attributes: true, attributeFilter: ['class'] });

  if (!fino || quieto) return;

  // ---------- Profundidad con el mouse: el fondo se mueve un poco al revés ----------
  const escenas = [...document.querySelectorAll('.escena')];
  let pendienteMouse = false;
  window.addEventListener('pointermove', (e) => {
    if (pendienteMouse) return;
    pendienteMouse = true;
    requestAnimationFrame(() => {
      // Solo en las escenas (no en la raíz): así el navegador no recalcula toda la página.
      const mx = ((e.clientX / innerWidth) * 2 - 1).toFixed(3);
      const my = ((e.clientY / innerHeight) * 2 - 1).toFixed(3);
      escenas.forEach((el) => { el.style.setProperty('--mx', mx); el.style.setProperty('--my', my); });
      pendienteMouse = false;
    });
  });

  // ---------- Botones magnéticos ----------
  document.querySelectorAll('.boton, .canal, .barra__menu, .barra__sonido, .barra__whatsapp, .barra__marca, .idioma').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      if (el.classList.contains('idioma--abierto')) { el.style.translate = ''; return; }
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * 0.28;
      const y = (e.clientY - (r.top + r.height / 2)) * 0.36;
      el.style.translate = `${x}px ${y}px`;
    });
    el.addEventListener('pointerleave', () => { el.style.translate = ''; });
  });

  // ---------- Cursor: un punto pegado al mouse y un aro que lo persigue ----------
  raiz.classList.add('con-cursor');
  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML = '<span class="cursor__aro"><svg viewBox="-50 -50 100 100" aria-hidden="true"><ellipse rx="48" ry="48"/></svg></span><span class="cursor__texto"></span><span class="cursor__punto"></span>';
  document.body.append(cursor);
  const aro = cursor.querySelector('.cursor__aro');
  const elipse = aro.querySelector('ellipse');
  const punto = cursor.querySelector('.cursor__punto');
  const texto = cursor.querySelector('.cursor__texto');
  let x = -100, y = -100, ax = x, ay = y;
  let estado = '';

  const C = T.cursor || {};
  function estadoDe(el) {
    if (raiz.classList.contains('en-general')) return ['entrar', C.entrar || 'entrar'];
    if (el.closest('.carta__giro')) return ['ver', C.voltear || 'voltear'];
    if (el.closest('[data-whatsapp], [data-red]')) return ['enlace', C.hablemos || 'hablemos'];
    if (el.closest('a, button')) return ['enlace', ''];
    if (el.closest('.washi.arriba')) return ['ver', C.arrastra || 'arrastra'];
    if (el.closest('.foco, .inicio__titulo')) return ['luz', ''];
    return ['', ''];
  }

  window.addEventListener('pointermove', (e) => {
    x = e.clientX;
    y = e.clientY;
    punto.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    cursor.classList.add('visible');
    const [nuevo, etiqueta] = estadoDe(e.target);
    if (nuevo !== estado) {
      estado = nuevo;
      cursor.dataset.estado = nuevo;
      texto.textContent = etiqueta;
    }
  });
  document.addEventListener('pointerleave', () => cursor.classList.remove('visible'));
  window.addEventListener('pointerdown', () => cursor.classList.add('presionado'));
  window.addEventListener('pointerup', () => cursor.classList.remove('presionado'));

  // El aro persigue al punto y se estira en la dirección del movimiento, como una gota.
  // Se dibuja como vector en cada cuadro (no se estira una imagen), así el trazo
  // fino nunca se rompe en rayitas.
  (function seguir() {
    const dx = x - ax;
    const dy = y - ay;
    ax += dx * 0.18;
    ay += dy * 0.18;
    const estirar = Math.min(Math.hypot(dx, dy) / 240, 0.32);
    const angulo = (Math.atan2(dy, dx) * 180) / Math.PI;
    aro.style.transform = `translate3d(${ax}px, ${ay}px, 0)`;
    elipse.setAttribute('rx', (48 * (1 + estirar)).toFixed(2));
    elipse.setAttribute('ry', (48 * (1 - estirar * 0.55)).toFixed(2));
    elipse.setAttribute('transform', `rotate(${angulo.toFixed(1)})`);
    texto.style.transform = `translate3d(${ax}px, ${ay}px, 0)`;
    requestAnimationFrame(seguir);
  })();
})();
