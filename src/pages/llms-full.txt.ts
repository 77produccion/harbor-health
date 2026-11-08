import type { APIRoute } from 'astro';
import { getHome } from '../lib/content';
import { publicKnowledge } from '../lib/seo-policy.mjs';
import { locales } from '../lib/i18n';
export const GET: APIRoute = async () => {
  const homes = await Promise.all(locales.map((locale) => getHome(locale)));
  const published = import.meta.env.HARBOR_PUBLISH === 'true';
  const approved = published ? homes.filter((home) => home.data.status === 'approved') : [];
  return new Response(
    approved.length
      ? `# Harbor Health\n\n${approved.map((home) => `# ${home.data.locale}\n\n${publicKnowledge(home.scenes)}`).join('\n\n')}\n`
      : 'Contenido editorial en revisión. No se exportan borradores.\n',
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
};
