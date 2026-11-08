import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// Originales aportados por el responsable. Nunca se sobrescriben.
const images = fileURLToPath(new URL('../public/images/', import.meta.url));
const writing = `${images}9c56b27b-189b-4bf5-b585-020fa04d786f.png`;
const portrait = `${images}ad93f76a-3fe9-4a15-bbfe-bba72801806d.png`;
const water = `${images}2154c642-f58e-4b4c-8ad8-96a1a357701d.png`;
await sharp(`${images}b87f262f-a492-4ef8-ac85-de128a1a4eef.png`).resize({ width: 1400, withoutEnlargement: true }).webp({ quality: 82 }).toFile(`${images}home-documents-1400.webp`);

for (const width of [1536, 960]) {
  await sharp(writing).resize({ width, withoutEnlargement: true }).webp({ quality: 82 })
    .toFile(`${images}home-preparation-${width}.webp`);
}
for (const width of [900]) {
  await sharp(portrait).resize({ width, withoutEnlargement: true }).webp({ quality: 82 })
    .toFile(`${images}home-professional-${width}.webp`);
}
for (const width of [1600, 800]) {
  await sharp(water).resize({ width, withoutEnlargement: true }).webp({ quality: 80 })
    .toFile(`${images}home-water-${width}.webp`);
}
console.log('Derivados WebP de las imágenes aportadas: hero, profesionales y cierre.');
