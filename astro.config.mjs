import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { loadContent, publicationIssues } from './scripts/content-model.mjs';
import { loadEnv } from 'vite';
import { resolveSiteUrl } from './src/lib/seo-policy.mjs';

const root = new URL('.', import.meta.url);
const { fileURLToPath } = await import('node:url');
const content = await loadContent(fileURLToPath(root));
const environment = loadEnv(process.env.NODE_ENV ?? 'development', fileURLToPath(root), '');
const origin = resolveSiteUrl(environment.SITE_URL);
if (process.env.HARBOR_PUBLISH === 'true') {
  if (!origin) throw new Error('Publicación bloqueada: falta SITE_URL definitivo.');
  const issues = publicationIssues(content.pages, content.site, content.evidence);
  if (issues.length) throw new Error(`Publicación bloqueada:\n${issues.join('\n')}`);
}

export default defineConfig({
  ...(origin ? { site: origin } : {}),
  integrations: [mdx()],
  output: 'static',
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en', 'nl', 'fr', 'pt', 'de', 'pap'],
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
  devToolbar: { enabled: false },
  vite: { server: { fs: { strict: true } } },
});
