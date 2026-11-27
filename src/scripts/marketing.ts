import {
  ANALYTICS_COOKIE_MAX_AGE,
  ANALYTICS_COOKIE_PREFIX,
  CONSENT_STORAGE_KEY,
  CONSENT_VALIDITY_MS,
  analyticsCookieNames,
  readConsent,
  safeAttribution,
  safeEvent,
} from '../lib/marketing-policy.mjs';

type Choice = 'accepted' | 'rejected';
type Consent = { version: 1; choice: Choice; at: number; provider?: string };
type Configuration = {
  provider: 'none' | 'ga4' | 'gtm';
  id: string | null;
  enabledOnPage: boolean;
  allowlists: Record<string, string[]>;
};
type Provider = { script: HTMLScriptElement; layer: unknown[]; loaded: boolean };

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const deniedConsent = {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
};
const hasPrivacySignal = () =>
  navigator.doNotTrack === '1' ||
  Boolean((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl);

function storedConsent(): Consent | null {
  try {
    const value = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY) ?? 'null') as Consent | null;
    return readConsent(value) ? value : null;
  } catch {
    return null;
  }
}

function persistConsent(consent: Consent) {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
  } catch {
    // If storage is full, discard any previous acceptance before a later navigation.
    if (consent.choice === 'rejected') {
      try {
        localStorage.removeItem(CONSENT_STORAGE_KEY);
      } catch {
        /* Keep the choice in memory. */
      }
    }
  }
}

