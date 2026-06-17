import { expect, test } from '@playwright/test';

test('website intro routes to app access without overclaiming production readiness', async ({ page }) => {
  await page.goto('/site');

  await expect(page).toHaveTitle('ZiLiOS');
  await expect(page.getByLabel('ZiLiOS company and product website')).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: /Tokenise an investment product without building the full technical and ops teams first/i,
    }),
  ).toBeVisible();
  await expect(page.getByText('Controlled MVP access. Ethereum Sepolia/testnet only. User wallet signs.')).toBeVisible();
  await expect(page.getByLabel('Hero proof points')).toContainText('No backend private-key custody');
  await expect(page.getByLabel('User outcome')).toContainText('Less throwaway effort');
  await expect(page.getByLabel('User outcome')).toContainText('Clearer proof for stakeholders');
  await expect(page.getByLabel('Operating model')).toContainText('AI turns intent into a buildable workflow');
  await expect(page.getByLabel('Operating model')).toContainText('Blockchain actions stay gated and wallet-signed');
  await expect(page.getByLabel('Operating model')).toContainText('Distribution and servicing are designed in from the start');
  await expect(page.getByLabel('Product overview')).toContainText('Keep distribution tied to named wallet rules');
  await expect(page.getByLabel('Product overview')).toContainText('provider-returned hashes');
  await expect(page.getByRole('button', { name: 'Request beta access' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open app workspace' })).toHaveAttribute('href', '/');
  await expect(page.getByText(/Track 15|Track 16|15B|15C/i)).toHaveCount(0);
  await expect(page.getByText(/production ready|mainnet ready|audit passed|investment advice/i)).toHaveCount(0);
});

test('product setup turns unstructured chat into reviewable requirements', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('Tokenisation lifecycle tabs').getByRole('button', { name: /Product Setup/ }).click();

  const productSetupHeader = page.getByLabel('Product Setup workspace');
  const productSetupArtifact = page.getByLabel('Product Setup PRD artifact');
  await expect(productSetupArtifact).toBeVisible();
  await expect(productSetupArtifact.getByLabel('What is this product')).toContainText('Product profile');
  await expect(productSetupArtifact.getByLabel('What is this product')).toContainText('Product name');
  await expect(productSetupArtifact.getByLabel('Product Setup downstream handoffs')).toContainText('No downstream details captured yet.');
  await expect(productSetupHeader).not.toContainText('Conversation-first Product Setup');
  await expect(productSetupHeader).not.toContainText('ZiLi-OS understanding');
  await expect(productSetupHeader).not.toContainText('MVP readiness');
  await expect(productSetupHeader).not.toContainText('Advisor Bot + Engineering Bot');
  await expect(page.getByLabel('Next suggested action')).toHaveCount(0);
  await expect(page.getByLabel('Lifecycle snapshot')).toHaveCount(0);

  await page
    .getByRole('textbox', { name: 'Product Setup chat' })
    .fill('We are tokenising a USD private credit portfolio for 25 investors. USDC subscriptions, whitelisted wallets only, quarterly redemption, payout may take 10 business days.');
  await expect(page.getByRole('textbox', { name: 'Product Setup chat' })).toHaveValue(/private credit portfolio/i);
  await page.getByRole('button', { name: 'Send' }).click();

  const suggestedUpdates = page.getByLabel('Needs your review');
  await expect(suggestedUpdates).toContainText('Expected investors');
  await suggestedUpdates.getByRole('button', { name: 'Review all' }).click();
  await expect(suggestedUpdates).toContainText('25');
  await expect(suggestedUpdates).toContainText('Subscription stablecoin type');
  await expect(suggestedUpdates).toContainText('USDC');
  await expect(suggestedUpdates).toContainText('Redemption / burn cadence');
  await expect(suggestedUpdates).toContainText('Quarterly');
  await expect(page.getByLabel('Next suggested action')).toHaveCount(0);

  await expect(productSetupArtifact.getByLabel('Product Setup downstream handoffs')).toContainText('Investor eligibility and wallet rules');
  await expect(productSetupArtifact.getByLabel('Product Setup downstream handoffs')).toContainText('Expected investors: 25');
  await expect(productSetupArtifact.getByLabel('Product requirements board')).toHaveCount(0);
  await expect(productSetupArtifact.getByLabel('Product Setup wallet capture')).toHaveCount(0);
  await expect(productSetupArtifact.getByLabel('Product Setup just-in-time explanations')).toHaveCount(0);
  await expect(productSetupArtifact.getByLabel('Product Setup missing fields')).toHaveCount(0);

  await expect(productSetupArtifact.getByLabel('Product Setup downstream handoffs')).toContainText('Subscription mechanics');
  await productSetupArtifact.getByLabel('Product Setup downstream handoffs').getByRole('button', { name: 'Send to Subscription' }).click();
  await page.getByLabel('Tokenisation lifecycle tabs').getByRole('button', { name: /Subscription/ }).click();
  await expect(page.getByLabel('Subscription Product Setup draft notes')).toContainText('Subscription mechanics');
  await expect(page.getByLabel('Permitted stablecoins')).toHaveValue('');
  await page.getByLabel('Subscription Product Setup draft notes').getByRole('button', { name: 'Apply' }).click();
  await expect(page.getByLabel('Subscription Product Setup draft notes')).toContainText('Applied');
  await expect(page.getByLabel('Permitted stablecoins')).toHaveValue('USDC');
  await page.getByLabel('Tokenisation lifecycle tabs').getByRole('button', { name: /Product Setup/ }).click();

  await expect(productSetupArtifact.getByLabel('Product Setup Pack')).toContainText('Draft');
  await expect(productSetupArtifact.getByLabel('Product Setup Pack').getByRole('button', { name: 'Download PRD .docx' })).toBeDisabled();
  await expect(productSetupArtifact.getByLabel('Product Setup Pack').getByRole('button', { name: 'Download PRD .md' })).toBeDisabled();
  await expect(productSetupArtifact.getByLabel('Product Setup Pack').getByRole('button', { name: 'Download setup JSON' })).toBeDisabled();
});

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
  await expect(page.getByLabel('ZiLi-OS console')).toBeVisible();
  await expect(page.getByLabel('Needs your review')).toBeVisible();
  await expect(page.getByLabel('Ask ZiLi-OS')).toBeVisible();
  const consolePanel = page.getByRole('complementary', { name: 'ZiLi-OS console' });
  const resizeHandle = page.getByRole('separator', { name: 'Resize right rail' });
  const consolePanelBoxBeforeResize = await consolePanel.boundingBox();
  const resizeHandleBox = await resizeHandle.boundingBox();
  expect(consolePanelBoxBeforeResize?.width).toBeGreaterThan(400);
  expect(resizeHandleBox).not.toBeNull();
  await page.mouse.move(
    (resizeHandleBox?.x ?? 0) + (resizeHandleBox?.width ?? 0) / 2,
    (resizeHandleBox?.y ?? 0) + 80,
  );
  await page.mouse.down();
  await page.mouse.move((resizeHandleBox?.x ?? 0) - 100, (resizeHandleBox?.y ?? 0) + 80, { steps: 5 });
  await page.mouse.up();
  const consolePanelBoxAfterResize = await consolePanel.boundingBox();
  expect(consolePanelBoxAfterResize?.width).toBeGreaterThan((consolePanelBoxBeforeResize?.width ?? 0) + 50);
  await expect(page.getByLabel('Workspace controls').getByText(/Sepolia Testnet/i)).toBeVisible();
  await expect(page.getByLabel('ZiLi-OS console').getByRole('heading', { name: 'All projects' })).toHaveCount(0);
  await expect(page.getByLabel('ZiLi-OS console').getByText('Safety boundary')).toHaveCount(0);
  await expect(page.getByText('Need help? Ask the Engineering Bot')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Alpha Income Fund I/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Singapore REIT Token/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Mixed Portfolio Token/i })).toBeVisible();
  await expect(page.getByLabel('Tokenisation lifecycle tabs')).toBeVisible();
  await expect(page.getByLabel('Top stage progress')).toHaveCount(0);
  await expect(page.getByLabel('Current-stage activities')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  await expect(page.getByLabel('ZiLi-OS Copilot workspace')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Create Requirement Doc' })).toBeVisible();
  await expect(page.getByText('Recommendation')).toHaveCount(0);
  await expect(page.getByText('I am ready to create the Requirement Brief.')).toHaveCount(0);
  await expect(page.getByLabel('Brief Preview')).toContainText('Business objective');
  await expect(page.getByLabel('Brief Preview')).toContainText('Token model');
  await expect(page.getByText('Next best action')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'ZiLi-OS Copilot' })).toBeVisible();
  await expect(page.getByText('What I understand')).toHaveCount(0);
  await expect(page.getByText('Tokenisation goal')).toHaveCount(0);
  await expect(page.getByText('Lifecycle snapshot')).toBeVisible();
  await expect(page.getByTestId('engineer-answer')).toContainText('Requirement Brief');
  await expect(page.getByText(/Local preview|Live model|Local fallback/i)).toHaveCount(0);

  await page.getByRole('button', { name: /Singapore REIT Token/i }).click();
  await expect(page.getByRole('heading', { name: 'Singapore REIT Token' }).first()).toBeVisible();
  await expect(page.getByLabel('ZiLi-OS console').getByText('Product Vault')).toHaveCount(0);

  await page.getByRole('button', { name: 'Hide left navigation' }).click();
  await expect(page.getByLabel('Project navigation')).toBeHidden();
  await page.getByRole('button', { name: 'Show left navigation' }).click();
  await expect(page.getByLabel('Project navigation')).toBeVisible();
  await page.getByRole('button', { name: 'Hide right context' }).click();
  await expect(page.getByLabel('ZiLi-OS console')).toBeHidden();
  await page.getByRole('button', { name: 'Show right context' }).click();
  await expect(page.getByLabel('ZiLi-OS console')).toBeVisible();

  await page.getByLabel('Tokenisation lifecycle tabs').getByRole('button', { name: /Contract Ops/ }).click();
  await expect(page.getByTestId('smart-contract-control')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Contract operations' })).toBeVisible();
  await expect(page.getByLabel('Contract Ops evidence summary')).toContainText('Deployment evidence');
  await expect(page.getByRole('button', { name: 'Record NAV Event' })).toBeVisible();

  const cockpitBox = await page.getByLabel('MILA26 tokenisation workspace').boundingBox();
  const controlBox = await page.getByTestId('smart-contract-control').boundingBox();
  expect(controlBox?.y).toBeGreaterThan((cockpitBox?.y ?? 0) + 80);

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
      'Wallet-signed deployment and selected Sepolia operations use the user wallet. Backend never holds private keys.',
    ),
  ).toBeVisible();
  await expect(generatedArtifacts.getByText('Wallet Connection', { exact: true })).toBeVisible();
  await expect(generatedArtifacts.getByText('Not detected', { exact: true })).toBeVisible();
  await expect(generatedArtifacts.getByText('Wallet chain: Unknown. No wallet address. Connection only; no signing or deployment.')).toBeVisible();
  await expect(generatedArtifacts.getByText('Smart Contract Operations', { exact: true })).toBeVisible();
  await expect(generatedArtifacts.getByText('Waiting for deployment evidence')).toBeVisible();
  await expect(
    generatedArtifacts.getByText(
      /Contract Ops exposes Record NAV Event, Whitelist Wallet, and Allocation \/ Mint when their wallet, deployment, ABI, parameter, and evidence gates are satisfied/i,
    ),
  ).toBeVisible();
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
  await expect(generatedArtifacts.getByText('Not audited. No production approval. Wallet connection alone does not execute deployment or operations.')).toBeVisible();
  await expect(page.getByTestId('engineer-answer')).toContainText('Smart contract preparation is complete for demo review');
  await expect(page.getByTestId('engineer-answer')).toContainText('known local compile/test foundation as passed');
  const scp = page.getByTestId('smart-contract-control');
  await expect(scp.getByText('Artifact preview generated').first()).toBeVisible();
  await expect(generatedArtifacts).toContainText('Smart Contract Spec');
  await expect(generatedArtifacts).toContainText('Local Compile/Test');
  await expect(generatedArtifacts).toContainText('Hardhat fixture compiles and local contract tests pass');
  await expect(generatedArtifacts).toContainText('Deployment Gate Review');
  await expect(generatedArtifacts).toContainText('Pre-deployment readiness: Complete');
  await expect(generatedArtifacts).toContainText('Wallet Signing Intent');
  await expect(generatedArtifacts).toContainText('Backend never holds private keys');
  await expect(generatedArtifacts).toContainText('Wallet Connection');
  await expect(generatedArtifacts).toContainText('Wallet chain: Unknown');
  await expect(generatedArtifacts).toContainText('No wallet address');
  await expect(generatedArtifacts).toContainText('No contract address');
  await expect(generatedArtifacts).toContainText('No transaction hash');
  await expect(generatedArtifacts).toContainText('Deployment Evidence: Not available');
  await expect(generatedArtifacts).toContainText('Evidence strength: None');
  await expect(generatedArtifacts).toContainText('Local session only');
  await expect(generatedArtifacts).toContainText('Transaction hash source: Absent');
  await expect(generatedArtifacts).toContainText('Contract address source: Absent');
  await expect(scp.getByText('Contract operations')).toBeVisible();
  await expect(page.getByLabel('Contract Ops evidence summary')).toContainText('Safety: user wallet signs, backend holds no private keys, Sepolia only.');
  await expect(page.getByLabel('Contract Ops summary')).toContainText('Deployment');
  await expect(page.getByLabel('Contract Ops summary')).toContainText('Deployment execution not started');
  await expect(page.getByLabel('Contract Ops summary')).toContainText('Connect a Sepolia wallet.');
  await expect(page.getByLabel('Contract Ops summary')).toContainText('Waiting for deployment evidence');
  await expect(page.getByLabel('Contract Ops summary')).toContainText('Record NAV, Whitelist Wallet, and Allocation / Mint are released operation-by-operation.');
  await expect(scp.getByRole('button', { name: 'Deploy to Sepolia with Wallet' })).toBeVisible();
  await expect(scp.getByRole('button', { name: 'Record NAV Event' })).toBeVisible();
  await expect(scp.getByLabel('Whitelist target wallet')).toBeVisible();
  await expect(scp.getByRole('button', { name: 'Whitelist Wallet' })).toBeVisible();
  await expect(scp.getByRole('button', { name: 'Submit Allocation / Mint' })).toBeVisible();
  await expect(page.getByLabel('Contract Ops evidence summary')).toContainText('Deployment evidence: Deployment Evidence: Not available');
  await expect(page.getByLabel('Contract Ops evidence summary')).toContainText('Record NAV: Record NAV operation not started');
  await expect(page.getByLabel('Contract Ops evidence summary')).toContainText('Wallet whitelist: Wallet whitelist not started');
  await expect(page.getByLabel('Contract Ops evidence summary')).toContainText('Allocation / Mint: Allocation / Mint not started');
  await expect(page.getByText(/txHash/i)).toHaveCount(0);
  await expect(page.getByLabel('ZiLi-OS console').getByRole('button', { name: /wallet|sign/i })).toHaveCount(0);
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
  await expect(page.getByLabel('ZiLi-OS console')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send' })).toBeVisible();

  const askButtonBox = await page.getByRole('button', { name: 'Send' }).boundingBox();
  expect(askButtonBox?.height).toBeLessThan(80);
});

