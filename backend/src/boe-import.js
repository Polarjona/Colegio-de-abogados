const { XMLParser } = require('fast-xml-parser');
const { getFirebase } = require('./firebase');

const BOE_SUMMARY_URL = 'https://www.boe.es/datosabiertos/api/boe/sumario';
const DEFAULT_SECTIONS = ['1', '3', '4', 'TC'];

function asArray(value) {
  return value == null ? [] : Array.isArray(value) ? value : [value];
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function categoryFor(title, section) {
  const value = `${section} ${title}`.toLowerCase();
  if (/(laboral|trabajador|empleo|seguridad social|convenio colectivo)/.test(value)) return 'laboral';
  if (/(penal|código penal|delito|criminal)/.test(value)) return 'penal';
  if (/(mercantil|sociedad mercantil|empresa|concurso)/.test(value)) return 'mercantil';
  if (/(fiscal|tributar|impuesto|hacienda)/.test(value)) return 'fiscal';
  if (/(civil|arrendamiento|vivienda|familia|consumidor)/.test(value)) return 'civil';
  return 'administrativo';
}

function parseSummary(xml, date, sections = DEFAULT_SECTIONS) {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const root = parser.parse(xml);
  const diario = root?.response?.data?.sumario?.diario;
  if (!diario) throw new Error('El BOE no devolvió un sumario válido');

  const allowedSections = new Set(sections);
  const news = [];
  for (const section of asArray(diario.seccion)) {
    const sectionCode = text(section['@_codigo']);
    if (!allowedSections.has(sectionCode)) continue;
    for (const department of asArray(section.departamento)) {
      for (const epigraph of asArray(department.epigrafe)) {
        for (const item of asArray(epigraph.item)) {
          const id = text(item.identificador);
          const title = text(item.titulo);
          if (!id || !title) continue;

          news.push({
            id,
            title,
            category: categoryFor(title, text(section['@_nombre'])),
            description: text(epigraph['@_nombre']) || text(section['@_nombre']),
            summary: text(epigraph['@_nombre']) || text(section['@_nombre']),
            publishedAt: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T00:00:00.000Z`,
            reference: id,
            boeUrl: text(item.url_html) || `https://www.boe.es/diario_boe/txt.php?id=${id}`,
            sourceUrl: text(item.url_html) || `https://www.boe.es/diario_boe/txt.php?id=${id}`,
            source: 'BOE'
          });
        }
      }
    }
  }
  return news;
}

function validDate(value) {
  return /^\d{8}$/.test(value) && !Number.isNaN(Date.parse(`${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`));
}

async function fetchSummary(date) {
  const response = await fetch(`${BOE_SUMMARY_URL}/${date}`, {
    headers: { Accept: 'application/xml' }
  });
  if (!response.ok) {
    throw new Error(`El BOE respondió con HTTP ${response.status}`);
  }
  return response.text();
}

async function importNews(date, sections, dryRun = false) {
  const news = await fetchNews(date, sections);
  if (dryRun) return news.length;

  const { db } = getFirebase();
  for (let offset = 0; offset < news.length; offset += 500) {
    const batch = db.batch();
    for (const item of news.slice(offset, offset + 500)) {
      const { id, ...document } = item;
      batch.set(db.collection('news').doc(id), document, { merge: true });
    }
    await batch.commit();
  }
  return news.length;
}

async function fetchNews(date, sections = DEFAULT_SECTIONS) {
  return parseSummary(await fetchSummary(date), date, sections);
}

async function main() {
  const date = process.argv[2] || new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const dryRun = process.argv.includes('--dry-run');
  const sections = (process.env.BOE_SECTIONS || DEFAULT_SECTIONS.join(','))
    .split(',')
    .map((section) => section.trim())
    .filter(Boolean);
  if (!validDate(date)) {
    throw new Error('La fecha debe tener el formato AAAAMMDD');
  }

  const count = await importNews(date, sections, dryRun);
  console.log(`${dryRun ? 'Encontradas' : 'Importadas'} ${count} noticias del BOE (${date})`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Error importando el BOE: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { categoryFor, parseSummary, fetchNews, importNews };
