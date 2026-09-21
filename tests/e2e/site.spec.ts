import { expect, test } from '@playwright/test';

async function collectErrors(page: import('@playwright/test').Page) {
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('response', (res) => {
    if (res.status() >= 400) failedRequests.push(`${res.status()} ${res.url()}`);
  });
  return { consoleErrors, failedRequests };
}

test('homepage: loads without errors or broken links', async ({ page }) => {
  const { consoleErrors, failedRequests } = await collectErrors(page);
  await page.goto('/');
  await expect(page).toHaveTitle(/.+/);
  await expect(page.locator('main').first()).toBeVisible();
  await expect(page.getByRole('navigation').first().getByRole('link', { name: 'Événements' })).toBeVisible();

  expect(consoleErrors, 'console errors: ' + consoleErrors.join(' | ')).toEqual([]);
  expect(failedRequests, 'failed requests: ' + failedRequests.join(' | ')).toEqual([]);
});

test('navigation: go to the Événements page from the menu', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Événements', exact: true }).first().click();
  await expect(page).toHaveURL(/\/evenements/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('evenements page: tabs filter by category', async ({ page }) => {
  await page.goto('/evenements');

  const allTab = page.getByRole('tab', { name: 'Tous', exact: true });
  const competitionTab = page.getByRole('tab', { name: 'Compétitions', exact: true });
  const stageTab = page.getByRole('tab', { name: 'Stages', exact: true });
  const gradeTab = page.getByRole('tab', { name: 'Grades', exact: true });

  const allPanel = page.locator('[data-panel="all"]');
  const competitionPanel = page.locator('[data-panel="competition"]');
  const stagePanel = page.locator('[data-panel="stage"]');
  const gradePanel = page.locator('[data-panel="grade"]');

  await expect(allTab).toHaveAttribute('aria-selected', 'true');
  await expect(allPanel).toBeVisible();
  await expect(competitionPanel).toBeHidden();
  await expect(stagePanel).toBeHidden();
  await expect(gradePanel).toBeHidden();

  await competitionTab.click();
  await expect(competitionTab).toHaveAttribute('aria-selected', 'true');
  await expect(allTab).toHaveAttribute('aria-selected', 'false');
  await expect(competitionPanel).toBeVisible();
  await expect(allPanel).toBeHidden();

  await stageTab.click();
  await expect(stageTab).toHaveAttribute('aria-selected', 'true');
  await expect(competitionTab).toHaveAttribute('aria-selected', 'false');
  await expect(stagePanel).toBeVisible();
  await expect(competitionPanel).toBeHidden();

  await gradeTab.click();
  await expect(gradeTab).toHaveAttribute('aria-selected', 'true');
  await expect(stageTab).toHaveAttribute('aria-selected', 'false');
  await expect(gradePanel).toBeVisible();
  await expect(stagePanel).toBeHidden();
});

test('homepage: shows the upcoming events section when content provides upcoming events', async ({ page }) => {
  await page.goto('/');
  const eventsLink = page.getByRole('link', { name: /Voir tous les événements/ });
  if (await eventsLink.count()) {
    await expect(eventsLink).toBeVisible();
    await expect(page.getByRole('heading', { name: /Prochains rendez-vous/ })).toBeVisible();
  }
});

test('photos page: lightbox opens and closes', async ({ page }) => {
  await page.goto('/photos');
  const photos = page.locator('.photo-item');
  await expect(photos.first()).toBeVisible();

  await photos.first().click();
  const lightbox = page.locator('#lightbox');
  await expect(lightbox).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(lightbox).toBeHidden();
});

test('mobile menu: opens on click', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const menu = page.locator('#mobile-menu');
  await expect(menu).toBeHidden();
  await page.locator('#mobile-menu-btn').click();
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('link', { name: 'Photos' })).toBeVisible();
});
