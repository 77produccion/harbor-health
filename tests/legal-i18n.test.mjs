import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';

const load = (name) => JSON.parse(readFileSync(new URL(`../content/${name}.json`, import.meta.url), 'utf8'));
const { locales } = load('site');
const originals = { health: load('legal/health'), living: load('legal/living') };
const fixedTerms = [
  'Harbor Health', 'Harbor Living', 'Harbor Family', 'Integrative Wellness bv',
  'FD Rooseveltweg 280', 'info@myharborliving.com', 'Visa', 'Wero', 'USD', '€',
];
const numbers = (text) => (text.match(/\d+/g) ?? []).sort();

test('los dos documentos existen en cada idioma configurado', () => {
  assert.deepEqual(Object.keys(load('legal/ui')).sort(), [...locales].sort());
  const expected = locales.filter((locale) => locale !== 'en').map((locale) => `${locale}.json`).sort();
  assert.deepEqual(readdirSync(new URL('../content/legal/translations/', import.meta.url)).sort(), expected);
});

for (const locale of locales.filter((lang) => lang !== 'en')) {
  test(`${locale}: las traducciones mantienen artículos, cláusulas, cifras, referencias y nombres`, () => {
    const translations = load(`legal/translations/${locale}`);
    for (const [key, original] of Object.entries(originals)) {
      const copy = translations[key];
      assert.ok(copy.description.trim());
      assert.equal(copy.sections.length, original.sections.length);
      for (const [index, section] of original.sections.entries()) {
        const translated = copy.sections[index];
        assert.equal(translated.number, section.number);
        assert.ok(translated.title.trim());
        assert.equal(translated.blocks.length, section.blocks.length);
        for (const [offset, block] of section.blocks.entries()) {
          const translatedBlock = translated.blocks[offset];
          const id = `${locale}/${key}/${section.number}/${block.label ?? offset}`;
          assert.equal(translatedBlock.kind, block.kind, id);
          assert.equal(translatedBlock.label, block.label, id);
          assert.ok(translatedBlock.text.trim(), id);
          assert.notEqual(translatedBlock.text, block.text, id);
          assert.deepEqual(numbers(translatedBlock.text), numbers(block.text), id);
          assert.doesNotMatch(translatedBlock.text, /ZXQ|@@\d{3}@@|\p{L}\?\p{L}/u, id);
          for (const term of fixedTerms) {
            if (block.text.includes(term)) assert.ok(translatedBlock.text.includes(term), `${id}: ${term}`);
          }
          if (key === 'health' && block.label === '11.2') {
            assert.ok(copy.partAReference && translatedBlock.text.includes(copy.partAReference), id);
          }
        }
      }
    }
  });
}
