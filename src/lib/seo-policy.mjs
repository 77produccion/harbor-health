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

/** @param {{ siteUrl?: string | null, route: string, canonicalRoute?: string, title: string, description: string, locale?: string, indexable?: boolean, faq?: {title: string, text: string}[], branded?: {name: string, kind: 'legal' | 'brand'} }} options */
export function buildMetadata({
  siteUrl,
  route,
  canonicalRoute = route,
  title,
  description,
  locale = 'es',
  indexable = false,
  faq = [],
  branded,
}) {
  const origin = resolveSiteUrl(siteUrl);
  const canonical = origin ? new URL(canonicalRoute, `${origin}/`).href : null;
  const pageUrl = origin ? new URL(route, `${origin}/`).href : null;
  const absolute = (path) => (origin ? new URL(path, `${origin}/`).href : path);
  const id = (suffix) => `${origin ?? ''}/#${suffix}`;
  const graph = branded ? [
    {
      '@type': 'Organization',
      '@id': id('integrative-wellness'),
      name: 'Integrative Wellness bv',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'FD Rooseveltweg 280',
        addressCountry: 'CW',
      },
    },
    {
      '@type': 'Brand',
      '@id': id(branded.name.toLowerCase().replace(' ', '-')),
      name: branded.name,
    },
    {
      '@type': 'WebPage',
      '@id': pageUrl ? `${pageUrl}#webpage` : '#webpage',
      name: title,
      description,
      inLanguage: locale,
      about: { '@id': id(branded.name.toLowerCase().replace(' ', '-')) },
      publisher: { '@id': id('integrative-wellness') },
      ...(branded.kind === 'legal' ? { genre: 'Terms and conditions' } : {}),
      ...(pageUrl ? { url: pageUrl } : {}),
    },
  ] : [
    {
      '@type': 'Organization',
      '@id': id('integrative-wellness'),
      name: 'Integrative Wellness bv',
    },
    {
      '@type': 'WebSite',
      '@id': id('website'),
      name: 'Harbor Health',
      inLanguage: locale,
      publisher: { '@id': id('integrative-wellness') },
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
      publisher: { '@id': id('integrative-wellness') },
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
