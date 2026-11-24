import health from '../../content/legal/health.json';
import living from '../../content/legal/living.json';
import ui from '../../content/legal/ui.json';
import type { Locale } from './i18n';

export const termsDocuments = {
  'harbor-health': {
    ...health,
    brand: 'Harbor Health',
    route: '/en/legal/harbor-health/',
    description: 'Terms for using Harbor Health’s service for understanding laboratory results, including access, subscriptions, uploads and privacy.',
  },
  'harbor-living': {
    ...living,
    brand: 'Harbor Living',
    route: '/en/legal/harbor-living/',
    description: 'Webshop terms for Harbor Living and Harbor Family, including orders, delivery, subscriptions, withdrawal and disputes.',
  },
} as const;

export type TermsSlug = keyof typeof termsDocuments;
export const termsPages = Object.values(termsDocuments);
export const termsSlugs = Object.keys(termsDocuments) as TermsSlug[];
export const legalUI = ui;

export function termsRoute(locale: Locale, slug: TermsSlug) {
  return `/${locale}/legal/${slug}/`;
}

export function relatedClause(slug: TermsSlug, label: string, locale: Locale) {
  if (slug === 'harbor-health' && label === '11.2') {
    return {
      text: 'Article 16 of Part A',
      href: `${termsRoute(locale, 'harbor-living')}#article-16`,
    };
  }
  if (slug === 'harbor-living' && label === '2.3') {
    return { text: 'Harbor Health', href: termsRoute(locale, 'harbor-health') };
  }
}
