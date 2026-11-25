'use strict';

/* ---------- Utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const espera = ms => new Promise(r => setTimeout(r, ms));
// Valores seguros para atributos style con datos externos: solo colores #rgb/#rrggbb y URLs https bien formadas.
const colorSeguro = c => /^#[0-9a-f]{3,8}$/i.test(String(c || '')) ? c : 'transparent';
function urlCssSegura(u) {
  try {
    const url = new URL(String(u || ''));
    // Comillas, barras invertidas y espacios se codifican para que no puedan cerrar el url("…").
    return url.protocol === 'https:' ? `url("${url.href.replace(/["'\\\s()]/g, c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase())}")` : 'none';
  } catch (e) { return 'none'; }
}

const ICONOS = {
  calendario: '<rect x="3" y="4.5" width="18" height="16.5" rx="3.5"/><path d="M8 2.5v4M16 2.5v4M3 10h18"/>',
  explorar: '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
  marcador: '<path d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4-6.5 4v-16a1 1 0 0 1 1-1z"/>',
  buscar: '<circle cx="11" cy="11" r="6.8"/><path d="m20 20-4.2-4.2"/>',
  abajo: '<path d="m6 9 6 6 6-6"/>',
  izq: '<path d="m15 6-6 6 6 6"/>',
  der: '<path d="m9 6 6 6-6 6"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  recargar: '<path d="M20 11.5A8 8 0 1 1 17.7 6"/><path d="M20.5 3.5V8.5h-5"/>',
  estrella: '<path d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.3l-5.6 2.9 1.1-6.3L2.9 9.5l6.3-.9z"/>',
  corazon: '<path d="M12 20.3s-7.6-4.6-9.3-9.5C1.5 7.3 3.8 4.3 7.2 4.3c2 0 3.7 1.1 4.8 2.8 1.1-1.7 2.8-2.8 4.8-2.8 3.4 0 5.7 3 4.5 6.5-1.7 4.9-9.3 9.5-9.3 9.5z"/>',
  externo: '<path d="M14 4h6v6M20 4l-8.5 8.5M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
  reloj: '<circle cx="12" cy="12" r="8.8"/><path d="M12 7.5V12l3 2"/>',
  info: '<circle cx="12" cy="12" r="8.8"/><path d="M12 11v5.5M12 7.8v.2"/>',
  tv: '<rect x="3" y="6.5" width="18" height="13" rx="2.5"/><path d="m8.5 2.8 3.5 3.4 3.5-3.4"/>',
  orden: '<path d="M7 4v16M3.5 16.5 7 20l3.5-3.5M17 20V4M13.5 7.5 17 4l3.5 3.5"/>',
  ordenDesc: '<path d="M4 6h10M4 12h7M4 18h4M18 4.5v15M14.5 16l3.5 3.5 3.5-3.5"/>',
  ordenAsc: '<path d="M4 6h4M4 12h7M4 18h10M18 19.5v-15M14.5 8 18 4.5 21.5 8"/>',
  sync: '<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5M20 12a8 8 0 0 1-13.7 5.6L4 15.5"/><path d="M20 4v4.5h-4.5M4 20v-4.5h4.5"/>',
  mas: '<path d="M12 5v14M5 12h14"/>',
  play: '<path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.2-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/>',
  lapiz: '<path d="M4 20h4L19.3 8.7a2.1 2.1 0 0 0-3-3L5 17v3z"/><path d="m14.5 7.5 3 3"/>'
};
const ico = (n, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24">${ICONOS[n]}</svg>`;
document.querySelectorAll('i[data-i]').forEach(i => { i.outerHTML = ico(i.dataset.i); });

const GENEROS = {
  'Action': 'Acción', 'Adventure': 'Aventura', 'Comedy': 'Comedia', 'Drama': 'Drama', 'Ecchi': 'Ecchi', 'Fantasy': 'Fantasía',
  'Horror': 'Terror', 'Mahou Shoujo': 'Mahou shoujo', 'Mecha': 'Mecha', 'Music': 'Música', 'Mystery': 'Misterio',
  'Psychological': 'Psicológico', 'Romance': 'Romance', 'Sci-Fi': 'Ciencia ficción', 'Slice of Life': 'Recuentos de la vida',
  'Sports': 'Deportes', 'Supernatural': 'Sobrenatural', 'Thriller': 'Suspense'
};
const FORMATOS = { TV: 'TV', TV_SHORT: 'TV corto', MOVIE: 'Película', OVA: 'OVA', ONA: 'ONA', SPECIAL: 'Especial', MUSIC: 'Musical' };
const ESTADOS = { RELEASING: 'En emisión', FINISHED: 'Finalizado', NOT_YET_RELEASED: 'Próximamente', HIATUS: 'En pausa', CANCELLED: 'Cancelado' };
const TEMPORADAS = { WINTER: 'Invierno', SPRING: 'Primavera', SUMMER: 'Verano', FALL: 'Otoño' };
// Criterios de orden: [clave, nombre, dirección natural, texto descendente, texto ascendente]
const ORDENES = [
  ['estreno', 'Estreno', 'desc', 'Estreno más reciente', 'Estreno más antiguo'],
  ['popularidad', 'Popularidad', 'desc', 'Más populares', 'Menos populares'],
  ['puntuacion', 'Puntuación', 'desc', 'Mejor puntuados', 'Peor puntuados'],
  ['nombre', 'Nombre (A-Z)', 'asc', 'Nombre (Z-A)', 'Nombre (A-Z)']
];
const ordenDe = k => ORDENES.find(o => o[0] === k) || ORDENES[0];
const describirOrden = f => { const o = ordenDe(f.orden); return f.dir === 'asc' ? o[4] : o[3]; };
const LISTA_ESTADOS = { viendo: 'Viendo', pendiente: 'Pendiente', completado: 'Completado' };
const MAL_ESTADOS = { 1: 'viendo', 2: 'completado', 3: 'pausa', 4: 'abandonado', 6: 'pendiente' };

const fmtHora = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' });
const fmtDiaLargo = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtDiaCorto = new Intl.DateTimeFormat('es-ES', { weekday: 'short' });
const fmtMes = new Intl.DateTimeFormat('es-ES', { month: 'long' });
const fmtFecha = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

function relativo(segundos) {
  const m = Math.round(Math.abs(segundos) / 60);
  if (m < 1) return segundos >= 0 ? 'en un momento' : 'hace un momento';
  let t;
  if (m < 60) t = `${m} min`;
  else if (m < 60 * 24) { const h = Math.floor(m / 60), r = m % 60; t = r && h < 10 ? `${h} h ${r} min` : `${h} h`; }
  else { const d = Math.round(m / 1440); t = d === 1 ? '1 día' : `${d} días`; }
  return segundos >= 0 ? `en ${t}` : `hace ${t}`;
}
function temporadaActual(fecha = new Date()) {
  const m = fecha.getMonth();
  return { season: ['WINTER', 'WINTER', 'WINTER', 'SPRING', 'SPRING', 'SPRING', 'SUMMER', 'SUMMER', 'SUMMER', 'FALL', 'FALL', 'FALL'][m], year: fecha.getFullYear() };
}
function aviso(texto, ms = 3200) {
  const a = $('#aviso');
  a.textContent = texto; a.hidden = false;
  clearTimeout(aviso.t); aviso.t = setTimeout(() => { a.hidden = true; }, ms);
}
function alCargarImagen(raiz) {
  raiz.querySelectorAll('img:not(.cargada)').forEach(img => {
    if (img.complete && img.naturalWidth) img.classList.add('cargada');
    else img.addEventListener('load', () => img.classList.add('cargada'), { once: true });
  });
}

/* ---------- Puente con la aplicación de Windows ---------- */
const anfitrion = window.chrome && window.chrome.webview ? window.chrome.webview : null;
const pendientes = new Map();
let siguienteId = 1;
if (anfitrion) anfitrion.addEventListener('message', e => {
  const r = e.data, p = pendientes.get(r.id);
  if (!p) return;
  pendientes.delete(r.id);
  r.error ? p.reject(new Error(r.error)) : p.resolve(r);
});
function llamar(datos) {
  return new Promise((resolve, reject) => {
    const id = siguienteId++;
    pendientes.set(id, { resolve, reject });
    anfitrion.postMessage(Object.assign({ id }, datos));
  });
}
async function obtenerTexto(url) {
  if (anfitrion) {
    const r = await llamar({ tipo: 'http', url });
    return { estado: r.estado, cuerpo: r.cuerpo };
  }
  const r = await fetch(url);
  return { estado: r.status, cuerpo: await r.text() };
}
function abrirExterno(url) {
  if (anfitrion) llamar({ tipo: 'abrir', url }).catch(() => {});
  else window.open(url, '_blank', 'noopener');
}

