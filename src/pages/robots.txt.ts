import type { APIRoute } from 'astro';
import { resolveSiteUrl } from '../lib/seo-policy.mjs';
import { locales } from '../lib/i18n';
export const GET: APIRoute = () => {
  const origin = resolveSiteUrl(import.meta.env.SITE_URL);
  const published = import.meta.env.HARBOR_PUBLISH === 'true' && origin;
  return new Response(
    published
      ? `User-agent: *\n${locales.map((locale) => `Allow: /${locale}/`).join('\n')}\nSitemap: ${origin}/sitemap.xml\n`
      : 'User-agent: *\nDisallow: /\n',
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
};
