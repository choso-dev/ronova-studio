// Worker de Cloudflare: corre antes de servir la web. Solo decide el idioma en la primera visita;
// todo lo demás lo sirven los archivos de dist/ tal cual (env.ASSETS).
//
// En la portada en español, sin elección guardada:
//   país que habla inglés → /en/ · Japón → /ja/ · país que habla español → se queda en español
//   otro país → el idioma del navegador si es es/en/ja, y si no, inglés.
// Si el visitante eligió idioma en la barra (cookie "ronova-idioma"), manda siempre esa elección.
// Los buscadores y las vistas previas de enlaces nunca se redirigen (cada idioma tiene su dirección).

const INGLES = new Set(['US', 'GB', 'CA', 'AU', 'NZ', 'IE', 'JM', 'TT', 'BS', 'BB', 'BZ', 'GY', 'AG', 'DM', 'GD', 'KN', 'LC', 'VC', 'BM', 'KY', 'VG', 'VI', 'GU', 'AS', 'MP', 'PR', 'SG', 'PH', 'ZA', 'NG', 'GH', 'KE', 'UG', 'ZW', 'ZM', 'BW', 'NA', 'MW', 'SL', 'LR', 'GM', 'MT', 'FJ', 'PG', 'IN', 'PK']);
const ESPANOL = new Set(['VE', 'CO', 'MX', 'ES', 'AR', 'CL', 'PE', 'EC', 'BO', 'PY', 'UY', 'CR', 'PA', 'GT', 'HN', 'SV', 'NI', 'CU', 'DO', 'GQ']);
const PAGINAS = new Set(['', 'index']);
const BOTS = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|discord|preview|lighthouse/i;

// ¿A qué dirección hay que mandar esta visita? null = servirla tal cual
export function destino(url, { cookie = '', pais = '', idiomas = '', agente = '', metodo = 'GET' } = {}) {
  if (metodo !== 'GET' || BOTS.test(agente)) return null;
  const { pathname, search } = new URL(url);
  const pagina = pathname.replace(/^\//, '').replace(/\.html$/, '');
  if (!PAGINAS.has(pagina)) return null; // ya está en /en/ o /ja/, o es un archivo (css, js, img…)

  const elegido = (cookie.match(/(?:^|;\s*)ronova-idioma=(es|en|ja)/) || [])[1];
  let idioma = elegido;
  if (!idioma) {
    if (pais === 'JP') idioma = 'ja';
    else if (INGLES.has(pais)) idioma = 'en';
    else if (ESPANOL.has(pais)) idioma = 'es';
    else idioma = (idiomas.toLowerCase().match(/\b(es|en|ja)\b/) || [, 'en'])[1];
  }
  if (idioma === 'es') return null;
  return `/${idioma}/${pagina === 'index' ? '' : pagina}${search}`;
}

export default {
  async fetch(request, env) {
    const a = destino(request.url, {
      cookie: request.headers.get('Cookie') || '',
      pais: (request.cf && request.cf.country) || '',
      idiomas: request.headers.get('Accept-Language') || '',
      agente: request.headers.get('User-Agent') || '',
      metodo: request.method,
    });
    if (a) return new Response(null, { status: 302, headers: { Location: a, 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
    return env.ASSETS.fetch(request);
  },
};
