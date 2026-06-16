import { expect, test } from '@playwright/test';

test('website presents the mockup-based company page and beta request form', async ({ page }) => {
  await page.goto('/site');

  const homeLink = page.getByLabel('ZiLiOS home');
  await expect(homeLink).toBeVisible();
  await expect(homeLink.locator('img')).toBeVisible();

  await expect(
    page.getByRole('heading', {
      name: 'Tokenise an investment product without building the full technical and ops teams first.',
    }),
  ).toBeVisible();
  await expect(page.getByText('AI structures the work')).toBeVisible();
  await expect(page.getByText('No backend private-key custody')).toBeVisible();

  const company = page.getByLabel('Company positioning');
  await expect(company).toContainText(
    'Infrastructure for tokenised investment products, from workflow design to testnet deployment.',
  );
  await expect(company).toContainText(
    'ZiLiOS is for builders who want to move tokenised finance forward responsibly',
  );

  await expect(page.getByLabel('User outcome')).toContainText(
    'Less uncertainty between product idea and technical proof',
  );
  await expect(page.getByLabel('User outcome')).toContainText(
    'Test a tokenisation idea before depending on broader teams or external developers.',
  );
  await expect(page.getByLabel('Operating model')).toContainText(
    'AI, blockchain, and post-trade operations stay connected',
  );
  await expect(page.getByLabel('Product overview')).toContainText(
    'One workspace across the tokenised product lifecycle',
  );

  await expect(page.getByTestId('zilios-spine-marker-01')).toHaveAttribute('data-active', 'true');
  await page.locator('#operating-model').scrollIntoViewIfNeeded();
  await expect(page.getByTestId('zilios-spine-marker-02')).toHaveAttribute('data-active', 'true');
  await page.locator('#product').scrollIntoViewIfNeeded();
  await expect(page.getByTestId('zilios-spine-marker-03')).toHaveAttribute('data-active', 'true');
  const spineFillHeight = await page.getByTestId('zilios-spine-fill').evaluate((element) =>
    Number.parseFloat(window.getComputedStyle(element).height),
  );
  expect(spineFillHeight).toBeGreaterThan(0);

  await page.getByRole('heading', {
    name: 'Tokenise an investment product without building the full technical and ops teams first.',
  }).scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Request beta access' }).click();
  const dialog = page.getByRole('dialog', { name: 'Request beta access' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel('Name')).toBeVisible();
  await expect(dialog.getByLabel('Email')).toBeVisible();
  await expect(dialog.getByLabel('Domain expertise')).toBeVisible();

  await dialog.getByLabel('Domain expertise').selectOption('other');
  await expect(dialog.getByRole('textbox', { name: 'Please specify' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Close beta request form' }).click();
  await expect(dialog).toBeHidden();

  await expect(page.getByText(/Short positioning options/i)).toHaveCount(0);
  await expect(page.getByText(/Track 15|Track 16|15B|15C/i)).toHaveCount(0);
  await expect(page.getByText(/production ready|mainnet ready|audit passed|investment advice/i)).toHaveCount(0);
});
