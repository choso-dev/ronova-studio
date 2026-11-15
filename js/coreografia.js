// Coreografía de entrada y salida de cada sesión.
// Capas, en este orden: los paneles se abren con un barrido desde el lado por
// donde llegas, las fotos se enfocan, las palabras de los títulos suben desde
// detrás de una máscara, los verbos verticales se pintan como un letrero y al
// final aparecen los textos y botones.
(function () {
  const PANELES = '.estacion, .inicio__campo, .inicio__foto, .estudio__marca, .ficha, .maquina, .producto, .torniquete, .yo__foto, .trabajo__marco, .konbini, .buzon';
  const FOTOS = '.inicio__foto video';
  const TITULOS = '.inicio__titulo, .titulo, .producto b, .estudio__pilares b, .koma__titulo';
  const VERBOS = ':not(*)'; // hoy ninguna sesión usa verbos verticales
  const TEXTOS = '.inicio__banda p, .inicio__banda .boton, .estudio__frase, .ficha div, .estudio__pilares span, .yo__texto p, .yo__datos li, .yo__acciones, .producto__desc, .servicios__leyenda, .maquina__marca, .trabajo__lead, .trabajo__coleccion, .trabajo__boton, .carta, .verificador__lead, .banco, .canales, .torniquete__botones, .agentes__lead, .agentes__hace li, .agentes__demo, .konbini__contador, .proceso__sub, .proceso__pago, .clientes__lead, .clientes__mando, .neon__frase, .neon__acciones, .pie';

  const CORTINA = 'cubic-bezier(.77,0,.18,1)';
  const SALIDA = 'cubic-bezier(.16,1,.3,1)';

  // Envuelve cada palabra en una máscara para que pueda subir desde abajo.
  function partir(el) {
    if (el.dataset.partido) return;
    el.dataset.partido = '1';
    [...el.childNodes].forEach((nodo) => {
      if (nodo.nodeType === Node.TEXT_NODE) {
        const trozos = nodo.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        trozos.forEach((t) => {
          if (!t) return;
          if (/^\s+$/.test(t)) { frag.append(t); return; }
          const mascara = document.createElement('span');
          mascara.className = 'mascara';
          const palabra = document.createElement('span');
          palabra.className = 'palabra';
          palabra.textContent = t;
          mascara.append(palabra);
          frag.append(mascara);
        });
        nodo.replaceWith(frag);
      } else if (nodo.nodeType === Node.ELEMENT_NODE && nodo.tagName !== 'BR' && !nodo.matches('span:not(.mascara)')) {
        partir(nodo);
      }
    });
  }

  const piezas = new Map();
  function preparar(sesion) {
    if (piezas.has(sesion)) return piezas.get(sesion);
    sesion.querySelectorAll(TITULOS).forEach(partir);
    const p = {
      paneles: [...sesion.querySelectorAll(PANELES)],
      fotos: [...sesion.querySelectorAll(FOTOS)],
      palabras: [...sesion.querySelectorAll('.palabra')],
      verbos: [...sesion.querySelectorAll(VERBOS)],
      textos: [...sesion.querySelectorAll(TEXTOS)],
      escena: sesion.querySelector('.escena'),
      capa: [...sesion.children].filter((el) => !el.classList.contains('escena')),
      salida: [],
    };
    piezas.set(sesion, p);
    return p;
  }

  // dx, dy: dirección del viaje (1, 0 = vas a la derecha; 0, 1 = vas abajo).
  function entrar(sesion, dx = 0, dy = 1, retraso = 0) {
    const p = preparar(sesion);
    p.salida.forEach((a) => a.cancel());
    p.salida = [];
    const todas = [...p.paneles, ...p.fotos, ...p.palabras, ...p.verbos, ...p.textos, p.escena].filter(Boolean);
    todas.forEach((el) => el.getAnimations().forEach((a) => a.cancel()));

    // La escena de fondo se enciende con un acercamiento lento.
    p.escena?.animate(
      [{ opacity: 0, transform: 'scale(1.14)' }, { opacity: 1, transform: 'scale(1)' }],
      { duration: 1800, delay: retraso * 0.6, easing: SALIDA, fill: 'backwards' },
    );

    // Barrido: el panel se abre desde el lado por donde llegas.
    const desde = dx > 0 ? 'inset(0 0 0 100%)' : dx < 0 ? 'inset(0 100% 0 0)' : dy < 0 ? 'inset(0 0 100% 0)' : 'inset(100% 0 0 0)';
    p.paneles.forEach((el, k) => {
      // El barrido respeta las esquinas redondeadas de las tarjetas.
      const radio = getComputedStyle(el).borderTopLeftRadius;
      const curva = radio && radio !== '0px' ? ` round ${radio}` : '';
      el.animate(
        [{ clipPath: desde.replace(')', curva + ')') }, { clipPath: `inset(0 0 0 0${curva})` }],
        { duration: 950, delay: retraso + k * 90, easing: CORTINA, fill: 'backwards' },
      );
    });

    p.fotos.forEach((el, k) => el.animate(
      [{ transform: 'scale(1.25)', filter: 'grayscale(1) contrast(1.15) brightness(0.35)' }, { transform: 'scale(1)' }],
      { duration: 1700, delay: retraso + 120 + k * 90, easing: SALIDA, fill: 'backwards' },
    ));

    p.palabras.forEach((el, k) => el.animate(
      [{ transform: 'translateY(110%) rotate(7deg)' }, { transform: 'translateY(0) rotate(0)' }],
      { duration: 1000, delay: retraso + 260 + Math.min(k, 40) * 32, easing: SALIDA, fill: 'backwards' },
    ));

    p.verbos.forEach((el, k) => el.animate(
      [{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }],
      { duration: 1100, delay: retraso + 400 + k * 140, easing: CORTINA, fill: 'backwards' },
    ));

    p.textos.forEach((el, k) => el.animate(
      [{ opacity: 0, transform: `translate(${dx * 28}px, ${dy * 28 || 0}px)`, filter: 'blur(6px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }],
      { duration: 900, delay: retraso + 560 + Math.min(k, 24) * 45, easing: SALIDA, fill: 'backwards' },
    ));
  }

  // Al irte, el contenido corre un poco más rápido que la cámara y se apaga.
  function salir(sesion, dx = 0, dy = 1) {
    const p = preparar(sesion);
    const tiempo = (k) => ({ duration: 800, delay: k * 30, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' });
    p.salida = p.capa.flatMap((el, k) => [
      // composite 'add' respeta el giro o desplazamiento que ya tenga el elemento.
      el.animate(
        [{ transform: 'translate(0, 0)' }, { transform: `translate(${-dx * 140}px, ${-dy * 140}px)` }],
        { ...tiempo(k), composite: 'add' },
      ),
      el.animate([{ opacity: 1 }, { opacity: 0.15 }], tiempo(k)),
    ]);
  }

  window.RonovaCoreo = { preparar, entrar, salir };
})();