function eraseAnalyticsCookies() {
  try {
    const flags = location.protocol === 'https:' ? '; Secure' : '';
    for (const name of analyticsCookieNames(document.cookie)) {
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${flags}`;
    }
  } catch {
    /* Browsers can deny cookie access. Measurement remains off. */
  }
}

let send: ((name: string, properties: Record<string, unknown>) => void) | undefined;

export function track(name: string, properties: Record<string, unknown> = {}) {
  send?.(name, properties);
}

export function initMarketing() {
  const raw = document.querySelector('#harbor-measurement-config')?.textContent;
  if (!raw || send) return;
  const { id, provider, enabledOnPage, allowlists } = JSON.parse(raw) as Configuration;
  const configured = !!id && provider !== 'none';
  const identity = configured ? `${provider}:${id}` : undefined;
  const locale = document.documentElement.lang;
  const home = enabledOnPage === true && safeEvent('page_view', {}, locale);
  let consent = storedConsent();
  let activeProvider: Provider | undefined;
  let providerStopped = false;
  let expiryTimer: number | undefined;
  let lastTrigger: HTMLElement | null = null;
  let pageMeasured = false;
  const inView = new Set<string>();
  const measured = new Set<string>();
  const dialog = document.querySelector<HTMLDialogElement>('[data-consent-dialog]');
  const request = document.querySelector<HTMLElement>('[data-consent-request]');
  const privacyMessage = document.querySelector<HTMLElement>('[data-privacy-signal]');
  const statuses = document.querySelectorAll<HTMLElement>('[data-consent-status]');
  const acceptButtons = document.querySelectorAll<HTMLButtonElement>('[data-consent-accept]');

  function measureAllowed() {
    return (
      !!activeProvider &&
      readConsent(consent, Date.now(), identity) === 'accepted' &&
      !hasPrivacySignal()
    );
  }

  send = (name, properties) => {
    if (!measureAllowed()) return;
    const event = safeEvent(name, properties, locale);
    if (!event) return;
    const safe = { ...event, ...safeAttribution(location.search, allowlists) };
    if (provider === 'ga4') {
      const { event: eventName, ...fields } = safe;
      window.gtag?.('event', eventName, {
        ...fields,
        page_location: `${location.origin}${event.page_path}`,
        page_referrer: '',
      });
    } else activeProvider?.layer.push(safe);
    window.dispatchEvent(new CustomEvent('harbor:measurement', { detail: safe }));
  };

  function setGaDisabled(value: boolean) {
    if (provider === 'ga4' && id) {
      (window as unknown as Record<string, unknown>)[`ga-disable-${id}`] = value;
    }
  }

  function startProvider() {
    if (!home || !id || activeProvider || providerStopped) return;
    const script = document.createElement('script');
    const layer: unknown[] = [];
    const current = { script, layer, loaded: false };
    activeProvider = current;
    window.dataLayer = layer;
    window.gtag = function () {
      layer.push(arguments);
    };
    setGaDisabled(false);
    window.gtag('consent', 'default', deniedConsent);
    window.gtag('consent', 'update', { ...deniedConsent, analytics_storage: 'granted' });
    const settings = {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_domain: 'none',
      cookie_path: '/',
      cookie_flags: location.protocol === 'https:' ? 'SameSite=Lax;Secure' : 'SameSite=Lax',
      cookie_expires: ANALYTICS_COOKIE_MAX_AGE,
      cookie_prefix: ANALYTICS_COOKIE_PREFIX,
      cookie_update: false,
      page_location: `${location.origin}${home.page_path}`,
      page_referrer: '',
    };
    script.async = true;
    script.referrerPolicy = 'no-referrer';
    if (provider === 'ga4') {
      window.gtag('js', new Date());
      window.gtag('config', id, settings);
      script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    } else {
      window.gtag('set', settings);
      layer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
      script.src = `https://www.googletagmanager.com/gtm.js?id=${id}`;
    }
    script.addEventListener(
      'load',
      () => {
        current.loaded = true;
      },
      { once: true },
    );
    script.addEventListener(
      'error',
      () => {
        if (activeProvider !== current) return;
        activeProvider = undefined;
        script.remove();
        layer.length = 0;
        pageMeasured = false;
        measured.clear();
      },
      { once: true },
    );
    document.head.append(script);
  }

  function stopProvider() {
    const current = activeProvider;
    if (!current) return false;
    activeProvider = undefined;
    providerStopped = true;
    setGaDisabled(true);
    if (!current.loaded) current.layer.length = 0;
    window.gtag?.('consent', 'update', deniedConsent);
    current.script.remove();
    return true;
  }

  function measureVisible() {
    if (!measureAllowed()) return;
    for (const section of inView) {
      if (measured.has(section)) continue;
      track('section_view', { section });
      measured.add(section);
    }
  }

  function refreshConsent() {
    const blocked = hasPrivacySignal();
    const choice = readConsent(consent, Date.now(), identity);
    if (request) request.hidden = !configured || blocked || choice !== null;
    if (privacyMessage) privacyMessage.hidden = !blocked;
    acceptButtons.forEach((button) => {
      button.disabled = !configured || blocked;
    });
    statuses.forEach((element) => {
      element.hidden =
        !configured || blocked || element.dataset.consentStatus !== (choice ?? 'unset');
    });

    window.clearTimeout(expiryTimer);
    if (choice && consent) {
      const remaining = consent.at + CONSENT_VALIDITY_MS - Date.now();
      expiryTimer = window.setTimeout(refreshConsent, Math.max(1, Math.min(remaining, 2147483647)));
    }

    if (!configured || blocked || choice !== 'accepted') {
      const started = stopProvider();
      eraseAnalyticsCookies();
      // Removing an executed script does not unload its listeners. Restart only when
      // the saved state can no longer activate the provider in the next document.
      if (started && (blocked || readConsent(storedConsent(), Date.now(), identity) !== 'accepted'))
        location.reload();
      return;
    }

    startProvider();
    if (!pageMeasured && measureAllowed()) {
      track('page_view');
      pageMeasured = true;
    }
    measureVisible();
  }

  function apply(choice: Choice) {
    if (choice === 'accepted' && (!configured || hasPrivacySignal())) return;
    consent = {
      version: 1,
      choice,
      at: Date.now(),
      provider: choice === 'accepted' ? identity : undefined,
    };
    persistConsent(consent);
    dialog?.close();
    refreshConsent();
  }

  document.querySelectorAll<HTMLElement>('[data-consent-open]').forEach((button) => {
    button.hidden = false;
    button.addEventListener('click', () => {
      lastTrigger = button;
      dialog?.showModal();
    });
  });
  dialog?.addEventListener('close', () => {
    lastTrigger?.focus();
    lastTrigger = null;
  });
  document.querySelector('[data-consent-close]')?.addEventListener('click', () => dialog?.close());
  acceptButtons.forEach((button) => button.addEventListener('click', () => apply('accepted')));
  document.querySelectorAll('[data-consent-reject]').forEach((button) => {
    button.addEventListener('click', () => apply('rejected'));
  });
  window.addEventListener('storage', (event) => {
    if (event.key !== CONSENT_STORAGE_KEY && event.key !== null) return;
    consent = storedConsent();
    refreshConsent();
  });
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    consent = storedConsent();
    refreshConsent();
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshConsent();
  });

  if (home && configured) {
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
    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const section = (entry.target as HTMLElement).dataset.homeScene;
            if (!section) continue;
            if (entry.isIntersecting) inView.add(section);
            else inView.delete(section);
          }
          measureVisible();
        },
        { threshold: 0.35 },
      );
      document
        .querySelectorAll('[data-home-scene]')
        .forEach((element) => observer.observe(element));
    }
  }

  refreshConsent();
}
