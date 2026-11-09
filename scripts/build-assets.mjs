import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { loadContent } from './content-model.mjs';
import './build-home-images.mjs';
import './build-editorial-images.mjs';
import './build-product-images.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const { pages } = await loadContent(root);
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
await mkdir(new URL('../public/images/', import.meta.url), { recursive: true });
// Recorte del símbolo superior original: dos personas formando un corazón.
// El PNG maestro (380×573) se conserva intacto, incluidos nombre y eslogan.
const { data: pixels, info } = await sharp(fileURLToPath(new URL('../public/images/harbor-health.png', import.meta.url)))
  .extract({ left: 94, top: 0, width: 192, height: 208 })
  .removeAlpha().raw().toBuffer({ resolveWithObject: true });
// Descomponer el matte blanco con los dos colores del original, también en
// píxeles antialias. Evita el halo blanco que deja un recorte por umbral.
const palette = [[6, 26, 51], [3, 137, 154]];
const rgba = Buffer.alloc(info.width * info.height * 4);
for (let pixel = 0; pixel < info.width * info.height; pixel++) {
  const sample = [...pixels.subarray(pixel * 3, pixel * 3 + 3)];
  const candidates = palette.map(color => {
    const alpha = Math.max(0, Math.min(1,
      sample.reduce((sum, value, channel) => sum + (value - 255) * (color[channel] - 255), 0)
      / color.reduce((sum, value) => sum + (value - 255) ** 2, 0)));
    const error = sample.reduce((sum, value, channel) => sum + (value - (255 + alpha * (color[channel] - 255))) ** 2, 0);
    return { color, alpha, error };
  });
  const { color, alpha } = candidates.sort((a, b) => a.error - b.error)[0];
  rgba.set([...color, Math.round(alpha * 255)], pixel * 4);
}
const symbol = await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
await sharp(symbol).webp({ lossless: true }).toFile(fileURLToPath(new URL('../public/images/harbor-health-symbol.webp', import.meta.url)));
await sharp(symbol).resize(64, 64, { fit: 'contain', background: '#ffffff00' }).png().toFile(fileURLToPath(new URL('../public/images/favicon.png', import.meta.url)));
for (const home of pages.filter(page => page.data.id === 'health.people')) {
  const lines = []; let line = '';
  for (const word of home.scenes[0].title.split(' ')) {
    if (`${line} ${word}`.length > 29) { lines.push(line); line = word; }
    else line = `${line} ${word}`.trim();
  }
  if (line) lines.push(line);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#061a33"/><text x="70" y="100" fill="#fff" font-family="Georgia,serif" font-size="36">Harbor Health</text>${lines.map((text,i)=>`<text x="70" y="${255+i*80}" fill="#fff" font-family="Georgia,serif" font-size="66">${escape(text)}</text>`).join('')}<text x="70" y="550" fill="#c7d9ef" font-family="Arial,sans-serif" font-size="23">${escape(home.scenes[0].paragraphs[0])}</text></svg>`;
  const name = home.data.locale === 'es' ? 'og-health.png' : `og-health-${home.data.locale}.png`;
  await writeFile(new URL(`../public/images/${name}`, import.meta.url), await sharp(Buffer.from(svg)).png().toBuffer());
}
console.log('OG 1200×630 generado para los siete idiomas desde sus MDX.');
