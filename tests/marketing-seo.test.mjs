import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CONSENT_VALIDITY_MS,
  analyticsCookieNames,
  safeEvent,
  safeAttribution,
  measurementConfig,
  readConsent,
} from '../src/lib/marketing-policy.mjs';
import { resolveSiteUrl, buildMetadata, serializeJsonLd, publicKnowledge } from '../src/lib/seo-policy.mjs';

test('eventos solo admiten propiedades enumeradas y nunca texto clínico', () => {
  assert.equal(safeEvent('diagnosis', {}), null);
  assert.equal(safeEvent('cta_click', { action: 'access', placement: 'hero', document: 'resultado' }), null);
  assert.equal(safeEvent('consultation_selection_change', { count: 4 }), null);
  assert.equal(safeEvent('consultation_selection_change', { count: 2, questionText: 'salud' }), null);
  assert.equal(safeEvent('document_category_change', { category: 'user-written-value' }), null);
  assert.deepEqual(safeEvent('document_category_change', { category: 'laboratory' }), { event: 'document_category_change', category: 'laboratory', page_id: 'health.people', page_path: '/es/', language: 'es' });
});
test('el consentimiento ausente, vencido o fechado en el futuro no activa medición', () => {
  const now = 1800000000000;
  assert.equal(readConsent(null, now), null);
  assert.equal(readConsent({ version: 1, choice: 'accepted' }, now), null);
  assert.equal(readConsent({ version: 1, choice: 'accepted', at: now + 1 }, now), null);
  assert.equal(readConsent({ version: 1, choice: 'accepted', at: now - 181 * 86400000 }, now), null);
  assert.equal(readConsent({ version: 1, choice: 'accepted', at: now - CONSENT_VALIDITY_MS }, now), null);
  assert.equal(readConsent({ version: 1, choice: 'accepted', at: now - 1000 }, now), 'accepted');
  assert.equal(readConsent({ version: 1, choice: 'rejected', at: now - 1000 }, now), 'rejected');
});

test('cada proveedor de medición exige su propio permiso explícito', () => {
  const now = 1800000000000;
  const accepted = { version: 1, choice: 'accepted', at: now - 1000 };
  const configured = 'ga4:G-TEST123';
  assert.equal(readConsent(accepted, now, configured), null);
  assert.equal(readConsent({ ...accepted, provider: 'gtm:GTM-OTHER' }, now, configured), null);
  assert.equal(readConsent({ ...accepted, provider: configured }, now, configured), 'accepted');
  assert.equal(readConsent({ ...accepted, choice: 'rejected' }, now, configured), 'rejected');
});

test('la retirada solo alcanza las cookies de medición con el prefijo de Harbor Health', () => {
  const cookies = 'session_token=private; _ga=external; _ga_X=external; harbor_health_language=es; '
    + 'harbor_health_ga=client; harbor_health_ga_ID24=a=b; harbor_health__ga_GA3=other; '
    + 'harbor_health_ga_other_cookie=retained; clinic_harbor_health_ga=retained';
  assert.deepEqual(analyticsCookieNames(cookies), [
    'harbor_health_ga',
    'harbor_health_ga_ID24',
    'harbor_health__ga_GA3',
  ]);
});

test('atribución ignora parámetros desconocidos, click IDs y campañas no autorizadas', () => {
  const result = safeAttribution('?utm_source=google&utm_medium=cpc&utm_campaign=launch&utm_term=clinical&gclid=123&patient=anything', { utm_source: ['google'], utm_medium: ['cpc'], utm_campaign: ['launch'] });
  assert.deepEqual(result, { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'launch' });
  assert.deepEqual(safeAttribution('?utm_source=google&utm_campaign=unapproved'), {});
});
test('no se configura un proveedor ficticio ni dos vías que dupliquen eventos', () => {
  assert.equal(measurementConfig('', '').provider, 'none');
  assert.equal(measurementConfig('G-TEST123', '').provider, 'ga4');
  assert.throws(() => measurementConfig('G-TEST123', 'GTM-TEST123'));
  assert.throws(() => measurementConfig('https://not-an-id', ''));
});
test('canonical solo usa un origen HTTPS configurado, nunca un dominio inventado', () => {
  assert.equal(resolveSiteUrl(undefined), null);
  assert.throws(() => resolveSiteUrl('http://example.test'));
  assert.throws(() => resolveSiteUrl('https://example.test/path'));
  const preview = buildMetadata({ title: 'Harbor Health', description: 'Descripción', route: '/es/' });
  assert.equal(preview.canonical, null);
  assert.match(preview.robots, /noindex/);
  const production = buildMetadata({ siteUrl: 'https://health.example.test', title: 'Harbor', description: 'Descripción', route: '/es/', indexable: true });
  assert.equal(production.canonical, 'https://health.example.test/es/');
  assert.match(production.robots, /^index/);
});
test('schema no inventa precios ni reseñas; FAQ refleja las respuestas suministradas', () => {
  const metadata = buildMetadata({ title: 'Harbor', description: 'Descripción', route: '/es/', faq: [{ title: '¿Diagnostica?', text: 'No.' }] });
  const json = JSON.stringify(metadata.graph);
  assert(!json.includes('aggregateRating') && !json.includes('price') && !json.includes('offers'));
  const faq = metadata.graph['@graph'].find(item => item['@type'] === 'FAQPage');
  assert.equal(faq.mainEntity[0].acceptedAnswer.text, 'No.');
  assert(!serializeJsonLd({ value: '</script>' }).includes('</script>'));
});
test('la proyección GEO no exporta metadatos privados ni fuentes de revisión', () => {
  const text = publicKnowledge([{ title: 'Producto', paragraphs: ['Información pública.'], items: [{ title: 'Uso', paragraphs: ['Explicación.'], sourceIds: ['private'] }], review: 'internal', sourceIds: ['private'] }]);
  assert(text.includes('Información pública.'));
  assert(!text.includes('internal') && !text.includes('private'));
});
