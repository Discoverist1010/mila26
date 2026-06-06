import { expect, test } from '@playwright/test';

test('guided beta journey creates requirements and exposes Engineering Brief action', async ({ page }) => {
  const engineeringBrief = {
    id: 'engineering-brief-e2e',
    generatedAtIso: '2026-05-22T00:00:00.000Z',
    sourceRequirementBriefId: 'brief-e2e',
    title: 'MILA Income Fund Engineering Brief',
    summary: 'Deterministic Engineering Brief summary.',
    projectContext: {
      projectName: 'MILA Income Fund',
      fundName: 'MILA Income Fund',
      tokenSymbol: 'MILA',
      jurisdiction: 'Singapore',
      targetInvestors: 'Accredited investors',
    },
    functionalRequirements: ['Capture tokenized fund requirements.', 'Confirm wallet whitelist requirements.'],
    nonFunctionalRequirements: ['Keep backend secrets out of frontend code.'],
    tokenDesign: {
      standardPreference: 'ERC-20',
      assumptions: ['Fungible portfolio shares are the MVP default.'],
      servicingModules: ['Fund Token Base'],
    },
    walletAndAccessModel: {
      whitelistRequired: true,
      assumptions: ['Investor wallets are whitelisted before distribution.'],
    },
    valuationAndPerformanceUpdates: {
      cadence: 'daily',
      assumptions: ['Valuations are uploaded off-chain.'],
    },
    complianceAndSecurityAssumptions: ['Engineering output is not legal advice.'],
    deploymentBoundary: {
      network: 'ethereum-testnet-only',
      noMainnetInMvp: true,
      signing: 'user-wallet-signs',
      backendCustody: 'backend-holds-no-private-keys',
      currentTarget: 'simulation-only',
      status: 'Deployment remains disabled for MVP.',
    },
    implementationPlan: ['Generate deterministic implementation artifacts after approval.'],
    testingAndQaPlan: ['Run contract and API tests before demo readiness.'],
    evidencePackPlan: ['Record source Requirement Brief and Engineering Brief IDs.'],
    openQuestions: [],
    risksAndControls: [
      {
        risk: 'Generated brief is mistaken for legal advice.',
        control: 'Mark output as engineering planning only.',
      },
    ],
    acceptanceCriteria: ['Engineering Brief preserves no mainnet deployment in MVP.'],
    metadata: {
      generator: 'deterministic-track-5b',
      mode: 'mock',
      llmUsed: false,
      productionAdvice: false,
    },
  };
  const smartContractArtifactSpec = {
    specId: 'smart-contract-artifact-spec-e2e',
    projectId: 'brief-e2e',
    projectName: 'MILA Income Fund',
    status: 'ready',
    tokenStandardProfile: {
      mila26RestrictionProfile: 'restricted_erc20',
    },
    eventModel: {
      customEvents: [
        'WalletWhitelisted',
        'AllocationMinted',
        'ValuationUpdated',
        'DistributionRecorded',
        'TransferRestrictionUpdated',
        'ContractPaused',
        'ContractUnpaused',
      ],
    },
  };

  await page.route('http://127.0.0.1:5174/api/prd/engineering-brief', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, data: engineeringBrief }),
    });
  });
  await page.route('http://127.0.0.1:5174/api/smart-contract/artifact-spec', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, data: smartContractArtifactSpec }),
    });
  });
  await page.route('http://127.0.0.1:5174/api/smart-contract/artifact', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        data: {
          artifactPackage: {
            artifactId: 'contract-artifact-smart-contract-artifact-spec-e2e',
            specId: smartContractArtifactSpec.specId,
            projectId: 'brief-e2e',
            projectName: 'MILA Income Fund',
            status: 'generated',
            sourceModel: {
              sourceFiles: [{ path: 'contracts/MILARestrictedIncomeFundToken.preview.sol' }],
            },
          },
          checkResult: {
            checkId: 'contract-check-smart-contract-artifact-spec-e2e',
            artifactId: 'contract-artifact-smart-contract-artifact-spec-e2e',
            specId: smartContractArtifactSpec.specId,
            status: 'passed',
            summary:
              'Deterministic spec-consistency/static-preview checking only. Not a production security audit, compiler result, deployment approval, wallet-signing proof, or legal/compliance opinion.',
          },
          evidenceLite: {
            evidenceId: 'evidence-lite-smart-contract-artifact-spec-e2e',
            artifactId: 'contract-artifact-smart-contract-artifact-spec-e2e',
            specId: smartContractArtifactSpec.specId,
            checkId: 'contract-check-smart-contract-artifact-spec-e2e',
            status: 'ready',
            evidenceItems: [{ id: 'evidence-spec-profile' }],
            eventEvidenceRefs: [{ eventName: 'ValuationUpdated' }],
          },
        },
      }),
    });
  });

  await page.goto('/');
  await expect(page.getByLabel('Project navigation').getByText('MILA26', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Alpha Income Fund I' })).toBeVisible();
  await expect(page.getByLabel('Project navigation')).toBeVisible();
  await expect(page.getByLabel('Project status')).toBeVisible();
  await expect(page.getByLabel('Workspace controls').getByText(/Sepolia Testnet/i)).toBeVisible();
  await expect(page.getByLabel('Project status').getByRole('heading', { name: 'All projects' })).toHaveCount(0);
  await expect(page.getByLabel('Project status').getByText('Safety boundary')).toHaveCount(0);
  await expect(page.getByText('Need help? Ask the Engineering Bot')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Alpha Income Fund I/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Singapore REIT Token/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Mixed Portfolio Token/i })).toBeVisible();
  await expect(page.getByTestId('smart-contract-control').getByText('SCP readiness', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Tokenisation lifecycle tabs')).toBeVisible();
  await expect(page.getByLabel('Top stage progress')).toHaveCount(0);
  await expect(page.getByLabel('Current-stage activities')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  await expect(page.getByLabel('Engineering Bot workspace')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create Requirement Doc' })).toBeVisible();
  await expect(page.getByText('Recommendation')).toHaveCount(0);
  await expect(page.getByText('I am ready to create the Requirement Brief.')).toHaveCount(0);
  await expect(page.getByLabel('Brief Preview')).toContainText('Business objective');
  await expect(page.getByLabel('Brief Preview')).toContainText('Token model');
  await expect(page.getByText('Next best action')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Engineering Bot MILA' })).toBeVisible();
  await expect(page.getByText('What I understand')).toHaveCount(0);
  await expect(page.getByText('Tokenisation goal')).toHaveCount(0);
  await expect(page.getByText('Lifecycle snapshot')).toBeVisible();
  await expect(page.getByTestId('engineer-answer')).toContainText('Requirement Brief');
  await expect(page.getByText(/Local preview shown until a backend response is available/i)).toBeVisible();

  await page.getByRole('button', { name: /Singapore REIT Token/i }).click();
  await expect(page.getByRole('heading', { name: 'Singapore REIT Token' }).first()).toBeVisible();
  await expect(page.getByLabel('Project status').getByText('Product Vault')).toBeVisible();

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
  await expect(page.getByTestId('smart-contract-control').getByText('SCP readiness', { exact: true })).toBeVisible();
  await expect(page.getByTestId('smart-contract-control').getByText('Preview only').first()).toBeVisible();
  await expect(page.getByText('NAV Updated')).toBeVisible();
  await expect(page.getByText('Distribution Recorded')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Trigger Event' }).first()).toBeVisible();

  const cockpitBox = await page.getByLabel('MILA26 tokenisation workspace').boundingBox();
  const controlBox = await page.getByTestId('smart-contract-control').boundingBox();
  expect(controlBox?.y).toBeGreaterThan((cockpitBox?.y ?? 0) + 200);

  const askButtonBox = await page.getByRole('button', { name: 'Send' }).boundingBox();
  expect(askButtonBox?.height).toBeLessThan(80);

  await page.getByRole('button', { name: /Create Requirement Doc/i }).click();
  await expect(page.getByTestId('requirement-brief')).toContainText('Business objective');
  await expect(page.getByTestId('requirement-brief')).toContainText('Investor access');
  await expect(page.getByRole('button', { name: /Generate Engineering Brief/i })).toBeVisible();
  await page.getByRole('button', { name: /Generate Engineering Brief/i }).click();
  await expect(page.getByRole('button', { name: 'Prepare Smart Contract Spec' })).toBeEnabled();
  await page.getByRole('button', { name: 'Prepare Smart Contract Spec' }).click();
  await expect(page.getByLabel('Generated smart contract artifacts')).toBeVisible();
  const generatedArtifacts = page.getByLabel('Generated smart contract artifacts');
  await expect(page.getByText('Smart contract preparation review')).toBeVisible();
  await expect(page.getByText('restricted_erc20 / ERC-20-compatible profile.')).toBeVisible();
  await expect(page.getByText('Preview only').first()).toBeVisible();
  await expect(page.getByText('Spec-consistency passed')).toBeVisible();
  await expect(page.getByText('Draft evidence linked')).toBeVisible();
  await expect(generatedArtifacts.getByText('Local Compile/Test', { exact: true })).toBeVisible();
  await expect(generatedArtifacts.getByText('Hardhat fixture compiles and local contract tests pass. Tested capabilities: ERC-20 basics, whitelist restrictions, issuer mint/allocation, valuation event, distribution event, pause/unpause, and access control.')).toBeVisible();
  await expect(generatedArtifacts.getByText('Deployment Gate Review', { exact: true })).toBeVisible();
  await expect(generatedArtifacts.getByText('Review-ready').first()).toBeVisible();
  await expect(generatedArtifacts.getByText('Pre-deployment readiness: Complete. Deployment execution: Blocked.')).toBeVisible();
  await expect(generatedArtifacts.getByText('Wallet Signing Intent', { exact: true })).toBeVisible();
  await expect(
    generatedArtifacts.getByText(
      'Wallet execution: Not implemented. User wallet signing required later. Backend never holds private keys.',
    ),
  ).toBeVisible();
  await expect(generatedArtifacts.getByText('Wallet Connection', { exact: true })).toBeVisible();
  await expect(generatedArtifacts.getByText('Not detected', { exact: true })).toBeVisible();
  await expect(generatedArtifacts.getByText('Wallet chain: Unknown. No wallet address. Connection only; no signing or deployment.')).toBeVisible();
  await expect(generatedArtifacts.getByText('Smart Contract Operations', { exact: true })).toBeVisible();
  await expect(generatedArtifacts.getByText('Locked', { exact: true })).toBeVisible();
  await expect(generatedArtifacts.getByText(/SCP exposes at most Record NAV Event and Whitelist Wallet after confirmed deployment evidence/i)).toBeVisible();
  await expect(generatedArtifacts.getByText('Sepolia Deployment', { exact: true })).toBeVisible();
  await expect(generatedArtifacts.getByText('Deployment execution not started')).toBeVisible();
  await expect(generatedArtifacts.getByText('No transaction hash. No contract address. Deployment state is local-session-only.')).toBeVisible();
  await expect(generatedArtifacts.getByText('Deployment Evidence', { exact: true })).toBeVisible();
  await expect(generatedArtifacts.getByText('Deployment Evidence: Not available')).toBeVisible();
  await expect(generatedArtifacts.getByText(/Evidence strength: None/)).toBeVisible();
  await expect(generatedArtifacts.getByText(/Transaction hash source: Absent/).first()).toBeVisible();
  await expect(generatedArtifacts.getByText(/Contract address source: Absent/).first()).toBeVisible();
  await expect(generatedArtifacts.getByText('Record NAV Operation', { exact: true })).toBeVisible();
  await expect(generatedArtifacts.getByText('Record NAV operation not started')).toBeVisible();
  await expect(generatedArtifacts.getByText('Not audited. No production approval. Wallet connection alone does not execute deployment. Smart Contract Operations remain locked.')).toBeVisible();
  await expect(page.getByTestId('engineer-answer')).toContainText('Smart contract preparation is complete for demo review');
  await expect(page.getByTestId('engineer-answer')).toContainText('known local compile/test foundation as passed');
  await expect(page.getByText('Backend artifacts generated.')).toBeVisible();
  const scp = page.getByTestId('smart-contract-control');
  await expect(scp.getByText('Artifact preview generated').first()).toBeVisible();
  await expect(scp.getByText('Smart Contract Spec: Generated')).toBeVisible();
  await expect(scp.getByText('Local compile/test foundation: Passed')).toBeVisible();
  await expect(scp.getByText('Solidity fixture: Compiles locally')).toBeVisible();
  await expect(scp.getByText('Contract tests: Passed locally')).toBeVisible();
  await expect(scp.getByText('Tested capabilities: ERC-20 basics, whitelist restrictions, issuer mint/allocation, valuation event, distribution event, pause/unpause, access control')).toBeVisible();
  await expect(scp.getByText('Deployment Gate Review: Review-ready').first()).toBeVisible();
  await expect(scp.getByText('Pre-deployment readiness: Complete').first()).toBeVisible();
  await expect(scp.getByText('Deployment execution: Blocked').first()).toBeVisible();
  await expect(scp.getByText('Wallet Signing Intent: Review-ready').first()).toBeVisible();
  await expect(scp.getByText('Wallet execution: Not implemented').first()).toBeVisible();
  await expect(scp.getByText('User wallet signing required later').first()).toBeVisible();
  await expect(scp.getByText('Backend never holds private keys').first()).toBeVisible();
  await expect(scp.getByText('Wallet connection: Not detected').first()).toBeVisible();
  await expect(scp.getByText('Wallet chain: Unknown').first()).toBeVisible();
  await expect(scp.getByText('No wallet address').first()).toBeVisible();
  await expect(scp.getByText('No signed payload').first()).toBeVisible();
  await expect(scp.getByText('No submitted transaction').first()).toBeVisible();
  await expect(scp.getByText('No confirmed transaction').first()).toBeVisible();
  await expect(scp.getByText('No contract address').first()).toBeVisible();
  await expect(scp.getByText('No transaction hash').first()).toBeVisible();
  await expect(scp.getByText('Deployment Evidence: Not available').first()).toBeVisible();
  await expect(scp.getByText('Evidence strength: None').first()).toBeVisible();
  await expect(scp.getByText('Evidence persistence: Local session only').first()).toBeVisible();
  await expect(scp.getByText('Transaction hash source: Absent').first()).toBeVisible();
  await expect(scp.getByText('Contract address source: Absent').first()).toBeVisible();
  await expect(scp.getByText('Smart Contract Operations: Locked until deployment evidence is confirmed').first()).toBeVisible();
  await expect(scp.getByText('Smart Contract Operations: Locked').first()).toBeVisible();
  await expect(scp.getByText('Reason: operation-specific authorization and evidence logging are not implemented').first()).toBeVisible();
  await expect(scp.getByText('Wallet signing not implemented: Not implemented')).toBeVisible();
  await expect(scp.getByText('User wallet signing required later: Required')).toBeVisible();
  await expect(scp.getByText('Wallet connection: Not detected').first()).toBeVisible();
  await expect(scp.getByText('Wallet address: Absent')).toBeVisible();
  await expect(scp.getByText('No signed payload: Absent')).toBeVisible();
  await expect(scp.getByText('No submitted transaction: Absent')).toBeVisible();
  await expect(scp.getByText('No confirmed transaction: Absent')).toBeVisible();
  await expect(scp.getByText('Contract address: No contract address', { exact: true })).toBeVisible();
  await expect(scp.getByText('Transaction hash: No transaction hash', { exact: true })).toBeVisible();
  await expect(scp.getByText('Deployment: Not started', { exact: true })).toBeVisible();
  await expect(scp.getByText('Wallet signing: Not started')).toBeVisible();
  await expect(scp.getByText('Audit: Not audited')).toBeVisible();
  await expect(scp.getByText('Ethereum testnet: Only')).toBeVisible();
  await expect(scp.getByText('Mainnet: Disabled')).toBeVisible();
  await expect(scp.getByText('Backend private keys: None held')).toBeVisible();
  await expect(scp.getByText('Transaction hash: No transaction hash', { exact: true })).toBeVisible();
  await expect(scp.getByRole('cell', { name: 'ValuationUpdated' })).toBeVisible();
  await expect(scp.getByText('ContractPaused')).toBeVisible();
  await expect(scp.getByText('ContractUnpaused')).toBeVisible();
  await expect(scp.getByText('No contract address - not deployed')).toBeVisible();
  await expect(page.getByText(/txHash/i)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Connect Wallet for Sepolia Check' })).toBeVisible();
  await expect(page.getByLabel('Project status').getByRole('button', { name: /wallet|sign/i })).toHaveCount(0);
  await expect(scp.getByRole('button', { name: /wallet|sign/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Review Deployment Gate/i })).toHaveCount(0);
  await expect(page.getByText(/ready to sign|sign now|ready to deploy|ready for signature|production ready|mainnet ready/i)).toHaveCount(0);
  await expect(page.getByText(/^Wallet connected$/i)).toHaveCount(0);
  await expect(page.getByText(/^Submitted transaction:/i)).toHaveCount(0);
  await expect(page.getByText(/^Confirmed transaction:/i)).toHaveCount(0);
  await expect(page.getByText(/^Signed payload:/i)).toHaveCount(0);
  await expect(page.getByText(/live|verified|audit passed|security approved/i)).toHaveCount(0);
});

test('dashboard shell remains usable on a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await page.goto('/');

  await expect(page.getByLabel('Project navigation').getByText('MILA26', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Alpha Income Fund I' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  await expect(page.getByLabel('Project status')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send' })).toBeVisible();

  const askButtonBox = await page.getByRole('button', { name: 'Send' }).boundingBox();
  expect(askButtonBox?.height).toBeLessThan(80);
});

test('subscription redemption parameters update shared lifecycle state and template handoff', async ({ page }) => {
  const investorWallet = '0x3333333333333333333333333333333333333333';
  const paymentWallet = '0x4444444444444444444444444444444444444444';
  const redemptionWallet = '0x5555555555555555555555555555555555555555';

  await page.goto('/');

  await page.getByLabel('Tokenisation lifecycle tabs').getByRole('button', { name: /Investor Registry/ }).click();
  const registry = page.getByLabel('Investor Registry workspace');
  await registry.getByLabel('Investor wallet address').fill(investorWallet);
  await registry.getByRole('button', { name: 'Add wallet' }).click();
  await expect(registry.getByText('1/50')).toBeVisible();

  await page.getByLabel('Tokenisation lifecycle tabs').getByRole('button', { name: /Subscription/ }).click();
  const subscription = page.getByLabel('Subscription workspace');
  await expect(subscription.getByText(/This does not move stablecoins/i)).toBeVisible();
  await subscription.getByLabel('Permitted stablecoins').fill('usdc, usdt, usdc');
  await subscription.getByLabel('Subscription window').fill('Monthly: first five business days');
  await subscription.getByLabel('Minimum subscription amount').fill('25000');
  await subscription.getByLabel('Payment wallet / contract address').fill(paymentWallet);
  await subscription.getByLabel('Payment per token').fill('1.025');
  await expect(subscription.getByText('Subscription parameters are ready for template handoff.')).toBeVisible();
  await expect(page.getByText(
    'Define redemption parameters so the template can capture the redemption wallet, payout stablecoin, payout-per-token amount, and delay.',
  )).toBeVisible();

  await page.getByLabel('Tokenisation lifecycle tabs').getByRole('button', { name: /Redemption/ }).click();
  const redemption = page.getByLabel('Redemption workspace');
  await expect(redemption.getByText(/This is parameter capture only/i)).toBeVisible();
  await redemption.getByLabel('Redemption window / date').fill('Quarterly redemption date');
  await redemption.getByLabel('Redemption delay unit').selectOption('days');
  await redemption.getByLabel('Redemption delay duration').fill('14');
  await redemption.getByLabel('Redemption wallet address').fill(redemptionWallet);
  await redemption.getByLabel('Payout stablecoin').fill('usdc');
  await redemption.getByLabel('Payout per token').fill('1.01');
  await expect(redemption.getByText('Redemption parameters are ready for template handoff.')).toBeVisible();
  await expect(page.getByText(
    'Review the subscription-redemption template handoff generated from the current shared lifecycle state.',
  )).toBeVisible();

  const handoff = page.getByLabel('Subscription redemption template handoff');
  await expect(handoff.getByRole('heading', { name: 'Subscription-Redemption Template Handoff' })).toBeVisible();
  await expect(handoff.getByText('Template handoff ready')).toBeVisible();
  await expect(handoff.getByText('USDC, USDT')).toBeVisible();
  await expect(handoff.getByText(paymentWallet)).toBeVisible();
  await expect(handoff.getByText(redemptionWallet)).toBeVisible();
  await expect(handoff.getByText('14 days')).toBeVisible();
  await expect(page.getByLabel('Project status')).toContainText('Contract Template (Sub-Redemption)');
  await expect(page.getByLabel('Project status')).toContainText('Available');

  await page.getByLabel('Tokenisation lifecycle tabs').getByRole('button', { name: /Subscription/ }).click();
  await page.getByLabel('Subscription workspace').getByLabel('Payment per token').fill('');
  await expect(subscription.getByText('Payment per token must be greater than zero.')).toBeVisible();
  await expect(page.getByLabel('Template handoff blocking items')).toContainText(
    'Subscription: Payment per token must be greater than zero.',
  );
  await expect(page.getByLabel('Project status')).toContainText('Draft');
});
