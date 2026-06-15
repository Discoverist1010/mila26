import { expect, test } from '@playwright/test';

test('website exposes company, product, access, and contact information without becoming app state', async ({ page }) => {
  await page.goto('/site');

  await expect(page.getByLabel('ZiLiOS website navigation')).toContainText('Product');
  await expect(page.getByLabel('Company positioning')).toContainText(
    'Infrastructure for tokenised investment products, from workflow design to testnet deployment.',
  );
  const companyCopy = page.getByLabel('Company positioning').locator('.website-company-copy p');
  await expect(companyCopy.nth(0)).toContainText(
    'ZilIOS is for builders who want to move tokenised finance forward responsibly.',
  );
  await expect(companyCopy.nth(1)).toContainText(
    'We seek to help create new growth path, and facilitate the launch and adoption of tokenised products with AI-guided structuring, blockchain-informed workflows, and post-trade domain expertise.',
  );

  const workspaceMode = page.getByLabel('Workspace mode preview');
  await expect(workspaceMode).toContainText('From product intent to a reviewable Sepolia operation path');
  await expect(workspaceMode.getByRole('button', { name: /Define the product/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(workspaceMode.getByRole('article')).toContainText('Capture product type, investor limits');
  await workspaceMode.getByRole('button', { name: /Turn rules into artifacts/ }).click();
  await expect(workspaceMode.getByRole('button', { name: /Turn rules into artifacts/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(workspaceMode.getByRole('article')).toContainText(
    'Generate requirement, engineering, contract, check, and evidence surfaces from approved parameters instead of scattered notes.',
  );
  await workspaceMode.getByRole('button', { name: /Prove the Sepolia path/ }).click();
  await expect(workspaceMode.getByRole('article')).toContainText('Use wallet-signed deployment, NAV, whitelist');

  await expect(page.getByLabel('Workflow path')).toContainText('From product intent to a reviewable Sepolia operation path');
  await expect(page.getByLabel('Workflow path')).toContainText('Prove the Sepolia path');
  await expect(page.getByLabel('Trust path visual')).toContainText('Evidence labels');
  await expect(page.getByLabel('Trust path visual')).toContainText(
    'No mainnet, custody, audit, legal, KYC, or investment-advice claim is made by the MVP.',
  );
  await expect(page.getByLabel('MVP status and boundaries')).toContainText('Working MVP');
  await expect(page.getByLabel('MVP status and boundaries')).toContainText('Still gated');
  await expect(page.getByLabel('Access path')).toContainText('The website does not store lifecycle data');

  const contact = page.getByLabel('Contact and beta interest');
  await expect(contact).toContainText('Request a beta conversation without sending sensitive documents');
  await expect(contact.getByLabel('User type')).toBeVisible();
  await expect(contact.getByLabel('Organisation')).toBeVisible();
  await expect(contact.getByLabel('Work email')).toBeVisible();
  await expect(contact.getByLabel('Product interest')).toBeVisible();
  await expect(contact.getByRole('button', { name: 'Send beta interest' })).toBeVisible();
  await expect(contact).toContainText('no website database or lifecycle workspace record is created');

  await expect(page.getByText(/Track 15|Track 16|15B|15C/i)).toHaveCount(0);
  await expect(page.getByText(/production ready|mainnet ready|audit passed|investment advice/i)).toHaveCount(0);
});
