import { expect, test } from '@playwright/test';

test('Product Setup and Contract Ops expose a traceable Sepolia mock-readiness workflow', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('Tokenisation lifecycle tabs').getByRole('button', { name: /Product Setup/ }).click();
  await expect(page.getByLabel('Product Setup workspace')).toContainText('Product setup');
  await expect(page.getByLabel('Product Setup PRD artifact')).toContainText('What is this product');
  await expect(page.getByLabel('Product Setup Pack')).toContainText('Product Setup Pack');

  await page.getByLabel('Tokenisation lifecycle tabs').getByRole('button', { name: /Contract Ops/ }).click();
  const contractOps = page.getByLabel('Contract Ops workspace');
  await expect(contractOps).toBeVisible();
  await expect(contractOps.getByRole('heading', { name: 'Contract Ops' })).toBeVisible();
  await expect(page.getByLabel('Contract Ops launch readiness')).toBeVisible();

  for (const label of [
    'Product Setup snapshot',
    'ERC protocol recommendation',
    'Smart Contract Specs',
    'Features & Events Mapping',
    'Deployment Readiness',
    'Deploy to Sepolia',
    'Deployment Evidence',
    'Post-deployment operations',
  ]) {
    await expect(contractOps.getByText(label).first()).toBeVisible();
  }

  await expect(contractOps.locator('[data-action-id="select-protocol-erc20"]')).toBeVisible();
  await expect(contractOps.locator('[data-action-id="select-protocol-custom-erc20"]')).toBeVisible();
  await expect(contractOps.locator('[data-action-id="select-protocol-erc3643"]')).toBeVisible();
  await expect(contractOps.locator('[data-action-id="select-protocol-erc4626"]')).toBeVisible();
  await expect(contractOps.locator('[data-action-id="select-protocol-erc1400-disabled"]')).toBeDisabled();
  await expect(contractOps.locator('[data-action-id="select-protocol-erc7683-disabled"]')).toBeDisabled();

  await contractOps.locator('[data-action-id="select-protocol-erc20"]').click();
  await contractOps.locator('[data-action-id="confirm-contract-specs"]').click();
  await contractOps.locator('[data-action-id="filter-deployment-critical-features"]').click();
  await contractOps.locator('[data-action-id="confirm-feature-event-mapping"]').click();

  await contractOps.getByLabel('Admin wallet').fill('0x123');
  await contractOps.locator('[data-action-id="add-admin-wallet"]').click();
  await expect(contractOps).toContainText('Enter a public EVM wallet address');

  await contractOps.getByLabel('Admin wallet').fill('apple banana cherry dragon eagle forest garden hotel island jungle kite lemon');
  await contractOps.locator('[data-action-id="add-admin-wallet"]').click();
  await expect(contractOps).toContainText('Do not paste private keys, seed phrases, or recovery phrases');

  await contractOps.getByLabel('Admin wallet').fill('0x1111111111111111111111111111111111111111');
  await contractOps.locator('[data-action-id="add-admin-wallet"]').click();
  await expect(contractOps).toContainText('Admin wallet saved as a public wallet address');

  await expect(contractOps.locator('[data-action-id="deploy_to_sepolia"]')).toBeDisabled();
  await expect(page.getByLabel('Contract Ops launch readiness')).toContainText('Connect a wallet on Sepolia');

  await contractOps.getByText('Action Trace').click();
  const actionTrace = page.getByLabel('Contract Ops action trace');
  for (const actionId of [
    'select-protocol-erc20',
    'confirm-contract-specs',
    'filter-deployment-critical-features',
    'confirm-feature-event-mapping',
    'add-admin-wallet',
  ]) {
    await expect(actionTrace).toContainText(actionId);
  }
});