/* ---------- Datos persistentes: preferencias y biblioteca ---------- */
const datos = { prefs: {}, mal: null, lista: {} };
async function cargarDatos() {
  try {
    const texto = anfitrion ? (await llamar({ tipo: 'leer' })).valor : localStorage.getItem('datos');
    if (texto) Object.assign(datos, JSON.parse(texto));
  } catch (e) { console.warn(e); }
}
// Se guarda al momento (agrupando los cambios hechos a la vez) para no perder nada si se cierra la ventana enseguida.
let guardadoPendiente = false;
function guardar() {
  if (guardadoPendiente) return;
  guardadoPendiente = true;
  queueMicrotask(() => {
    guardadoPendiente = false;
    const texto = JSON.stringify(datos);
    if (anfitrion) llamar({ tipo: 'guardar', valor: texto }).catch(e => aviso('No se pudo guardar: ' + e.message));
    else try { localStorage.setItem('datos', texto); } catch (e) { /* sin almacenamiento */ }
  });
}

/* Caché de respuestas: se muestra al instante y se renueva en segundo plano. */
const cache = {
  leer(clave) {
    try { const v = localStorage.getItem('c:' + clave); return v ? JSON.parse(v) : null; } catch (e) { return null; }
  },
  escribir(clave, valor) {
    const texto = JSON.stringify({ t: Date.now(), v: valor });
    for (let intento = 0; intento < 3; intento++) {
      try { localStorage.setItem('c:' + clave, texto); return; } catch (e) { cache.podar(); }
    }
  },
  podar() {
    const claves = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith('c:')) { try { claves.push([k, JSON.parse(localStorage.getItem(k)).t]); } catch (e) { claves.push([k, 0]); } }
    }
    claves.sort((a, b) => a[1] - b[1]).slice(0, Math.ceil(claves.length / 2)).forEach(([k]) => localStorage.removeItem(k));
  },
  vaciar() {
    for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (k.startsWith('c:')) localStorage.removeItem(k); }
  }
};

/* ---------- AniList ---------- */
async function anilist(query, variables) {
  for (let intento = 0; intento < 3; intento++) {
    let r;
    try {
      r = await fetch('https://graphql.anilist.co', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query, variables })
      });
    } catch (e) {
      if (intento === 2) throw new Error('No se pudo conectar con AniList.');
      await espera(1200); continue;
    }
    if (r.status === 429) { await espera((Number(r.headers.get('Retry-After')) || 20) * 1000); continue; }
    const j = await r.json().catch(() => null);
    if (!r.ok || !j || j.errors) {
      if (r.status >= 500 && intento < 2) { await espera(1500); continue; }
      throw new Error('AniList no está disponible ahora mismo.');
    }
    return j.data;
  }
  throw new Error('AniList está limitando las peticiones. Prueba en un momento.');
}
/** Devuelve lo guardado al instante (aunque esté caducado) y llama a alRenovar si había que actualizar. */
async function conCache(clave, vigenciaMin, cargar, alRenovar, forzar) {
  const guardado = cache.leer(clave);
  const fresco = guardado && Date.now() - guardado.t < vigenciaMin * 60000;
  if (guardado && !forzar) {
    if (!fresco) cargar().then(v => { cache.escribir(clave, v); alRenovar(v); }).catch(() => {});
    return guardado.v;
  }
  const v = await cargar();
  cache.escribir(clave, v);
  return v;
}

const CAMPOS_TARJETA = `id idMal title { romaji english native } coverImage { extraLarge large color } format status episodes
  season seasonYear startDate { year month day } averageScore popularity genres nextAiringEpisode { airingAt episode }`;

/* ---------- Biblioteca ---------- */
function claveDe(m) { return m.idMal ? 'mal:' + m.idMal : 'al:' + m.id; }
function estadoDe(e) {
  if (!e) return null;
  const s = e.manual ? e.manual : e.mal;
  return s && s.estado !== 'quitado' ? s.estado : null;
}
function favDe(e) { return !!e && (e.fav !== undefined ? e.fav : !!e.malFav); }
function entradaDe(m) {
  return datos.lista[claveDe(m)] || (m.idMal ? null : Object.values(datos.lista).find(e => e.idAl === m.id)) || null;
}
function enMiLista(m) { const e = entradaDe(m); return !!e && (['viendo', 'pendiente'].includes(estadoDe(e)) || favDe(e)); }
function actualizarEntrada(m, cambio) {
  const k = claveDe(m);
  const e = datos.lista[k] || { idMal: m.idMal || null };
  Object.assign(e, {
    idAl: m.id, titulo: m.title.romaji, portada: m.coverImage.extraLarge || m.coverImage.large,
    formato: m.format, total: m.episodes || e.total || 0, emision: m.status === 'RELEASING', anio: m.seasonYear || (m.startDate && m.startDate.year) || e.anio
  });
  cambio(e);
  if (!estadoDe(e) && !favDe(e) && !e.mal && !e.malFav) delete datos.lista[k];
  else datos.lista[k] = e;
  guardar();
}

/* ---------- MyAnimeList (perfil público, sin iniciar sesión) ---------- */
function usuarioMal(texto) {
  texto = (texto || '').trim();
  const m = texto.match(/myanimelist\.net\/(?:profile|animelist)\/([^/?#\s]+)/i);
  const u = m ? m[1] : texto.replace(/^@/, '');
  return /^[\w-]{2,16}$/.test(u) ? u : null;
}
async function listaMal(usuario) {
  const todo = [];
  for (let offset = 0; offset < 20000; offset += 300) {
    const r = await obtenerTexto(`https://myanimelist.net/animelist/${encodeURIComponent(usuario)}/load.json?status=7&offset=${offset}`);
    if (r.estado === 400 || r.estado === 404) throw new Error('No existe ese usuario o su lista de anime es privada.');
    if (r.estado === 403 || r.estado === 401) throw new Error('La lista de ese usuario es privada.');
    if (r.estado === 429) throw new Error('MyAnimeList está limitando las peticiones. Prueba en un minuto.');
    if (r.estado !== 200) throw new Error(`MyAnimeList respondió con un error (${r.estado}).`);
    let pagina;
    try { pagina = JSON.parse(r.cuerpo); } catch (e) { throw new Error('MyAnimeList devolvió una respuesta inesperada.'); }
    if (!Array.isArray(pagina)) throw new Error('No existe ese usuario o su lista de anime es privada.');
    todo.push(...pagina);
    if (pagina.length < 300) break;
    await espera(400);
  }
  return todo;
}
function portadaMal(url) {
  if (!url) return '';
  return url.replace(/\/r\/\d+x\d+/, '').replace(/\?.*$/, '').replace(/(\d+)\.(jpg|webp)$/, '$1l.$2');
}
async function favoritosMal(usuario) {
  // 1) La sección de favoritos del perfil público; 2) Jikan (API pública no oficial) como alternativa.
  try {
    const r = await obtenerTexto(`https://myanimelist.net/profile/${encodeURIComponent(usuario)}`);
    if (r.estado === 200) {
      const doc = new DOMParser().parseFromString(r.cuerpo, 'text/html');
      const bloque = doc.getElementById('anime_favorites');
      if (!bloque) return doc.querySelector('.user-profile') ? [] : null;
      return [...bloque.querySelectorAll('li.btn-fav a[href*="/anime/"]')].map(a => {
        const img = a.querySelector('img');
        const extra = (a.querySelector('.users') || {}).textContent || '';
        return {
          id: Number((a.getAttribute('href').match(/\/anime\/(\d+)/) || [])[1]),
          titulo: ((a.querySelector('.title') || {}).textContent || (img && img.alt) || '').trim(),
          portada: portadaMal(img && (img.getAttribute('data-src') || img.getAttribute('src'))),
          formato: extra.split(/·|·/)[0].trim(), anio: Number((extra.match(/\d{4}/) || [])[0]) || null
        };
      }).filter(f => f.id);
    }
  } catch (e) { /* se intenta con Jikan */ }
  try {
    const r = await obtenerTexto(`https://api.jikan.moe/v4/users/${encodeURIComponent(usuario)}/favorites`);
    if (r.estado !== 200) return null;
    const j = JSON.parse(r.cuerpo);
    return j.data.anime.map(a => ({ id: a.mal_id, titulo: a.title, portada: portadaMal(a.images && a.images.jpg && a.images.jpg.image_url), formato: a.type, anio: a.start_year }));
  } catch (e) { return null; }
}
const FORMATOS_MAL = { TV: 'TV', Movie: 'MOVIE', OVA: 'OVA', ONA: 'ONA', Special: 'SPECIAL', Music: 'MUSIC', 'TV Special': 'SPECIAL' };
let sincronizando = false;
async function sincronizarMal(usuario, silencioso) {
  if (sincronizando) return;
  sincronizando = true; refrescarLista();
  try {
    const [lista, favs] = await Promise.all([listaMal(usuario), favoritosMal(usuario)]);
    for (const e of Object.values(datos.lista)) { delete e.mal; if (favs) delete e.malFav; }
    for (const a of lista) {
      const k = 'mal:' + a.anime_id;
      const e = datos.lista[k] || (datos.lista[k] = { idMal: a.anime_id });
      e.titulo = String(e.titulo || a.anime_title);
      e.portada = e.portada || portadaMal(a.anime_image_path);
      e.formato = e.formato || FORMATOS_MAL[a.anime_media_type_string] || a.anime_media_type_string;
      e.total = a.anime_num_episodes || e.total || 0;
      e.emision = a.anime_airing_status === 1;
      e.mal = { estado: MAL_ESTADOS[a.status] || 'pendiente', vistos: a.num_watched_episodes || 0, nota: a.score || 0 };
    }
    for (const f of favs || []) {
      const k = 'mal:' + f.id;
      const e = datos.lista[k] || (datos.lista[k] = { idMal: f.id, titulo: String(f.titulo), portada: f.portada, formato: FORMATOS_MAL[f.formato] || f.formato, anio: f.anio });
      e.malFav = true;
    }
    for (const [k, e] of Object.entries(datos.lista)) if (!e.mal && !e.malFav && !e.manual && e.fav === undefined) delete datos.lista[k];
    datos.mal = { usuario, fecha: Date.now(), total: lista.length, favoritos: favs ? favs.length : null };
    guardar();
    if (!silencioso) aviso(`Lista de ${usuario} sincronizada: ${lista.length} animes` + (favs ? `, ${favs.length} favoritos.` : '.'));
  } catch (e) {
    if (!silencioso) aviso(e.message, 5000);
    if (datos.mal) { datos.mal.error = e.message; guardar(); }
    else throw e;
  } finally {
    sincronizando = false;
    pintarBarra(); refrescarLista();
  }
}
function refrescarLista() { if (estado.seccion === 'lista') vistaLista(); }

/* ---------- Estado de la interfaz ---------- */
const estado = { seccion: 'calendario', semana: 0, dia: null, cargaCal: 0, cargaExp: 0 };
const vista = $('#vista');

function pintarBarra() {
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('activo', b.dataset.seccion === estado.seccion));
  $('#barraDer').innerHTML = datos.mal
    ? `<button class="mal-pill" data-ir="lista" title="Lista de MyAnimeList sincronizada"><span class="punto"></span>MAL · <b>${esc(datos.mal.usuario)}</b></button>`
    : '';
}
function ir(seccion) {
  if (seccion === estado.seccion && vista.childElementCount) return;
  estado.seccion = seccion;
  datos.prefs.seccion = seccion; guardar();
  pintarBarra();
  window.scrollTo(0, 0);
  ({ calendario: vistaCalendario, explorar: vistaExplorar, lista: vistaLista })[seccion]();
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-seccion],[data-ir]');
  if (b) ir(b.dataset.seccion || b.dataset.ir);
});

