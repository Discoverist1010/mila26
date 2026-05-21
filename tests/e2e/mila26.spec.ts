import { expect, test } from '@playwright/test';

test('guided beta journey creates requirements and runs agents', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('KangLe AI')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tokenized Income Fund' })).toBeVisible();
  await expect(page.getByLabel('Project navigation')).toBeVisible();
  await expect(page.getByLabel('Project status and assistant')).toBeVisible();
  await expect(page.getByText(/Ethereum testnet only/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Locked for MVP' })).toBeVisible();
  await expect(page.getByTestId('engineer-answer')).toContainText('Requirement Brief');
  await expect(page.getByText(/Local preview shown until a backend response is available/i)).toBeVisible();

  const askButtonBox = await page.getByRole('button', { name: /Ask Blockchain Engineer/i }).boundingBox();
  expect(askButtonBox?.height).toBeLessThan(80);

  await page.getByRole('button', { name: /Create Requirement Brief/i }).click();
  await expect(page.getByTestId('requirement-brief')).toContainText('MILA Income Fund');

  await page.getByRole('button', { name: /Approve Brief and Run Coding Bot/i }).click();
  await expect(page.getByTestId('agent-results')).toContainText('contract_worker');
  await expect(page.getByText(/Approved for beta artifact release/i)).toBeVisible();
  await expect(page.getByText(/MILA26 Evidence Pack/i)).toBeVisible();
});
