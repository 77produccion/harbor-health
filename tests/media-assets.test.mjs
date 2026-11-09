import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { readFile, stat } from 'node:fs/promises';

test('los posters son fotogramas visibles, no el negro del inicio del vídeo', async () => {
  for (const name of ['home-workspace', 'home-clinician'])
    for (const width of [800, 1600]) {
      const file = new URL(`../public/images/${name}-poster-${width}.webp`, import.meta.url);
      const image = sharp(fileURLToPath(file));
      const meta = await image.metadata();
      assert.equal(meta.width, width);
      assert.equal(meta.height, (width * 9) / 16);
      const stats = await image.stats();
      assert(
        stats.channels.some((channel) => channel.stdev > 15),
        `${name}: poster sin detalle visible`,
      );
    }
});

test('los derivados de vídeo reducen peso y permiten reproducción progresiva sin tocar originales', async () => {
  for (const [derived, original] of [
    ['health-workspace-720.mp4', 'harbor-line-visual.mp4'],
    ['health-professional-720.mp4', 'harbor-line-visual (1).mp4'],
  ]) {
    const file = new URL(`../public/videos/${derived}`, import.meta.url);
    const source = await stat(new URL(`../public/videos/${original}`, import.meta.url));
    const buffer = await readFile(file);
    assert(buffer.length < source.size / 3, `${derived}: reducción insuficiente`);
    assert.equal(buffer.subarray(4, 8).toString(), 'ftyp');
    const moov = buffer.indexOf(Buffer.from('moov'));
    const mdat = buffer.indexOf(Buffer.from('mdat'));
    assert(moov > 0 && moov < mdat, `${derived}: metadatos deben preceder a los fotogramas`);
  }
});

test('las composiciones fotográficas tienen variantes pequeñas sin ampliación', async () => {
  for (const name of ['preparation', 'documents', 'questions', 'clinician']) {
    for (const width of [480, 800]) {
      const file = new URL(`../public/images/cinematic-${name}-${width}.webp`, import.meta.url);
      const metadata = await sharp(fileURLToPath(file)).metadata();
      assert.equal(metadata.width, width);
      assert((await stat(file)).size < 120_000, `${name}: variante demasiado pesada`);
    }
  }
});
