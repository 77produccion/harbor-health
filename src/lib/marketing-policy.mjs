const sceneIds = [
  'hero',
  'documents',
  'levels',
  'consultation',
  'knowledge',
  'professionals',
  'faq',
  'closing',
];
const rules = {
  page_view: {},
  cta_click: {
    action: ['access', 'app', 'professional-access', 'medical-editor', 'tour', 'trust'],
    placement: ['header', 'hero', 'journey', 'professionals', 'closing', 'footer'],
  },
  section_view: { section: sceneIds },
  product_mode_change: { mode: ['documents', 'levels', 'consultation'] },
  document_category_change: { category: ['laboratory', 'radiology', 'functional'] },
  reading_level_change: { level: ['l1', 'l2'] },
  consultation_selection_change: { count: 'count' },
  pdf_example_generated: { count: 'count' },
};

export function readConsent(value, now = Date.now()) {
  if (!value || value.version !== 1 || !['accepted', 'rejected'].includes(value.choice))
    return null;
  if (
    typeof value.at !== 'number' ||
    !Number.isFinite(value.at) ||
    value.at > now ||
    now - value.at >= 180 * 86400000
  )
    return null;
  return value.choice;
}

export function safeEvent(name, properties = {}, locale = 'es') {
  if (!['es', 'en', 'nl', 'fr', 'pt', 'de', 'pap'].includes(locale)) return null;
  if (!Object.hasOwn(rules, name)) return null;
  const rule = rules[name];
  if (Object.keys(properties).some((key) => !Object.hasOwn(rule, key))) return null;
  const safe = {};
  for (const [key, allowed] of Object.entries(rule)) {
    const value = properties[key];
    if (allowed === 'count') {
      if (!Number.isInteger(value) || value < 0 || value > 3) return null;
    } else if (!allowed.includes(value)) return null;
    safe[key] = value;
  }
  return {
    event: name,
    ...safe,
    page_id: 'health.people',
    page_path: `/${locale}/`,
    language: locale,
  };
}

export function safeAttribution(search, allowlists = {}) {
  const params = new URLSearchParams(search);
  const result = {};
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) {
    const value = params.get(key);
    if (value && /^[a-zA-Z0-9_-]{1,60}$/.test(value) && allowlists[key]?.includes(value))
      result[key] = value;
  }
  return result;
}

export function measurementConfig(ga4, gtm) {
  if (ga4 && gtm) throw new Error('Configura GA4 o GTM, no ambos: evita medición duplicada.');
  if (ga4 && !/^G-[A-Z0-9]+$/.test(ga4)) throw new Error('PUBLIC_GA4_ID inválido.');
  if (gtm && !/^GTM-[A-Z0-9]+$/.test(gtm)) throw new Error('PUBLIC_GTM_ID inválido.');
  return { provider: ga4 ? 'ga4' : gtm ? 'gtm' : 'none', id: ga4 || gtm || null };
}