/* ---------- Calendario ---------- */
function inicioSemana(desplazamiento) {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + desplazamiento * 7);
  return d;
}
async function cargarSemana(inicio, forzar, alRenovar) {
  const desde = Math.floor(inicio / 1000), hasta = desde + 7 * 86400;
  const actual = Date.now() / 1000;
  const vigencia = hasta < actual ? 24 * 60 : desde > actual + 86400 * 7 ? 6 * 60 : 30;
  const q = `query($p:Int,$a:Int,$b:Int){Page(page:$p,perPage:50){pageInfo{hasNextPage}
    airingSchedules(airingAt_greater:$a,airingAt_lesser:$b,sort:TIME){airingAt episode
    media{id idMal isAdult countryOfOrigin popularity format episodes status title{romaji} coverImage{large color}}}}}`;
  return conCache('semana:' + desde, vigencia, async () => {
    const lista = [];
    for (let p = 1; p < 12; p++) {
      const d = await anilist(q, { p, a: desde - 1, b: hasta });
      for (const s of d.Page.airingSchedules) {
        const m = s.media;
        if (!m || m.isAdult) continue;
        lista.push({ t: s.airingAt, ep: s.episode, id: m.id, idMal: m.idMal, titulo: m.title.romaji, portada: m.coverImage.large, color: m.coverImage.color,
          pop: m.popularity || 0, pais: m.countryOfOrigin, formato: m.format, total: m.episodes || 0 });
      }
      if (!d.Page.pageInfo.hasNextPage) break;
    }
    return lista;
  }, alRenovar, forzar);
}
function filtrarCal(lista) {
  const modo = datos.prefs.modoCal || 'todo';
  if (modo === 'lista') return lista.filter(x => enMiLista({ id: x.id, idMal: x.idMal }));
  if (modo === 'populares') return lista.filter(x => x.pop >= 3000 || enMiLista({ id: x.id, idMal: x.idMal }));
  return lista;
}

async function vistaCalendario(forzar) {
  const carga = ++estado.cargaCal;
  const inicio = inicioSemana(estado.semana);
  const fin = new Date(inicio); fin.setDate(fin.getDate() + 6);
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  if (estado.dia == null || estado.dia < 0 || estado.dia > 6)
    estado.dia = estado.semana === 0 ? (hoy.getDay() + 6) % 7 : 0;
  const rango = inicio.getMonth() === fin.getMonth()
    ? `${inicio.getDate()} – ${fin.getDate()} de ${fmtMes.format(fin)}`
    : `${inicio.getDate()} de ${fmtMes.format(inicio)} – ${fin.getDate()} de ${fmtMes.format(fin)}`;
  const modo = datos.prefs.modoCal || 'todo';

  vista.innerHTML = `
    <div class="cabecera">
      <div class="titulo"><h1>Calendario</h1><p>${rango} ${fin.getFullYear()}</p></div>
      <div class="der">
        <div class="segmentado" id="modoCal">
          ${[['todo', 'Todo'], ['populares', 'Populares'], ['lista', 'Mi lista']].map(([k, t]) => `<button data-modo="${k}" class="${modo === k ? 'activo' : ''}">${t}</button>`).join('')}
        </div>
        <div style="display:flex;gap:6px">
          <button class="boton icono" id="semAnt" title="Semana anterior">${ico('izq')}</button>
          <button class="boton" id="semHoy" ${estado.semana === 0 ? 'disabled' : ''}>Hoy</button>
          <button class="boton icono" id="semSig" title="Semana siguiente">${ico('der')}</button>
        </div>
        <button class="boton icono" id="calRecargar" title="Actualizar (F5)">${ico('recargar')}</button>
      </div>
    </div>
    <div class="dias" id="dias">${Array.from({ length: 7 }, () => '<div class="dia esqueleto" style="height:74px"></div>').join('')}</div>
    <div id="contenidoDia"><div class="episodios">${Array.from({ length: 6 }, () => '<div class="episodio esqueleto" style="height:121px"></div>').join('')}</div></div>`;

  $('#modoCal').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    datos.prefs.modoCal = b.dataset.modo; guardar(); vistaCalendario();
  };
  $('#semAnt').onclick = () => { estado.semana--; estado.dia = 0; vistaCalendario(); };
  $('#semSig').onclick = () => { estado.semana++; estado.dia = 0; vistaCalendario(); };
  $('#semHoy').onclick = () => { estado.semana = 0; estado.dia = null; vistaCalendario(); };
  $('#calRecargar').onclick = () => vistaCalendario(true);

  let lista;
  const boton = $('#calRecargar');
  boton.classList.add('girando');
  const pintar = l => { if (carga === estado.cargaCal) { estado.ultima = { inicio, lista: l }; pintarSemana(inicio, filtrarCal(l)); } };
  try {
    lista = await cargarSemana(inicio, forzar, pintar);
  } catch (e) {
    if (carga !== estado.cargaCal) return;
    $('#dias').innerHTML = '';
    $('#contenidoDia').innerHTML = `<div class="error">${ico('info')}<span>${esc(e.message)}</span><button class="boton" id="reintentar">Reintentar</button></div>`;
    $('#reintentar').onclick = () => vistaCalendario(true);
    return;
  } finally { boton.classList.remove('girando'); }
  pintar(lista);
}

