// Detalles de la página: selector de idioma, portafolio y enlaces de contacto.
(function () {
  const ajustes = window.RONOVA || {};
  const idioma = document.documentElement.lang || 'es';
  const T = (window.RONOVA_TEXTOS && (window.RONOVA_TEXTOS[idioma] || window.RONOVA_TEXTOS.es)) || {};

  // ---------- Idioma: cápsula que se abre a lo ancho en la barra con pastilla morada deslizante ----------
  const selector = document.querySelector('[data-idioma-selector]');
  if (selector) {
    const boton = selector.querySelector('button');
    const enlaces = [...selector.querySelectorAll('a[data-idioma]')];
    const abrir = (si) => {
      selector.classList.toggle('idioma--abierto', si);
      boton.setAttribute('aria-expanded', String(si));
      if (si) selector.style.translate = '';
    };
    boton.addEventListener('click', (ev) => {
      const si = boton.getAttribute('aria-expanded') !== 'true';
      abrir(si);
      // Con teclado (Enter o espacio: detail 0) el foco pasa al idioma actual; con el mouse no
      if (si && ev.detail === 0) selector.querySelector('a[aria-current]')?.focus({ preventScroll: true });
    });
    document.addEventListener('click', (ev) => { if (!selector.contains(ev.target)) abrir(false); });
    selector.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && boton.getAttribute('aria-expanded') === 'true') { ev.stopPropagation(); abrir(false); boton.focus(); }
      // Flechas izquierda/derecha o arriba/abajo para moverse entre idiomas
      if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft' || ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        const i = enlaces.indexOf(document.activeElement);
        if (i < 0) return;
        ev.preventDefault();
        const paso = (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') ? 1 : enlaces.length - 1;
        enlaces[(i + paso) % enlaces.length].focus();
      }
    });
    selector.addEventListener('focusout', (ev) => { if (!selector.contains(ev.relatedTarget)) abrir(false); });
    enlaces.forEach((a, i) => a.addEventListener('click', (ev) => {
      document.cookie = `ronova-idioma=${a.dataset.idioma}; path=/; max-age=31536000; SameSite=Lax`;
      selector.style.setProperty('--activo', String(i));
      // Si toca el idioma en el que ya está, solo cierra la cápsula
      if (a.hasAttribute('aria-current')) {
        ev.preventDefault();
        abrir(false);
      }
    }));
  }

  // ---------- Portafolio: cartas coleccionables ----------
  // Con el mouse, la carta se inclina y el brillo holográfico sigue la luz.
  // Al tocarla se voltea; detrás, la web del proyecto baja sola.
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fino = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const VELOCIDAD = 110; // píxeles por segundo al bajar
  const PAUSA = 1000; // milisegundos quieta arriba y abajo

  function recorrer(pantalla) {
    const img = pantalla.querySelector('img');
    img.getAnimations().forEach((a) => a.cancel());
    if (quieto) return;
    const bajar = img.offsetHeight - pantalla.clientHeight;
    if (bajar <= 0) { img.addEventListener('load', () => recorrer(pantalla), { once: true }); return; }
    const baja = (bajar / VELOCIDAD) * 1000;
    const total = PAUSA + baja + PAUSA + baja * 0.35;
    const fin = `translateY(${-bajar}px)`;
    img.animate(
      [
        { transform: 'translateY(0)', offset: 0 },
        { transform: 'translateY(0)', offset: PAUSA / total, easing: 'cubic-bezier(.45,0,.55,1)' },
        { transform: fin, offset: (PAUSA + baja) / total },
        { transform: fin, offset: (PAUSA * 2 + baja) / total, easing: 'cubic-bezier(.65,0,.35,1)' },
        { transform: 'translateY(0)', offset: 1 },
      ],
      { duration: total, iterations: Infinity },
    );
  }

  const cartas = [...document.querySelectorAll('.carta')];
  // Las capturas de atrás se decodifican antes de voltear: así la carta nunca se ve negra al girar.
  const prepararCartas = () => document.querySelectorAll('.carta__pantalla img, .carta__arte img').forEach((img) => img.decode?.().catch(() => {}));
  if (document.readyState === 'complete') prepararCartas();
  else window.addEventListener('load', prepararCartas, { once: true });
  cartas.forEach((carta) => {
    const giro = carta.querySelector('.carta__giro');
    const pantalla = carta.querySelector('.carta__pantalla');
    // Volteo en dos tiempos: se aplana hasta quedar de canto, cambia de cara y se abre.
    let girando = false;
    giro.addEventListener('click', () => {
      if (girando) return;
      girando = true;
      carta.classList.remove('moviendo');
      carta.classList.add('girando');
      const cambiar = () => {
        const volteada = carta.classList.toggle('volteada');
        giro.setAttribute('aria-pressed', String(volteada));
        if (!pantalla) return;
        if (volteada) recorrer(pantalla);
        else pantalla.querySelector('img').getAnimations().forEach((a) => a.cancel());
      };
      const terminar = () => { girando = false; carta.classList.remove('girando'); };
      if (quieto) { cambiar(); terminar(); return; }
      const cierra = giro.animate([{ scale: '1 1' }, { scale: '0.02 0.96' }], { duration: 230, easing: 'cubic-bezier(.55, 0, 1, .45)' });
      cierra.onfinish = () => {
        cambiar();
        const abre = giro.animate([{ scale: '0.02 0.96' }, { scale: '1 1' }], { duration: 320, easing: 'cubic-bezier(0, .55, .45, 1)' });
        abre.onfinish = terminar;
      };
    });
    if (!fino || quieto) return;
    giro.addEventListener('pointermove', (e) => {
      if (carta.classList.contains('girando')) return;
      const r = giro.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      carta.classList.add('moviendo');
      giro.style.setProperty('--ry', `${(x - 0.5) * 22}deg`);
      giro.style.setProperty('--rx', `${(0.5 - y) * 18}deg`);
      carta.style.setProperty('--px', `${x * 100}%`);
      carta.style.setProperty('--py', `${y * 100}%`);
    });
    giro.addEventListener('pointerleave', () => {
      carta.classList.remove('moviendo');
      giro.style.setProperty('--ry', '0deg');
      giro.style.setProperty('--rx', '0deg');
    });
  });
  // La colección crece sola: cuenta las cartas y, si no caben, aparecen las flechas.
  const mazo = document.querySelector('.cartas');
  const total = document.querySelector('[data-total]');
  if (total) total.textContent = cartas.filter((c) => !c.classList.contains('carta--tuya')).length;
  const flechas = document.querySelector('.cartas__flechas');
  if (mazo && flechas) {
    const [atras, adelante] = flechas.querySelectorAll('button');
    const revisar = () => {
      const desborda = mazo.scrollWidth > mazo.clientWidth + 4;
      mazo.classList.toggle('desborda', desborda);
      flechas.hidden = !desborda;
      atras.disabled = mazo.scrollLeft < 4;
      adelante.disabled = mazo.scrollLeft + mazo.clientWidth > mazo.scrollWidth - 4;
    };
    flechas.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      const paso = cartas[0].offsetWidth + 24;
      mazo.scrollBy({ left: paso * +b.dataset.dir });
    }));
    mazo.addEventListener('scroll', revisar, { passive: true });
    new ResizeObserver(revisar).observe(mazo);
  }
    // Al salir de "páginas web", las cartas se quedan quietas: no gastan nada.
  document.addEventListener('ronova:sesion', (e) => {
    if (e.detail === 'web') cartas.forEach((c) => { const p = c.querySelector('.carta__pantalla'); if (p && c.classList.contains('volteada')) recorrer(p); });
    else document.querySelectorAll('.carta__pantalla img').forEach((img) => img.getAnimations().forEach((a) => a.pause()));
  });

  // ---------- WhatsApp e Instagram ----------
  const wa = (texto) => `https://wa.me/${ajustes.whatsapp}?text=${encodeURIComponent(texto)}`;

  if (ajustes.whatsapp) {
    document.querySelectorAll('[data-whatsapp]').forEach((a) => {
      a.href = wa(a.dataset.whatsapp);
      a.target = '_blank';
      a.rel = 'noopener';
    });
  }


  // Instagram, Telegram y Discord: si su enlace está en config.js, abren tu perfil;
  // si no, se quedan quietos (nunca llevan a una página vacía).
  document.querySelectorAll('[data-red]').forEach((a) => {
    const url = ajustes[a.dataset.red];
    // Un nombre de usuario (sin enlace, como en Discord): al tocar se copia.
    if (url && !/^https?:/.test(url)) {
      const etiqueta = a.querySelector('span');
      const original = etiqueta.textContent;
      a.title = (T.copiar || 'Copiar {x}').replace('{x}', url);
      a.addEventListener('click', (e) => {
        e.preventDefault();
        navigator.clipboard?.writeText(url).catch(() => {});
        etiqueta.textContent = T.copiado || 'copiado ✓';
        setTimeout(() => { etiqueta.textContent = original; }, 1800);
      });
      return;
    }
    if (url) {
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
    } else {
      a.addEventListener('click', (e) => e.preventDefault());
      a.setAttribute('aria-disabled', 'true');
    }
  });
})();
