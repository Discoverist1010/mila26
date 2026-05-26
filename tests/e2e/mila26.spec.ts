import { expect, test } from '@playwright/test';

test('guided beta journey creates requirements and exposes Engineering Brief action', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('KangLe AI')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'MILA Income Fund / Tokenized Income Fund' })).toBeVisible();
  await expect(page.getByLabel('Project navigation')).toBeVisible();
  await expect(page.getByLabel('Project status')).toBeVisible();
  await expect(page.getByLabel('Project safety badges').getByText(/Ethereum testnet only/i)).toBeVisible();
  await expect(page.getByLabel('Project status').getByRole('heading', { name: 'Requirement Brief pending' })).toBeVisible();
  await expect(page.getByText('Closure readiness pending')).toBeVisible();
  await expect(page.getByLabel('Top stage progress').getByText('Setup / Explore')).toBeVisible();
  await expect(page.getByLabel('Current-stage activities').getByText('Goal intake')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Engineering Bot decision workspace' })).toBeVisible();
  await expect(page.getByLabel('Engineering Bot workspace')).toBeVisible();
  await expect(page.getByLabel('Engineering Bot actions').getByRole('button', { name: 'Create Requirement Doc' })).toBeVisible();
  await expect(page.getByText('Recommendation')).toHaveCount(0);
  await expect(page.getByText('I am ready to create the Requirement Brief.')).toHaveCount(0);
  await expect(page.getByLabel('Brief Preview')).toContainText('Business objective');
  await expect(page.getByLabel('Brief Preview')).toContainText('Token model');
  await page.getByRole('button', { name: 'Expand Brief Preview' }).click();
  await expect(page.getByLabel('Brief Preview')).toContainText('Open items');
  await expect(page.getByText('Engineering Bot reply')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Engineering Bot MILA' })).toBeVisible();
  await expect(page.getByText('What I understand')).toHaveCount(0);
  await expect(page.getByText('Tokenisation goal')).toHaveCount(0);
  await expect(page.getByText('Press Enter to send, Shift+Enter for a new line.')).toBeVisible();
  await expect(page.getByTestId('engineer-answer')).toContainText('Requirement Brief');
  await expect(page.getByText(/Local preview shown until a backend response is available/i)).toBeVisible();

  await page.getByRole('button', { name: 'Hide left rail' }).click();
  await expect(page.getByLabel('Project navigation')).toBeHidden();
  await page.getByRole('button', { name: 'Show left rail' }).click();
  await expect(page.getByLabel('Project navigation')).toBeVisible();
  await page.getByRole('button', { name: 'Hide right rail' }).click();
  await expect(page.getByLabel('Project status')).toBeHidden();
  await page.getByRole('button', { name: 'Show right rail' }).click();
  await expect(page.getByLabel('Project status')).toBeVisible();

  await expect(page.getByTestId('smart-contract-control')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Smart Contract Control Panel' })).toBeVisible();
  await expect(page.getByTestId('smart-contract-control').getByText('Closure readiness', { exact: true })).toBeVisible();
  await expect(page.getByText('NAV Updated')).toBeVisible();
  await expect(page.getByText('Distribution Recorded')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Trigger Event' }).first()).toBeVisible();

  const cockpitBox = await page.getByLabel('mila26-cockpit2 workspace').boundingBox();
  const controlBox = await page.getByTestId('smart-contract-control').boundingBox();
  expect(controlBox?.y).toBeGreaterThan((cockpitBox?.y ?? 0) + 200);

  const askButtonBox = await page.getByRole('button', { name: 'Send' }).boundingBox();
  expect(askButtonBox?.height).toBeLessThan(80);

  await page.getByRole('button', { name: /Create Requirement Doc/i }).click();
  await expect(page.getByTestId('requirement-brief')).toContainText('Business objective');
  await expect(page.getByTestId('requirement-brief')).toContainText('Investor access');
  await expect(page.getByText(/Deployment boundary/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Generate Engineering Brief/i })).toBeVisible();
});

test('dashboard shell remains usable on a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await page.goto('/');

  await expect(page.getByText('KangLe AI')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'MILA Income Fund / Tokenized Income Fund' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Engineering Bot decision workspace' })).toBeVisible();
  await expect(page.getByLabel('Project status')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send' })).toBeVisible();

  const askButtonBox = await page.getByRole('button', { name: 'Send' }).boundingBox();
  expect(askButtonBox?.height).toBeLessThan(80);
});