function pintarSemana(inicio, lista) {
  const ahora = Date.now() / 1000;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const porDia = Array.from({ length: 7 }, () => []);
  for (const x of lista) {
    const d = new Date(x.t * 1000); d.setHours(0, 0, 0, 0);
    const i = Math.round((d - inicio) / 86400000);
    if (i >= 0 && i < 7) porDia[i].push(x);
  }
  $('#dias').innerHTML = porDia.map((eps, i) => {
    const d = new Date(inicio); d.setDate(d.getDate() + i);
    const cls = [i === estado.dia && 'activo', +d === +hoy && 'hoy', d < hoy && 'pasado'].filter(Boolean).join(' ');
    return `<button class="dia ${cls}" data-dia="${i}">
      <span class="nom">${+d === +hoy ? 'Hoy' : fmtDiaCorto.format(d).replace('.', '')}</span>
      <span class="num">${d.getDate()}</span>
      <span class="cnt">${eps.length ? eps.length + (eps.length === 1 ? ' episodio' : ' episodios') : 'Sin episodios'}</span></button>`;
  }).join('');
  $('#dias').onclick = e => {
    const b = e.target.closest('[data-dia]'); if (!b) return;
    estado.dia = Number(b.dataset.dia);
    pintarSemana(inicio, lista);
  };

  const dia = new Date(inicio); dia.setDate(dia.getDate() + estado.dia);
  const eps = porDia[estado.dia];
  const contenedor = $('#contenidoDia');
  if (!eps.length) {
    const modo = datos.prefs.modoCal || 'todo';
    contenedor.innerHTML = `<div class="vacio">${ico('calendario')}<h3>No hay episodios este día</h3>
      <p>${modo === 'lista' ? 'Ninguno de los animes que sigues se emite este día.' : modo === 'populares' ? 'Prueba con «Todo» para ver también los menos conocidos.' : 'Elige otro día de la semana.'}</p></div>`;
    return;
  }
  const titulo = fmtDiaLargo.format(dia).replace(/^./, c => c.toUpperCase());
  let html = `<div class="cab-dia"><h2>${titulo}</h2><span>${eps.length} ${eps.length === 1 ? 'episodio' : 'episodios'}</span>
    <span class="nota-fuente" title="Fecha y hora de la emisión original en Japón (AniList), convertidas a tu hora local.">${ico('reloj')}Hora local · emisión en Japón</span></div><div class="episodios">`;
  const esHoy = +dia === +hoy;
  const emitidos = esHoy ? eps.filter(x => x.t <= ahora).length : 0;
  const plegar = esHoy && emitidos > 0 && emitidos < eps.length && !estado.verEmitidos;
  if (plegar) html += `<button class="plegados" id="verEmitidos">${ico('abajo')}Mostrar ${emitidos === 1 ? 'el episodio ya emitido' : `los ${emitidos} episodios ya emitidos`} hoy</button>`;
  let marcaAhora = false;
  for (const x of eps) {
    if (plegar && x.t <= ahora) continue;
    if (!marcaAhora && x.t > ahora && esHoy) {
      marcaAhora = true;
      html += `<div class="ahora">Ahora · ${fmtHora.format(new Date())}</div>`;
    }
    html += tarjetaEpisodio(x, ahora);
  }
  html += '</div>';
  contenedor.innerHTML = html;
  alCargarImagen(contenedor);
  contenedor.onclick = e => { const t = e.target.closest('[data-id]'); if (t) abrirFicha(Number(t.dataset.id)); };
  const ver = $('#verEmitidos');
  if (ver) ver.onclick = e => { e.stopPropagation(); estado.verEmitidos = true; pintarSemana(inicio, lista); };
}

function tarjetaEpisodio(x, ahora) {
  const mio = enMiLista({ id: x.id, idMal: x.idMal });
  const etiquetas = [];
  if (x.ep === 1) etiquetas.push('<span class="etiqueta estreno">Estreno</span>');
  else if (x.total && x.ep === x.total) etiquetas.push('<span class="etiqueta final">Final</span>');
  if (mio) etiquetas.push(`<span class="etiqueta acento">${ico('marcador')}Mi lista</span>`);
  const dif = x.t - ahora;
  const cuando = dif <= 0 ? 'Emitido' : dif < 86400 * 2 ? relativo(dif) : '';
  return `<article class="episodio ${mio ? 'mio' : ''} ${dif <= 0 ? 'emitido' : ''}" data-id="${x.id}">
    <div class="mini" style="background:${colorSeguro(x.color)}"><img src="${esc(x.portada)}" alt="" loading="lazy" decoding="async"></div>
    <div class="datos">
      <div class="cuando"><b>${fmtHora.format(new Date(x.t * 1000))}</b>${cuando ? `<span>${cuando}</span>` : ''}</div>
      <h3 title="${esc(x.titulo)}">${esc(x.titulo)}</h3>
      <div class="ep">Episodio <b>${x.ep}</b>${x.total ? ` de ${x.total}` : ''}</div>
      ${etiquetas.length ? `<div class="abajo">${etiquetas.join('')}</div>` : ''}
    </div></article>`;
}

/* ---------- Explorar ---------- */
function filtrosExp() {
  const f = datos.prefs.explorar || (datos.prefs.explorar = {});
  f.generos = f.generos || []; f.formatos = f.formatos || []; f.estados = f.estados || [];
  // Convierte las preferencias de versiones anteriores («reciente», «antiguo»).
  if (f.orden === 'reciente' || !f.orden) { f.orden = 'estreno'; f.dir = f.dir || 'desc'; }
  if (f.orden === 'antiguo') { f.orden = 'estreno'; f.dir = 'asc'; }
  if (!ORDENES.some(o => o[0] === f.orden)) f.orden = 'estreno';
  if (f.dir !== 'asc' && f.dir !== 'desc') f.dir = ordenDe(f.orden)[2];
  if (f.temporada === undefined) f.temporada = null;
  if (f.anio === undefined) f.anio = null;
  return f;
}
let busqueda = '';
const explorar = { pagina: 0, hayMas: true, cargando: false, vistos: new Set(), clave: '' };

function variablesExp() {
  const f = filtrosExp();
  const v = { isAdult: false };
  if (f.generos.length) v.genre_in = f.generos;
  if (f.formatos.length) v.format_in = f.formatos; else v.format_not_in = ['MUSIC'];
  if (f.estados.length) v.status_in = f.estados;
  if (f.temporada) v.season = f.temporada;
  if (f.anio) v.seasonYear = f.anio;
  if (busqueda) v.search = busqueda;
  const sinFecha = !f.temporada && !f.anio && !f.estados.includes('NOT_YET_RELEASED') && !busqueda;
  const desc = f.dir === 'desc';
  switch (f.orden) {
    case 'popularidad': v.sort = [desc ? 'POPULARITY_DESC' : 'POPULARITY']; break;
    case 'puntuacion': v.sort = [desc ? 'SCORE_DESC' : 'SCORE', 'POPULARITY_DESC']; v.averageScore_greater = 1; break;
    case 'nombre': v.sort = [desc ? 'TITLE_ROMAJI_DESC' : 'TITLE_ROMAJI']; break;
    default:
      v.startDate_greater = 19000000;
      if (!desc) { v.sort = ['START_DATE', 'POPULARITY_DESC']; break; }
      v.sort = busqueda ? ['SEARCH_MATCH'] : ['START_DATE_DESC', 'POPULARITY_DESC'];
      if (sinFecha) {
        const m = new Date(); m.setDate(m.getDate() + 1);
        v.startDate_lesser = m.getFullYear() * 10000 + (m.getMonth() + 1) * 100 + m.getDate();
      }
  }
  if (!busqueda && !(f.orden === 'popularidad' && desc)) v.popularity_greater = f.temporada || f.anio ? 50 : 250;
  return v;
}

function textoFiltros() {
  const f = filtrosExp();
  if (busqueda) return `Resultados para «${busqueda}»`;
  const partes = [];
  if (f.temporada || f.anio) partes.push([f.temporada && TEMPORADAS[f.temporada], f.anio].filter(Boolean).join(' '));
  const orden = describirOrden(f);
  partes.push(partes.length ? orden.charAt(0).toLowerCase() + orden.slice(1) : orden);
  return partes.join(' · ');
}

function vistaExplorar() {
  const f = filtrosExp();
  vista.innerHTML = `
    <div class="cabecera">
      <div class="titulo"><h1>Explorar</h1><p id="expResumen">${esc(textoFiltros())}</p></div>
      <div class="der">
        <label class="campo buscador">${ico('buscar')}<input id="buscar" placeholder="Buscar por título" value="${esc(busqueda)}" autocomplete="off" spellcheck="false">
          <button class="borrar" id="borrarBusqueda" ${busqueda ? '' : 'hidden'} title="Borrar">${ico('x')}</button></label>
      </div>
    </div>
    <div class="filtros" id="filtros"></div>
    <div class="activos" id="activos"></div>
    <div class="rejilla" id="rejilla"></div>
    <div class="centinela" id="centinela"></div>
    <div id="masInfo"></div>`;
  pintarFiltros();
  let t;
  const entrada = $('#buscar');
  entrada.oninput = () => {
    clearTimeout(t);
    $('#borrarBusqueda').hidden = !entrada.value;
    t = setTimeout(() => { busqueda = entrada.value.trim(); reiniciarExplorar(); }, 450);
  };
  entrada.onkeydown = e => { if (e.key === 'Escape') { entrada.value = ''; entrada.oninput(); } };
  $('#borrarBusqueda').onclick = e => { e.preventDefault(); entrada.value = ''; busqueda = ''; $('#borrarBusqueda').hidden = true; reiniciarExplorar(); };
  new IntersectionObserver(es => { if (es[0].isIntersecting) cargarPaginaExp(); }, { rootMargin: '900px' }).observe($('#centinela'));
  reiniciarExplorar();
}

