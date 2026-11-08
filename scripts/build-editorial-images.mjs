import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const images = new URL('../public/images/', import.meta.url);

// Originales aportados por el responsable. Se conservan intactos; estos
// derivados solo reducen peso para las escenas editoriales.
const derivatives = [
  ['2154c642-f58e-4b4c-8ad8-96a1a357701d.png', 'editorial-ocean-1600.webp', 1600],
  ['9c56b27b-189b-4bf5-b585-020fa04d786f.png', 'editorial-writing-1400.webp', 1400],
  ['98bbb4c4-4ab4-4b05-a495-fcfc87a9b568.png', 'editorial-questions-1400.webp', 1400],
  ['b87f262f-a492-4ef8-ac85-de128a1a4eef.png', 'editorial-notes-1400.webp', 1400],
  ['ad93f76a-3fe9-4a15-bbfe-bba72801806d.png', 'editorial-clinician-1000.webp', 1000],
];

for (const [source, target, width] of derivatives) {
  const input = new URL(source, images);
  try {
    await stat(fileURLToPath(input));
  } catch {
    continue;
  }
  await sharp(fileURLToPath(input))
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 82, effort: 5 })
    .toFile(fileURLToPath(new URL(target, images)));
  console.log(`Derivado editorial: ${target}`);
}
