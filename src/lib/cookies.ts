import cookies from '../../content/legal/cookies.json';
import type { Locale } from './i18n';

export const cookiesContact = cookies.contact;
export const cookiesCopy = cookies.translations;

export function cookiesRoute(locale: Locale) {
  return `/${locale}/cookies/`;
}