function pintarFiltros() {
  const f = filtrosExp();
  const btn = (id, texto, n) => `<div class="filtro"><button class="boton ${n ? 'con-valor' : ''}" data-abrir="${id}">${texto}${n ? `<span class="cuenta">${n}</span>` : ''}${ico('abajo')}</button></div>`;
  const temp = f.temporada || f.anio ? [f.temporada && TEMPORADAS[f.temporada], f.anio].filter(Boolean).join(' ') : 'Temporada';
  $('#filtros').innerHTML =
    btn('generos', 'Géneros', f.generos.length) +
    `<div class="filtro"><button class="boton ${f.temporada || f.anio ? 'con-valor' : ''}" data-abrir="temporada">${esc(temp)}${ico('abajo')}</button></div>` +
    btn('formatos', 'Formato', f.formatos.length) +
    btn('estados', 'Emisión', f.estados.length) +
    `<div class="separador"></div>
     <div class="orden">
       <div class="filtro"><button class="boton" data-abrir="orden">${describirOrden(f)}${ico('abajo')}</button></div>
       <button class="boton icono" id="invertirOrden" title="${esc(describirOrden(f))}. Pulsa para invertir el orden.">${ico(f.dir === 'desc' ? 'ordenDesc' : 'ordenAsc')}</button>
     </div>`;

  const chips = [];
  f.generos.forEach(g => chips.push([GENEROS[g], () => { f.generos = f.generos.filter(x => x !== g); }]));
  if (f.temporada || f.anio) chips.push([temp, () => { f.temporada = null; f.anio = null; }]);
  f.formatos.forEach(g => chips.push([FORMATOS[g], () => { f.formatos = f.formatos.filter(x => x !== g); }]));
  f.estados.forEach(g => chips.push([ESTADOS[g], () => { f.estados = f.estados.filter(x => x !== g); }]));
  const activos = $('#activos');
  activos.innerHTML = chips.map(([t], i) => `<span class="chip">${esc(t)}<button data-quitar="${i}" title="Quitar">${ico('x')}</button></span>`).join('') +
    (chips.length > 1 ? '<button class="enlace" data-quitar="todo">Limpiar filtros</button>' : '');
  activos.onclick = e => {
    const b = e.target.closest('[data-quitar]'); if (!b) return;
    if (b.dataset.quitar === 'todo') Object.assign(f, { generos: [], formatos: [], estados: [], temporada: null, anio: null });
    else chips[Number(b.dataset.quitar)][1]();
    cambiarFiltros();
  };
  $('#filtros').onclick = e => {
    if (e.target.closest('#invertirOrden')) { cerrarDesplegable(); f.dir = f.dir === 'desc' ? 'asc' : 'desc'; cambiarFiltros(); return; }
    const b = e.target.closest('[data-abrir]');
    if (b) abrirDesplegable(b);
  };
}

function cambiarFiltros() {
  guardar();
  pintarFiltros();
  reiniciarExplorar();
}

let desplegable = null;
function cerrarDesplegable() {
  if (!desplegable) return;
  desplegable.el.remove();
  desplegable.boton.classList.remove('abierto');
  const alCerrar = desplegable.alCerrar;
  desplegable = null;
  if (alCerrar) alCerrar();
}
document.addEventListener('mousedown', e => {
  if (desplegable && !desplegable.el.contains(e.target) && !desplegable.boton.contains(e.target)) cerrarDesplegable();
});

function abrirDesplegable(boton) {
  const tipo = boton.dataset.abrir;
  const abiertoAntes = desplegable && desplegable.tipo === tipo;
  cerrarDesplegable();
  if (abiertoAntes) return;
  const f = filtrosExp();
  const antes = JSON.stringify(f);
  const el = document.createElement('div');
  el.className = 'desplegable' + (tipo === 'orden' ? ' derecha lista' : '');
  const fichas = (lista, sel, cls = '') => `<div class="fichas ${cls}">${lista.map(([k, t]) => `<button class="ficha-op ${sel(k) ? 'activo' : ''}" data-v="${k}">${esc(t)}</button>`).join('')}</div>`;
  const pintar = () => {
    if (tipo === 'generos') {
      el.innerHTML = `<h4>Géneros</h4>${fichas(Object.entries(GENEROS).sort((a, b) => a[1].localeCompare(b[1], 'es')), k => f.generos.includes(k), 'generos')}
        <div class="pie-desplegable">${f.generos.length ? '<button class="enlace" data-limpiar>Quitar todos</button>' : ''}<span style="flex:1;color:var(--tenue);font-size:12px;align-self:center">${f.generos.length > 1 ? 'Se muestran los animes que tienen todos los géneros elegidos.' : 'Puedes elegir varios.'}</span></div>`;
    } else if (tipo === 'temporada') {
      const actual = temporadaActual(), anios = [];
      for (let a = new Date().getFullYear() + 1; a >= 1970; a--) anios.push([a, a]);
      el.innerHTML = `<h4>Temporada</h4>${fichas([['', 'Todas']].concat(Object.entries(TEMPORADAS)), k => (f.temporada || '') === k)}
        <h4>Año</h4>${fichas([['', 'Todos']].concat(anios), k => String(f.anio || '') === String(k), 'anios')}
        <div class="pie-desplegable"><button class="boton" data-actual>Temporada actual (${TEMPORADAS[actual.season]} ${actual.year})</button></div>`;
    } else if (tipo === 'formatos') {
      el.innerHTML = `<h4>Formato</h4>${fichas(Object.entries(FORMATOS).filter(([k]) => k !== 'MUSIC'), k => f.formatos.includes(k))}`;
    } else if (tipo === 'estados') {
      el.innerHTML = `<h4>Estado de emisión</h4>${fichas(Object.entries(ESTADOS), k => f.estados.includes(k))}`;
    } else {
      // Cada opción se muestra con su dirección habitual; la elegida, tal como se está usando.
      el.innerHTML = `<div class="opciones">${ORDENES.map(o => {
        const activo = f.orden === o[0];
        const texto = activo ? describirOrden(f) : (o[2] === 'desc' ? o[3] : o[4]);
        return `<button data-v="${o[0]}" class="${activo ? 'activo' : ''}">${texto}${activo ? ico('check') : ''}</button>`;
      }).join('')}</div>`;
    }
  };
  pintar();
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    const v = b.dataset.v;
    if (tipo === 'orden') {
      if (f.orden !== v) { f.orden = v; f.dir = ordenDe(v)[2]; }
      cerrarDesplegable(); return;
    }
    if (b.hasAttribute('data-limpiar')) f.generos = [];
    else if (b.hasAttribute('data-actual')) { const a = temporadaActual(); f.temporada = a.season; f.anio = a.year; }
    else if (tipo === 'temporada') {
      if (b.closest('.anios')) f.anio = v ? Number(v) : null; else f.temporada = v || null;
    } else {
      const arr = f[tipo];
      const i = arr.indexOf(v);
      i >= 0 ? arr.splice(i, 1) : arr.push(v);
    }
    const scroll = el.querySelector('.anios') ? el.querySelector('.anios').scrollTop : 0;
    pintar();
    if (el.querySelector('.anios')) el.querySelector('.anios').scrollTop = scroll;
    aplicarEnVivo();
  };
  // Los cambios se aplican al momento, sin botón de «Aplicar».
  let t;
  const aplicarEnVivo = () => { clearTimeout(t); t = setTimeout(() => { guardar(); reiniciarExplorar(); actualizarBotones(); }, 350); };
  const actualizarBotones = () => {
    pintarFiltros();
    const nuevo = $(`[data-abrir="${tipo}"]`);
    nuevo.classList.add('abierto');
    el.style.animation = 'none';
    nuevo.closest('.filtro').appendChild(el);
    desplegable.boton = nuevo;
  };
  boton.closest('.filtro').appendChild(el);
  boton.classList.add('abierto');
  desplegable = {
    tipo, el, boton, alCerrar: () => {
      clearTimeout(t);
      if (JSON.stringify(f) !== antes || tipo === 'orden') cambiarFiltros();
    }
  };
  if (tipo === 'temporada' && f.anio) {
    const sel = el.querySelector('.anios .activo');
    if (sel) sel.scrollIntoView({ block: 'center' });
  }
}

function reiniciarExplorar() {
  const clave = JSON.stringify(variablesExp());
  if (clave === explorar.clave && $('#rejilla') && $('#rejilla').childElementCount) return;
  explorar.clave = clave;
  explorar.pagina = 0; explorar.hayMas = true; explorar.vistos = new Set(); explorar.cargando = false;
  estado.cargaExp++;
  const r = $('#rejilla');
  if (!r) return;
  r.innerHTML = Array.from({ length: 18 }, () => '<div class="tarjeta esqueleto"></div>').join('');
  $('#masInfo').innerHTML = '';
  if ($('#expResumen')) $('#expResumen').textContent = textoFiltros();
  cargarPaginaExp(true);
}

