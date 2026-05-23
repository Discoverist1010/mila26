import { expect, test } from '@playwright/test';

test('guided beta journey creates requirements and exposes Engineering Brief action', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('KangLe AI')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'MILA Income Fund / Tokenized Income Fund' })).toBeVisible();
  await expect(page.getByLabel('Project navigation')).toBeVisible();
  await expect(page.getByLabel('Project status')).toBeVisible();
  await expect(page.getByLabel('Project safety badges').getByText(/Ethereum testnet only/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Locked for MVP' })).toBeVisible();
  await expect(page.getByLabel('Top stage progress').getByText('Setup / Explore')).toBeVisible();
  await expect(page.getByLabel('Current-stage activities').getByText('Goal intake')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Goal Copilot and Requirement Brief draft preview' })).toBeVisible();
  await expect(page.getByTestId('engineer-answer')).toContainText('Requirement Brief');
  await expect(page.getByText(/Local preview shown until a backend response is available/i)).toBeVisible();
  await expect(page.getByTestId('smart-contract-control')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Smart Contract Control Panel' })).toBeVisible();
  await expect(page.getByText('NAV Updated')).toBeVisible();
  await expect(page.getByText('Distribution Recorded')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Trigger Event' }).first()).toBeVisible();

  const cockpitBox = await page.getByLabel('mila26-cockpit2 workspace').boundingBox();
  const controlBox = await page.getByTestId('smart-contract-control').boundingBox();
  expect(controlBox?.y).toBeGreaterThan((cockpitBox?.y ?? 0) + 200);

  const askButtonBox = await page.getByRole('button', { name: /Ask Blockchain Engineer/i }).boundingBox();
  expect(askButtonBox?.height).toBeLessThan(80);

  await page.getByRole('button', { name: /Create Requirement Brief/i }).click();
  await expect(page.getByTestId('requirement-brief')).toContainText('MILA Income Fund');
  await expect(page.getByText(/Asset \/ fund profile/i)).toBeVisible();
  await expect(page.getByText(/Deployment boundary/i)).toBeVisible();
  await expect(page.getByText(/Ready to generate the Engineering Brief artifact/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Generate Engineering Brief/i })).toBeVisible();
});

test('dashboard shell remains usable on a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await page.goto('/');

  await expect(page.getByText('KangLe AI')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'MILA Income Fund / Tokenized Income Fund' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Goal Copilot and Requirement Brief draft preview' })).toBeVisible();
  await expect(page.getByLabel('Project status')).toBeVisible();
  await expect(page.getByRole('button', { name: /Ask Blockchain Engineer/i })).toBeVisible();

  const askButtonBox = await page.getByRole('button', { name: /Ask Blockchain Engineer/i }).boundingBox();
  expect(askButtonBox?.height).toBeLessThan(80);
});