test('subscription redemption parameters update shared lifecycle state and template handoff', async ({ page }) => {
  const investorWallet = '0x3333333333333333333333333333333333333333';
  const paymentWallet = '0x4444444444444444444444444444444444444444';
  const redemptionWallet = '0x5555555555555555555555555555555555555555';

  await page.goto('/');

  await page.getByLabel('Tokenisation lifecycle tabs').getByRole('button', { name: /Investor Wallets/ }).click();
  const registry = page.getByLabel('Investor Wallets workspace');
  await registry.getByLabel('Investor wallet address').fill(investorWallet);
  await registry.getByRole('button', { name: 'Add wallet' }).click();
  await expect(registry.getByText('1/50')).toBeVisible();

  await page.getByLabel('Tokenisation lifecycle tabs').getByRole('button', { name: /Subscription/ }).click();
  const subscription = page.getByLabel('Subscription workspace');
  await expect(subscription.getByText(/This does not move stablecoins/i)).toBeVisible();
  await subscription.getByLabel('Permitted stablecoins').fill('usdc, usdt, usdc');
  await subscription.getByLabel('Subscription window').fill('Monthly: first five business days');
  await subscription.getByLabel('Minimum subscription amount').fill('25000');
  await subscription.getByLabel('Subscription receiving wallet address').fill(paymentWallet);
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
  await redemption.getByLabel('Redemption handling').selectOption('Lock until stablecoin payout is complete, then burn');
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
  await expect(handoff.getByText('Lock until stablecoin payout is complete, then burn')).toBeVisible();
  await expect(page.getByLabel('ZiLi-OS console')).toBeVisible();
  await expect(page.getByTestId('smart-contract-control')).toHaveCount(0);

  await page.getByLabel('Tokenisation lifecycle tabs').getByRole('button', { name: /Subscription/ }).click();
  await page.getByLabel('Subscription workspace').getByLabel('Payment per token').fill('');
  await expect(subscription.getByText('Payment per token must be greater than zero.')).toBeVisible();
  await expect(page.getByLabel('Template handoff blocking items')).toContainText(
    'Subscription: Payment per token must be greater than zero.',
  );
  await expect(page.getByLabel('ZiLi-OS console')).toBeVisible();
});

