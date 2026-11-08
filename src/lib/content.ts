import { getCollection } from 'astro:content';
import site from '../../content/site.json';
import { type Locale } from './i18n';
import evidence from '../../content/editorial/evidence.json';
import { parseMdx, validatePage } from '../../scripts/content-model.mjs';
import { parseScenes, projectSceneSections } from '../../scripts/scene-content.mjs';

export { site };
export type HomeItem = { id: string; title: string; paragraphs: string[]; actions: string[] };
export type HomeScene = {
  id: string;
  kind: string;
  title: string;
  paragraphs: string[];
  actions: string[];
  items: HomeItem[];
};
const rawHomes = import.meta.glob('../../content/pages/*/people.mdx', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;
export function homeVersions() {
  return Object.values(rawHomes).map(
    (raw) => parseMdx(raw).data as { id: string; locale: Locale; route: string },
  );
}
export async function pageVersions() {
  return [
    ...homeVersions(),
    ...(await getCollection('pages')).map((page) => ({
      id: page.data.id,
      locale: page.data.locale as Locale,
      route: page.data.route,
    })),
  ];
}
export async function getHome(locale: Locale = 'es') {
  const raw = rawHomes[`../../content/pages/${locale}/people.mdx`];
  if (!raw) throw new Error(`Home inexistente: ${locale}`);
  const { data, body } = parseMdx(raw);
  const scenes = parseScenes(body, site, data.locale);
  data.sections = projectSceneSections(scenes);
  validatePage(data, site, evidence);
  const page = { data, scenes };
  return page as {
    data: {
      id: string;
      locale: string;
      route: string;
      status: string;
      updatedAt: string;
      seo: { title: string; description: string };
    };
    scenes: HomeScene[];
  };
}
export async function getPage(id: string, locale: Locale = 'es') {
  const entries = await getCollection('pages');
  const entry = entries.find((entry) => entry.data.id === id && entry.data.locale === locale);
  if (!entry) throw new Error(`No se encontró la página ${id}/es`);
  return entry;
}

export async function getPageRoutes(locale: Locale = 'es'): Promise<Record<string, string>> {
  const entries = await getCollection('pages');
  return {
    'health.people': `/${locale}/`,
    ...Object.fromEntries(
      entries
        .filter((entry) => entry.data.locale === locale)
        .map((entry) => [entry.data.id, entry.data.route]),
    ),
  };
}
