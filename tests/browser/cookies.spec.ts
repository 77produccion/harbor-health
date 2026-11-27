import { expect, test, type BrowserContext, type Page } from '@playwright/test';

const locales = ['es', 'en', 'nl', 'fr', 'pt', 'de', 'pap'];
const consentKey = 'harbor:measurement-consent:v1';
const testMeasurementId = 'G-HARBORQA';
const testMeasurementProvider = `ga4:${testMeasurementId}`;
const configuredFixture = process.env.PUBLIC_GA4_ID === testMeasurementId;
const hasProviderEnvironment = Boolean(process.env.PUBLIC_GA4_ID || process.env.PUBLIC_GTM_ID);

function settingsDialog(page: Page) {
  return page.locator('[data-consent-dialog]');
}

async function openSettings(page: Page) {
  await page.locator('[data-consent-open]').first().click();
  await expect(settingsDialog(page)).toBeVisible();
}

async function consentChoice(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null')?.choice ?? null, consentKey);
}

async function mockGoogleTag(context: BrowserContext) {
  const requests: string[] = [];
  await context.route(/^https:\/\/[^/]*(?:googletagmanager\.com|google-analytics\.com)\//, async (route) => {
    requests.push(route.request().url());
    const url = new URL(route.request().url());
    if (url.pathname !== '/gtag/js' || url.searchParams.get('id') !== testMeasurementId) {
      await route.abort();
      return;
    }
    await route.fulfill({
      contentType: 'application/javascript',
      body: `
        const configuration = window.dataLayer
          .map((entry) => Array.from(entry ?? []))
          .find(([command]) => command === 'config')[2];
        document.cookie = configuration.cookie_prefix + '_ga=fixture; Path=/';
        document.cookie = configuration.cookie_prefix + '_ga_HARBORQA=fixture; Path=/';
      `,
    });
  });
  return requests;
}

test.describe('Public cookie notice', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });

  test('a visitor can read the localized notice without JavaScript', async ({ page }) => {
    await page.goto('/en/');
    const link = page.locator('footer a[href="/en/cookies/"]');
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/en\/cookies\/$/);

    for (const locale of locales) {
      const response = await page.goto(`/${locale}/cookies/`);
      expect(response?.status()).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible();
      await page.locator('.language-trigger').click();
      await expect(page.locator('#language-options a[hreflang="es"]')).toHaveAttribute('href', '/es/cookies/');
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
    }
  });
});

test('cookie settings are available across the site without a measurement provider', async ({ page, context }) => {
  test.skip(hasProviderEnvironment, 'This case uses the default build with measurement unconfigured.');
  const requests = await mockGoogleTag(context);

  for (const path of ['/en/', '/en/harbor-living/', '/en/legal/harbor-health/', '/en/delete-account/', '/en/cookies/']) {
    await page.goto(path);
    await openSettings(page);
    const dialog = settingsDialog(page);
    await expect(dialog).toHaveAccessibleName('Cookies and measurement');
    await expect(dialog.locator('a[href="/en/cookies/"]')).toBeVisible();
    await expect(dialog.locator('[data-consent-accept]:enabled')).toBeHidden();
    await expect(page.locator('[data-consent-request]')).toBeHidden();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.locator('[data-consent-open]').first()).toBeFocused();
  }

  expect(requests).toEqual([]);
  expect(await consentChoice(page)).toBeNull();
});

