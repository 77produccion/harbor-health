/** No guessed domain, clinical credentials, prices, ratings, or reviews. */
export function resolveSiteUrl(value) {
  if (!value?.trim()) return null;
  const url = new URL(value);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  ) {
    throw new Error('SITE_URL debe ser un origen HTTPS sin ruta, credenciales ni parámetros.');
  }
  return url.origin;
}

export function serializeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

/** @param {{ siteUrl?: string | null, route: string, title: string, description: string, locale?: string, indexable?: boolean, faq?: {title: string, text: string}[] }} options */
export function buildMetadata({
  siteUrl,
  route,
  title,
  description,
  locale = 'es',
  indexable = false,
  faq = [],
}) {
  const origin = resolveSiteUrl(siteUrl);
  const canonical = origin ? new URL(route, `${origin}/`).href : null;
  const absolute = (path) => (origin ? new URL(path, `${origin}/`).href : path);
  const id = (suffix) => `${origin ?? ''}/#${suffix}`;
  const graph = [
    {
      '@type': 'Organization',
      '@id': id('organization'),
      name: 'Harbor Living',
      ...(origin ? { url: origin } : {}),
    },
    {
      '@type': 'WebSite',
      '@id': id('website'),
      name: 'Harbor Health',
      inLanguage: locale,
      publisher: { '@id': id('organization') },
      ...(origin ? { url: origin } : {}),
    },
    {
      '@type': 'SoftwareApplication',
      '@id': id('application'),
      name: 'Harbor Health',
      applicationCategory: 'HealthApplication',
      operatingSystem: 'Web',
      url: 'https://harbor-web-rho.vercel.app/health/login',
      description,
      publisher: { '@id': id('organization') },
    },
    {
      '@type': 'WebPage',
      '@id': canonical ? `${canonical}#webpage` : '#webpage',
      name: title,
      description,
      inLanguage: locale,
      isPartOf: { '@id': id('website') },
      about: { '@id': id('application') },
      ...(canonical ? { url: canonical } : {}),
    },
  ];
  if (faq.length)
    graph.push({
      '@type': 'FAQPage',
      '@id': canonical ? `${canonical}#faq` : '#faq',
      mainEntity: faq.map((item) => ({
        '@type': 'Question',
        name: item.title,
        acceptedAnswer: { '@type': 'Answer', text: item.text },
      })),
    });
  return {
    title,
    description,
    canonical,
    locale,
    robots: indexable && origin ? 'index, follow, max-image-preview:large' : 'noindex, nofollow',
    image: absolute(locale === 'es' ? '/images/og-health.png' : `/images/og-health-${locale}.png`),
    graph: { '@context': 'https://schema.org', '@graph': graph },
  };
}

export function publicKnowledge(scenes) {
  // Explicit public fields only: never spread frontmatter, sourceIds, reviews, or private notes.
  return scenes
    .map(
      (scene) =>
        `## ${scene.title}\n\n${scene.paragraphs.join('\n\n')}${scene.items.map((item) => `\n\n### ${item.title}\n\n${item.paragraphs.join('\n\n')}`).join('')}`,
    )
    .join('\n\n');
}
