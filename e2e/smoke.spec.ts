import { expect, test, type Page } from '@playwright/test';
import { expectNoA11yViolations } from './fixtures/axe';

const html = (page: Page) => page.locator('html');
const DARK = /\bdark\b/;

/** The toggle lives in the sidebar (desktop) and the top bar (mobile); use whichever is visible. */
async function chooseTheme(page: Page, label: 'Light' | 'Dark' | 'System') {
  await page.getByTitle(label, { exact: true }).filter({ visible: true }).click();
  await expect(page.getByRole('radio', { name: label })).toBeChecked();
}

test.describe('smoke', () => {
  test('home renders and is accessible in light and dark', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
    await expect(page).toHaveTitle('Dashboard · Money Tracker');
    await expectNoA11yViolations(page);

    await chooseTheme(page, 'Dark');
    await expect(html(page)).toHaveClass(DARK);
    await expectNoA11yViolations(page);
  });

  test('dark/light choice persists after reload', async ({ page }) => {
    await page.goto('/');
    await chooseTheme(page, 'Dark');
    await page.reload();
    await expect(html(page)).toHaveClass(DARK);
    await expect(page.getByRole('radio', { name: 'Dark' })).toBeChecked();

    await chooseTheme(page, 'Light');
    await page.reload();
    await expect(html(page)).not.toHaveClass(DARK);
  });
});

test.describe('system theme', () => {
  test.use({ colorScheme: 'dark' });

  test('follows the OS color scheme by default', async ({ page }) => {
    await page.goto('/');
    await expect(html(page)).toHaveClass(DARK);
    await expect(page.getByRole('radio', { name: 'System' })).toBeChecked();
  });
});

test('applies the stored theme before the app bundle runs (no flash)', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'money-tracker:theme',
      JSON.stringify({ state: { preference: 'dark' }, version: 1 }),
    );
  });
  await page.route('**/assets/*.js', (route) => route.abort());
  await page.goto('/');
  await expect(html(page)).toHaveClass(DARK);
});
