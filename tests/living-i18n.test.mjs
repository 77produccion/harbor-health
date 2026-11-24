import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const load = (name) => JSON.parse(readFileSync(new URL(`../content/${name}`, import.meta.url), 'utf8'));

test('Living conserva una versión completa por cada idioma habilitado', () => {
  const { locales } = load('site.json');
  const living = load('living.json');
  const keys = Object.keys(living.es).sort();
  assert.deepEqual(Object.keys(living).sort(), [...locales].sort());
  for (const locale of locales) {
    const page = living[locale];
    assert.equal(page.locale, locale);
    assert.equal(page.route, `/${locale}/harbor-living/`);
    assert.deepEqual(Object.keys(page).sort(), keys);
    for (const value of Object.values(page)) assert.ok(typeof value === 'string' && value.trim());
  }
});