test('allocation mint readiness uses shared investor registry and subscription state without execution', async ({ page }) => {
  const investorWallet = '0x3333333333333333333333333333333333333333';
  const paymentWallet = '0x4444444444444444444444444444444444444444';

  await page.goto('/');

  await page.getByLabel('Tokenisation lifecycle tabs').getByRole('button', { name: /Investor Wallets/ }).click();
  const registry = page.getByLabel('Investor Wallets workspace');
  await registry.getByLabel('Investor wallet address').fill(investorWallet);
  await registry.getByRole('button', { name: 'Add wallet' }).click();
  await registry.getByRole('button', { name: 'Use for Allocation / Mint' }).click();

  const allocationMint = page.getByLabel('Allocation Mint workspace');
  await expect(page.getByRole('heading', { name: 'Allocation / Mint setup' })).toBeVisible();
  await expect(allocationMint.getByLabel('Allocation target wallet')).toHaveValue(investorWallet);
  await expect(allocationMint.getByText('Complete Subscription parameters before Allocation / Mint.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Contract operations' })).toBeVisible();
  await expect(page.getByLabel('ZiLi-OS console')).toBeVisible();

  await page.getByLabel('Tokenisation lifecycle tabs').getByRole('button', { name: /Subscription/ }).click();
  const subscription = page.getByLabel('Subscription workspace');
  await subscription.getByLabel('Permitted stablecoins').fill('usdc');
  await subscription.getByLabel('Subscription window').fill('Monthly: first five business days');
  await subscription.getByLabel('Minimum subscription amount').fill('25000');
  await subscription.getByLabel('Subscription receiving wallet address').fill(paymentWallet);
  await subscription.getByLabel('Payment per token').fill('1.025');

  await page.getByLabel('Tokenisation lifecycle tabs').getByRole('button', { name: /Contract Ops/ }).click();
  await allocationMint.getByLabel('Token allocation amount').fill('1250');
  await expect(allocationMint.getByText('Allocation / Mint parameters are ready for review.')).toBeVisible();
  await expect(allocationMint.getByText(`Allocation ready for 1250 token(s) to ${investorWallet}.`)).toBeVisible();
  await expect(page.getByLabel('Lifecycle snapshot')).toContainText('Allocation / Mint');
  await expect(page.getByLabel('Lifecycle snapshot')).toContainText('Ready for review');
  await expect(page.getByLabel('ZiLi-OS console')).toBeVisible();
  await expect(page.getByTestId('smart-contract-control').getByRole('button', { name: 'Mint' })).toBeDisabled();

  await page.getByLabel('Tokenisation lifecycle tabs').getByRole('button', { name: /Subscription/ }).click();
  await subscription.getByLabel('Payment per token').fill('');
  await page.getByLabel('Tokenisation lifecycle tabs').getByRole('button', { name: /Contract Ops/ }).click();
  await expect(allocationMint.getByText('Complete Subscription parameters before Allocation / Mint.')).toBeVisible();
});

