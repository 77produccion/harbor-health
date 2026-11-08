import type { APIRoute } from 'astro';
import { resolveSiteUrl } from '../lib/seo-policy.mjs';
import { getCollection } from 'astro:content';
import { getHome } from '../lib/content';
import { locales } from '../lib/i18n';
export const GET: APIRoute = async () => {
  const origin = resolveSiteUrl(import.meta.env.SITE_URL);
  const published = import.meta.env.HARBOR_PUBLISH === 'true' && origin;
  const pages = [
    ...(await getCollection('pages')).map((page) => page.data),
    ...(await Promise.all(locales.map((locale) => getHome(locale)))).map((page) => page.data),
  ];
  const urls = published
    ? pages
        .filter((page) => page.status === 'approved')
        .map((page) => `<url><loc>${origin}${page.route}</loc></url>`)
        .join('')
    : '';
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