async function cargarPaginaExp(primera) {
  if (explorar.cargando || !explorar.hayMas || estado.seccion !== 'explorar') return;
  if (!primera && !explorar.pagina) return;
  explorar.cargando = true;
  const carga = estado.cargaExp, pagina = explorar.pagina + 1, vars = Object.assign({ page: pagina, perPage: 40 }, variablesExp());
  const info = $('#masInfo');
  if (pagina > 1) info.innerHTML = '<div class="cargando-mas"><div class="girador"></div>Cargando más…</div>';
  const q = `query($page:Int,$perPage:Int,$search:String,$genre_in:[String],$format_in:[MediaFormat],$format_not_in:[MediaFormat],$status_in:[MediaStatus],
    $season:MediaSeason,$seasonYear:Int,$sort:[MediaSort],$isAdult:Boolean,$startDate_greater:FuzzyDateInt,$startDate_lesser:FuzzyDateInt,
    $popularity_greater:Int,$averageScore_greater:Int){Page(page:$page,perPage:$perPage){pageInfo{hasNextPage total}
    media(type:ANIME,search:$search,genre_in:$genre_in,format_in:$format_in,format_not_in:$format_not_in,status_in:$status_in,season:$season,
    seasonYear:$seasonYear,sort:$sort,isAdult:$isAdult,startDate_greater:$startDate_greater,startDate_lesser:$startDate_lesser,
    popularity_greater:$popularity_greater,averageScore_greater:$averageScore_greater){${CAMPOS_TARJETA}}}}`;
  const pintar = (d, reemplazar) => {
    if (carga !== estado.cargaExp) return;
    const r = $('#rejilla');
    if (!r) return;
    if (reemplazar || pagina === 1) { r.innerHTML = ''; explorar.vistos = new Set(); }
    const nuevos = d.Page.media.filter(m => !explorar.vistos.has(m.id));
    nuevos.forEach(m => explorar.vistos.add(m.id));
    r.insertAdjacentHTML('beforeend', nuevos.map(tarjetaAnime).join(''));
    alCargarImagen(r);
    explorar.hayMas = d.Page.pageInfo.hasNextPage;
    if (!r.childElementCount) r.innerHTML = '', info.innerHTML = `<div class="vacio">${ico('buscar')}<h3>No hay resultados</h3><p>Prueba a quitar algún filtro.</p></div>`;
    else info.innerHTML = explorar.hayMas ? '' : '<div class="cargando-mas">No hay más resultados</div>';
  };
  try {
    const clave = 'exp:' + JSON.stringify(vars);
    let d;
    if (pagina === 1) {
      // La primera página sale al instante desde la caché. La versión renovada en segundo plano solo la sustituye
      // si aún no se ha cargado nada más; si no, borraría las páginas siguientes (queda guardada para la próxima vez).
      d = await conCache(clave, 60, () => anilist(q, vars), v => { if (explorar.pagina <= 1 && !explorar.cargando) pintar(v, true); });
    } else {
      // Las páginas siguientes se usan de la caché si son recientes y, si no, se piden directamente, sin renovaciones aparte.
      const guardada = cache.leer(clave);
      if (guardada && Date.now() - guardada.t < 180 * 60000) d = guardada.v;
      else { d = await anilist(q, vars); cache.escribir(clave, d); }
    }
    pintar(d);
    explorar.pagina = pagina;
  } catch (e) {
    if (carga !== estado.cargaExp) return;
    info.innerHTML = `<div class="error">${ico('info')}<span>${esc(e.message)}</span><button class="boton" id="reintentarExp">Reintentar</button></div>`;
    if (pagina === 1) $('#rejilla').innerHTML = '';
    $('#reintentarExp').onclick = () => { info.innerHTML = ''; cargarPaginaExp(true); };
    explorar.hayMas = pagina === 1 ? true : explorar.hayMas;
  } finally {
    if (carga === estado.cargaExp) explorar.cargando = false;
  }
  if (carga === estado.cargaExp && explorar.hayMas) {
    const c = $('#centinela');
    if (c && c.getBoundingClientRect().top < innerHeight + 900) setTimeout(() => cargarPaginaExp(), 50);
  }
}

function tarjetaAnime(m) {
  const e = entradaDe(m);
  const est = estadoDe(e), fav = favDe(e);
  const nota = m.averageScore ? (m.averageScore / 10).toFixed(1).replace('.', ',') : '';
  const anio = m.seasonYear || (m.startDate && m.startDate.year) || '';
  const meta = [m.status === 'RELEASING' ? '<span class="punto"></span>En emisión' : '', FORMATOS[m.format] || '', m.status !== 'RELEASING' ? anio : '',
    m.episodes && m.format !== 'MOVIE' ? m.episodes + ' ep.' : ''].filter(Boolean).join(' · ');
  return `<article class="tarjeta" data-id="${m.id}" style="background-color:${colorSeguro(m.coverImage && m.coverImage.color)}">
    <img src="${esc(m.coverImage.extraLarge || m.coverImage.large)}" alt="" loading="lazy" decoding="async">
    <div class="insignias"><span>${nota ? `<span class="insignia nota">${ico('estrella', 'lleno')}${nota}</span>` : ''}</span>
      <span style="display:flex;gap:4px">${fav ? `<span class="insignia fav">${ico('corazon', 'lleno')}</span>` : ''}${est && LISTA_ESTADOS[est] ? `<span class="insignia estado">${LISTA_ESTADOS[est]}</span>` : ''}</span></div>
    <div class="pie"><h3>${esc(m.title.romaji)}</h3><div class="meta">${meta}</div></div>
  </article>`;
}
vista.addEventListener('click', e => {
  const t = e.target.closest('.tarjeta[data-id]');
  if (t) abrirFicha(Number(t.dataset.id));
  const tm = e.target.closest('.tarjeta[data-mal]');
  if (tm) abrirFicha(null, Number(tm.dataset.mal));
});

/* ---------- Mi lista ---------- */
let pestanaLista = 'viendo';
function vistaLista() {
  const entradas = Object.entries(datos.lista);
  const grupos = { viendo: [], pendiente: [], completado: [], favoritos: [] };
  for (const [k, e] of entradas) {
    const s = estadoDe(e);
    if (grupos[s]) grupos[s].push([k, e]);
    if (favDe(e)) grupos.favoritos.push([k, e]);
  }
  const nombres = { viendo: 'Viendo', pendiente: 'Pendientes', completado: 'Completados', favoritos: 'Favoritos' };
  const mal = datos.mal;
  const conexion = mal
    ? `<div class="mal">MAL</div>
       <div class="txt"><b>${esc(mal.usuario)}</b>
         <p>${sincronizando ? 'Sincronizando…' : `Sincronizado ${relativo((mal.fecha - Date.now()) / 1000)} · ${mal.total} animes${mal.favoritos != null ? ` · ${mal.favoritos} favoritos` : ''}`}${mal.error && !sincronizando ? ` · <span style="color:#ff9db4">${esc(mal.error)}</span>` : ''}</p></div>
       <button class="boton ${sincronizando ? 'girando' : ''}" id="malSync" ${sincronizando ? 'disabled' : ''}>${ico('sync')}Sincronizar</button>
       <button class="boton" id="malQuitar" title="Deja de sincronizar. Tus cambios manuales se conservan.">Desvincular</button>`
    : `<div class="mal">MAL</div>
       <div class="txt"><b>Importa tu lista de MyAnimeList</b><p>Solo necesitas tu nombre de usuario. La lista debe ser pública; no hace falta iniciar sesión.</p></div>
       <form id="malForm"><label class="campo">${ico('marcador')}<input id="malUsuario" placeholder="Usuario o enlace del perfil" autocomplete="off" spellcheck="false"></label>
         <button class="boton primario ${sincronizando ? 'girando' : ''}" ${sincronizando ? 'disabled' : ''}>${sincronizando ? ico('sync') + 'Importando…' : 'Importar'}</button></form>`;

  const lista = (grupos[pestanaLista] || []).sort((a, b) => {
    if (pestanaLista === 'viendo' && a[1].emision !== b[1].emision) return a[1].emision ? -1 : 1;
    return String(a[1].titulo || '').localeCompare(String(b[1].titulo || ''), 'es', { numeric: true });
  });
  vista.innerHTML = `
    <div class="cabecera"><div class="titulo"><h1>Mi lista</h1><p>Tus animes de MyAnimeList y los que añadas desde la aplicación</p></div></div>
    <div class="conexion">${conexion}</div>
    <div class="pestanas" id="pestanas">${Object.keys(nombres).map(k => `<button data-p="${k}" class="${k === pestanaLista ? 'activo' : ''}">${nombres[k]}<span class="n">${grupos[k].length}</span></button>`).join('')}</div>
    ${lista.length ? `<div class="rejilla">${lista.map(([k, e]) => tarjetaLista(k, e)).join('')}</div>`
      : `<div class="vacio">${ico(pestanaLista === 'favoritos' ? 'corazon' : 'marcador')}<h3>No hay nada aquí todavía</h3>
         <p>${mal ? 'Añade animes desde Explorar o el Calendario abriendo su ficha.' : 'Importa tu lista de MyAnimeList o añade animes desde su ficha en Explorar.'}</p>
         <button class="boton" data-ir="explorar">${ico('explorar')}Ir a Explorar</button></div>`}`;
  alCargarImagen(vista);
  $('#pestanas').onclick = e => { const b = e.target.closest('[data-p]'); if (b) { pestanaLista = b.dataset.p; vistaLista(); } };
  if (mal) {
    $('#malSync').onclick = () => sincronizarMal(mal.usuario);
    $('#malQuitar').onclick = () => {
      for (const [k, e] of Object.entries(datos.lista)) {
        delete e.mal; delete e.malFav;
        if (!e.manual && e.fav === undefined) delete datos.lista[k];
      }
      datos.mal = null; guardar(); pintarBarra(); vistaLista();
      aviso('Lista de MyAnimeList desvinculada. Se han conservado tus animes añadidos a mano.');
    };
  } else {
    $('#malForm').onsubmit = async e => {
      e.preventDefault();
      const u = usuarioMal($('#malUsuario').value);
      if (!u) { aviso('Escribe un nombre de usuario de MyAnimeList válido.'); return; }
      try { await sincronizarMal(u); } catch (err) { aviso(err.message, 5000); }
    };
  }
}
function tarjetaLista(k, e) {
  const est = estadoDe(e), fav = favDe(e);
  // Estos datos vienen de MyAnimeList, de Jikan o del HTML del perfil: los números se fuerzan a número y el texto se escapa.
  const num = v => { const n = Number(v); return isFinite(n) && n > 0 ? Math.floor(n) : 0; };
  const vistos = e.mal ? num(e.mal.vistos) : 0, total = num(e.total), anio = num(e.anio), notaMal = e.mal ? num(e.mal.nota) : 0;
  const meta = [e.emision ? '<span class="punto"></span>En emisión' : '', esc(FORMATOS[e.formato] || e.formato || ''), !e.emision && anio ? anio : '',
    est === 'viendo' && vistos ? (total ? `${vistos}/${total} ep.` : `${vistos} vistos`) : (total && e.formato !== 'MOVIE' ? total + ' ep.' : '')].filter(Boolean).join(' · ');
  // La barra de episodios vistos solo tiene sentido con los datos de MyAnimeList; los añadidos a mano no la llevan.
  const progreso = est === 'viendo' && total && e.mal ? `<div class="progreso"><span style="width:${Math.min(100, vistos / total * 100)}%"></span></div>` : '';
  const nota = notaMal ? `<span class="insignia nota">${ico('estrella', 'lleno')}${notaMal}</span>` : '';
  const atributo = num(e.idAl) ? `data-id="${num(e.idAl)}"` : `data-mal="${num(e.idMal)}"`;
  return `<article class="tarjeta" ${atributo} title="${esc(e.titulo)}">
    <img src="${esc(e.portada)}" alt="" loading="lazy" decoding="async">
    <div class="insignias"><span>${nota}</span><span style="display:flex;gap:4px">${fav && pestanaLista !== 'favoritos' ? `<span class="insignia fav">${ico('corazon', 'lleno')}</span>` : ''}${pestanaLista === 'favoritos' && est && LISTA_ESTADOS[est] ? `<span class="insignia estado">${LISTA_ESTADOS[est]}</span>` : ''}</span></div>
    <div class="pie"><h3>${esc(e.titulo)}</h3><div class="meta">${meta}</div>${progreso}</div>
  </article>`;
}

