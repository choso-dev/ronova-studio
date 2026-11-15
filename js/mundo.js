// La cámara de Ronova Studio.
// Al empezar, las sesiones flotan en abanico como pósters. Con el clic, cada una
// vuela a su lugar y la cámara entra a la primera. Desde ahí, cada gesto de scroll
// lleva a la siguiente sesión con un deslizamiento: derecha, abajo, derecha,
// abajo... (al revés si subes), y los elementos de la sesión que llega aparecen
// uno por uno desde el lado por donde entras.
(function () {
  const raiz = document.documentElement;
  const sesiones = [...document.querySelectorAll('.sesion')];
  const N = sesiones.length;

  // Lo que necesitan los demás archivos, también en modo apilado.
  const api = { activo: false, alTerminarIntro() {}, irA(i) { sesiones[i]?.scrollIntoView({ behavior: 'smooth' }); } };
  window.RonovaMundo = api;
  if (!raiz.classList.contains('modo-mundo')) return;

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  api.activo = true;

  // ---------- La cámara no se mueve por saltos del navegador ----------
  // Un enlace "#contacto" o abrir la página con "#…" en la dirección hace que el
  // navegador desplace el contenedor para mostrar ese ancla, y descuadra todo el mundo.
  const camaraEl = document.querySelector('.camara');
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  const enCero = (el) => { if (el.scrollTop || el.scrollLeft) { el.scrollTop = 0; el.scrollLeft = 0; } };
  camaraEl.addEventListener('scroll', () => enCero(camaraEl));
  window.addEventListener('scroll', () => { if (scrollX || scrollY) scrollTo(0, 0); });
  window.addEventListener('hashchange', () => {
    history.replaceState(null, '', location.pathname + location.search);
    enCero(camaraEl);
    if (scrollX || scrollY) scrollTo(0, 0);
  });
  // Ningún enlace interno salta: la cámara se encarga (o no hace nada si está ocupada).
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (a) e.preventDefault();
  }, true);
  const mundo = document.querySelector('.mundo');
  const escenas = sesiones.map((s, i) => ({ el: s.querySelector('.escena'), i })).filter((e) => e.el);

  const coreo = window.RonovaCoreo;
  sesiones.forEach(coreo.preparar);

  // ---------- Recorrido en escalera: derecha, abajo, derecha, abajo ----------
  const ruta = sesiones.map((_, i) => [Math.ceil(i / 2), Math.floor(i / 2)]);

  // ---------- Medidas ----------
  let W, H;
  function medir() {
    W = raiz.clientWidth;
    H = window.innerHeight; // en celular, el alto visible real (sin la barra del navegador)
    raiz.style.setProperty('--ancho', W + 'px');
    raiz.style.setProperty('--alto', H + 'px');
  }
  const enRuta = (i) => ({ x: ruta[i][0] * W, y: ruta[i][1] * H, r: 0, s: 1 });

  // El abanico: la primera sesión al centro, grande y encima; las demás a los lados.
  // Sesión i → puesto en el abanico: la primera al centro, las demás alternando derecha e izquierda.
  const centroAbanico = Math.floor((N - 1) / 2);
  const LUGARES = sesiones.map((_, i) => centroAbanico + (i % 2 ? Math.ceil(i / 2) : -i / 2));
  // Separación entre pósters, en anchos de pantalla: más juntos en vertical para que se vean grandes.
  const paso = () => (W > H ? 0.3 : 0.2);
  function enAbanico(i) {
    const k = LUGARES[i] - centroAbanico;
    const d = Math.abs(k);
    return { x: k * W * paso() * (1 + d * 0.12), y: d * d * H * 0.035, r: k * 4, s: 1.45 - Math.min(d, 3) * 0.17 };
  }
  function vistaGeneral() {
    const lado = Math.max(centroAbanico, N - 1 - centroAbanico);
    const ext = lado * W * paso() * (1 + lado * 0.12);
    const ancho = ext * 2 + W * 1.1;
    const alto = H * 1.55;
    return { x: 0, y: H * 0.06, z: Math.min((W * 0.96) / ancho, (H * 0.82) / alto) };
  }

  // ---------- Pintar ----------
  function colocar(pos) {
    sesiones.forEach((s, i) => {
      const { x, y, r = 0, s: e = 1 } = pos[i];
      s.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${r}deg) scale(${e})`;
    });
  }
  // x, y: esquina de la sesión que la cámara pone en pantalla; z: zoom.
  function camara({ x, y, z = 1 }) {
    mundo.style.transform = `translate3d(${W / 2 - (x + W / 2) * z}px, ${H / 2 - (y + H / 2) * z}px, 0) scale(${z})`;
    // Profundidad: el video de fondo de cada sesión se mueve más lento que su contenido.
    if (estado === 'recorrido') {
      // Solo las sesiones con escena de fondo, y sobre la escena misma: es mucho más liviano.
      escenas.forEach(({ el, i }) => {
        const p = enRuta(i);
        el.style.setProperty('--ex', `${-(p.x - x) * 0.1}px`);
        el.style.setProperty('--ey', `${-(p.y - y) * 0.1}px`);
      });
    }
  }

  const lerp = (a, b, t) => a + (b - a) * t;
  const limitar = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const deslizar = (t) => (t < 0.5 ? 8 * t ** 4 : 1 - Math.pow(-2 * t + 2, 4) / 2);

  // ---------- Estados: general → acomodo → recorrido ----------
  let estado = 'general';
  let actual = 0;
  let flotar = 0;

  // Los pósters flotan despacio en el abanico mientras esperan el clic.
  function mecer() {
    const inicio = performance.now();
    (function cuadro(ahora) {
      const t = (ahora - inicio) / 1000;
      colocar(sesiones.map((_, i) => {
        const p = enAbanico(i);
        return { ...p, y: p.y + Math.sin(t * 0.9 + i * 1.3) * H * 0.02, r: p.r + Math.sin(t * 0.6 + i) * 0.8 };
      }));
      flotar = requestAnimationFrame(cuadro);
    })(inicio);
  }

  function mostrarGeneral() {
    medir();
    sesiones.forEach((s, i) => { s.inert = true; s.style.zIndex = N - Math.abs(LUGARES[i] - centroAbanico) * 2; });
    raiz.classList.add('en-general');
    document.body.style.overflow = 'hidden';
    camara(vistaGeneral());
    mecer();
  }

  function entrar() {
    if (estado !== 'general') return;
    estado = 'acomodo';
    window.RonovaSonido?.iniciar();
    cancelAnimationFrame(flotar);
    raiz.classList.remove('en-general');
    const desde = sesiones.map((_, i) => enAbanico(i));
    const hasta = sesiones.map((_, i) => enRuta(i));
    const camDesde = vistaGeneral();
    const DURA = 1800;
    const RETRASO = 0.04;
    const inicio = performance.now();
    coreo.entrar(sesiones[0], 0, 1, 900);

    function cuadro(ahora) {
      const t = limitar((ahora - inicio) / DURA);
      colocar(desde.map((d, i) => {
        const u = suave(limitar((t - i * RETRASO) / (1 - (N - 1) * RETRASO)));
        return { x: lerp(d.x, hasta[i].x, u), y: lerp(d.y, hasta[i].y, u), r: lerp(d.r, 0, u), s: lerp(d.s, 1, u) };
      }));
      const e = suave(t);
      camara({ x: lerp(camDesde.x, 0, e), y: lerp(camDesde.y, 0, e), z: Math.exp(lerp(Math.log(camDesde.z), 0, e)) });
      if (t < 1) requestAnimationFrame(cuadro);
      else {
        sesiones.forEach((s) => { s.inert = false; s.style.zIndex = ''; });
        estado = 'recorrido';
        marcar(0);
        ponerPista();
      }
    }
    requestAnimationFrame(cuadro);
  }

  // Aviso de que se baja con la rueda; se va con el primer viaje.
  let pista;
  function ponerPista() {
    pista = document.createElement('p');
    pista.className = 'pista-scroll';
    const tactil = matchMedia('(pointer: coarse)').matches;
    const T = (window.RONOVA_TEXTOS && (window.RONOVA_TEXTOS[raiz.lang] || window.RONOVA_TEXTOS.es)) || {};
    pista.innerHTML = `<span class="pista-scroll__rueda" aria-hidden="true"><i></i></span> ${tactil ? (T.deslizaArriba || 'desliza hacia arriba') : (T.deslizaRecorrer || 'desliza para recorrer')}`;
    document.body.append(pista);
  }
  function quitarPista() {
    if (!pista) return;
    const p = pista;
    pista = null;
    p.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }).onfinish = () => p.remove();
  }

  // ---------- Viaje entre sesiones ----------
  let viajando = false;
  function irA(destino) {
    destino = limitar(destino, 0, N - 1);
    if (estado !== 'recorrido' || viajando || destino === actual) return;
    viajando = true;
    quitarPista();
    const llegada = sesiones[destino];
    llegada.scrollTop = destino > actual ? 0 : llegada.scrollHeight;
    raiz.classList.toggle('desplazado', llegada.scrollTop > 8);
    const A = enRuta(actual);
    const B = enRuta(destino);
    const dx = Math.sign(B.x - A.x);
    const dy = Math.sign(B.y - A.y);
    const DURA = 1100;
    const inicio = performance.now();
    window.RonovaSonido?.whoosh(dx, dy);
    coreo.salir(sesiones[actual], dx, dy);
    coreo.entrar(sesiones[destino], dx, dy, DURA * 0.38);
    marcar(destino);

    function cuadro(ahora) {
      const t = limitar((ahora - inicio) / DURA);
      const e = deslizar(t);
      camara({ x: lerp(A.x, B.x, e), y: lerp(A.y, B.y, e) });
      if (t < 1) requestAnimationFrame(cuadro);
      else setTimeout(() => (viajando = false), 120);
    }
    requestAnimationFrame(cuadro);
  }
  api.irA = irA;

  function marcar(i) {
    actual = i;
    raiz.dataset.tono = sesiones[i].dataset.tono;
    raiz.dataset.sesion = sesiones[i].id; // las animaciones de las demás se pausan (css)
    document.dispatchEvent(new CustomEvent('ronova:sesion', { detail: sesiones[i].id }));
    const id = sesiones[i].id;
    document.querySelectorAll('.menu__nav a').forEach((a) => {
      if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }

  // Si la sesión actual está desplazada por dentro, la barra pone su franja.
  const revisarFranja = () => raiz.classList.toggle('desplazado', estado === 'recorrido' && sesiones[actual].scrollTop > 8);
  sesiones.forEach((s) => s.addEventListener('scroll', revisarFranja, { passive: true }));

  // ---------- Rueda, teclado y toque ----------
  // Si la sesión es más alta que la pantalla (celular), primero se desliza por
  // dentro; solo al llegar a su borde, el siguiente gesto viaja a otra sesión.
  const enBorde = (s, dir) => (dir > 0
    ? s.scrollTop + s.clientHeight >= s.scrollHeight - 2
    : s.scrollTop <= 1);

  // Un gesto = una sesión. La rueda del trackpad manda muchos eventos seguidos:
  // se suman, y después de viajar se ignoran hasta que el gesto se calma.
  let suma = 0;
  let calma;
  let movidoPorDentro = 0;
  window.addEventListener('wheel', (e) => {
    if (estado === 'general') { if (api.introLista) entrar(); return; }
    if (estado !== 'recorrido' || raiz.classList.contains('menu-abierto')) return;
    const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    // Todavía queda sesión por recorrer: que el navegador la deslice.
    if (!enBorde(sesiones[actual], Math.sign(delta))) {
      movidoPorDentro = performance.now();
      suma = 0;
      return;
    }
    e.preventDefault();
    clearTimeout(calma);
    calma = setTimeout(() => (suma = 0), 160);
    // La inercia que llega al borde no cuenta como un gesto nuevo.
    if (viajando || performance.now() - movidoPorDentro < 380) return;
    suma += delta;
    if (Math.abs(suma) > 40) {
      irA(actual + Math.sign(suma));
      suma = 0;
    }
  }, { passive: false });

  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select') || raiz.classList.contains('menu-abierto')) return;
    const adelante = ['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(e.key);
    const atras = ['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key);
    if (estado === 'general' && api.introLista && (adelante || e.key === 'Enter')) { e.preventDefault(); entrar(); return; }
    if (estado !== 'recorrido') return;
    if (adelante) { e.preventDefault(); irA(actual + 1); }
    if (atras) { e.preventDefault(); irA(actual - 1); }
    if (e.key === 'Home') { e.preventDefault(); irA(0); }
    if (e.key === 'End') { e.preventDefault(); irA(N - 1); }
  });

  // Toque: deslizar hacia arriba avanza y hacia abajo regresa, pero solo si el
  // gesto empezó con la sesión ya en su borde.
  let toque = null;
  window.addEventListener('touchstart', (e) => {
    if (estado !== 'recorrido') return;
    const s = sesiones[actual];
    toque = { x: e.touches[0].clientX, y: e.touches[0].clientY, abajo: enBorde(s, 1), arriba: enBorde(s, -1) };
  }, { passive: true });
  window.addEventListener('touchend', (e) => {
    if (!toque || estado !== 'recorrido' || raiz.classList.contains('menu-abierto')) { toque = null; return; }
    const f = e.changedTouches[0];
    const dx = toque.x - f.clientX;
    const dy = toque.y - f.clientY;
    if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx) * 1.2) {
      if (dy > 0 && toque.abajo) irA(actual + 1);
      if (dy < 0 && toque.arriba) irA(actual - 1);
    }
    toque = null;
  }, { passive: true });

  // ---------- Enlaces y foco ----------
  const indiceDe = (el) => sesiones.findIndex((s) => s === el || s.contains(el));

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    const destino = document.querySelector(a.getAttribute('href'));
    const i = destino ? indiceDe(destino) : -1;
    if (i < 0) return;
    a.addEventListener('click', (e) => {
      // app.js puede cambiar el enlace a WhatsApp: entonces no es un salto interno.
      if (estado !== 'recorrido' || !a.getAttribute('href').startsWith('#')) return;
      e.preventDefault();
      irA(i);
    });
  });

  // Con Tab, la cámara va a la sesión del elemento enfocado (sin animación).
  document.addEventListener('focusin', (e) => {
    if (estado !== 'recorrido' || viajando) return;
    const i = indiceDe(e.target);
    if (i >= 0 && i !== actual) { coreo.entrar(sesiones[i], 0, 0, 0); marcar(i); camara(enRuta(i)); }
  });

  document.querySelector('.camara').addEventListener('click', () => { if (api.introLista) entrar(); });

  window.addEventListener('resize', () => {
    medir();
    if (estado === 'general') camara(vistaGeneral());
    if (estado === 'recorrido') { colocar(sesiones.map((_, i) => enRuta(i))); camara(enRuta(actual)); }
  });

  mostrarGeneral();

  // intro.js avisa cuando termina.
  api.introLista = false;
  api.alTerminarIntro = () => { api.introLista = true; };
})();
