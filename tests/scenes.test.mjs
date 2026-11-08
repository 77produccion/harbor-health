import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseMdx, loadContent } from '../scripts/content-model.mjs';
import { parseScenes, projectSceneSections } from '../scripts/scene-content.mjs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const { site, pages } = await loadContent(root);
const raw = await readFile(new URL('../content/pages/es/people.mdx', import.meta.url), 'utf8');
const { body } = parseMdx(raw);

test('la home real tiene ocho escenas en el cuerpo y no duplica sections en YAML', () => {
  const { data } = parseMdx(raw);
  assert.equal(data.schemaVersion, 2);
  assert.equal(data.sections, undefined);
  const home = pages.find(page => page.data.id === 'health.people');
  assert.equal(home.scenes.length, 8);
  assert(home.body.includes('<Scene'));
  assert.deepEqual(home.scenes.map(scene => scene.id), ['hero', 'documents', 'levels', 'consultation', 'knowledge', 'professionals', 'faq', 'closing']);
});
test('editar el cuerpo MDX cambia la proyección consumida por la página', () => {
  const edited = body.replace('Tu próxima consulta empieza aquí.', 'Documentos y preguntas para tu consulta.');
  const result = projectSceneSections(parseScenes(edited, site, 'es'));
  assert.equal(result[0].title, 'Documentos y preguntas para tu consulta.');
});
test('las escenas rechazan imports, expresiones, scripts, props ejecutables y URLs arbitrarias', () => {
  assert.throws(() => parseScenes(`import x from 'x'\n\n${body}`, site, 'es'));
  assert.throws(() => parseScenes(body.replace('kind="product-hero"', 'kind="product-hero" onClick={run()}'), site, 'es'));
  assert.throws(() => parseScenes(body.replace('Organiza tus documentos', '{process.env.SECRET}\n\nOrganiza tus documentos'), site, 'es'));
  assert.throws(() => parseScenes(body.replace('action:access', 'javascript:alert(1)'), site, 'es'));
  assert.throws(() => parseScenes(body.replace('kind="product-hero"', 'kind="custom"'), site, 'es'));
});
test('las etiquetas de acción y los IDs de items deben coincidir con el catálogo', () => {
  assert.throws(() => parseScenes(body.replace('[Entrar a Harbor Health]', '[Gratis ahora]'), site, 'es'));
  assert.throws(() => parseScenes(body.replace('items="l1,l2"', 'items="l1,l1"'), site, 'es'));
});