/* ---------- Ficha ---------- */
const capa = $('#capa'), ficha = $('#ficha');
let fichaActual = null, fichaMedia = null;
function repintarCalendario() {
  if (estado.seccion === 'calendario' && estado.ultima && $('#dias')) pintarSemana(estado.ultima.inicio, filtrarCal(estado.ultima.lista));
}
function cerrarFicha() {
  capa.hidden = true; fichaActual = null; fichaMedia = null; document.body.style.overflow = '';
  if (estado.seccion === 'lista') vistaLista();
  else if (estado.seccion === 'explorar') refrescarInsignias();
  else repintarCalendario();
}
function refrescarInsignias() {
  document.querySelectorAll('#rejilla .tarjeta[data-id]').forEach(t => {
    const m = refrescarInsignias.cache.get(Number(t.dataset.id));
    if (m) { const n = document.createElement('div'); n.innerHTML = tarjetaAnime(m); const nueva = n.firstElementChild; nueva.querySelector('img').classList.add('cargada'); t.replaceWith(nueva); }
  });
}
refrescarInsignias.cache = new Map();
capa.addEventListener('mousedown', e => { if (e.target === capa) cerrarFicha(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (dialogo) cerrarDialogo(); else if (desplegable) cerrarDesplegable(); else if (!capa.hidden) cerrarFicha(); }
  if (e.key === 'F5') {
    e.preventDefault();
    if (estado.seccion === 'calendario') vistaCalendario(true);
    else if (estado.seccion === 'explorar') { cache.vaciar(); explorar.clave = ''; reiniciarExplorar(); }
    else if (datos.mal) sincronizarMal(datos.mal.usuario);
  }
});

const CAMPOS_FICHA = `${CAMPOS_TARJETA} bannerImage description(asHtml:false) duration source synonyms siteUrl
  endDate { year month day } studios(isMain:true) { nodes { name } } meanScore favourites`;

async function abrirFicha(id, idMal) {
  fichaActual = id || 'mal:' + idMal;
  const yo = fichaActual;
  capa.hidden = false; document.body.style.overflow = 'hidden';
  ficha.innerHTML = '<div class="cargando"><div class="girador"></div></div>';
  capa.scrollTop = 0;
  try {
    const clave = id ? 'ficha:' + id : 'fichamal:' + idMal;
    const d = await conCache(clave, 24 * 60, () => anilist(`query($id:Int,$idMal:Int){Media(id:$id,idMal:$idMal,type:ANIME){${CAMPOS_FICHA}}}`, id ? { id } : { idMal }), () => {});
    if (fichaActual !== yo) return;
    pintarFicha(d.Media);
  } catch (e) {
    if (fichaActual !== yo) return;
    const entrada = idMal && datos.lista['mal:' + idMal];
    ficha.innerHTML = `<button class="cerrar" id="cerrarFicha">${ico('x')}</button><div class="vacio">${ico('info')}<h3>No se pudo cargar la ficha</h3><p>${esc(e.message)}</p>
      ${entrada ? `<button class="boton" id="abrirMal">${ico('externo')}Ver en MyAnimeList</button>` : ''}</div>`;
    $('#cerrarFicha').onclick = cerrarFicha;
    if (entrada) $('#abrirMal').onclick = () => abrirExterno('https://myanimelist.net/anime/' + idMal);
  }
}

function limpiarSinopsis(t) {
  return (t || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
    .replace(/\n*\(?(Source|Fuente)s?:[^\n]*\)?\s*$/i, '').replace(/\n*Notes?:[\s\S]*$/i, '')
    .replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/\n{3,}/g, '\n\n').trim();
}

function pintarFicha(m) {
  refrescarInsignias.cache.set(m.id, m);
  fichaMedia = m.id;
  const e = entradaDe(m), est = estadoDe(e), fav = favDe(e);
  const fecha = d => d && d.year ? fmtFecha.format(new Date(d.year, (d.month || 1) - 1, d.day || 1)) : null;
  const alt = [m.title.english, m.title.native].filter(t => t && t !== m.title.romaji).join(' · ');
  const etiquetas = [
    ESTADOS[m.status] && `<span class="etiqueta ${m.status === 'RELEASING' ? 'acento' : ''}">${ESTADOS[m.status]}</span>`,
    FORMATOS[m.format] && `<span class="etiqueta">${FORMATOS[m.format]}</span>`,
    (m.season || m.seasonYear) && `<span class="etiqueta">${[TEMPORADAS[m.season], m.seasonYear].filter(Boolean).join(' ')}</span>`,
    m.averageScore && `<span class="etiqueta">${ico('estrella', 'lleno')}${(m.averageScore / 10).toFixed(1).replace('.', ',')}</span>`
  ].filter(Boolean).join('');
  const prox = m.nextAiringEpisode;
  const stats = [
    ['Episodios', (m.episodes || '?') + (m.duration ? ` · ${m.duration} min` : '')],
    ['Estudio', m.studios && m.studios.nodes.length ? m.studios.nodes.map(s => s.name).join(', ') : '—'],
    ['Inicio', fecha(m.startDate) || '—'],
    ['Fin', fecha(m.endDate) || (m.status === 'RELEASING' ? 'En emisión' : '—')]
  ];
  const sinopsis = limpiarSinopsis(m.description);
  ficha.innerHTML = `
    <button class="cerrar" id="cerrarFicha" title="Cerrar (Esc)">${ico('x')}</button>
    <div class="banner" style="background-image:${esc(urlCssSegura(m.bannerImage || m.coverImage.extraLarge))};${m.bannerImage ? '' : 'filter:blur(18px) saturate(1.2);transform:scale(1.2)'}"></div>
    <div class="cuerpo">
      <div class="lado">
        <div class="portada"><img src="${esc(m.coverImage.extraLarge || m.coverImage.large)}" alt=""></div>
        <div class="estadisticas">${stats.map(([k, v]) => `<div><small>${k}</small><b>${esc(v)}</b></div>`).join('')}</div>
        <div class="enlaces">
          ${botonesEnlacePropio(m)}
          <button class="boton" data-url="${esc(m.siteUrl)}">${ico('externo')}Ver en AniList</button>
          ${m.idMal ? `<button class="boton" data-url="https://myanimelist.net/anime/${m.idMal}">${ico('externo')}Ver en MyAnimeList</button>` : ''}
        </div>
      </div>
      <div class="info">
        <h2>${esc(m.title.romaji)}</h2>
        ${alt ? `<div class="alt">${esc(alt)}</div>` : ''}
        <div class="datos-f">${etiquetas}</div>
        <div class="generos-f">${(m.genres || []).map(g => `<span>${esc(GENEROS[g] || g)}</span>`).join('')}</div>
        ${prox ? `<div class="proximo">${ico('tv')}<div><b>Episodio ${prox.episode}</b><br><span>${fmtDiaLargo.format(new Date(prox.airingAt * 1000))} a las ${fmtHora.format(new Date(prox.airingAt * 1000))} · ${relativo(prox.airingAt - Date.now() / 1000)}</span></div></div>` : ''}
        <div class="acciones">
          <div class="segmentado" id="estadoFicha">${Object.entries(LISTA_ESTADOS).map(([k, t]) => `<button data-e="${k}" class="${est === k ? 'activo' : ''}">${est === k ? ico('check') + ' ' : ''}${t}</button>`).join('')}</div>
          <button class="boton fav ${fav ? 'activo' : ''}" id="favFicha">${ico('corazon')}${fav ? 'Favorito' : 'Favorito'}</button>
          ${est || fav ? '<button class="enlace" id="quitarFicha">Quitar de mi lista</button>' : ''}
        </div>
        <div class="sinopsis" id="sinopsis">${sinopsis ? esc(sinopsis) : '<span style="color:var(--tenue)">Sin sinopsis disponible.</span>'}</div>
      </div>
    </div>`;
  alCargarImagen(ficha);
  $('#cerrarFicha').onclick = cerrarFicha;
  ficha.querySelectorAll('[data-url]').forEach(b => { b.onclick = () => abrirExterno(b.dataset.url); });
  ficha.querySelectorAll('[data-enlace-propio]').forEach(b => { b.onclick = () => dialogoEnlace(m); });
  $('#estadoFicha').onclick = ev => {
    const b = ev.target.closest('[data-e]'); if (!b) return;
    const nuevo = b.dataset.e;
    actualizarEntrada(m, x => { x.manual = { estado: estadoDe(x) === nuevo ? 'quitado' : nuevo }; });
    pintarFicha(m);
  };
  $('#favFicha').onclick = () => { actualizarEntrada(m, x => { x.fav = !favDe(x); }); pintarFicha(m); };
  const quitar = $('#quitarFicha');
  if (quitar) quitar.onclick = () => { actualizarEntrada(m, x => { x.manual = { estado: 'quitado' }; x.fav = false; }); pintarFicha(m); aviso('Quitado de tu lista.'); };
  if (sinopsis) traducirSinopsis(m.id, sinopsis);
}

