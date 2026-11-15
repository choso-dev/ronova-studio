// Las páginas en inglés y japonés, los textos dinámicos del JS y el Worker que elige el idioma.
// Correr con: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { generar, PAGINAS, IDIOMAS } = require('../scripts/idiomas.js');
const TEXTOS = require('../js/textos.js');

const raiz = path.join(__dirname, '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
// Solo lo que ve el visitante: sin comentarios, scripts, estilos ni etiquetas
const visible = (html) => html.replace(/<!--[\s\S]*?-->|<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');

test('los diccionarios cubren todos los textos y las páginas generadas están al día', () => {
  for (const idioma of IDIOMAS) {
    const faltan = new Set();
    const paginas = generar(idioma, faltan);
    assert.equal(faltan.size, 0, `${idioma}: faltan traducciones: ${[...faltan].join(', ')}`);
    for (const p of PAGINAS) {
      assert.equal(leer(`${idioma}/${p}`), paginas[p], `${idioma}/${p} está viejo: corre node scripts/idiomas.js`);
    }
  }
});

test('cada página en/ja tiene su idioma, sus versiones (hreflang), rutas relativas y enlaces a web en su idioma', () => {
  for (const idioma of IDIOMAS) {
    for (const p of PAGINAS) {
      const s = leer(`${idioma}/${p}`);
      assert.ok(s.includes(`<html lang="${idioma}">`), `${idioma}/${p}: falta lang="${idioma}"`);
      for (const h of ['es', 'en', 'ja', 'x-default']) assert.ok(s.includes(`hreflang="${h}"`), `${idioma}/${p}: falta hreflang ${h}`);
      assert.ok(s.includes('../css/estilos.css') && s.includes('../js/textos.js'), `${idioma}/${p}: rutas de archivos mal`);
      assert.ok(s.includes(`https://web.ronovastudio.workers.dev/${idioma}/`), `${idioma}/${p}: falta enlace a web en ${idioma}`);
    }
  }
});

test('en inglés no queda texto en español a la vista', () => {
  const palabras = /\b(para|desde|página|páginas|negocio|hablemos|disponible|próximamente|escríbeme|cómo trabajo)\b/i;
  for (const p of PAGINAS) {
    const s = visible(leer(`en/${p}`));
    assert.ok(!palabras.test(s), `en/${p}: queda español: "${(s.match(new RegExp(`.{0,40}${palabras.source}.{0,40}`, 'i')) || [''])[0].trim()}"`);
  }
});

test('js/textos.js tiene los tres idiomas completos y adaptados', () => {
  for (const idioma of ['es', 'en', 'ja']) {
    const t = TEXTOS[idioma];
    assert.ok(t && t.menu && t.cerrar && t.sonido && t.silencio && t.saltarIntro);
    assert.ok(t.cursor && t.cursor.entrar && t.cursor.voltear && t.cursor.hablemos && t.cursor.arrastra);
    assert.equal(t.noches.whatsapp.length, 3);
    assert.equal(t.noches.instagram.length, 3);
    assert.ok(t.verificador && t.verificador.leyendo && t.verificador.buscando && t.verificador.casos.ok);
  }
  // En inglés y japonés los chats de demo no usan lugares locales de Caracas
  const chatEn = JSON.stringify(TEXTOS.en.noches);
  const chatJa = JSON.stringify(TEXTOS.ja.noches);
  assert.ok(!/Chacao|Los Teques|Pago Móvil/.test(chatEn));
  assert.ok(!/Chacao|Los Teques|Pago Móvil/.test(chatJa));
});

test('el Worker elige el idioma por país, elección guardada y navegador', async () => {
  const { destino } = await import('../worker.mjs');
  const u = 'https://ronova-studio.ronovastudio.workers.dev/';
  assert.equal(destino(u, { pais: 'VE' }), null);
  assert.equal(destino(u, { pais: 'US' }), '/en/');
  assert.equal(destino(u, { pais: 'JP' }), '/ja/');
  assert.equal(destino(u, { pais: 'VE', cookie: 'ronova-idioma=ja' }), '/ja/');
  assert.equal(destino(u, { pais: 'US', cookie: 'ronova-idioma=es' }), null);
  assert.equal(destino(u, { pais: 'FR', idiomas: 'fr,ja;q=0.8' }), '/ja/');
  assert.equal(destino(u, { pais: 'US', agente: 'WhatsApp/2.23' }), null);
  assert.equal(destino('https://ronova-studio.ronovastudio.workers.dev/en/', { pais: 'VE' }), null);
});
