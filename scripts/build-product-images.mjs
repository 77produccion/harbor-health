import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const manifest = JSON.parse(await readFile(new URL('../content/product-captures.json', import.meta.url), 'utf8'));
const directory = new URL('../public/images/product/', import.meta.url);
await mkdir(directory, { recursive: true });
for (const [id, capture] of Object.entries(manifest.captures)) {
  const source = fileURLToPath(new URL(`source/${id}.png`, directory));
  const metadata = await sharp(source).metadata();
  if (metadata.width !== capture.width || metadata.height !== capture.height)
    throw new Error(`Dimensiones de captura incorrectas: ${id}`);
  for (const width of [480, 960, 1600].filter(width => width < capture.width).concat(capture.width)) {
    await sharp(source).resize({ width }).webp({ quality: 86, effort: 5 })
      .toFile(fileURLToPath(new URL(`${id}-${width}.webp`, directory)));
  }
}
console.log('Capturas de producto optimizadas desde fuentes sin datos identificables.');
