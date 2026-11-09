import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const manifest = JSON.parse(
  await readFile(new URL('../content/product-captures.json', import.meta.url), 'utf8'),
);

test('los controles de ampliación existen en los siete idiomas', () => {
  assert.deepEqual(
    Object.keys(manifest.viewer).sort(),
    ['es', 'en', 'nl', 'fr', 'pt', 'de', 'pap'].sort(),
  );
  for (const controls of Object.values(manifest.viewer)) {
    assert.deepEqual(Object.keys(controls).sort(), ['close', 'zoomIn', 'zoomOut'].sort());
    assert(
      Object.values(controls).every(
        (value) => typeof value === 'string' && value.trim().length > 0,
      ),
    );
  }
});

test('las capturas tienen fuentes saneadas y variantes responsive sin ampliar', async () => {
  for (const [id, capture] of Object.entries(manifest.captures)) {
    assert(capture.alt && capture.caption);
    const source = await sharp(
      fileURLToPath(new URL(`../public/images/product/source/${id}.png`, import.meta.url)),
    ).metadata();
    assert.equal(source.width, capture.width);
    assert.equal(source.height, capture.height);
    for (const width of [480, 960, 1600]
      .filter((width) => width < capture.width)
      .concat(capture.width)) {
      const metadata = await sharp(
        fileURLToPath(new URL(`../public/images/product/${id}-${width}.webp`, import.meta.url)),
      ).metadata();
      assert.equal(metadata.width, width);
      assert(Math.abs(metadata.height - (capture.height * width) / capture.width) <= 1);
      assert.equal(metadata.format, 'webp');
    }
  }
});

test('la fuente pública de laboratorio no conserva los valores clínicos de la captura', async () => {
  const file = fileURLToPath(
    new URL('../public/images/product/source/laboratory.png', import.meta.url),
  );
  const { data, info } = await sharp(file)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  // Only the opaque white mask, neutral bars and row rules may occur in the redacted region.
  const allowed = new Set(['255,255,255', '220,228,236', '216,222,232']);
  for (let y = 57; y < 624; y++)
    for (let x = 331; x < 1160; x++) {
      const offset = (y * info.width + x) * info.channels;
      const pixel = [...data.subarray(offset, offset + 3)];
      // Rounded/antialiased edges can contain blends, but never the original dark text or coloured statuses.
      assert(
        allowed.has(pixel.join(',')) || (pixel[0] >= 210 && pixel[1] >= 210 && pixel[2] >= 210),
        `Unexpected pixel at ${x},${y}`,
      );
    }
});