test.describe('Consent with a locally mocked GA4 tag', () => {
  test.skip(!configuredFixture, `Set PUBLIC_GA4_ID=${testMeasurementId} for the intercepted browser fixture.`);

  test('keeps measurement off until consent and lets an interior page withdraw it', async ({ page, context }) => {
    const requests = await mockGoogleTag(context);
    await page.addInitScript(() => {
      const events: Array<Record<string, unknown>> = [];
      (window as unknown as { measurementEvents: typeof events }).measurementEvents = events;
      window.addEventListener('harbor:measurement', (event) => events.push((event as CustomEvent).detail));
    });
    const measurementEvents = () => page.evaluate(() => (
      window as unknown as { measurementEvents: Array<Record<string, unknown>> }
    ).measurementEvents);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/en/?utm_source=google&utm_campaign=unlisted-fixture&email=private-fixture');
    const request = page.locator('[data-consent-request]');
    await expect(request).toBeVisible();
    for (const action of ['accept', 'reject']) {
      const button = request.locator(`[data-consent-${action}]`);
      await expect(button).toBeInViewport();
      expect((await button.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    }
    expect(requests).toEqual([]);
    await request.locator('[data-consent-reject]').click();
    expect(await consentChoice(page)).toBe('rejected');
    await page.reload();
    await expect(page.locator('[data-consent-open]').first()).toBeVisible();
    await expect(request).toBeHidden();
    expect(requests).toEqual([]);
    expect(await measurementEvents()).toEqual([]);

    await openSettings(page);
    await settingsDialog(page).locator('[data-consent-accept]').click();
    expect(await consentChoice(page)).toBe('accepted');
    await expect.poll(() => requests.length).toBe(1);
    await expect.poll(async () => (await context.cookies()).map((cookie) => cookie.name))
      .toContain('harbor_health_ga_HARBORQA');
    await openSettings(page);
    await settingsDialog(page).locator('[data-consent-accept]').click();
    const events = await measurementEvents();
    expect(events.filter((event) => event.event === 'page_view')).toEqual([
      { event: 'page_view', page_id: 'health.people', page_path: '/en/', language: 'en', utm_source: 'google' },
    ]);
    expect(JSON.stringify(events)).not.toContain('unlisted-fixture');
    expect(JSON.stringify(events)).not.toContain('private-fixture');
    expect(requests).toHaveLength(1);
    await context.addCookies([{ name: 'session_token', value: 'preserve', url: page.url() }]);

    await page.goto('/en/cookies/');
    await openSettings(page);
    expect(requests).toHaveLength(1);
    await expect(settingsDialog(page).locator('[data-consent-status="accepted"]')).toBeVisible();
    await settingsDialog(page).locator('[data-consent-reject]').click();
    expect(await consentChoice(page)).toBe('rejected');
    const cookieNames = (await context.cookies()).map((cookie) => cookie.name);
    expect(cookieNames).toContain('session_token');
    expect(cookieNames).not.toContain('harbor_health_ga');
    expect(cookieNames).not.toContain('harbor_health_ga_HARBORQA');

    await page.goto('/en/');
    await expect(page.locator('[data-consent-open]').first()).toBeVisible();
    await expect(request).toBeHidden();
    await openSettings(page);
    await expect(settingsDialog(page).locator('[data-consent-status="rejected"]')).toBeVisible();
    expect(requests).toHaveLength(1);
  });

  test('withdrawal in another tab stops the already loaded tag', async ({ page, context }) => {
    const requests = await mockGoogleTag(context);
    await page.goto('/en/');
    await page.locator('[data-consent-request] [data-consent-accept]').click();
    const tag = page.locator('script[src*="googletagmanager.com/gtag/js"]');
    await expect(tag).toHaveCount(1);
    await expect.poll(() => requests.length).toBe(1);

    const settings = await context.newPage();
    await settings.goto('/en/cookies/');
    await openSettings(settings);
    const reloaded = page.waitForEvent('framenavigated', (frame) => frame === page.mainFrame());
    await settingsDialog(settings).locator('[data-consent-reject]').click();
    await reloaded;
    await expect(tag).toHaveCount(0);
    await expect(page.locator('[data-consent-open]').first()).toBeVisible();
    expect(await consentChoice(page)).toBe('rejected');
    expect((await context.cookies()).map((cookie) => cookie.name)).not.toContain('harbor_health_ga');
    expect(requests).toHaveLength(1);
  });

  for (const signal of ['gpc', 'dnt'] as const) {
    test(`an existing grant cannot start measurement when ${signal.toUpperCase()} is enabled`, async ({ page, context }) => {
      const requests = await mockGoogleTag(context);
      await context.addInitScript(({ signal, consentKey, provider }) => {
        const property = signal === 'gpc' ? 'globalPrivacyControl' : 'doNotTrack';
        Object.defineProperty(navigator, property, { value: signal === 'gpc' ? true : '1' });
        localStorage.setItem(consentKey, JSON.stringify({ version: 1, choice: 'accepted', at: Date.now(), provider }));
      }, { signal, consentKey, provider: testMeasurementProvider });

      await page.goto('/en/');
      await expect(page.locator('[data-consent-request]')).toBeHidden();
      await openSettings(page);
      const dialog = settingsDialog(page);
      await expect(dialog.locator('[data-privacy-signal]')).toBeVisible();
      await expect(dialog.locator('[data-consent-accept]:enabled')).toBeHidden();
      expect(requests).toEqual([]);
    });
  }

  test('an expired grant prompts again without starting measurement', async ({ page, context }) => {
    const requests = await mockGoogleTag(context);
    await context.addInitScript(({ key, provider }) => {
      const at = Date.now() - (181 * 86400000);
      localStorage.setItem(key, JSON.stringify({ version: 1, choice: 'accepted', at, provider }));
    }, { key: consentKey, provider: testMeasurementProvider });
    await page.goto('/en/');
    await expect(page.locator('[data-consent-request]')).toBeVisible();
    expect(requests).toEqual([]);
  });

  test('a grant for a different provider configuration does not activate GA4', async ({ page, context }) => {
    const requests = await mockGoogleTag(context);
    await context.addInitScript((key) => {
      localStorage.setItem(key, JSON.stringify({
        version: 1, choice: 'accepted', at: Date.now(), provider: 'ga4:G-PREVIOUS',
      }));
    }, consentKey);
    await page.goto('/en/');
    await expect(page.locator('[data-consent-request]')).toBeVisible();
    expect(requests).toEqual([]);
  });
});
