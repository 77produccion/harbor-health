import { safeAttribution, safeEvent, readConsent } from '../lib/marketing-policy.mjs';

type Choice = 'accepted' | 'rejected';
type Configuration = {
  provider: 'none' | 'ga4' | 'gtm';
  id: string | null;
  allowlists: Record<string, string[]>;
};
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
const key = 'harbor:measurement-consent:v1';
let choice: Choice | null = null;
let config: Configuration | undefined;
let providerStarted = false;
const signal = () =>
  navigator.doNotTrack === '1' ||
  Boolean((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl);

export function track(name: string, properties: Record<string, unknown> = {}) {
  if (choice !== 'accepted' || signal()) return;
  const event = safeEvent(name, properties, document.documentElement.lang);
  if (!event) return;
  const attribution = safeAttribution(location.search, config?.allowlists);
  const safe = { ...event, ...attribution };
  window.dispatchEvent(new CustomEvent('harbor:measurement', { detail: safe }));
  if (config?.provider === 'ga4' && providerStarted) {
    const { event: eventName, ...fields } = safe;
    window.gtag?.('event', eventName, {
      ...fields,
      page_location: `${location.origin}${event.page_path}`,
      page_referrer: '',
    });
  } else if (config?.provider === 'gtm' && providerStarted) window.dataLayer?.push(safe);
}

function startProvider() {
  if (providerStarted || !config?.id || choice !== 'accepted' || signal()) return;
  providerStarted = true;
  window.dataLayer ??= [];
  window.gtag = (...args: unknown[]) => window.dataLayer!.push(args);
  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  window.gtag('consent', 'update', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  const script = document.createElement('script');
  script.async = true;
  if (config.provider === 'ga4') {
    window.gtag('js', new Date());
    window.gtag('config', config.id, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: `${location.origin}/${document.documentElement.lang}/`,
      page_referrer: '',
    });
    script.src = `https://www.googletagmanager.com/gtag/js?id=${config.id}`;
  } else {
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    script.src = `https://www.googletagmanager.com/gtm.js?id=${config.id}`;
  }
  document.head.append(script);
}

export function initMarketing() {
  const raw = document.querySelector('#harbor-measurement-config')?.textContent;
  if (!raw) return;
  config = JSON.parse(raw) as Configuration;
  try {
    const stored = JSON.parse(localStorage.getItem(key) ?? 'null');
    choice = readConsent(stored) as Choice | null;
  } catch {
    /* Consent is optional; failure leaves measurement off. */
  }
  if (signal()) choice = 'rejected';
  const dialog = document.querySelector<HTMLDialogElement>('[data-consent-dialog]');
  const request = document.querySelector<HTMLElement>('[data-consent-request]');
  const inView = new Set<string>();
  const measured = new Set<string>();
  let lastTrigger: HTMLElement | null = null;
  let pageMeasured = false;
  function measurePage() {
    if (!pageMeasured && choice === 'accepted' && !signal()) {
      track('page_view');
      pageMeasured = true;
    }
  }
  function measureVisible() {
    if (choice !== 'accepted' || signal()) return;
    for (const section of inView)
      if (!measured.has(section)) {
        track('section_view', { section });
        measured.add(section);
      }
  }
  function apply(next: Choice, persist = true) {
    choice = signal() ? 'rejected' : next;
    try {
      if (persist)
        localStorage.setItem(key, JSON.stringify({ version: 1, choice, at: Date.now() }));
    } catch {
      /* Use session memory when storage is unavailable. */
    }
    if (request) request.hidden = true;
    dialog?.close();
    lastTrigger?.focus();
    if (config?.provider === 'ga4' && config.id)
      (window as unknown as Record<string, unknown>)[`ga-disable-${config.id}`] =
        choice !== 'accepted';
    if (choice === 'accepted') {
      startProvider();
      measurePage();
      measureVisible();
    } else
      window.gtag?.('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      });
  }
  document.querySelectorAll<HTMLElement>('[data-consent-open]').forEach((button) => {
    button.hidden = false;
    button.addEventListener('click', () => {
      lastTrigger = button;
      dialog?.showModal();
    });
  });
  document.querySelector('[data-consent-close]')?.addEventListener('click', () => dialog?.close());
  document
    .querySelectorAll('[data-consent-accept]')
    .forEach((button) => button.addEventListener('click', () => apply('accepted')));
  document
    .querySelectorAll('[data-consent-reject]')
    .forEach((button) => button.addEventListener('click', () => apply('rejected')));
  window.addEventListener('storage', (event) => {
    if (event.key !== key) return;
    try {
      const stored = JSON.parse(event.newValue ?? 'null');
      apply(readConsent(stored) === 'accepted' ? 'accepted' : 'rejected', false);
    } catch {
      apply('rejected', false);
    }
  });
  if (signal()) {
    const message = document.querySelector<HTMLElement>('[data-privacy-signal]');
    if (message) message.hidden = false;
    document.querySelectorAll<HTMLButtonElement>('[data-consent-accept]').forEach((button) => {
      button.disabled = true;
    });
  }
  if (!choice && config.provider !== 'none' && request) request.hidden = false;
  document.addEventListener('click', (event) => {
    const link =
      event.target instanceof Element
        ? event.target.closest<HTMLElement>('[data-marketing-action]')
        : null;
    if (link)
      track('cta_click', {
        action: link.dataset.marketingAction,
        placement: link.dataset.placement,
      });
  });
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = (entry.target as HTMLElement).dataset.homeScene!;
        if (entry.isIntersecting) inView.add(id);
        else inView.delete(id);
      });
      measureVisible();
    },
    { threshold: 0.35 },
  );
  document.querySelectorAll('[data-home-scene]').forEach((element) => observer.observe(element));
  if (choice === 'accepted') {
    startProvider();
    measurePage();
  }
}
