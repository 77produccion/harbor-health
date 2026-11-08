import type { APIRoute } from 'astro';
import { resolveSiteUrl } from '../lib/seo-policy.mjs';
import { getHome } from '../lib/content';
import { locales } from '../lib/i18n';
export const GET: APIRoute = async () => {
  const origin = resolveSiteUrl(import.meta.env.SITE_URL);
  const published = import.meta.env.HARBOR_PUBLISH === 'true' && origin;
  const approved = published
    ? (await Promise.all(locales.map((locale) => getHome(locale)))).filter(
        (home) => home.data.status === 'approved',
      )
    : [];
  const text = published
    ? `# Harbor Health\n\n${approved.map((home) => `- [${home.data.seo.title}](${origin}${home.data.route}): ${home.data.seo.description}`).join('\n')}\n- [Public content](${origin}/llms-full.txt)\n`
    : '# Harbor Health\n\nEste entorno de revisión no publica una base de conocimiento aprobada.\n';
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
