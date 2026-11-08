import es from '../../content/home-ui.es.json';
import en from '../../content/home-ui.en.json';
import nl from '../../content/home-ui.nl.json';
import fr from '../../content/home-ui.fr.json';
import pt from '../../content/home-ui.pt.json';
import de from '../../content/home-ui.de.json';
import pap from '../../content/home-ui.pap.json';

export const locales = ['es', 'en', 'nl', 'fr', 'pt', 'de', 'pap'] as const;
export type Locale = (typeof locales)[number];
const dictionaries: Record<Locale, typeof es> = { es, en, nl, fr, pt, de, pap };
export const languageNames: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
  nl: 'Nederlands',
  fr: 'Français',
  pt: 'Português',
  de: 'Deutsch',
  pap: 'Papiamentu',
};
export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
export function getLocale(pathname: string): Locale {
  const value = pathname.split('/')[1];
  return isLocale(value) ? value : 'es';
}
export function getUI(pathname: string) {
  return dictionaries[getLocale(pathname)];
}
