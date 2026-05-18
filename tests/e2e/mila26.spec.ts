import { expect, test } from '@playwright/test';

test('guided beta journey creates requirements and runs agents', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /CTO team/i })).toBeVisible();
  await expect(page.getByTestId('engineer-answer')).toContainText('Requirement Brief');

  await page.getByRole('button', { name: /Create Requirement Brief/i }).click();
  await expect(page.getByTestId('requirement-brief')).toContainText('MILA Income Fund');

  await page.getByRole('button', { name: /Approve Brief and Run Coding Bot/i }).click();
  await expect(page.getByTestId('agent-results')).toContainText('contract_worker');
  await expect(page.getByText(/Approved for beta artifact release/i)).toBeVisible();
  await expect(page.getByText(/MILA26 Evidence Pack/i)).toBeVisible();
});
