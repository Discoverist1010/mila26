import { expect, test } from '@playwright/test';

test('website exposes company, product, access, and contact information without becoming app state', async ({ page }) => {
  await page.goto('/site');

  await expect(page.getByLabel('ZiLiOS website navigation')).toContainText('Product');
  await expect(page.getByLabel('Company positioning')).toContainText(
    'Purpose-built infrastructure for the next generation of tokenised investment products.',
  );
  await expect(page.getByLabel('Company positioning')).toContainText(
    'ZilIOS believes tokenised investment products should be easier to create, test, and launch responsibly.',
  );
  await expect(page.getByLabel('Workflow path')).toContainText('From product intent to a reviewable Sepolia operation path');
  await expect(page.getByLabel('Workflow path')).toContainText('Prove the Sepolia path');
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
