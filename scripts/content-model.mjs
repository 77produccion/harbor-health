import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { compile } from '@mdx-js/mdx';
import { parseDocument } from 'yaml';
import { parseScenes, projectSceneSections } from './scene-content.mjs';

const PAGE_KEYS = ['schemaVersion', 'id', 'locale', 'route', 'audience', 'status', 'revision', 'review', 'agentEligible', 'sourceIds', 'seo', 'sections', 'updatedAt'];
const SECTION_KEYS = ['id', 'type', 'title', 'text', 'items', 'actions', 'noticeKey'];
const TYPES = ['hero', 'demo', 'steps', 'comparison', 'cards', 'prose', 'conversion', 'faq'];
const REVIEWS = ['commercial', 'clinical', 'legal'];
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function object(value, label) {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${label}: se esperaba un objeto`);
}

function keys(value, allowed, label) {
  object(value, label);
  for (const key of Object.keys(value)) assert(allowed.includes(key), `${label}: campo desconocido ${key}`);
}

function text(value, label) {
  assert(typeof value === 'string' && value.trim(), `${label}: texto obligatorio`);
}

function strings(value, label, { nonempty = true } = {}) {
  assert(Array.isArray(value) && (!nonempty || value.length), `${label}: lista obligatoria`);
  value.forEach(item => text(item, label));
  assert(new Set(value).size === value.length, `${label}: valores duplicados`);
}

export function parseMdx(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  assert(match, 'El MDX debe empezar por frontmatter YAML');
  const document = parseDocument(match[1], { uniqueKeys: true });
  assert.equal(document.errors.length, 0, document.errors.map(error => error.message).join('\n'));
  // No permitir aliases para evitar expansiones inesperadas en contenido editorial.
  return { data: document.toJS({ maxAliasCount: 0 }), body: raw.slice(match[0].length) };
}

export function validateSite(site) {
  strings(site.locales, 'locales');
  strings(site.markets, 'markets');
  assert(site.locales.includes(site.authoringLocale), 'Locale editorial inválido');
  assert(site.defaultPublicLocale === null || site.locales.includes(site.defaultPublicLocale), 'Locale público inválido');
  for (const locale of site.locales) {
    assert(['draft', 'not_started', 'approved'].includes(site.translations[locale]), `Traducción ${locale}: estado inválido`);
  }
  object(site.actions, 'actions');
  for (const [id, action] of Object.entries(site.actions)) {
    assert(SLUG.test(id), `Acción inválida: ${id}`);
    assert(['page', 'external'].includes(action.kind), `${id}: tipo de acción inválido`);
    if (action.kind === 'page') text(action.pageId, `${id}.pageId`);
    else {
      assert(action.url === null || typeof action.url === 'string', `${id}: URL inválida`);
      if (action.url !== null) assert.equal(new URL(action.url).protocol, 'https:', `${id}: se requiere HTTPS`);
    }
    object(action.labels, `${id}.labels`);
    text(action.labels[site.authoringLocale], `${id}: etiqueta editorial`);
  }
}

export function validatePage(data, site, evidence) {
  keys(data, PAGE_KEYS, 'page');
  assert([1, 2].includes(data.schemaVersion), 'Versión de esquema no admitida');
  if (data.updatedAt !== undefined) assert(/^\d{4}-\d{2}-\d{2}$/.test(data.updatedAt), 'Fecha editorial inválida');
  assert(/^health\.[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.id), 'ID de página inválido');
  assert(site.locales.includes(data.locale), 'Locale no configurado');
  assert(typeof data.route === 'string' && new RegExp(`^/${data.locale}/(?:[a-z0-9-]+/)*$`).test(data.route), 'Ruta localizada inválida');
  assert(['people', 'professionals', 'all'].includes(data.audience), 'Público inválido');
  assert(['draft', 'in_review', 'approved', 'archived'].includes(data.status), 'Estado editorial inválido');
  assert(Number.isSafeInteger(data.revision) && data.revision > 0, 'Revisión inválida');
  keys(data.review, REVIEWS, 'review');
  for (const key of REVIEWS) assert(['pending', 'approved', 'not_required'].includes(data.review[key]), `Revisión ${key} inválida`);
  assert(typeof data.agentEligible === 'boolean', 'agentEligible debe ser booleano');
  if (data.status === 'approved' || data.agentEligible) {
    assert.equal(data.status, 'approved', 'El agente no puede usar borradores');
    assert(REVIEWS.every(key => data.review[key] !== 'pending'), 'Aprobación incompatible con revisiones pendientes');
  }
  strings(data.sourceIds, 'sourceIds');
  for (const id of data.sourceIds) assert(Object.hasOwn(evidence.sources, id), `Fuente desconocida: ${id}`);
  keys(data.seo, ['title', 'description'], 'seo');
  text(data.seo.title, 'seo.title');
  text(data.seo.description, 'seo.description');
  assert(Array.isArray(data.sections) && data.sections.length, 'Secciones obligatorias');
  const ids = new Set();
  for (const section of data.sections) {
    keys(section, SECTION_KEYS, 'section');
    assert(SLUG.test(section.id), 'ID de sección inválido');
    assert(!ids.has(section.id), `Sección duplicada: ${section.id}`);
    ids.add(section.id);
    assert(TYPES.includes(section.type), `${section.id}: tipo desconocido`);
    text(section.title, `${section.id}.title`);
    if (section.text !== undefined) text(section.text, `${section.id}.text`);
    if (section.actions !== undefined) {
      strings(section.actions, `${section.id}.actions`);
      for (const actionId of section.actions) {
        assert(Object.hasOwn(site.actions, actionId), `Acción desconocida: ${actionId}`);
        text(site.actions[actionId].labels[data.locale], `Falta etiqueta ${data.locale} de ${actionId}`);
      }
    }
    if (section.noticeKey !== undefined) text(site.sharedCopy[data.locale]?.[section.noticeKey], `Aviso desconocido: ${section.noticeKey}`);
    if (['cards', 'steps', 'comparison', 'faq'].includes(section.type)) assert(section.items?.length, `${section.id}: requiere items`);
    if (section.items !== undefined) {
      assert(Array.isArray(section.items) && section.items.length, `${section.id}: items inválidos`);
      const itemIds = new Set();
      for (const item of section.items) {
        keys(item, ['id', 'title', 'text'], `${section.id}.item`);
        assert(SLUG.test(item.id) && !itemIds.has(item.id), `${section.id}: ID de item inválido o duplicado`);
        itemIds.add(item.id);
        text(item.title, `${item.id}.title`);
        text(item.text, `${item.id}.text`);
      }
    }
  }
  assert.equal(data.sections[0].type, 'hero', 'La primera sección debe ser hero');
  assert.equal(data.sections.filter(section => section.type === 'hero').length, 1, 'Una sola sección hero por página');
}

export async function validateMdxBody(body) {
  // MDX editorial restringido a Markdown en esta fase. Ni imports, ni JSX, ni expresiones ejecutables.
  function noExecutableMdx() {
    return tree => {
      function visit(node) {
        assert(!node.type.startsWith('mdx'), 'No se permite código MDX/JSX en el contenido editorial');
        if (node.children) node.children.forEach(visit);
      }
      visit(tree);
    };
  }
  await compile(body, { remarkPlugins: [noExecutableMdx] });
}

export function validateReferences(pages, site, evidence) {
  const pageKeys = new Set();
  const routes = new Set();
  for (const { data } of pages) {
    const key = `${data.id}:${data.locale}`;
    assert(!pageKeys.has(key), `Página/idioma duplicado: ${key}`);
    assert(!routes.has(data.route), `Ruta duplicada: ${data.route}`);
    pageKeys.add(key);
    routes.add(data.route);
  }
  for (const { data } of pages) {
    const canonical = pages.find(page => page.data.id === data.id && page.data.locale === site.authoringLocale);
    assert(canonical, `${data.id}: falta la versión editorial canónica`);
    assert.deepEqual(data.sections.map(section => section.id), canonical.data.sections.map(section => section.id), `${data.id}: estructura de traducción desincronizada`);
    data.sections.forEach((section, index) => {
      assert.deepEqual((section.items ?? []).map(item => item.id), (canonical.data.sections[index].items ?? []).map(item => item.id), `${data.id}/${section.id}: items de traducción desincronizados`);
      assert.deepEqual(section.actions ?? [], canonical.data.sections[index].actions ?? [], `${data.id}/${section.id}: acciones de traducción desincronizadas`);
    });
    for (const section of data.sections) for (const id of section.actions ?? []) {
      const action = site.actions[id];
      if (action.kind === 'page') assert(pageKeys.has(`${action.pageId}:${data.locale}`), `Destino sin traducción: ${id}/${data.locale}`);
    }
  }
  const pendingIds = new Set();
  for (const pending of evidence.pending) {
    assert(!pendingIds.has(pending.id), `Pendiente duplicado: ${pending.id}`);
    pendingIds.add(pending.id);
    for (const target of pending.affects) {
      assert(pages.some(({ data }) => data.sections.some(section => `${data.id}.${section.id}` === target)), `Pendiente apunta a sección inexistente: ${target}`);
    }
  }
}

export function publicationIssues(pages, site, evidence) {
  const issues = [];
  if (!site.defaultPublicLocale) issues.push('Falta decidir el idioma público por defecto.');
  for (const { data } of pages) {
    if (data.status !== 'approved') issues.push(`${data.id}/${data.locale}: contenido no aprobado.`);
    if (site.translations[data.locale] !== 'approved') issues.push(`${data.id}/${data.locale}: traducción no aprobada.`);
    for (const key of REVIEWS) if (data.review[key] === 'pending') issues.push(`${data.id}: revisión ${key} pendiente.`);
    for (const section of data.sections) for (const id of section.actions ?? []) {
      if (site.actions[id].kind === 'external' && !site.actions[id].url) issues.push(`${data.id}.${section.id}: falta destino de ${id}.`);
    }
  }
  // Los pendientes son bloqueos explícitos hasta que se cierre su evidencia o se retire el copy afectado.
  for (const pending of evidence.pending) {
    if (pending.status !== 'resolved' && pending.affects.some(target => pages.some(({ data }) => data.sections.some(section => `${data.id}.${section.id}` === target)))) {
      issues.push(`${pending.id}: evidencia pendiente (${pending.status}).`);
    }
  }
  return [...new Set(issues)];
}

export async function loadContent(root) {
  const site = JSON.parse(await readFile(path.join(root, 'content/site.json'), 'utf8'));
  const evidence = JSON.parse(await readFile(path.join(root, 'content/editorial/evidence.json'), 'utf8'));
  validateSite(site);
  const pages = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(file);
      else if (entry.name.endsWith('.mdx')) {
        const { data, body } = parseMdx(await readFile(file, 'utf8'));
        const scenes = data.schemaVersion === 2 ? parseScenes(body, site, data.locale) : undefined;
        if (scenes) {
          assert(!Object.hasOwn(data, 'sections'), 'MDX v2 no duplica sections en YAML');
          data.sections = projectSceneSections(scenes);
        }
        validatePage(data, site, evidence);
        if (!scenes) await validateMdxBody(body);
        assert.equal(path.basename(path.dirname(file)), data.locale, `${file}: carpeta/locale no coinciden`);
        pages.push({ file: path.relative(root, file).replaceAll('\\', '/'), data, body, ...(scenes ? { scenes } : {}) });
      }
    }
  }
  await walk(path.join(root, 'content/pages'));
  assert(pages.length, 'No hay páginas editoriales');
  validateReferences(pages, site, evidence);
  return { pages, site, evidence };
}

export function contentMatrix(pages, evidence) {
  const lines = [
    '# Matriz de contenido Health', '',
    'Generado con `npm run content:matrix:write`. No editar a mano. Cada clave apunta al MDX canónico; los textos no se duplican aquí.', '',
    '| Clave estable | Archivo | Tipo | Título | Pendientes |',
    '| --- | --- | --- | --- | --- |',
  ];
  for (const { data, file } of pages) for (const section of data.sections) {
    const key = `${data.id}.${section.id}`;
    const pending = evidence.pending.filter(item => item.affects.includes(key)).map(item => item.id).join(', ') || '—';
    lines.push(`| \`${key}\` | \`${file}\` | ${section.type} | ${section.title.replaceAll('|', '\\|')} | ${pending} |`);
  }
  return `${lines.join('\n')}\n`;
}
