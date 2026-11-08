import { fileURLToPath } from 'node:url';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { contentMatrix, loadContent, publicationIssues } from './content-model.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
try {
  const { pages, site, evidence } = await loadContent(root);
  if (process.argv.includes('--matrix')) console.log(contentMatrix(pages, evidence));
  else if (process.argv.includes('--write-matrix')) {
    await mkdir(path.join(root, 'docs'), { recursive: true });
    await writeFile(path.join(root, 'docs/content-matrix.md'), contentMatrix(pages, evidence), 'utf8');
    console.log('Matriz generada en docs/content-matrix.md');
  } else if (process.argv.includes('--publish')) {
    const issues = publicationIssues(pages, site, evidence);
    if (issues.length) {
      console.error(`Publicación bloqueada:\n${issues.map(issue => `- ${issue}`).join('\n')}`);
      process.exitCode = 1;
    } else console.log('Validación editorial de publicación superada. No sustituye QA del sitio.');
  } else {
    console.log(`${pages.length} MDX válidos; ${pages.reduce((count, page) => count + page.data.sections.length, 0)} secciones verificadas.`);
    console.log(`Borradores: ${pages.filter(page => page.data.status !== 'approved').length}. Sin exportación al agente.`);
    console.log(`Idiomas sin contenido: ${site.locales.filter(locale => !pages.some(page => page.data.locale === locale)).join(', ')}.`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