test('test wallet lab generates investor wallets for allocation mint prototype demos', async ({ page }) => {
  const paymentWallet = '0x4444444444444444444444444444444444444444';

  await page.goto('/');

  await page.getByLabel('Tokenisation lifecycle tabs').getByRole('button', { name: /Investor Wallets/ }).click();
  const registry = page.getByLabel('Investor Wallets workspace');
  const walletLab = registry.getByLabel('Test Wallet Lab');

  await expect(walletLab.getByText(/separate test-only MetaMask profile/i)).toBeVisible();
  await expect(walletLab.getByText(/Private keys hidden until explicit export/i)).toBeVisible();
  await expect(page.getByText(/privateKey/i)).toHaveCount(0);

  await walletLab.getByRole('button', { name: 'Generate test wallet pack' }).click();

  await expect(registry.getByText('50/50')).toBeVisible();
  await expect(walletLab.getByText('50 generated test investor wallet(s) added to Investor Wallets.')).toBeVisible();
  await expect(
    registry.getByRole('table', { name: 'Investor wallet entries' }).getByText('Investor 01', { exact: true }),
  ).toBeVisible();
  await expect(registry.getByText('Generated test wallet').first()).toBeVisible();
  await expect(page.getByText(/privateKey/i)).toHaveCount(0);

  await walletLab.getByRole('button', { name: 'Prepare test-only export' }).click();
  await expect(page.getByLabel('Test-only wallet export')).toHaveValue(/privateKey/);

  await registry.getByRole('button', { name: 'Use for Allocation / Mint' }).first().click();
  const allocationMint = page.getByLabel('Allocation Mint workspace');
  await expect(allocationMint.getByLabel('Allocation target wallet')).toHaveValue(/^0x[a-fA-F0-9]{40}$/);

  await page.getByLabel('Tokenisation lifecycle tabs').getByRole('button', { name: /Subscription/ }).click();
  const subscription = page.getByLabel('Subscription workspace');
  await subscription.getByLabel('Permitted stablecoins').fill('usdc');
  await subscription.getByLabel('Subscription window').fill('Monthly: first five business days');
  await subscription.getByLabel('Minimum subscription amount').fill('25000');
  await subscription.getByLabel('Subscription receiving wallet address').fill(paymentWallet);
  await subscription.getByLabel('Payment per token').fill('1.025');

  await page.getByLabel('Tokenisation lifecycle tabs').getByRole('button', { name: /Contract Ops/ }).click();
  await allocationMint.getByLabel('Token allocation amount').fill('1000');
  await expect(allocationMint.getByText('Allocation / Mint parameters are ready for review.')).toBeVisible();
  await expect(page.getByTestId('smart-contract-control').getByRole('button', { name: 'Mint' })).toBeDisabled();
});
