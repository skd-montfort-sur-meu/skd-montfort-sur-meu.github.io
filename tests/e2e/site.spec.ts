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
  await expect(page).toHaveTitle(/Shotokan Karaté-dō Montfort/);
  await expect(page.locator('h1, .text-2xl').first()).toContainText('Shotokan');
  await expect(page.getByRole('navigation').first().getByRole('link', { name: 'Événements' })).toBeVisible();

  expect(consoleErrors, 'console errors: ' + consoleErrors.join(' | ')).toEqual([]);
  expect(failedRequests, 'failed requests: ' + failedRequests.join(' | ')).toEqual([]);
});

test('navigation: go to the Événements page from the menu', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Événements', exact: true }).first().click();
  await expect(page).toHaveURL(/\/evenements/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('rendez-vous');
});

test('evenements page: tabs filter by category', async ({ page }) => {
  await page.goto('/evenements');
  const stageCard = page.getByRole('heading', { name: /Stage départemental Multi-Disciplines/ });
  const competitionCard = page.getByRole('heading', { name: 'Championnat départemental', exact: true });
  const gradeCard = page.getByRole('heading', { name: /Examen de grades/ });
  await expect(stageCard).toBeVisible();
  await expect(competitionCard).toBeVisible();
  await expect(gradeCard).toBeVisible();

  await page.getByRole('tab', { name: 'Compétitions', exact: true }).click();
  await expect(stageCard).toBeHidden();
  await expect(competitionCard).toBeVisible();
  await expect(gradeCard).toBeHidden();

  await page.getByRole('tab', { name: 'Stages', exact: true }).click();
  await expect(stageCard).toBeVisible();
  await expect(competitionCard).toBeHidden();
  await expect(gradeCard).toBeHidden();

  await page.getByRole('tab', { name: 'Grades', exact: true }).click();
  await expect(stageCard).toBeHidden();
  await expect(competitionCard).toBeHidden();
  await expect(gradeCard).toBeVisible();
});

test('homepage: previews the upcoming stage', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Prochains rendez-vous/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Stage départemental Multi-Disciplines/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Voir tous les événements/ })).toBeVisible();
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