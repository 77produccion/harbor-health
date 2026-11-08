import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { loadContent, parseMdx, validatePage, validateMdxBody, validateReferences, publicationIssues } from '../scripts/content-model.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const content = await loadContent(root);
const page = () => structuredClone(content.pages[0].data);

test('seis páginas por cada uno de los siete idiomas con referencias válidas', () => {
  assert.equal(content.pages.length, 42);
  assert.equal(new Set(content.pages.map(entry => entry.data.id)).size, 6);
  for (const locale of content.site.locales) {
    assert.equal(content.pages.filter(page => page.data.locale === locale).length, 6);
    assert.equal(content.site.translations[locale], 'draft');
  }
});

test('rechaza YAML duplicado', () => {
  assert.throws(() => parseMdx('---\nid: uno\nid: dos\n---\n'));
});

test('rechaza campos desconocidos y secciones duplicadas', () => {
  const data = page();
  data.unknown = true;
  assert.throws(() => validatePage(data, content.site, content.evidence), /campo desconocido/);
  delete data.unknown;
  data.sections.push(data.sections[0]);
  assert.throws(() => validatePage(data, content.site, content.evidence), /duplicada/);
});

test('rechaza acciones y fuentes inexistentes', () => {
  const data = page();
  data.sections[0].actions = ['invented'];
  assert.throws(() => validatePage(data, content.site, content.evidence), /Acción desconocida/);
  data.sections[0].actions = ['demo'];
  data.sourceIds = ['invented'];
  assert.throws(() => validatePage(data, content.site, content.evidence), /Fuente desconocida/);
});

test('no permite reintroducir encabezados decorativos eyebrow en el contrato', () => {
  const data = page();
  data.sections[0].eyebrow = 'Disponible';
  assert.throws(() => validatePage(data, content.site, content.evidence), /campo desconocido eyebrow/);
});

test('impide usar borradores o aprobaciones incompletas para el agente', () => {
  const data = page();
  data.agentEligible = true;
  assert.throws(() => validatePage(data, content.site, content.evidence), /borradores/);
  data.status = 'approved';
  assert.throws(() => validatePage(data, content.site, content.evidence), /revisiones pendientes/);
});

test('rechaza rutas duplicadas y destinos sin traducción', () => {
  assert.throws(() => validateReferences([...content.pages, content.pages[0]], content.site, content.evidence), /duplicado/);
  const site = structuredClone(content.site);
  site.actions.demo.pageId = 'health.missing';
  assert.throws(() => validateReferences(content.pages, site, content.evidence), /Destino sin traducción/);
});

test('bloquea publicación de borradores y CTA sin configurar', () => {
  const issues = publicationIssues(content.pages, content.site, content.evidence);
  assert(issues.some(issue => issue.includes('contenido no aprobado')));
  assert(issues.some(issue => issue.includes('falta destino')));
  assert(issues.some(issue => issue.includes('evidencia pendiente')));
});

test('rechaza imports, expresiones y JSX en el cuerpo MDX', async () => {
  await assert.rejects(validateMdxBody('import X from "./x.js"\n\n# Texto'), /código MDX/);
  await assert.rejects(validateMdxBody('{process.env.SECRET}'), /código MDX/);
  await assert.rejects(validateMdxBody('<Custom />'), /código MDX/);
  await validateMdxBody('## Texto editorial\n\nUn párrafo con **énfasis**.');
});
