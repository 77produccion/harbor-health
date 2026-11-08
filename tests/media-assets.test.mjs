import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

test('los posters son fotogramas visibles, no el negro del inicio del vídeo', async () => {
  for (const name of ['home-workspace', 'home-clinician']) for (const width of [800, 1600]) {
    const file = new URL(`../public/images/${name}-poster-${width}.webp`, import.meta.url);
    const image = sharp(fileURLToPath(file));
    const meta = await image.metadata();
    assert.equal(meta.width, width);
    assert.equal(meta.height, width * 9 / 16);
    const stats = await image.stats();
    assert(stats.channels.some(channel => channel.stdev > 15), `${name}: poster sin detalle visible`);
  }
});
