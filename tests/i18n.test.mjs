import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { loadContent, validateReferences, publicationIssues } from '../scripts/content-model.mjs';
import { safeEvent } from '../src/lib/marketing-policy.mjs';
const content = await loadContent(fileURLToPath(new URL('../', import.meta.url)));
function leafKeys(value, prefix = '') {
  return Object.entries(value).flatMap(([key, item]) => typeof item === 'string' ? [`${prefix}${key}`] : leafKeys(item, `${prefix}${key}.`));
}
const reference = JSON.parse(await readFile(new URL('../content/home-ui.es.json', import.meta.url), 'utf8'));
test('los siete diccionarios tienen las mismas claves sin valores vacíos', async () => {
  for (const locale of content.site.locales) {
    const ui = JSON.parse(await readFile(new URL(`../content/home-ui.${locale}.json`, import.meta.url), 'utf8'));
    assert.deepEqual(leafKeys(ui), leafKeys(reference));
    for (const action of Object.values(content.site.actions)) assert(action.labels[locale]?.trim());
    assert(!JSON.stringify(ui).includes('""'));
  }
});
test('cada idioma tiene seis páginas y ocho escenas de home con IDs conservados', () => {
  const canonical = content.pages.find(page => page.data.id === 'health.people' && page.data.locale === 'es');
  for (const locale of content.site.locales) {
    const pages = content.pages.filter(page => page.data.locale === locale);
    assert.equal(pages.length, 6);
    const home = pages.find(page => page.data.id === 'health.people');
    assert.equal(home.data.route, `/${locale}/`);
    assert.deepEqual(home.scenes.map(scene => [scene.id, scene.items.map(item => item.id)]), canonical.scenes.map(scene => [scene.id, scene.items.map(item => item.id)]));
    assert(home.scenes.every(scene => scene.title && scene.paragraphs.every(Boolean)));
    if (locale !== 'es') assert.notEqual(home.scenes[0].title, canonical.scenes[0].title);
    assert(pages.every(page => page.data.status === 'draft' && !page.data.agentEligible));
  }
  assert(publicationIssues(content.pages, content.site, content.evidence).length > 0);
});
test('valida IDs de items traducidos, no solo nombres de sección', () => {
  const pages = structuredClone(content.pages);
  const translated = pages.find(page => page.data.locale === 'de' && page.data.id === 'health.demo');
  translated.data.sections[1].items[0].id = 'changed';
  assert.throws(() => validateReferences(pages, content.site, content.evidence), /items de traducción/);
});
test('medición localizada enumerada, sin capturar rutas libres ni idioma arbitrario', () => {
  for (const locale of content.site.locales) {
    const event = safeEvent('page_view', {}, locale);
    assert.equal(event.language, locale);
    assert.equal(event.page_path, `/${locale}/`);
  }
  assert.equal(safeEvent('page_view', {}, 'unknown'), null);
});
