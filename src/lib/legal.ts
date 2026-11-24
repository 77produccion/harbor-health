import health from '../../content/legal/health.json';
import living from '../../content/legal/living.json';

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

export type TermsDocument = (typeof termsDocuments)[keyof typeof termsDocuments];
export const termsPages = Object.values(termsDocuments);

export function relatedClause(document: TermsDocument, label: string) {
  if (document.brand === 'Harbor Health' && label === '11.2') {
    return {
      text: 'Article 16 of Part A',
      href: `${termsDocuments['harbor-living'].route}#article-16`,
    };
  }
  if (document.brand === 'Harbor Living' && label === '2.3') {
    return { text: 'Harbor Health', href: termsDocuments['harbor-health'].route };
  }
}
