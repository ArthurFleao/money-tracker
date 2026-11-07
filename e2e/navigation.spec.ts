import { expect, test } from '@playwright/test';
import { expectNoA11yViolations } from './fixtures/axe';

const ROUTES = [
  { link: 'Wallets', path: '/wallets', heading: 'Wallets' },
  { link: 'Transactions', path: '/transactions', heading: 'Transactions' },
  { link: 'Recurring', path: '/recurring', heading: 'Recurring' },
  { link: 'Plan ahead', path: '/forecast', heading: 'Plan ahead' },
  { link: 'Settings', path: '/settings', heading: 'Settings' },
  { link: 'Dashboard', path: '/', heading: 'Dashboard' },
] as const;

test.describe('desktop navigation', () => {
  test.skip(({ isMobile }) => isMobile, 'sidebar is desktop-only');

  test('sidebar reaches every screen, each accessible', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.getByRole('navigation', { name: 'Primary' });
    await expect(sidebar).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeHidden();

    for (const route of ROUTES) {
      await sidebar.getByRole('link', { name: route.link }).click();
      await expect(page).toHaveURL(route.path);
      await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible();
      await expect(page).toHaveTitle(`${route.heading} · Money Tracker`);
      await expect(sidebar.getByRole('link', { name: route.link })).toHaveAttribute(
        'aria-current',
        'page',
      );
      await expectNoA11yViolations(page);
    }
  });

  test('skip link moves focus to the main content', async ({ page, browserName }) => {
    await page.goto('/');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    if (browserName === 'webkit') {
      // Safari tabs to links only with "Press Tab to highlight each item" enabled; tab order is covered by Chromium.
      await skip.focus();
    } else {
      await page.keyboard.press('Tab');
    }
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
  });
});

test.describe('mobile navigation', () => {
  test.skip(({ isMobile }) => !isMobile, 'bottom bar is mobile-only');

  test('bottom bar, quick add and settings', async ({ page }) => {
    await page.goto('/');
    const tabs = page.getByRole('navigation', { name: 'Main' });
    await expect(tabs).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeHidden();

    await tabs.getByRole('link', { name: 'Transactions' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Transactions' })).toBeVisible();

    await tabs.getByRole('link', { name: 'Plan ahead' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Plan ahead' })).toBeVisible();

    await tabs.getByRole('button', { name: 'Quick add' }).click();
    await expect(page.getByText('Quick add is coming soon.')).toBeVisible();

    await page.getByRole('banner').getByRole('link', { name: 'Settings' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();
    await expectNoA11yViolations(page);
  });
});

test.describe('routing', () => {
  test('deep links load directly', async ({ page }) => {
    await page.goto('/recurring');
    await expect(page.getByRole('heading', { level: 1, name: 'Recurring' })).toBeVisible();
  });

  test('unknown paths show a not-found page inside the shell', async ({ page }) => {
    await page.goto('/nope');
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test('onboarding renders without the shell', async ({ page }) => {
    await page.goto('/welcome');
    await expect(page.getByRole('heading', { level: 1, name: 'Welcome' })).toBeVisible();
    await expect(page.getByRole('navigation')).toHaveCount(0);
    await expectNoA11yViolations(page);
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('navigation still works with animations reduced', async ({ page }) => {
    await page.goto('/wallets');
    await expect(page.getByRole('heading', { level: 1, name: 'Wallets' })).toBeVisible();
    await page.getByRole('link', { name: 'Plan ahead' }).filter({ visible: true }).first().click();
    await expect(page.getByRole('heading', { level: 1, name: 'Plan ahead' })).toBeVisible();
  });
});
