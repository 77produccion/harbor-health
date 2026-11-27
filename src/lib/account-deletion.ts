import accountDeletion from '../../content/legal/account-deletion.json';
import type { Locale } from './i18n';

export const accountDeletionEmail = accountDeletion.email;
export const accountDeletionCopy = accountDeletion.translations;

export function accountDeletionRoute(locale: Locale) {
  return `/${locale}/delete-account/`;
}

export function accountDeletionMailto(locale: Locale) {
  const { subject, message } = accountDeletionCopy[locale];
  return `mailto:${accountDeletionEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
}
