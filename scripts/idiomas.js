// Genera la web en inglés (en/) y japonés (ja/) a partir de la de español, con los diccionarios
// de idiomas/en/ e idiomas/ja/ (texto en español → traducción). Lo corre scripts/construir.sh.
// Es el mismo sistema que la web de paquetes (../web/tools/idiomas.js).
//
//   node scripts/idiomas.js              → escribe en/index.html y ja/index.html (falla si falta alguna traducción)
//   node scripts/idiomas.js --faltan     → muestra, por idioma, los textos que faltan por traducir
//
// Los textos que escribe el JavaScript (chats de demo, cursor, menú…) no van aquí: están en js/textos.js.
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..');
const BASE = 'https://ronova-studio.ronovastudio.workers.dev';
const WEB = 'https://web.ronovastudio.workers.dev'; // la web de paquetes también tiene en/ y ja/
const IDIOMAS = ['en', 'ja'];
const LOCALES = { en: 'en_US', ja: 'ja_JP' };
const PAGINAS = fs.readdirSync(RAIZ).filter((f) => f.endsWith('.html') && f !== '404.html');
const CARPETAS = /^(css|js|img|fuentes|marca|video)\//;
const LETRAS = /[A-Za-zÁÉÍÓÚÑáéíóúñü¿¡]/;
const ATRIBUTOS = new Set(['alt', 'aria-label', 'title', 'placeholder', 'data-whatsapp', 'data-nombre']);
const META = /(name|property)="(description|og:title|og:description|og:image:alt|twitter:title|twitter:description)"/;

const normal = (t) => t.replace(/\s+/g, ' ').trim();

function generar(idioma, faltan) {
  const carpeta = path.join(RAIZ, 'idiomas', idioma);
  const dic = {};
  for (const f of fs.existsSync(carpeta) ? fs.readdirSync(carpeta).filter((x) => x.endsWith('.json')).sort() : []) {
    Object.assign(dic, JSON.parse(fs.readFileSync(path.join(carpeta, f), 'utf8')));
  }
  const salida = {};

  for (const pagina of PAGINAS) {
    let html = fs.readFileSync(path.join(RAIZ, pagina), 'utf8');

    const traducir = (texto) => {
      const clave = normal(texto);
      if (!LETRAS.test(clave)) return texto;
      if (!(clave in dic) || dic[clave] === '') { faltan.add(clave); return texto; }
      const [, antes, , despues] = texto.match(/^(\s*)([\s\S]*?)(\s*)$/);
      return antes + dic[clave] + despues;
    };

    const ruta = (v) => (CARPETAS.test(v) ? `../${v}` : v);
    const atributo = (etiqueta) => etiqueta.replace(/(\s)([\w:-]+)="([^"]*)"/g, (todo, esp, nombre, valor) => {
      if (nombre === 'lang' && /^<html/.test(etiqueta)) return `${esp}lang="${idioma}"`;
      if (nombre === 'content' && /property="og:locale"/.test(etiqueta)) return `${esp}content="${LOCALES[idioma]}"`;
      if (ATRIBUTOS.has(nombre) || (nombre === 'content' && META.test(etiqueta))) return `${esp}${nombre}="${traducir(valor)}"`;
      if (nombre === 'srcset') return `${esp}srcset="${valor.split(',').map((p) => ruta(p.trim())).join(', ')}"`;
      if ((nombre === 'href' && /rel="canonical"/.test(etiqueta)) || (nombre === 'content' && /property="og:url"/.test(etiqueta))) {
        return `${esp}${nombre}="${valor.replace(BASE + '/', `${BASE}/${idioma}/`)}"`;
      }
      // Los enlaces a la web de paquetes van a su versión en el mismo idioma
      if (nombre === 'href' && (valor === WEB || valor.startsWith(WEB + '/')) && !/hreflang=/.test(etiqueta)) {
        return `${esp}href="${WEB}/${idioma}/${valor.slice(WEB.length).replace(/^\//, '')}"`;
      }
      if (nombre === 'href' || nombre === 'src' || nombre === 'content' || nombre === 'poster') return `${esp}${nombre}="${ruta(valor)}"`;
      return todo;
    });

    // El selector de idioma: cada enlace apunta a la misma página en su idioma, y se marca el actual
    const selector = (etiqueta) => {
      const otro = (etiqueta.match(/data-idioma="(\w+)"/) || [])[1];
      if (!otro) return null;
      const destino = (etiqueta.match(/href="([^"]*)"/) || [])[1].replace(/^(en|ja)\//, '');
      const href = otro === idioma ? destino : otro === 'es' ? `../${destino}` : `../${otro}/${destino}`;
      return etiqueta.replace(/href="[^"]*"/, `href="${href}"`).replace(/ aria-current="true"/, '').replace(/>$/, otro === idioma ? ' aria-current="true">' : '>');
    };

    html = html.replace(/<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<[^>]+>|[^<]+/g, (pieza) => {
      if (pieza.startsWith('<!--')) return pieza;
      if (pieza.startsWith('<script')) {
        const [, abre, cuerpo, cierra] = pieza.match(/^(<script\b[^>]*>)([\s\S]*?)(<\/script>)$/);
        return atributo(abre) + cuerpo + cierra;
      }
      if (pieza.startsWith('<style')) return pieza;
      if (pieza.startsWith('<')) return selector(pieza) || atributo(pieza);
      if (LETRAS.test(pieza)) return traducir(pieza);
      return pieza;
    });

    html = html.replace(/(data-idioma-actual>)[^<]*/, `$1${idioma.toUpperCase()}`);
    salida[pagina] = html;
  }
  return salida;
}

if (require.main === module) {
  const soloVer = process.argv.includes('--faltan');
  let falta = false;
  const todo = {};
  for (const idioma of IDIOMAS) {
    const faltan = new Set();
    todo[idioma] = generar(idioma, faltan);
    if (faltan.size || soloVer) {
      falta = falta || faltan.size > 0;
      console.log(JSON.stringify({ idioma, faltan: [...faltan] }, null, 2));
    }
  }
  if (soloVer) process.exit(0);
  if (falta) { console.error('Faltan traducciones: no se escribió nada.'); process.exit(1); }
  for (const idioma of IDIOMAS) {
    fs.mkdirSync(path.join(RAIZ, idioma), { recursive: true });
    for (const [pagina, html] of Object.entries(todo[idioma])) fs.writeFileSync(path.join(RAIZ, idioma, pagina), html);
  }
  console.log(`Listo: ${PAGINAS.length} página(s) en ${IDIOMAS.join(' y ')}.`);
}

module.exports = { generar, PAGINAS, IDIOMAS };
