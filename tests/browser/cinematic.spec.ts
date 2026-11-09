import { test, expect } from '@playwright/test';

for (const width of [390, 768, 1024, 1440]) {
  test(`hero original y resto del rediseño conservado a ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/es/');
    const hero = page.locator('#hero');
    const film = hero.locator('[data-editorial-video]');
    const box = await film.boundingBox();
    expect(box!.width / box!.height).toBeCloseTo(16 / 9, 2);
    await expect(film.locator('video')).toHaveCSS('object-fit', 'contain');
    await expect(film).toHaveClass(/hw-hero-media/);
    await expect(film.locator('video')).toHaveAttribute('data-video-src', '/videos/harbor-line-visual.mp4');
    await expect(hero.locator('.hw-hero-gallery, .hw-hero-intro, [data-photo-frame]')).toHaveCount(0);
    const copyBox = await hero.locator('[data-hero-copy]').boundingBox();
    if (width < 1000) {
      expect(box!.y).toBeGreaterThanOrEqual(copyBox!.y + copyBox!.height);
    } else {
      await expect(hero.locator('.hw-hero-container')).toHaveCSS('position', 'absolute');
      expect(copyBox!.y).toBeGreaterThanOrEqual(box!.y);
      expect(copyBox!.y + copyBox!.height).toBeLessThanOrEqual(box!.y + box!.height);
    }
    await expect(page.locator('.hw-knowledge-visual [data-photo-frame]')).toBeVisible();
    const firstAnswer = page.locator('.hw-faq-answers details').first();
    await expect(firstAnswer).toHaveAttribute('open', '');
    await expect(firstAnswer.locator('p')).toBeVisible();
    const nextAnswer = page.locator('.hw-faq-answers details').nth(1);
    await nextAnswer.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(nextAnswer.locator('p')).toBeVisible();
    for (const link of await page.locator('.sc-explore-link').all()) {
      const bounds = await link.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    }
  });
}