/* ---------- Enlace propio para ver la serie (manual) ---------- */
function enlacePropio(m) { return (datos.enlaces || {})[m.id] || ''; }
function botonesEnlacePropio(m) {
  const url = enlacePropio(m);
  if (!url) return `<button class="boton" data-enlace-propio>${ico('mas')}Añadir enlace</button>`;
  let sitio = url;
  try { sitio = new URL(url).hostname.replace(/^www\./, ''); } catch (e) { /* se muestra tal cual */ }
  return `<div class="enlace-propio">
    <button class="boton primario" data-url="${esc(url)}" title="Abrir ${esc(sitio)}">${ico('play', 'lleno')}Ver anime</button>
    <button class="boton icono" data-enlace-propio title="Editar o eliminar el enlace">${ico('lapiz')}</button></div>`;
}
function validarUrl(texto) {
  texto = texto.trim();
  if (!texto || /\s/.test(texto)) return null;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(texto)) texto = 'https://' + texto;
  try {
    const u = new URL(texto);
    return (u.protocol === 'http:' || u.protocol === 'https:') && u.hostname.includes('.') ? u.href : null;
  } catch (e) { return null; }
}
let dialogo = null;
function cerrarDialogo() { if (dialogo) { dialogo.remove(); dialogo = null; } }
function dialogoEnlace(m) {
  cerrarDialogo();
  const actual = enlacePropio(m);
  dialogo = document.createElement('div');
  dialogo.className = 'dialogo';
  dialogo.innerHTML = `<form class="tarjeta-dialogo" novalidate>
    <h3>${actual ? 'Editar enlace' : 'Añadir enlace'}</h3>
    <p>Pega la dirección de la página donde ves <b>${esc(m.title.romaji)}</b>, por ejemplo, la de la serie en Crunchyroll.</p>
    <label class="campo">${ico('externo')}<input id="urlPropia" placeholder="https://…" value="${esc(actual)}" autocomplete="off" spellcheck="false"></label>
    <p class="error-campo" id="errorUrl" hidden>Escribe una dirección web válida que empiece por http:// o https://.</p>
    <div class="botones-dialogo">
      ${actual ? '<button type="button" class="enlace peligro" id="eliminarEnlace">Eliminar enlace</button>' : ''}
      <span style="flex:1"></span>
      <button type="button" class="boton" id="cancelarEnlace">Cancelar</button>
      <button class="boton primario">Guardar</button>
    </div></form>`;
  document.body.appendChild(dialogo);
  const entrada = $('#urlPropia'), error = $('#errorUrl');
  entrada.focus(); entrada.select();
  entrada.oninput = () => { error.hidden = true; };
  const terminar = () => { cerrarDialogo(); if (fichaMedia === m.id) pintarFicha(m); };
  dialogo.addEventListener('mousedown', e => { if (e.target === dialogo) cerrarDialogo(); });
  $('#cancelarEnlace').onclick = cerrarDialogo;
  dialogo.querySelector('form').onsubmit = e => {
    e.preventDefault();
    const url = validarUrl(entrada.value);
    if (!url) { error.hidden = false; entrada.focus(); return; }
    (datos.enlaces || (datos.enlaces = {}))[m.id] = url;
    guardar(); terminar(); aviso('Enlace guardado.');
  };
  const eliminar = $('#eliminarEnlace');
  if (eliminar) eliminar.onclick = () => {
    delete datos.enlaces[m.id];
    guardar(); terminar(); aviso('Enlace eliminado.');
  };
}

/* ---------- Sinopsis en español ---------- */
async function traducirSinopsis(id, texto) {
  const clave = 'tr:' + id;
  const destino = () => fichaMedia === id ? $('#sinopsis') : null;
  const guardada = cache.leer(clave);
  if (guardada) { const s = destino(); if (s) s.textContent = guardada.v; return; }
  const s0 = destino();
  if (s0) s0.insertAdjacentHTML('beforeend', '<span class="traduciendo">Traduciendo al español…</span>');
  try {
    const traducido = await traducir(texto);
    if (!traducido) throw new Error('sin traducción');
    cache.escribir(clave, traducido);
    const s = destino(); if (s) s.textContent = traducido;
  } catch (e) {
    const s = destino(); if (s) { const t = s.querySelector('.traduciendo'); if (t) t.textContent = 'Sinopsis original en inglés (no hay traducción disponible ahora).'; }
  }
}
async function traducir(texto) {
  // Traductor integrado del navegador cuando existe; si no, el servicio público MyMemory.
  const limite = (p, ms) => Promise.race([p, espera(ms).then(() => { throw new Error('tiempo'); })]);
  if (traducir.integrado !== false && 'Translator' in self) {
    try {
      if ((await limite(Translator.availability({ sourceLanguage: 'en', targetLanguage: 'es' }), 1500)) !== 'available') throw new Error('no');
      const t = await limite(Translator.create({ sourceLanguage: 'en', targetLanguage: 'es' }), 4000);
      return (await limite(Promise.all(texto.split('\n').map(p => p.trim() ? t.translate(p) : '')), 15000)).join('\n');
    } catch (e) { traducir.integrado = false; }
  }
  const trozos = [];
  for (const parrafo of texto.split(/\n+/)) {
    let actual = '';
    for (const frase of parrafo.match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) || [parrafo]) {
      if ((actual + frase).length > 450 && actual) { trozos.push(actual); actual = ''; }
      actual += frase;
    }
    trozos.push(actual + '\n\n');
  }
  let salida = '';
  for (const t of trozos) {
    const salto = t.endsWith('\n\n');
    const limpio = t.trim();
    if (!limpio) continue;
    const r = await fetch('https://api.mymemory.translated.net/get?langpair=en|es&q=' + encodeURIComponent(limpio), { signal: AbortSignal.timeout(15000) });
    const j = await r.json();
    if (j.quotaFinished || j.responseStatus !== 200) throw new Error('cuota');
    let tr = j.responseData.translatedText || '';
    if (/MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(tr)) throw new Error('cuota');
    tr = tr.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
    salida += tr + (salto ? '\n\n' : ' ');
  }
  return salida.trim();
}

/* ---------- Arranque ---------- */
(async function iniciar() {
  await cargarDatos();
  estado.seccion = ['calendario', 'explorar', 'lista'].includes(datos.prefs.seccion) ? datos.prefs.seccion : 'calendario';
  const s = estado.seccion; estado.seccion = null;
  ir(s);
  // Sincroniza MyAnimeList en segundo plano si han pasado más de 6 horas.
  if (datos.mal && Date.now() - datos.mal.fecha > 6 * 3600 * 1000) setTimeout(() => sincronizarMal(datos.mal.usuario, true), 2500);
  // Mantiene al día las cuentas atrás del calendario.
  setInterval(() => { if (capa.hidden) repintarCalendario(); }, 60 * 1000);
})();
