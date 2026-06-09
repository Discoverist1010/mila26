import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/App';
import type { EngineeringBrief } from '../server/contracts/engineeringBrief';
import { createInitialProductSetupRecord } from '../src/domain/productSetup';
import { SEPOLIA_CHAIN_ID_HEX } from '../src/domain/walletConnectionReadModel';
import type { Eip1193Provider } from '../src/wallet/eip1193WalletAdapter';
import { expectNoPrematureBlockchainExecutionClaims } from './golden-flow-assertions';

function createJsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

function createTestProductSetupRecord() {
  return createInitialProductSetupRecord({
    fundName: 'Alpha Income Fund I',
    tokenSymbol: 'ALPHA',
    jurisdiction: 'Singapore',
    targetInvestors: 'Accredited investors',
    totalSupply: 1_000_000,
    initialNav: 1,
  });
}

const engineeringBrief: EngineeringBrief = {
  id: 'engineering-brief-1',
  generatedAtIso: '2026-05-22T00:00:00.000Z',
  sourceRequirementBriefId: 'brief-1',
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

const connectedWalletAddress = '0x1111111111111111111111111111111111111111';

function createMockWalletProvider(options: {
  requestAccounts?: string[];
  chainId?: string;
  rejectRequest?: boolean;
  transactionHash?: string;
  receiptContractAddress?: string;
  receiptStatus?: '0x1' | '0x0';
  receiptNullCount?: number;
  balance?: string;
} = {}) {
  const calls: string[] = [];
  const transactionParams: unknown[] = [];
  let accounts: string[] = [];
  let receiptNullCount = options.receiptNullCount ?? 0;
  const provider = {
    async request(args: { method: string; params?: unknown }) {
      calls.push(args.method);

      if (args.method === 'eth_accounts') return accounts;
      if (args.method === 'eth_chainId') return options.chainId ?? SEPOLIA_CHAIN_ID_HEX;
      if (args.method === 'eth_requestAccounts') {
        if (options.rejectRequest) {
          throw Object.assign(new Error('User rejected request'), { code: 4001 });
        }
        accounts = options.requestAccounts ?? [connectedWalletAddress];
        return accounts;
      }
      if (args.method === 'eth_sendTransaction') {
        transactionParams.push(args.params);
        return options.transactionHash ?? '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
      }
      if (args.method === 'eth_getTransactionReceipt') {
        if (receiptNullCount > 0) {
          receiptNullCount -= 1;
          return null;
        }
        return {
          status: options.receiptStatus ?? '0x1',
          contractAddress: options.receiptContractAddress ?? '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        };
      }
      if (args.method === 'eth_getBalance') return options.balance ?? '0x38d7ea4c68000';

      throw new Error(`Unexpected request method: ${args.method}`);
    },
  } as Eip1193Provider;

  return { provider, calls, transactionParams };
}

function stubBrowserWallet(provider: Eip1193Provider) {
  vi.stubGlobal('ethereum', provider);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubSmartContractPreparationFetch() {
  const smartContractArtifactSpec = {
    specId: 'smart-contract-artifact-spec-engineering-brief-1',
    projectId: 'brief-1',
    projectName: 'MILA Income Fund',
    status: 'ready',
    eventModel: {
      customEvents: ['ValuationUpdated', 'DistributionRecorded'],
    },
  };

  const fetchMock = vi.fn((url: string) => {
    if (url.endsWith('/api/prd/engineering-brief')) {
      return Promise.resolve(createJsonResponse({ ok: true, data: engineeringBrief }));
    }

    if (url.endsWith('/api/smart-contract/artifact-spec')) {
      return Promise.resolve(createJsonResponse({ ok: true, data: smartContractArtifactSpec }));
    }

    if (url.endsWith('/api/smart-contract/artifact')) {
      return Promise.resolve(
        createJsonResponse({
          ok: true,
          data: {
            artifactPackage: {
              artifactId: 'contract-artifact-smart-contract-artifact-spec-engineering-brief-1',
              specId: smartContractArtifactSpec.specId,
              projectId: 'brief-1',
              projectName: 'MILA Income Fund',
              status: 'generated',
              sourceModel: {
                sourceFiles: [{ path: 'contracts/MILARestrictedIncomeFundToken.preview.sol' }],
              },
            },
            checkResult: {
              checkId: 'contract-check-smart-contract-artifact-spec-engineering-brief-1',
              artifactId: 'contract-artifact-smart-contract-artifact-spec-engineering-brief-1',
              specId: smartContractArtifactSpec.specId,
              status: 'passed',
              summary:
                'Deterministic spec-consistency/static-preview checking only. Not a production security audit, compiler result, deployment approval, wallet-signing proof, or legal/compliance opinion.',
            },
            evidenceLite: {
              evidenceId: 'evidence-lite-smart-contract-artifact-spec-engineering-brief-1',
              artifactId: 'contract-artifact-smart-contract-artifact-spec-engineering-brief-1',
              specId: smartContractArtifactSpec.specId,
              checkId: 'contract-check-smart-contract-artifact-spec-engineering-brief-1',
              status: 'ready',
              evidenceItems: [{ id: 'evidence-spec-profile' }],
              eventEvidenceRefs: [{ eventName: 'ValuationUpdated' }],
            },
          },
        }),
      );
    }

    return Promise.resolve(createJsonResponse({ ok: false, error: { code: 'UNEXPECTED', message: 'Unexpected route.' } }, { status: 400 }));
  });
  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

async function completeSmartContractPreparation() {
  fireEvent.click(screen.getByRole('button', { name: 'Create Requirement Doc' }));
  fireEvent.click(screen.getByRole('button', { name: 'Generate Engineering Brief' }));

  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Prepare Smart Contract Spec' })).toBeEnabled();
  });

  fireEvent.click(screen.getByRole('button', { name: 'Prepare Smart Contract Spec' }));

  await waitFor(() => {
    expect(screen.getByLabelText('Generated smart contract artifacts')).toBeVisible();
  });

  fireEvent.click(within(screen.getByLabelText('Tokenisation lifecycle tabs')).getByRole('button', { name: /Contract Ops/ }));
}

function contractOps() {
  return within(screen.getByTestId('smart-contract-control'));
}

function getContractOpsDeployButton() {
  return contractOps().getByRole('button', { name: 'Deploy to Sepolia with Wallet' });
}

function acknowledgeContractOpsProductSetupWarnings() {
  const proceedButton = screen.queryByRole('button', { name: 'Proceed with warnings' });
  if (proceedButton) fireEvent.click(proceedButton);
}

describe('App Blockchain Engineer Bot panel', () => {
  it('shows local preview before asking and then renders a backend answer', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        ok: true,
        data: {
          messageId: 'chat-1',
          agentId: 'blockchain-engineer',
          content: 'Backend mock says ERC-3643 is suitable for whitelisted investor wallet products.',
          protocolComparison: {
            erc20: 'Fungible portfolio shares with broad wallet support.',
            erc4626: 'Vault shares for clean single-asset vaults.',
            erc3643: 'Permissioned token for approved wallets.',
            rebasingErc20: 'Balances adjust after NAV updates.',
            erc721OutOfScope: 'Unique token IDs are out of MVP scope.',
            recommendation: 'Use ERC-3643 when wallet permissioning is central.',
          },
          suggestedRequirementUpdates: [
            {
              field: 'protocol_base',
              proposedValue: 'ERC-3643',
              rationale: 'The stated income product needs approved-wallet controls.',
              confidence: 0.84,
            },
          ],
          openQuestions: ['Should every approved investor hold identical share units?'],
          riskNotes: ['Backend must not hold private keys.'],
          nextRecommendedAction: 'Confirm the recommended protocol base before approving the Requirement Brief.',
          createdAt: '2026-05-21T00:00:00.000Z',
        },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    expect(screen.getByText('MILA26')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Alpha Income Fund I' })).toBeVisible();
    expect(screen.getByLabelText('Project navigation')).toBeVisible();
    expect(screen.getByLabelText('Project status')).toBeVisible();
    expect(screen.getByLabelText('Tokenisation lifecycle tabs')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Overview' })).toBeVisible();
    expect(screen.getByLabelText('Engineering Bot workspace')).toBeVisible();
    expect(screen.getByText('Designs the tokenisation workflow, artifacts, smart-contract handoffs, and wallet operation next steps.')).toBeVisible();
    expect(screen.getByText('Next best action')).toBeVisible();
    expect(screen.getByRole('button', { name: /Alpha Income Fund I/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /Singapore REIT Token/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /Mixed Portfolio Token/i })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Smart Contract Control Panel' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Current-stage activities')).not.toBeInTheDocument();
    expect(screen.queryByText('Goal intake')).not.toBeInTheDocument();
    expect(screen.queryByText('Project Closure Ledger')).not.toBeInTheDocument();
    expect(screen.queryByText('1 unresolved open item(s)')).not.toBeInTheDocument();
    expect(screen.queryByText('Need help? Ask the Engineering Bot')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'All projects' })).not.toBeInTheDocument();
    expect(screen.queryByText('Choose a project folder on the left to inspect its linked artifacts and evidence.')).not.toBeInTheDocument();
    expect(screen.getByText('Local preview shown until a backend response is available.')).toBeVisible();
    expect(screen.getByLabelText('Engineering Bot actions')).toBeVisible();
    expect(screen.queryByText('Recommendation')).not.toBeInTheDocument();
    expect(screen.queryByText('I am ready to create the Requirement Brief.')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Create Requirement Doc' })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Create Requirement Doc' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Review assumptions' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Approve Brief and Run Coding Bot' })).not.toBeInTheDocument();
    expect(screen.queryByText('What I understand')).not.toBeInTheDocument();
    expect(screen.queryByText('Tokenisation goal')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Engineering Bot MILA' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Send' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Advisor' })).toBeVisible();
    expect(screen.queryByText('Next Recommended Action')).not.toBeInTheDocument();
    expect(screen.queryByTestId('smart-contract-control')).not.toBeInTheDocument();

    const botComposer = screen.getByRole('textbox', { name: 'Engineering Bot MILA' });
    fireEvent.change(botComposer, {
      target: {
        value:
          'We are tokenising a private credit portfolio for 25 investors with USDC subscriptions, whitelisted wallets, quarterly redemption, and a 10 business days payout delay.',
      },
    });
    fireEvent.keyDown(botComposer, { key: 'Enter', code: 'Enter' });

    expect(screen.getByRole('button', { name: 'Sending...' })).toBeDisabled();
    expect(screen.getByTestId('engineer-answer')).toHaveTextContent('Waiting for Engineering Bot response...');

    await waitFor(() => {
      expect(screen.getByText('Backend response.')).toBeVisible();
    });
    expect(botComposer).toHaveValue('');
    expect(
      screen.getByText(
        'We are tokenising a private credit portfolio for 25 investors with USDC subscriptions, whitelisted wallets, quarterly redemption, and a 10 business days payout delay.',
      ),
    ).toBeVisible();
    expect(screen.getByTestId('engineer-answer')).toHaveTextContent('Backend mock says ERC-3643');
    expect(screen.getByText('Protocol comparison')).toBeVisible();
    expect(screen.getByText('ERC-20: Fungible portfolio shares with broad wallet support.')).toBeVisible();
    expect(screen.getByText('ERC-3643: Permissioned token for approved wallets.')).toBeVisible();
    expect(screen.getByText('ERC-721: Unique token IDs are out of MVP scope.')).toBeVisible();
    expect(screen.getByText('Suggested requirement updates')).toBeVisible();
    expect(screen.getByText('protocol_base: ERC-3643. The stated income product needs approved-wallet controls.')).toBeVisible();
    expect(screen.getByText('Open questions')).toBeVisible();
    expect(screen.getByText('Should every approved investor hold identical share units?')).toBeVisible();
    expect(screen.queryByText('Risk notes')).not.toBeInTheDocument();
    expect(screen.queryByText('Backend must not hold private keys.')).not.toBeInTheDocument();
    expect(screen.getByText('Recommended next action')).toBeVisible();
    expect(screen.getByText('Confirm the recommended protocol base before approving the Requirement Brief.')).toBeVisible();

    fireEvent.click(within(screen.getByLabelText('Tokenisation lifecycle tabs')).getByRole('button', { name: /Product Setup/ }));
    expect(screen.getByLabelText('Product Setup suggested updates')).toHaveTextContent('Expected investors');
    expect(screen.getByLabelText('Product Setup suggested updates')).toHaveTextContent('Subscription stablecoins');
    expect(screen.getByLabelText('Product Setup suggested updates')).toHaveTextContent('Redemption payout delay');
    fireEvent.click(
      within(screen.getByLabelText('Product Setup suggested updates'))
        .getAllByRole('button', { name: 'Confirm' })
        .at(-1) as HTMLElement,
    );
    fireEvent.click(within(screen.getByLabelText('Tokenisation lifecycle tabs')).getByRole('button', { name: /Redemption/ }));
    expect(screen.getByLabelText('Redemption delay unit')).toHaveValue('days');
    expect(screen.getByLabelText('Redemption delay duration')).toHaveValue('10');
  });

  it('blocks blank input before calling fetch', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Engineering Bot MILA' }), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a question before asking the bot.');
  });

  it('keeps Advisor mode in the same AI panel across tab switches', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        ok: true,
        data: {
          messageId: 'advisor-response-1',
          agentId: 'blockchain-engineer',
          content: 'Advisor view: use Redemption for delay terms and Evidence Vault for provider-derived proof.',
          openQuestions: ['Which lifecycle step should I explain next?'],
          riskNotes: ['Explanatory guidance only.'],
          nextRecommendedAction: 'Ask a plain-language question about the current lifecycle state.',
          createdAt: '2026-05-21T00:00:00.000Z',
        },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Advisor' }));
    expect(screen.getByRole('textbox', { name: 'Advisor Bot MILA' })).toBeVisible();
    fireEvent.change(screen.getByRole('textbox', { name: 'Advisor Bot MILA' }), {
      target: { value: 'Where do redemption delays belong?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(screen.getByTestId('engineer-answer')).toHaveTextContent('Advisor view: use Redemption');
    });
    const requestBody = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(requestBody.assistantMode).toBe('advisor');
    expect(screen.getByText('You to Advisor')).toBeVisible();
    expect(screen.getAllByText('Advisor Bot').length).toBeGreaterThan(0);

    fireEvent.click(within(screen.getByLabelText('Tokenisation lifecycle tabs')).getByRole('button', { name: /Redemption/ }));
    expect(screen.getByRole('textbox', { name: 'Advisor Bot MILA' })).toBeVisible();
    expect(screen.getByTestId('engineer-answer')).toHaveTextContent('Advisor view: use Redemption');
  });

  it('shows a safe error and local fallback when the backend is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));

    render(<App />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Engineering Bot MILA' }), {
      target: { value: 'How should deployment work?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Could not reach the MILA26 API. Check that the local API server is running.',
      );
    });
    expect(screen.getByText('Local preview shown until a backend response is available.')).toBeVisible();
  });

  it('generates and renders an Engineering Brief artifact from the Requirement Brief', async () => {
    let resolveEngineeringBrief: (value: Response) => void = () => undefined;
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveEngineeringBrief = resolve;
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Create Requirement Doc' }));
    expect(screen.getAllByRole('button', { name: 'Generate Engineering Brief' })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Generate Engineering Brief' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Generate Engineering Brief' }));

    expect(screen.getByRole('button', { name: 'Generating Engineering Brief...' })).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:5174/api/prd/engineering-brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.stringContaining('"approvalStatus":"approved"'),
    });

    resolveEngineeringBrief(
      createJsonResponse({
        ok: true,
        data: engineeringBrief,
      }),
    );

    let artifact: HTMLElement | undefined;
    await waitFor(() => {
      artifact = screen.getByTestId('engineering-brief-artifact');
      expect(artifact).toBeVisible();
    });
    expect(screen.getByRole('heading', { name: 'Engineering Brief Artifact' })).toBeVisible();
    const artifactScope = within(artifact as HTMLElement);
    expect(artifactScope.getByText('Project context')).toBeVisible();
    expect(artifactScope.getByText('Functional requirements')).toBeVisible();
    expect(artifactScope.getByText('Wallet / access model')).toBeVisible();
    expect(artifactScope.getByText('Deployment boundary')).toBeVisible();
    expect(artifactScope.getByText('QA / evidence plan')).toBeVisible();
    expect(artifactScope.getByText('Risks / controls')).toBeVisible();
    expect(artifactScope.getByText('Acceptance criteria')).toBeVisible();
    expect(artifactScope.getByText('Capture tokenized fund requirements.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Prepare Smart Contract Spec' })).toBeEnabled();
    expect(screen.getByText('Start by registering investor wallet addresses so subscription, whitelisting, servicing, and evidence can use the same lifecycle state.')).toBeVisible();
    const nextAction = screen.getByRole('button', { name: 'Prepare Smart Contract Spec' });
    expect(nextAction).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Approve Brief and Run Coding Bot' })).not.toBeInTheDocument();
  });

  it('uses shared lifecycle state for the Investor Wallets tab, snapshot, vault, and Contract Ops handoff', () => {
    const validWallet = '0x3333333333333333333333333333333333333333';
    render(<App />);

    fireEvent.click(within(screen.getByLabelText('Tokenisation lifecycle tabs')).getByRole('button', { name: /Investor Wallets/ }));

    const registry = screen.getByLabelText('Investor Wallets workspace');
    expect(within(registry).getByText('No investor wallets registered yet.')).toBeVisible();
    expect(within(registry).getByText('Investor Wallets: Wallets needed')).toBeVisible();
    expect(within(registry).getByText(/This is not KYC, investor eligibility approval, or legal approval/i)).toBeVisible();
    expect(within(registry).queryByText(/KYC approved|investor eligibility approved|legally approved/i)).not.toBeInTheDocument();

    fireEvent.change(within(registry).getByLabelText('Investor wallet address'), {
      target: { value: validWallet },
    });
    fireEvent.click(within(registry).getByRole('button', { name: 'Add wallet' }));

    expect(within(registry).getByText('1/50')).toBeVisible();
    expect(within(registry).getAllByText('Ready to whitelist').length).toBeGreaterThan(0);
    expect(within(registry).getByText('Valid wallet address')).toBeVisible();
    expect(screen.getByText('1 ready, 0 whitelisted')).toBeVisible();
    expect(screen.getByLabelText('Product setup status')).toHaveTextContent('1/50 registered');
    expect(screen.getByLabelText('Project status')).toHaveTextContent('Investor Wallets');
    expect(screen.getByLabelText('Project status')).toHaveTextContent('Active');

    fireEvent.click(within(registry).getByRole('button', { name: 'Use for wallet whitelist' }));
    expect(screen.getByRole('heading', { name: 'Contract Ops' })).toBeVisible();
    expect(screen.getByLabelText('Whitelist target wallet')).toHaveValue(validWallet);

    fireEvent.click(within(screen.getByLabelText('Tokenisation lifecycle tabs')).getByRole('button', { name: /Investor Wallets/ }));
    fireEvent.change(screen.getByLabelText('Investor wallet address'), {
      target: { value: '0x1234' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add wallet' }));

    expect(screen.getByText('Wallet address must be a valid non-zero EVM address.')).toBeVisible();
    expect(screen.getByLabelText('Investor Wallets blocking items')).toHaveTextContent('Resolve invalid wallet addresses.');
  });

  it('generates a test investor wallet pack and uses generated wallets for Allocation / Mint readiness', () => {
    const paymentWallet = '0x4444444444444444444444444444444444444444';
    render(<App />);

    fireEvent.click(within(screen.getByLabelText('Tokenisation lifecycle tabs')).getByRole('button', { name: /Investor Wallets/ }));
    const registry = screen.getByLabelText('Investor Wallets workspace');
    const walletLab = within(registry).getByLabelText('Test Wallet Lab');

    expect(within(walletLab).getByText(/separate test-only MetaMask profile/i)).toBeVisible();
    expect(within(walletLab).getByText(/Private keys hidden until explicit export/i)).toBeVisible();
    expect(screen.queryByText(/privateKey/i)).not.toBeInTheDocument();

    fireEvent.click(within(walletLab).getByRole('button', { name: 'Generate test wallet pack' }));

    expect(within(registry).getByText('50/50')).toBeVisible();
    expect(within(walletLab).getByText('50 generated test investor wallet(s) added to Investor Wallets.')).toBeVisible();
    expect(within(registry).getByText('Investor 01')).toBeVisible();
    expect(within(registry).getAllByText('Generated test wallet').length).toBeGreaterThan(0);
    expect(within(registry).getAllByText(/Ready for whitelist; subscription, redemption, notices planned/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/privateKey/i)).not.toBeInTheDocument();

    fireEvent.click(within(walletLab).getByRole('button', { name: 'Prepare test-only export' }));
    expect((screen.getByLabelText('Test-only wallet export') as HTMLTextAreaElement).value).toContain('privateKey');

    const generatedWallet = within(registry).getAllByRole('button', { name: 'Use for Allocation / Mint' })[0];
    fireEvent.click(generatedWallet);
    const allocationMintPanel = screen.getByLabelText('Allocation Mint workspace');
    const allocationTarget = within(allocationMintPanel).getByLabelText('Allocation target wallet') as HTMLSelectElement;
    expect(allocationTarget.value).toMatch(/^0x[a-fA-F0-9]{40}$/);

    fireEvent.click(within(screen.getByLabelText('Tokenisation lifecycle tabs')).getByRole('button', { name: /Subscription/ }));
    const subscription = screen.getByLabelText('Subscription workspace');
    fireEvent.change(within(subscription).getByLabelText('Permitted stablecoins'), { target: { value: 'usdc' } });
    fireEvent.change(within(subscription).getByLabelText('Subscription window'), { target: { value: 'Monthly: first five business days' } });
    fireEvent.change(within(subscription).getByLabelText('Minimum subscription amount'), { target: { value: '25000' } });
    fireEvent.change(within(subscription).getByLabelText('Payment wallet / contract address'), { target: { value: paymentWallet } });
    fireEvent.change(within(subscription).getByLabelText('Payment per token'), { target: { value: '1.025' } });

    fireEvent.click(within(screen.getByLabelText('Tokenisation lifecycle tabs')).getByRole('button', { name: /Contract Ops/ }));
    fireEvent.change(within(screen.getByLabelText('Allocation Mint workspace')).getByLabelText('Token allocation amount'), {
      target: { value: '1000' },
    });

    expect(screen.getByLabelText('Allocation Mint workspace')).toHaveTextContent('Allocation / Mint parameters are ready for review.');
    expect(within(screen.getByTestId('smart-contract-control')).queryByRole('button', { name: /Mint/i })).toBeDisabled();
  });

  it('captures subscription and redemption parameters as working shared lifecycle state', () => {
    const investorWallet = '0x3333333333333333333333333333333333333333';
    const paymentWallet = '0x4444444444444444444444444444444444444444';
    const redemptionWallet = '0x5555555555555555555555555555555555555555';
    render(<App />);

    fireEvent.click(within(screen.getByLabelText('Tokenisation lifecycle tabs')).getByRole('button', { name: /Investor Wallets/ }));
    const registry = screen.getByLabelText('Investor Wallets workspace');
    fireEvent.change(within(registry).getByLabelText('Investor wallet address'), { target: { value: investorWallet } });
    fireEvent.click(within(registry).getByRole('button', { name: 'Add wallet' }));

    fireEvent.click(within(screen.getByLabelText('Tokenisation lifecycle tabs')).getByRole('button', { name: /Subscription/ }));
    const subscription = screen.getByLabelText('Subscription workspace');

    expect(within(subscription).getByText(/This does not move stablecoins/i)).toBeVisible();
    expect(within(subscription).getByText('Add at least one permitted stablecoin.')).toBeVisible();
    expect(screen.getByLabelText('Project status')).toHaveTextContent('Subscription template');
    expect(screen.getByLabelText('Project status')).toHaveTextContent('Needs parameters');

    fireEvent.change(within(subscription).getByLabelText('Permitted stablecoins'), { target: { value: 'usdc, usdt, usdc' } });
    fireEvent.change(within(subscription).getByLabelText('Subscription window'), { target: { value: 'Monthly: first five business days' } });
    fireEvent.change(within(subscription).getByLabelText('Minimum subscription amount'), { target: { value: '25000' } });
    fireEvent.change(within(subscription).getByLabelText('Payment wallet / contract address'), { target: { value: paymentWallet } });
    fireEvent.change(within(subscription).getByLabelText('Payment per token'), { target: { value: '1.025' } });

    expect(within(subscription).getByText('Subscription parameters are ready for template handoff.')).toBeVisible();
    expect(screen.getAllByText('2 permitted stablecoin(s) configured for subscription.').length).toBeGreaterThan(1);
    expect(screen.getByText(/Define redemption parameters so the template can capture/i)).toBeVisible();

    fireEvent.click(within(screen.getByLabelText('Tokenisation lifecycle tabs')).getByRole('button', { name: /Redemption/ }));
    const redemption = screen.getByLabelText('Redemption workspace');

    expect(within(redemption).getByText(/This is parameter capture only/i)).toBeVisible();
    fireEvent.change(within(redemption).getByLabelText('Redemption window / date'), { target: { value: 'Quarterly redemption date' } });
    fireEvent.change(within(redemption).getByLabelText('Redemption delay unit'), { target: { value: 'days' } });
    fireEvent.change(within(redemption).getByLabelText('Redemption delay duration'), { target: { value: '14' } });
    fireEvent.change(within(redemption).getByLabelText('Redemption wallet address'), { target: { value: redemptionWallet } });
    fireEvent.change(within(redemption).getByLabelText('Payout stablecoin'), { target: { value: 'usdc' } });
    fireEvent.change(within(redemption).getByLabelText('Payout per token'), { target: { value: '1.01' } });
    fireEvent.change(within(redemption).getByLabelText('Redemption handling'), {
      target: { value: 'Lock until stablecoin payout is complete, then burn' },
    });

    expect(within(redemption).getByText('Redemption parameters are ready for template handoff.')).toBeVisible();
    expect(within(redemption).getByText('Redemption delay configured: 14 days.')).toBeVisible();
    expect(screen.getByText(/Review the subscription-redemption template handoff/i)).toBeVisible();

    const handoff = screen.getByLabelText('Subscription redemption template handoff');
    expect(within(handoff).getByRole('heading', { name: 'Subscription-Redemption Template Handoff' })).toBeVisible();
    expect(within(handoff).getByText('Template handoff ready')).toBeVisible();
    expect(within(handoff).getByText('USDC, USDT')).toBeVisible();
    expect(within(handoff).getByText(paymentWallet)).toBeVisible();
    expect(within(handoff).getByText(redemptionWallet)).toBeVisible();
    expect(within(handoff).getByText('14 days')).toBeVisible();
    expect(within(handoff).getByText('Lock until stablecoin payout is complete, then burn')).toBeVisible();
    expect(screen.getByLabelText('Project status')).toHaveTextContent('Contract Template (Sub-Redemption)');
    expect(screen.getByLabelText('Project status')).toHaveTextContent('Available');

    fireEvent.click(within(screen.getByLabelText('Tokenisation lifecycle tabs')).getByRole('button', { name: /Subscription/ }));
    fireEvent.change(screen.getByLabelText('Payment per token'), { target: { value: '' } });

    expect(screen.getByText('Payment per token must be greater than zero.')).toBeVisible();
    expect(screen.getByLabelText('Template handoff blocking items')).toHaveTextContent(
      'Subscription: Payment per token must be greater than zero.',
    );
    expect(screen.getByLabelText('Project status')).toHaveTextContent('Draft');
  });

  it('prepares Allocation / Mint readiness from Investor Wallets and Subscription without live mint execution', () => {
    const investorWallet = '0x3333333333333333333333333333333333333333';
    const paymentWallet = '0x4444444444444444444444444444444444444444';
    render(<App />);

    fireEvent.click(within(screen.getByLabelText('Tokenisation lifecycle tabs')).getByRole('button', { name: /Investor Wallets/ }));
    const registry = screen.getByLabelText('Investor Wallets workspace');
    fireEvent.change(within(registry).getByLabelText('Investor wallet address'), { target: { value: investorWallet } });
    fireEvent.click(within(registry).getByRole('button', { name: 'Add wallet' }));

    fireEvent.click(within(registry).getByRole('button', { name: 'Use for Allocation / Mint' }));
    const allocationMintPanel = screen.getByLabelText('Allocation Mint workspace');
    expect(screen.getByRole('heading', { name: 'Allocation / Mint setup' })).toBeVisible();
    expect(within(allocationMintPanel).getByLabelText('Allocation target wallet')).toHaveValue(investorWallet);
    expect(within(allocationMintPanel).getByText('Complete Subscription parameters before Allocation / Mint.')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Contract operations' })).toBeVisible();
    expect(screen.getByLabelText('Project status')).toHaveTextContent('Allocation / Mint');
    expect(screen.getByLabelText('Project status')).toHaveTextContent('Allocation setup needs review');

    fireEvent.click(within(screen.getByLabelText('Tokenisation lifecycle tabs')).getByRole('button', { name: /Subscription/ }));
    const subscription = screen.getByLabelText('Subscription workspace');
    fireEvent.change(within(subscription).getByLabelText('Permitted stablecoins'), { target: { value: 'usdc' } });
    fireEvent.change(within(subscription).getByLabelText('Subscription window'), { target: { value: 'Monthly: first five business days' } });
    fireEvent.change(within(subscription).getByLabelText('Minimum subscription amount'), { target: { value: '25000' } });
    fireEvent.change(within(subscription).getByLabelText('Payment wallet / contract address'), { target: { value: paymentWallet } });
    fireEvent.change(within(subscription).getByLabelText('Payment per token'), { target: { value: '1.025' } });

    fireEvent.click(within(screen.getByLabelText('Tokenisation lifecycle tabs')).getByRole('button', { name: /Contract Ops/ }));
    const readyAllocationMintPanel = screen.getByLabelText('Allocation Mint workspace');
    fireEvent.change(within(readyAllocationMintPanel).getByLabelText('Token allocation amount'), { target: { value: '1250' } });

    expect(within(readyAllocationMintPanel).getByText('Allocation / Mint parameters are ready for review.')).toBeVisible();
    expect(within(readyAllocationMintPanel).getByText(`Allocation ready for 1250 token(s) to ${investorWallet}.`)).toBeVisible();
    expect(screen.getByLabelText('Lifecycle snapshot')).toHaveTextContent('Allocation / Mint');
    expect(screen.getByLabelText('Lifecycle snapshot')).toHaveTextContent('Ready for review');
    expect(screen.getByLabelText('Project status')).toHaveTextContent('Allocation / Mint Parameters');
    expect(screen.getByLabelText('Project status')).toHaveTextContent('Available');
    expect(within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: 'Submit Allocation / Mint' })).toBeDisabled();
    expect(within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: 'Submit Allocation / Mint' })).toHaveAttribute(
      'title',
      'Confirm wallet-signed Sepolia deployment evidence before Allocation / Mint.',
    );

    fireEvent.click(within(screen.getByLabelText('Tokenisation lifecycle tabs')).getByRole('button', { name: /Subscription/ }));
    fireEvent.change(screen.getByLabelText('Payment per token'), { target: { value: '' } });
    fireEvent.click(within(screen.getByLabelText('Tokenisation lifecycle tabs')).getByRole('button', { name: /Contract Ops/ }));

    expect(screen.getByLabelText('Allocation Mint workspace')).toHaveTextContent(
      'Complete Subscription parameters before Allocation / Mint.',
    );
    expect(screen.getByLabelText('Project status')).toHaveTextContent('Allocation setup needs review');
  });

  it('saves the shared lifecycle workspace snapshot through the backend persistence API', async () => {
    const investorWallet = '0x3333333333333333333333333333333333333333';
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        ok: true,
        data: {
          project: {
            id: 'usequities',
            name: 'Alpha Income Fund I',
            investorCap: 50,
            createdAtIso: '2026-06-07T00:00:00.000Z',
            updatedAtIso: '2026-06-07T00:00:00.000Z',
          },
          snapshot: {
            id: 'usequities-snapshot-1',
            projectId: 'usequities',
            version: 1,
            source: 'user_action',
            lifecycleState: {
              investorRegistryEntries: [
                {
                  id: 'investor-wallet-1',
                  walletAddress: investorWallet,
                  status: 'ready_to_whitelist',
                  source: 'manual',
                },
              ],
              subscriptionParameters: { permittedStablecoins: [] },
              redemptionParameters: {},
              maturityParameters: {},
              allocationMintParameters: {},
            },
            investorWalletCount: 1,
            createdAtIso: '2026-06-07T00:00:00.000Z',
          },
          investorWallets: [],
        },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    fireEvent.click(within(screen.getByLabelText('Tokenisation lifecycle tabs')).getByRole('button', { name: /Investor Wallets/ }));
    fireEvent.change(screen.getByLabelText('Investor wallet address'), { target: { value: investorWallet } });
    fireEvent.click(screen.getByRole('button', { name: 'Add wallet' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save snapshot' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Workspace persistence status')).toHaveTextContent(
        'Snapshot v1 saved. Evidence remains local-session only.',
      );
    });

    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:5174/api/workspace/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.any(String),
    });
    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(requestBody).toMatchObject({
      projectId: 'usequities',
      projectName: 'Alpha Income Fund I',
      source: 'user_action',
      productSetupRecord: {
        fields: {
          product_name: {
            value: 'MILA Income Fund',
            status: 'system_default',
          },
          protocol_base: {
            value: 'ERC-3643',
          },
          prototype_network: {
            value: 'Sepolia testnet',
          },
        },
      },
      lifecycleState: {
        investorRegistryEntries: [
          {
            walletAddress: investorWallet,
            status: 'ready_to_whitelist',
          },
        ],
      },
    });
    expect(JSON.stringify(requestBody)).not.toMatch(/privateKey|signedPayload/i);
  });

  it('loads the latest workspace snapshot into the shared lifecycle state and resets local-only artifacts', async () => {
    const investorWallet = '0x7777777777777777777777777777777777777777';
    const productSetupRecord = createTestProductSetupRecord();
    productSetupRecord.fields.subscription_stablecoins = {
      ...productSetupRecord.fields.subscription_stablecoins,
      value: ['USDC'],
      status: 'user_confirmed',
      sourceType: 'user_confirmation',
      sourceRef: 'test_confirmation',
      confidence: 0.96,
      confirmedByUser: true,
    };
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        ok: true,
        data: {
          project: {
            id: 'usequities',
            name: 'Alpha Income Fund I',
            investorCap: 50,
            createdAtIso: '2026-06-07T00:00:00.000Z',
            updatedAtIso: '2026-06-07T00:00:00.000Z',
          },
          snapshot: {
            id: 'usequities-snapshot-2',
            projectId: 'usequities',
            version: 2,
            source: 'user_action',
            lifecycleState: {
              investorRegistryEntries: [
                {
                  id: 'investor-wallet-7',
                  label: 'Investor 07',
                  walletAddress: investorWallet,
                  status: 'ready_to_whitelist',
                  source: 'manual',
                },
              ],
              subscriptionParameters: {
                permittedStablecoins: ['USDC'],
                subscriptionWindow: 'Monthly',
                minimumSubscriptionAmount: '25000',
                paymentAddress: '0x4444444444444444444444444444444444444444',
                paymentPerToken: '1.025',
              },
              redemptionParameters: {},
              maturityParameters: {},
              allocationMintParameters: {},
            },
            productSetupRecord,
            investorWalletCount: 1,
            createdAtIso: '2026-06-07T00:00:00.000Z',
          },
          investorWallets: [],
        },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Load latest' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Workspace persistence status')).toHaveTextContent(
        'Snapshot v2 loaded. Local-only wallet evidence was reset.',
      );
    });

    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:5174/api/workspace/load-latest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: 'usequities' }),
    });
    fireEvent.click(within(screen.getByLabelText('Tokenisation lifecycle tabs')).getByRole('button', { name: /Investor Wallets/ }));
    expect(screen.getByLabelText('Investor Wallets workspace')).toHaveTextContent('Investor 07');
    expect(screen.getByLabelText('Investor Wallets workspace')).toHaveTextContent(investorWallet);
    fireEvent.click(within(screen.getByLabelText('Tokenisation lifecycle tabs')).getByRole('button', { name: /Subscription/ }));
    expect(screen.getByLabelText('Permitted stablecoins')).toHaveValue('USDC');
    expect(screen.getByLabelText('Subscription workspace')).toHaveTextContent('Subscription parameters are ready for template handoff.');
    fireEvent.click(within(screen.getByLabelText('Tokenisation lifecycle tabs')).getByRole('button', { name: /Product Setup/ }));
    expect(screen.getByLabelText('Product requirements board')).toHaveTextContent('Subscription stablecoins');
    expect(screen.getByLabelText('Product requirements board')).toHaveTextContent('USDC');
    const walletCapture = within(screen.getByLabelText('Product Setup wallet capture'));
    const subscriptionWalletInput = walletCapture.getByLabelText('Subscription receiving wallet');
    expect(subscriptionWalletInput).toHaveValue('0x4444444444444444444444444444444444444444');
    fireEvent.change(subscriptionWalletInput, { target: { value: '' } });
    expect(subscriptionWalletInput).toHaveValue('');
  });

  it('saves generated artifacts from the Evidence tab after establishing a workspace snapshot', async () => {
    const smartContractArtifactSpec = {
      specId: 'smart-contract-artifact-spec-engineering-brief-1',
      projectId: 'brief-1',
      projectName: 'MILA Income Fund',
      status: 'ready',
      eventModel: {
        customEvents: ['ValuationUpdated'],
      },
    };
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url.endsWith('/api/prd/engineering-brief')) {
        return Promise.resolve(createJsonResponse({ ok: true, data: engineeringBrief }));
      }

      if (url.endsWith('/api/smart-contract/artifact-spec')) {
        return Promise.resolve(createJsonResponse({ ok: true, data: smartContractArtifactSpec }));
      }

      if (url.endsWith('/api/smart-contract/artifact')) {
        return Promise.resolve(
          createJsonResponse({
            ok: true,
            data: {
              artifactPackage: {
                artifactId: 'contract-artifact-smart-contract-artifact-spec-engineering-brief-1',
                specId: smartContractArtifactSpec.specId,
                projectId: 'brief-1',
                projectName: 'MILA Income Fund',
                status: 'generated',
                sourceModel: {
                  sourceFiles: [{ path: 'contracts/MILARestrictedIncomeFundToken.preview.sol' }],
                },
              },
              checkResult: {
                checkId: 'contract-check-smart-contract-artifact-spec-engineering-brief-1',
                artifactId: 'contract-artifact-smart-contract-artifact-spec-engineering-brief-1',
                specId: smartContractArtifactSpec.specId,
                status: 'passed',
                summary:
                  'Deterministic spec-consistency/static-preview checking only. Not a production security audit, compiler result, deployment approval, wallet-signing proof, or legal/compliance opinion.',
              },
              evidenceLite: {
                evidenceId: 'evidence-lite-smart-contract-artifact-spec-engineering-brief-1',
                artifactId: 'contract-artifact-smart-contract-artifact-spec-engineering-brief-1',
                specId: smartContractArtifactSpec.specId,
                checkId: 'contract-check-smart-contract-artifact-spec-engineering-brief-1',
                status: 'ready',
                evidenceItems: [{ id: 'evidence-spec-profile' }],
                eventEvidenceRefs: [{ eventName: 'ValuationUpdated' }],
              },
            },
          }),
        );
      }

      if (url.endsWith('/api/workspace/save')) {
        expect(init?.body).toEqual(expect.stringContaining('"projectId":"usequities"'));
        return Promise.resolve(
          createJsonResponse({
            ok: true,
            data: {
              project: {
                id: 'usequities',
                name: 'Alpha Income Fund I',
                investorCap: 50,
                createdAtIso: '2026-06-07T00:00:00.000Z',
                updatedAtIso: '2026-06-07T00:00:00.000Z',
              },
              snapshot: {
                id: 'usequities-snapshot-1',
                projectId: 'usequities',
                version: 1,
                source: 'user_action',
                lifecycleState: {
                  investorRegistryEntries: [],
                  subscriptionParameters: { permittedStablecoins: [] },
                  redemptionParameters: {},
                  maturityParameters: {},
                  allocationMintParameters: {},
                },
                investorWalletCount: 0,
                createdAtIso: '2026-06-07T00:00:00.000Z',
              },
              investorWallets: [],
            },
          }),
        );
      }

      if (url.endsWith('/api/workspace/artifacts/save')) {
        const body = JSON.parse(String(init?.body));
        expect(body.projectId).toBe('usequities');
        expect(body.records.map((record: { artifactType: string }) => record.artifactType)).toEqual([
          'requirement_brief',
          'engineering_brief',
          'smart_contract_spec',
          'artifact_preview',
          'check_result',
          'evidence_lite',
        ]);
        expect(JSON.stringify(body)).not.toMatch(/privateKey|signedPayload/i);

        return Promise.resolve(
          createJsonResponse({
            ok: true,
            data: {
              projectId: 'usequities',
              latestSnapshotVersion: 1,
              artifactRecords: body.records.map((record: { artifactType: string; artifactPayload: unknown }, index: number) => ({
                id: `artifact-record-${index + 1}`,
                projectId: 'usequities',
                artifactType: record.artifactType,
                artifactId: `artifact-${index + 1}`,
                artifactStatus: 'generated',
                lifecycleSnapshotVersion: 1,
                lifecycleContextStatus: 'current_context',
                contentHash: `${index}`.padStart(64, 'a'),
                artifactPayload: record.artifactPayload,
                createdAtIso: '2026-06-07T00:00:00.000Z',
                updatedAtIso: '2026-06-07T00:00:00.000Z',
              })),
            },
          }),
        );
      }

      return Promise.resolve(createJsonResponse({ ok: false, error: { code: 'UNEXPECTED', message: 'Unexpected route.' } }, { status: 400 }));
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    await completeSmartContractPreparation();
    fireEvent.click(within(screen.getByLabelText('Tokenisation lifecycle tabs')).getByRole('button', { name: /Evidence/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Save generated artifacts' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Evidence Vault workspace')).toHaveTextContent('6 generated artifact record(s) saved.');
    });
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual(
      expect.arrayContaining([
        'http://127.0.0.1:5174/api/workspace/save',
        'http://127.0.0.1:5174/api/workspace/artifacts/save',
      ]),
    );
  });

  it('completes the golden lifecycle flow into wallet-intent review and locked operations without execution claims', async () => {
    let resolveArtifactSpec: (value: Response) => void = () => undefined;
    const smartContractArtifactSpec = {
      specId: 'smart-contract-artifact-spec-engineering-brief-1',
      projectId: 'brief-1',
      projectName: 'MILA Income Fund',
      status: 'ready',
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
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url.endsWith('/api/prd/engineering-brief')) {
        return Promise.resolve(createJsonResponse({ ok: true, data: engineeringBrief }));
      }

      if (url.endsWith('/api/smart-contract/artifact-spec')) {
        expect(init?.body).toEqual(expect.stringContaining('"engineeringBrief"'));
        expect(init?.body).toEqual(expect.stringContaining('"approvalStatus":"approved"'));
        return new Promise<Response>((resolve) => {
          resolveArtifactSpec = resolve;
        });
      }

      if (url.endsWith('/api/smart-contract/artifact')) {
        expect(init?.body).toEqual(expect.stringContaining('"smartContractArtifactSpec"'));
        expect(init?.body).toEqual(expect.stringContaining('"smart-contract-artifact-spec-engineering-brief-1"'));
        return Promise.resolve(
          createJsonResponse({
            ok: true,
      data: {
        artifactPackage: {
          artifactId: 'contract-artifact-smart-contract-artifact-spec-engineering-brief-1',
          specId: smartContractArtifactSpec.specId,
          projectId: 'brief-1',
          projectName: 'MILA Income Fund',
          status: 'generated',
          sourceModel: {
            sourceFiles: [{ path: 'contracts/MILARestrictedIncomeFundToken.preview.sol' }],
          },
        },
              checkResult: {
                checkId: 'contract-check-smart-contract-artifact-spec-engineering-brief-1',
                artifactId: 'contract-artifact-smart-contract-artifact-spec-engineering-brief-1',
          specId: smartContractArtifactSpec.specId,
          status: 'passed',
          summary:
            'Deterministic spec-consistency/static-preview checking only. Not a production security audit, compiler result, deployment approval, wallet-signing proof, or legal/compliance opinion.',
        },
              evidenceLite: {
                evidenceId: 'evidence-lite-smart-contract-artifact-spec-engineering-brief-1',
                artifactId: 'contract-artifact-smart-contract-artifact-spec-engineering-brief-1',
                specId: smartContractArtifactSpec.specId,
          checkId: 'contract-check-smart-contract-artifact-spec-engineering-brief-1',
          status: 'ready',
          evidenceItems: [{ id: 'evidence-spec-profile' }],
          eventEvidenceRefs: [{ eventName: 'ValuationUpdated' }],
        },
            },
          }),
        );
      }

      return Promise.resolve(createJsonResponse({ ok: false, error: { code: 'UNEXPECTED', message: 'Unexpected route.' } }, { status: 400 }));
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Create Requirement Doc' }));
    fireEvent.click(screen.getByRole('button', { name: 'Generate Engineering Brief' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Prepare Smart Contract Spec' })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Prepare Smart Contract Spec' }));
    expect(screen.getByRole('button', { name: 'Preparing Smart Contract Spec...' })).toBeDisabled();

    resolveArtifactSpec(createJsonResponse({ ok: true, data: smartContractArtifactSpec }));

    await waitFor(() => {
      expect(
        screen.getByLabelText('Generated smart contract artifacts'),
      ).toBeVisible();
    });
    const generatedArtifacts = within(screen.getByLabelText('Generated smart contract artifacts'));

    const connectWalletButton = screen.getByRole('button', { name: 'Connect Wallet for Sepolia Check' });
    expect(connectWalletButton).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Connect Wallet for Sepolia Check' })).toBeVisible();
    expect(screen.getByText('Backend artifacts generated.')).toBeVisible();
    expect(screen.getByText('Smart contract preparation review')).toBeVisible();
    expect(screen.getByText('Preview')).toBeVisible();
    expect(generatedArtifacts.getByText('Smart Contract Spec')).toBeVisible();
    expect(screen.getByText('restricted_erc20 / ERC-20-compatible profile.')).toBeVisible();
    expect(screen.getByText('Artifact Preview')).toBeVisible();
    expect(screen.getByText('Preview only')).toBeVisible();
    expect(screen.getByText('1 deterministic preview file(s). Preview artifact not deployed or audited.')).toBeVisible();
    expect(screen.getByText('Check Result')).toBeVisible();
    expect(screen.getByText('Spec-consistency passed')).toBeVisible();
    expect(screen.getByText('Evidence-Lite')).toBeVisible();
    expect(screen.getByText('Draft evidence linked')).toBeVisible();
    expect(screen.getByText('Local Compile/Test')).toBeVisible();
    expect(screen.getByText('Hardhat fixture compiles and local contract tests pass. Tested capabilities: ERC-20 basics, whitelist restrictions, issuer mint/allocation, valuation event, distribution event, pause/unpause, and access control.')).toBeVisible();
    expect(screen.getByText('Known local foundation result')).toBeVisible();
    expect(generatedArtifacts.getByText('Deployment Gate Review')).toBeVisible();
    expect(generatedArtifacts.getAllByText('Review-ready').length).toBeGreaterThan(0);
    expect(generatedArtifacts.getByText('Pre-deployment readiness: Complete. Deployment execution: Blocked.')).toBeVisible();
    expect(generatedArtifacts.getByText('Deployment gate')).toBeVisible();
    expect(generatedArtifacts.getByText('Wallet Signing Intent')).toBeVisible();
    expect(
      generatedArtifacts.getByText(
        'Wallet-signed deployment and selected Sepolia operations use the user wallet. Backend never holds private keys.',
      ),
    ).toBeVisible();
    expect(generatedArtifacts.getByText('Wallet signing intent')).toBeVisible();
    expect(generatedArtifacts.getByText('Wallet Connection')).toBeVisible();
    expect(generatedArtifacts.getByText('Not detected')).toBeVisible();
    expect(generatedArtifacts.getByText('Wallet chain: Unknown. No wallet address. Connection only; no signing or deployment.')).toBeVisible();
    expect(generatedArtifacts.getByText('Wallet connection')).toBeVisible();
	    expect(generatedArtifacts.getByText('Smart Contract Operations')).toBeVisible();
	    expect(generatedArtifacts.getByText('Waiting for deployment evidence')).toBeVisible();
    expect(
      generatedArtifacts.getByText(
        'Contract Ops exposes Record NAV Event, Whitelist Wallet, and Allocation / Mint when their wallet, deployment, ABI, parameter, and evidence gates are satisfied. Other operations need explicit adapters before release.',
      ),
    ).toBeVisible();
    expect(screen.getByText('Deployment / Signing / Audit')).toBeVisible();
    expect(screen.getByText('Not audited. No production approval. Wallet connection alone does not execute deployment or operations.')).toBeVisible();
    expect(screen.getByTestId('engineer-answer')).toHaveTextContent('Smart contract preparation is complete for demo review');
    expect(screen.getByTestId('engineer-answer')).toHaveTextContent('represented the known local compile/test foundation as passed');
    expect(screen.getByText('Recommended next action')).toBeVisible();
    expect(screen.getByText('Deployment Gate and wallet-signing design remain later steps. Local compile/test status does not imply deployment readiness.')).toBeVisible();
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Artifact Preview');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Smart Contract Spec');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Generated');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Artifact Preview');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Check Result');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Evidence-Lite');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Local Compile/Test');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Hardhat fixture');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('local contract tests');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent(
      'Tested capabilities: ERC-20 basics, whitelist restrictions, issuer mint/allocation, valuation event, distribution event, pause/unpause, and access control.',
    );
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Deployment Gate Review');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Pre-deployment readiness: Complete');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Deployment execution: Blocked');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Wallet Signing Intent');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Wallet-signed deployment');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Backend never holds private keys');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Wallet Connection');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Not detected');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Wallet chain: Unknown');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('No wallet address');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('No contract address');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('No transaction hash');
    fireEvent.click(within(screen.getByLabelText('Tokenisation lifecycle tabs')).getByRole('button', { name: /Contract Ops/ }));
    expect(screen.getByText('Contract operations')).toBeVisible();
    expect(screen.getByLabelText('Contract Ops summary')).toHaveTextContent('Waiting for deployment evidence');
    expect(
      screen.getAllByText(
        'Contract Ops exposes Record NAV Event, Whitelist Wallet, and Allocation / Mint when their wallet, deployment, ABI, parameter, and evidence gates are satisfied. Other operations need explicit adapters before release.',
      ).length,
    ).toBeGreaterThan(0);
    expect(within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: 'Record NAV Event' })).toBeDisabled();
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Wallet Connection');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Not detected');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('No wallet address');
    expect(screen.getByLabelText('Contract Ops summary')).toHaveTextContent('No receipt-returned contract address yet.');
    expect(screen.getAllByText('Deployment Evidence').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Deployment Evidence: Not available');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Evidence strength: None');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Local-session evidence');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Transaction hash source: Absent');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Contract address source: Absent');
    expect(screen.getByLabelText('Contract Ops evidence summary')).toHaveTextContent('Deployment evidence: Deployment Evidence: Not available');
    expect(screen.getByLabelText('Contract Ops evidence summary')).toHaveTextContent('Record NAV: Record NAV operation not started');
    expect(screen.getByLabelText('Contract Ops evidence summary')).toHaveTextContent(
      'Safety: user wallet signs, backend holds no private keys, Sepolia only.',
    );
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('No transaction hash.');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('valuation event');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('pause/unpause');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('No contract address');
    const rightRail = screen.getByLabelText('Project status');
    const scp = screen.getByTestId('smart-contract-control');
    expect(within(rightRail).queryByRole('button', { name: /wallet/i })).not.toBeInTheDocument();
    expect(within(scp).getByRole('button', { name: 'Whitelist Wallet' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Connect Wallet for Sepolia Check' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: /sign/i })).not.toBeInTheDocument();
    expect(getContractOpsDeployButton()).toBeDisabled();
    expect(screen.queryByText(/0x[a-fA-F0-9]{6,}/)).not.toBeInTheDocument();
    expect(screen.queryByText(/txHash/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ready to sign|sign now|ready to deploy|ready for signature|production ready|mainnet ready/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Wallet connected$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Submitted transaction:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Confirmed transaction:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Signed payload:/i)).not.toBeInTheDocument();
    expectNoPrematureBlockchainExecutionClaims(document.body.textContent ?? '');
    expect(fetchMock.mock.calls.map(([url]) => String(url)).join(' ')).not.toMatch(/hardhat|contracts:build|test:contracts/i);
  });

  it('connects a mocked Sepolia wallet from the central workflow surface without unlocking execution', async () => {
    const { provider, calls } = createMockWalletProvider();
    stubBrowserWallet(provider);
    stubSmartContractPreparationFetch();

    render(<App />);
    await completeSmartContractPreparation();

    const generatedArtifacts = within(screen.getByLabelText('Generated smart contract artifacts'));
    const rightRail = screen.getByLabelText('Project status');
    const scp = screen.getByTestId('smart-contract-control');

    expect(screen.queryByText(/0x1111/i)).not.toBeInTheDocument();
    expect(generatedArtifacts.getByText('Wallet Connection')).toBeVisible();
    expect(generatedArtifacts.getByText('Not connected')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Connect Wallet for Sepolia Check' })).toBeEnabled();
    expect(within(rightRail).queryByRole('button', { name: /wallet/i })).not.toBeInTheDocument();
    expect(within(scp).getByRole('button', { name: 'Whitelist Wallet' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Connect Wallet for Sepolia Check' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Wallet Connected on Sepolia' })).toBeDisabled();
    });

    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Wallet Connection');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Sepolia');
    expect(screen.getByLabelText('Contract Ops summary')).toHaveTextContent('0x1111...1111');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Wallet-signed deployment');
    expect(screen.getByLabelText('Contract Ops summary')).toHaveTextContent('Deployment execution not started');
    expect(screen.getByLabelText('Contract Ops summary')).toHaveTextContent('Waiting for deployment evidence');
    expect(screen.getByTestId('engineer-answer')).toHaveTextContent('Wallet connection check updated');
    expect(screen.getByTestId('engineer-answer')).toHaveTextContent('It does not sign, deploy, submit a transaction, or unlock Smart Contract Operations.');
    expect(calls).toContain('eth_requestAccounts');
    expect(calls).toContain('eth_chainId');
    expect(calls).not.toContain('eth_sendTransaction');
    expect(calls).not.toContain('personal_sign');
    expect(calls).not.toContain('eth_sign');
    expect(calls).not.toContain('eth_signTypedData');
    expect(screen.queryByText(/contract address: 0x/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/transaction hash: 0x/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Signed payload:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Submitted transaction:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Confirmed transaction:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ready to sign|sign now|ready to deploy|deploy now|ready for signature|production ready|mainnet ready/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Deployed$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Live$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Verified$/i)).not.toBeInTheDocument();
  });

  it('requests wallet-signed Sepolia deployment from the central workflow and renders provider-returned identifiers only after responses', async () => {
    const { provider, calls, transactionParams } = createMockWalletProvider();
    stubBrowserWallet(provider);
    stubSmartContractPreparationFetch();

    render(<App />);
    await completeSmartContractPreparation();

    expect(getContractOpsDeployButton()).toBeDisabled();
    expect(screen.queryByText(/0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Connect Wallet for Sepolia Check' }));

    await waitFor(() => {
      expect(getContractOpsDeployButton()).toBeEnabled();
    });

    acknowledgeContractOpsProductSetupWarnings();
    const deploymentButton = getContractOpsDeployButton();
    fireEvent.click(deploymentButton);
    fireEvent.click(deploymentButton);

    await waitFor(() => {
      expect(screen.getAllByText('Deployment confirmed on Sepolia').length).toBeGreaterThan(0);
    });

    expect(calls.filter((method) => method === 'eth_sendTransaction')).toHaveLength(1);
    expect(calls).toEqual(
      expect.arrayContaining(['eth_accounts', 'eth_chainId', 'eth_requestAccounts', 'eth_sendTransaction', 'eth_getTransactionReceipt']),
    );
    expect(transactionParams).toHaveLength(1);
    const transaction = (transactionParams[0] as Array<Record<string, unknown>>)[0];
    expect(transaction.from).toBe(connectedWalletAddress);
    expect(transaction.to).toBeUndefined();
    expect(transaction.value).toBe('0x0');
    expect(String(transaction.data)).toMatch(/^0x[0-9a-f]+/i);
    expect(screen.getAllByText(/Transaction hash: 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Contract address: 0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Deployment Evidence: Confirmed from receipt').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Confirmed receipt');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Provider returned');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Receipt returned');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Local-session evidence');
    expect(screen.getByLabelText('Contract Ops summary')).toHaveTextContent('Gated operations available');
    expect(within(screen.getByLabelText('Engineering Bot actions')).queryByRole('button', { name: /Record NAV/i })).not.toBeInTheDocument();
    expect(within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: 'Record NAV Event' })).toBeEnabled();
    expect(screen.queryByText(/durable evidence|persistent evidence|permanent evidence/i)).not.toBeInTheDocument();
    expect(within(screen.getByLabelText('Project status')).queryByRole('button', { name: /deploy/i })).not.toBeInTheDocument();
    expect(within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: /Deployment Confirmed on Sepolia/i })).toBeDisabled();
    expect(screen.queryByText(/production ready|mainnet ready|audit passed|security approved/i)).not.toBeInTheDocument();
  });

  it('records the first wallet-signed NAV event from Contract Ops only after confirmed deployment evidence', async () => {
    const { provider, calls, transactionParams } = createMockWalletProvider();
    stubBrowserWallet(provider);
    stubSmartContractPreparationFetch();

    render(<App />);
    await completeSmartContractPreparation();

    expect(within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: 'Record NAV Event' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Connect Wallet for Sepolia Check' }));

    await waitFor(() => {
      expect(getContractOpsDeployButton()).toBeEnabled();
    });

    acknowledgeContractOpsProductSetupWarnings();
    fireEvent.click(getContractOpsDeployButton());

    await waitFor(() => {
      expect(within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: 'Record NAV Event' })).toBeEnabled();
    });

    expect(within(screen.getByLabelText('Engineering Bot actions')).queryByRole('button', { name: /Record NAV/i })).not.toBeInTheDocument();
    expect(within(screen.getByLabelText('Project status')).queryByRole('button', { name: /Record NAV/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Operation transaction hash: 0x/i)).not.toBeInTheDocument();

    const recordNavButton = within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: 'Record NAV Event' });
    fireEvent.click(recordNavButton);
    fireEvent.click(recordNavButton);

    await waitFor(() => {
      expect(screen.getAllByText('Record NAV confirmed on Sepolia').length).toBeGreaterThan(0);
    });

    expect(calls.filter((method) => method === 'eth_sendTransaction')).toHaveLength(2);
    expect(transactionParams).toHaveLength(2);
    const operationTransaction = (transactionParams[1] as Array<Record<string, unknown>>)[0];
    expect(operationTransaction.from).toBe(connectedWalletAddress);
    expect(operationTransaction.to).toBe('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
    expect(operationTransaction.value).toBe('0x0');
    expect(String(operationTransaction.data)).toMatch(/^0x/);
    expect(screen.getByLabelText('Contract Ops evidence summary')).toHaveTextContent('Record NAV: Record NAV confirmed on Sepolia');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Operation evidence: Local session only');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Transaction hash source: Provider returned');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Receipt source: Provider receipt');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Event evidence: Receipt confirmed');
    expect(screen.getByLabelText('Contract Ops evidence summary')).toHaveTextContent('Record NAV: Record NAV confirmed on Sepolia');
    expect(within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: 'Record NAV Confirmed on Sepolia' })).toBeDisabled();
    expect(within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: 'Submit Allocation / Mint' })).toBeDisabled();
    expect(screen.queryByText(/production ready|mainnet ready|audit passed|security approved|operation suite unlocked/i)).not.toBeInTheDocument();
  });

  it('whitelists a target wallet from Contract Ops only after explicit target input and confirmed deployment evidence', async () => {
    const firstTargetWallet = '0x3333333333333333333333333333333333333333';
    const secondTargetWallet = '0x4444444444444444444444444444444444444444';
    const { provider, calls, transactionParams } = createMockWalletProvider({
      transactionHash: '0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
    });
    stubBrowserWallet(provider);
    stubSmartContractPreparationFetch();

    render(<App />);
    await completeSmartContractPreparation();

    expect(within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: 'Whitelist Wallet' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Connect Wallet for Sepolia Check' }));

    await waitFor(() => {
      expect(getContractOpsDeployButton()).toBeEnabled();
    });

    acknowledgeContractOpsProductSetupWarnings();
    fireEvent.click(getContractOpsDeployButton());

    await waitFor(() => {
      expect(within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: 'Whitelist Wallet' })).toBeDisabled();
    });

    expect(within(screen.getByLabelText('Engineering Bot actions')).queryByRole('button', { name: /Whitelist/i })).not.toBeInTheDocument();
    expect(within(screen.getByLabelText('Project status')).queryByRole('button', { name: /Whitelist/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Whitelist transaction hash: 0x/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Whitelist target wallet'), {
      target: { value: '0x1234' },
    });
    expect(within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: 'Whitelist Wallet' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Whitelist target wallet'), {
      target: { value: '0x5555555555555555555555555555555555555555' },
    });
    expect(within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: 'Whitelist Wallet' })).toBeDisabled();
    expect(within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: 'Whitelist Wallet' })).toHaveAttribute(
      'title',
      'Register this wallet in Investor Wallets before whitelisting.',
    );

    fireEvent.click(within(screen.getByLabelText('Tokenisation lifecycle tabs')).getByRole('button', { name: /Investor Wallets/ }));
    const registry = screen.getByLabelText('Investor Wallets workspace');
    fireEvent.change(within(registry).getByLabelText('Investor wallet address'), {
      target: { value: firstTargetWallet },
    });
    fireEvent.click(within(registry).getByRole('button', { name: 'Add wallet' }));
    fireEvent.change(within(registry).getByLabelText('Investor wallet address'), {
      target: { value: secondTargetWallet },
    });
    fireEvent.click(within(registry).getByRole('button', { name: 'Add wallet' }));
    expect(within(registry).getAllByText('Ready to whitelist').length).toBeGreaterThanOrEqual(2);

    fireEvent.click(within(registry).getAllByRole('button', { name: 'Use for wallet whitelist' })[0]);
    expect(screen.getByLabelText('Whitelist target wallet')).toHaveValue(firstTargetWallet);

    await waitFor(() => {
      expect(within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: 'Whitelist Wallet' })).toBeEnabled();
    });

    const whitelistButton = within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: 'Whitelist Wallet' });
    fireEvent.click(whitelistButton);
    fireEvent.click(whitelistButton);

    await waitFor(() => {
      expect(screen.getAllByText('Wallet whitelist confirmed on Sepolia').length).toBeGreaterThan(0);
    });

    fireEvent.click(within(screen.getByLabelText('Tokenisation lifecycle tabs')).getByRole('button', { name: /Investor Wallets/ }));
    const updatedRegistry = screen.getByLabelText('Investor Wallets workspace');
    await waitFor(() => {
      expect(within(updatedRegistry).getByText('Whitelisted locally')).toBeVisible();
    });
    const updatedHandoffButtons = within(updatedRegistry).getAllByRole('button', { name: 'Use for wallet whitelist' });
    expect(updatedHandoffButtons[0]).toBeDisabled();
    expect(updatedHandoffButtons[1]).toBeEnabled();

    fireEvent.click(updatedHandoffButtons[1]);
    expect(screen.getByLabelText('Whitelist target wallet')).toHaveValue(secondTargetWallet);

    await waitFor(() => {
      expect(within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: 'Whitelist Wallet' })).toBeEnabled();
    });
    fireEvent.change(screen.getByLabelText('Whitelist target wallet'), {
      target: { value: firstTargetWallet },
    });
    expect(within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: 'Whitelist Wallet' })).toBeDisabled();
    expect(within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: 'Whitelist Wallet' })).toHaveAttribute(
      'title',
      'Selected wallet is already whitelisted in this local session.',
    );
    fireEvent.change(screen.getByLabelText('Whitelist target wallet'), {
      target: { value: secondTargetWallet },
    });
    await waitFor(() => {
      expect(within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: 'Whitelist Wallet' })).toBeEnabled();
    });
    fireEvent.click(within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: 'Whitelist Wallet' }));

    await waitFor(() => {
      expect(calls.filter((method) => method === 'eth_sendTransaction')).toHaveLength(3);
    });
    await waitFor(() => {
      expect(screen.getAllByText('Wallet whitelist confirmed on Sepolia').length).toBeGreaterThan(0);
    });

    expect(transactionParams).toHaveLength(3);
    const firstWhitelistTransaction = (transactionParams[1] as Array<Record<string, unknown>>)[0];
    const secondWhitelistTransaction = (transactionParams[2] as Array<Record<string, unknown>>)[0];
    expect(firstWhitelistTransaction.from).toBe(connectedWalletAddress);
    expect(firstWhitelistTransaction.to).toBe('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
    expect(firstWhitelistTransaction.value).toBe('0x0');
    expect(String(firstWhitelistTransaction.data)).toMatch(/^0x/);
    expect(secondWhitelistTransaction.from).toBe(connectedWalletAddress);
    expect(secondWhitelistTransaction.to).toBe('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
    expect(secondWhitelistTransaction.value).toBe('0x0');
    expect(String(secondWhitelistTransaction.data)).toMatch(/^0x/);
    expect(screen.getByLabelText('Contract Ops evidence summary')).toHaveTextContent('Wallet whitelist: Wallet whitelist confirmed on Sepolia');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Wallet whitelist evidence: Local session only');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Transaction hash source: Provider returned');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('WalletWhitelisted event: Not decoded');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Contract authorization is enforced on-chain');
    expect(within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: 'Submit Allocation / Mint' })).toBeDisabled();
    expect(within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: 'Wallet whitelist confirmed on Sepolia' })).toBeDisabled();
    within(screen.getByTestId('smart-contract-control'))
      .getAllByRole('button', { name: /Mint/i })
      .forEach((button) => expect(button).toBeDisabled());
    expect(screen.queryByText(/KYC approved|investor approved|legally eligible|issuer authorized|wallet authorized|production ready|mainnet ready|audit passed|operation suite unlocked/i)).not.toBeInTheDocument();
  });

  it('submits Allocation / Mint only after Sepolia deployment, whitelisted investor, subscription, and allocation gates are ready', async () => {
    const investorWallet = '0x3333333333333333333333333333333333333333';
    const paymentWallet = '0x4444444444444444444444444444444444444444';
    const { provider, calls, transactionParams } = createMockWalletProvider({
      transactionHash: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    });
    stubBrowserWallet(provider);
    stubSmartContractPreparationFetch();

    render(<App />);
    await completeSmartContractPreparation();

    fireEvent.click(screen.getByRole('button', { name: 'Connect Wallet for Sepolia Check' }));
    await waitFor(() => {
      expect(getContractOpsDeployButton()).toBeEnabled();
    });
    acknowledgeContractOpsProductSetupWarnings();
    fireEvent.click(getContractOpsDeployButton());

    await waitFor(() => {
      expect(screen.getAllByText('Deployment confirmed on Sepolia').length).toBeGreaterThan(0);
    });

    fireEvent.click(within(screen.getByLabelText('Tokenisation lifecycle tabs')).getByRole('button', { name: /Investor Wallets/ }));
    const registry = screen.getByLabelText('Investor Wallets workspace');
    fireEvent.change(within(registry).getByLabelText('Investor wallet address'), { target: { value: investorWallet } });
    fireEvent.click(within(registry).getByRole('button', { name: 'Add wallet' }));
    fireEvent.click(within(registry).getByRole('button', { name: 'Use for wallet whitelist' }));

    await waitFor(() => {
      expect(within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: 'Whitelist Wallet' })).toBeEnabled();
    });
    fireEvent.click(within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: 'Whitelist Wallet' }));

    await waitFor(() => {
      expect(screen.getAllByText('Wallet whitelist confirmed on Sepolia').length).toBeGreaterThan(0);
    });

    fireEvent.click(within(screen.getByLabelText('Tokenisation lifecycle tabs')).getByRole('button', { name: /Subscription/ }));
    const subscription = screen.getByLabelText('Subscription workspace');
    fireEvent.change(within(subscription).getByLabelText('Permitted stablecoins'), { target: { value: 'usdc' } });
    fireEvent.change(within(subscription).getByLabelText('Subscription window'), { target: { value: 'Monthly: first five business days' } });
    fireEvent.change(within(subscription).getByLabelText('Minimum subscription amount'), { target: { value: '25000' } });
    fireEvent.change(within(subscription).getByLabelText('Payment wallet / contract address'), { target: { value: paymentWallet } });
    fireEvent.change(within(subscription).getByLabelText('Payment per token'), { target: { value: '1.025' } });

    fireEvent.click(within(screen.getByLabelText('Tokenisation lifecycle tabs')).getByRole('button', { name: /Contract Ops/ }));
    const allocationMintPanel = screen.getByLabelText('Allocation Mint workspace');
    fireEvent.change(within(allocationMintPanel).getByLabelText('Allocation target wallet'), { target: { value: investorWallet } });
    fireEvent.change(within(allocationMintPanel).getByLabelText('Token allocation amount'), { target: { value: '1000' } });

    await waitFor(() => {
      expect(within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: 'Submit Allocation / Mint' })).toBeEnabled();
    });
    expect(within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: 'Submit Allocation / Mint' })).toBeEnabled();

    fireEvent.click(within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: 'Submit Allocation / Mint' }));

    await waitFor(() => {
      expect(screen.getAllByText('Allocation / Mint confirmed on Sepolia').length).toBeGreaterThan(0);
    });

    expect(calls.filter((method) => method === 'eth_sendTransaction')).toHaveLength(3);
    expect(transactionParams).toHaveLength(3);
    const allocationMintTransaction = (transactionParams[2] as Array<Record<string, unknown>>)[0];
    expect(allocationMintTransaction.from).toBe(connectedWalletAddress);
    expect(allocationMintTransaction.to).toBe('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
    expect(allocationMintTransaction.value).toBe('0x0');
    expect(String(allocationMintTransaction.data)).toMatch(/^0x/);
    expect(screen.getByLabelText('Contract Ops evidence summary')).toHaveTextContent('Allocation / Mint: Allocation / Mint confirmed on Sepolia');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Allocation / Mint evidence: Local session only');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('AllocationMinted event: Receipt confirmed');
    expect(screen.queryByText(/production ready|mainnet ready|audit passed|operation suite unlocked/i)).not.toBeInTheDocument();
  });

  it('can whitelist and mint for a second investor after the first investor is confirmed', async () => {
    const investorOne = '0x3333333333333333333333333333333333333333';
    const investorTwo = '0x5555555555555555555555555555555555555555';
    const paymentWallet = '0x4444444444444444444444444444444444444444';
    const { provider, calls, transactionParams } = createMockWalletProvider({
      transactionHash: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    });
    stubBrowserWallet(provider);
    stubSmartContractPreparationFetch();

    render(<App />);
    await completeSmartContractPreparation();

    fireEvent.click(screen.getByRole('button', { name: 'Connect Wallet for Sepolia Check' }));
    await waitFor(() => {
      expect(getContractOpsDeployButton()).toBeEnabled();
    });
    acknowledgeContractOpsProductSetupWarnings();
    fireEvent.click(getContractOpsDeployButton());

    await waitFor(() => {
      expect(screen.getAllByText('Deployment confirmed on Sepolia').length).toBeGreaterThan(0);
    });

    fireEvent.click(within(screen.getByLabelText('Tokenisation lifecycle tabs')).getByRole('button', { name: /Investor Wallets/ }));
    const registry = screen.getByLabelText('Investor Wallets workspace');
    fireEvent.change(within(registry).getByLabelText('Investor wallet address'), { target: { value: investorOne } });
    fireEvent.click(within(registry).getByRole('button', { name: 'Add wallet' }));
    fireEvent.change(within(registry).getByLabelText('Investor wallet address'), { target: { value: investorTwo } });
    fireEvent.click(within(registry).getByRole('button', { name: 'Add wallet' }));

    const whitelistButtons = within(registry).getAllByRole('button', { name: 'Use for wallet whitelist' });
    fireEvent.click(whitelistButtons[0]);
    await waitFor(() => {
      expect(within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: 'Whitelist Wallet' })).toBeEnabled();
    });
    fireEvent.click(within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: 'Whitelist Wallet' }));
    await waitFor(() => {
      expect(screen.getAllByText('Wallet whitelist confirmed on Sepolia').length).toBeGreaterThan(0);
    });

    fireEvent.click(within(screen.getByLabelText('Tokenisation lifecycle tabs')).getByRole('button', { name: /Subscription/ }));
    const subscription = screen.getByLabelText('Subscription workspace');
    fireEvent.change(within(subscription).getByLabelText('Permitted stablecoins'), { target: { value: 'usdc' } });
    fireEvent.change(within(subscription).getByLabelText('Subscription window'), { target: { value: 'Monthly: first five business days' } });
    fireEvent.change(within(subscription).getByLabelText('Minimum subscription amount'), { target: { value: '25000' } });
    fireEvent.change(within(subscription).getByLabelText('Payment wallet / contract address'), { target: { value: paymentWallet } });
    fireEvent.change(within(subscription).getByLabelText('Payment per token'), { target: { value: '1.025' } });

    fireEvent.click(within(screen.getByLabelText('Tokenisation lifecycle tabs')).getByRole('button', { name: /Contract Ops/ }));
    const allocationMintPanel = screen.getByLabelText('Allocation Mint workspace');
    fireEvent.change(within(allocationMintPanel).getByLabelText('Allocation target wallet'), { target: { value: investorOne } });
    fireEvent.change(within(allocationMintPanel).getByLabelText('Token allocation amount'), { target: { value: '1000' } });
    await waitFor(() => {
      expect(within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: 'Submit Allocation / Mint' })).toBeEnabled();
    });
    fireEvent.click(within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: 'Submit Allocation / Mint' }));
    await waitFor(() => {
      expect(screen.getAllByText('Allocation / Mint confirmed on Sepolia').length).toBeGreaterThan(0);
    });

    fireEvent.click(within(screen.getByLabelText('Tokenisation lifecycle tabs')).getByRole('button', { name: /Investor Wallets/ }));
    fireEvent.click(within(screen.getByLabelText('Investor Wallets workspace')).getAllByRole('button', { name: 'Use for wallet whitelist' })[1]);
    await waitFor(() => {
      expect(within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: 'Whitelist Wallet' })).toBeEnabled();
    });
    fireEvent.click(within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: 'Whitelist Wallet' }));
    await waitFor(() => {
      expect(screen.getAllByText('Wallet whitelist confirmed on Sepolia').length).toBeGreaterThan(0);
    });

    fireEvent.click(within(screen.getByLabelText('Tokenisation lifecycle tabs')).getByRole('button', { name: /Contract Ops/ }));
    fireEvent.change(within(screen.getByLabelText('Allocation Mint workspace')).getByLabelText('Allocation target wallet'), {
      target: { value: investorTwo },
    });
    fireEvent.change(within(screen.getByLabelText('Allocation Mint workspace')).getByLabelText('Token allocation amount'), {
      target: { value: '2000' },
    });
    await waitFor(() => {
      expect(within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: 'Submit Allocation / Mint' })).toBeEnabled();
    });
    fireEvent.click(within(screen.getByTestId('smart-contract-control')).getByRole('button', { name: 'Submit Allocation / Mint' }));
    await waitFor(() => {
      expect(calls.filter((method) => method === 'eth_sendTransaction')).toHaveLength(5);
    });

    const firstMintTransaction = (transactionParams[2] as Array<Record<string, unknown>>)[0];
    const secondMintTransaction = (transactionParams[4] as Array<Record<string, unknown>>)[0];
    expect(firstMintTransaction.from).toBe(connectedWalletAddress);
    expect(secondMintTransaction.from).toBe(connectedWalletAddress);
    expect(firstMintTransaction.to).toBe('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
    expect(secondMintTransaction.to).toBe('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
    expect(firstMintTransaction.data).not.toBe(secondMintTransaction.data);
    expect(screen.queryByText(/production ready|mainnet ready|audit passed|operation suite unlocked/i)).not.toBeInTheDocument();
  });

  it('blocks wallet-signed deployment when the wallet is wrong-chain or rejects submission', async () => {
    const wrongChainWallet = createMockWalletProvider({ chainId: '0x1' });
    stubBrowserWallet(wrongChainWallet.provider);
    stubSmartContractPreparationFetch();

    render(<App />);
    await completeSmartContractPreparation();
    fireEvent.click(screen.getByRole('button', { name: 'Connect Wallet for Sepolia Check' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Recheck Wallet Chain' })).toBeEnabled();
    });
    expect(getContractOpsDeployButton()).toBeDisabled();
    expect(wrongChainWallet.calls).not.toContain('eth_sendTransaction');

    cleanup();
    vi.unstubAllGlobals();

    const rejectedDeployment = createMockWalletProvider();
    const originalRequest = rejectedDeployment.provider.request as (args: { method: string; params?: unknown }) => Promise<unknown>;
    rejectedDeployment.provider.request = async (args: { method: string; params?: unknown }) => {
      if (args.method === 'eth_sendTransaction') {
        throw Object.assign(new Error('User rejected deployment'), { code: 4001 });
      }
      return originalRequest(args);
    };
    stubBrowserWallet(rejectedDeployment.provider);
    stubSmartContractPreparationFetch();
    render(<App />);
    await completeSmartContractPreparation();
    fireEvent.click(screen.getByRole('button', { name: 'Connect Wallet for Sepolia Check' }));

    await waitFor(() => {
      expect(getContractOpsDeployButton()).toBeEnabled();
    });

    acknowledgeContractOpsProductSetupWarnings();
    fireEvent.click(getContractOpsDeployButton());

    await waitFor(() => {
      expect(screen.getAllByText('Deployment rejected in wallet').length).toBeGreaterThan(0);
    });
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('No transaction hash.');
    expect(screen.getByLabelText('Contract Ops summary')).toHaveTextContent('No receipt-returned contract address yet.');
  });

  it('shows wrong-chain and rejected wallet states through MILA26-owned statuses', async () => {
    const wrongChainWallet = createMockWalletProvider({ chainId: '0x1' });
    stubBrowserWallet(wrongChainWallet.provider);
    stubSmartContractPreparationFetch();

    render(<App />);
    await completeSmartContractPreparation();
    fireEvent.click(screen.getByRole('button', { name: 'Connect Wallet for Sepolia Check' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Recheck Wallet Chain' })).toBeEnabled();
    });
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Wallet connection');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Wrong chain');
    expect(screen.getByLabelText('Contract Ops summary')).toHaveTextContent('Wrong chain');
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Wallet-signed deployment');
    expect(screen.queryByText(/ready to sign|ready to deploy|contract address: 0x|transaction hash: 0x/i)).not.toBeInTheDocument();

    cleanup();
    vi.unstubAllGlobals();

    const rejectedWallet = createMockWalletProvider({ rejectRequest: true });
    stubBrowserWallet(rejectedWallet.provider);
    stubSmartContractPreparationFetch();
    render(<App />);
    await completeSmartContractPreparation();
    fireEvent.click(screen.getByRole('button', { name: 'Connect Wallet for Sepolia Check' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Rejected');
    });
    expect(screen.getByLabelText('Generated smart contract artifacts')).toHaveTextContent('Unknown');
    expect(screen.queryByText(/User rejected request/)).not.toBeInTheDocument();
    expect(screen.queryByText(/ready to sign|ready to deploy|contract address: 0x|transaction hash: 0x/i)).not.toBeInTheDocument();
  });

  it('shows a safe Smart Contract Spec error without claiming generated readiness', async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.endsWith('/api/prd/engineering-brief')) {
        return Promise.resolve(createJsonResponse({ ok: true, data: engineeringBrief }));
      }

      if (url.endsWith('/api/smart-contract/artifact-spec')) {
        return Promise.resolve(
          createJsonResponse(
            {
              ok: false,
              error: {
                code: 'CLOSURE_NOT_READY',
                message: 'Closure readiness must be ready before Smart Contract Artifact Spec generation.',
              },
            },
            { status: 409 },
          ),
        );
      }

      return Promise.resolve(createJsonResponse({ ok: false, error: { code: 'UNEXPECTED', message: 'Unexpected route.' } }, { status: 400 }));
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Create Requirement Doc' }));
    fireEvent.click(screen.getByRole('button', { name: 'Generate Engineering Brief' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Prepare Smart Contract Spec' })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Prepare Smart Contract Spec' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Closure readiness must be ready before Smart Contract Artifact Spec generation.',
      );
    });

    expect(screen.queryByText('Smart Contract Spec, Artifact Preview, Check Result, and Evidence-Lite are ready in the SCP preview.')).not.toBeInTheDocument();
    expect(screen.queryByText('Artifact preview generated')).not.toBeInTheDocument();
  });

  it('shows a safe Engineering Brief error state when the backend rejects the request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse(
        {
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid Engineering Brief generation request.',
          },
        },
        { status: 400 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Create Requirement Doc' }));
    fireEvent.click(screen.getByRole('button', { name: 'Generate Engineering Brief' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid Engineering Brief generation request.');
    });
    expect(screen.queryByTestId('engineering-brief-artifact')).not.toBeInTheDocument();
  });

  it('supports passive side rails, lifecycle tabs, and a non-dashboard brief artifact surface', () => {
    render(<App />);

    const rightRail = screen.getByLabelText('Project status');
    expect(within(rightRail).queryByText('Next Recommended Action')).not.toBeInTheDocument();
    expect(within(rightRail).queryByRole('button', { name: 'Create Requirement Doc' })).not.toBeInTheDocument();
    expect(within(rightRail).queryByRole('button', { name: 'Prepare Smart Contract Spec' })).not.toBeInTheDocument();
    expect(within(rightRail).queryByRole('button', { name: /wallet|sign|deploy/i })).not.toBeInTheDocument();
    expect(within(rightRail).queryByRole('button', { name: 'Approve Brief and Run Coding Bot' })).not.toBeInTheDocument();
    expect(within(rightRail).queryByText('Project Directory')).not.toBeInTheDocument();
    expect(within(rightRail).queryByRole('heading', { name: 'All projects' })).not.toBeInTheDocument();
    expect(within(rightRail).queryByText('US Equities Portfolio')).not.toBeInTheDocument();
    expect(within(rightRail).queryByText('SG Equities Portfolio')).not.toBeInTheDocument();
    expect(within(rightRail).queryByText('Mixed Portfolio')).not.toBeInTheDocument();
    expect(within(rightRail).queryByText('Safety boundary')).not.toBeInTheDocument();
    expect(within(rightRail).getByRole('heading', { name: 'Workspace Status' })).toBeVisible();
    expect(within(rightRail).getByRole('heading', { name: 'Capability Status' })).toBeVisible();
    expect(within(rightRail).getByRole('heading', { name: 'Product Vault' })).toBeVisible();
    expect(within(rightRail).getByText('Requirement Brief')).toBeVisible();
    expect(within(rightRail).getByText('Engineering Brief')).toBeVisible();
    expect(within(rightRail).getByText('Smart Contract Spec')).toBeVisible();
    expect(screen.queryByText('Step 1 To-Do Checklist')).not.toBeInTheDocument();
    expect(screen.queryByText('Step 1 Artifacts')).not.toBeInTheDocument();
    expect(screen.queryByText('Project Closure Ledger')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Singapore REIT Token/i }));
    expect(screen.getAllByRole('heading', { name: 'Singapore REIT Token' }).length).toBeGreaterThan(0);
    expect(screen.queryByText('Need help? Ask the Engineering Bot')).not.toBeInTheDocument();
    expect(screen.queryByText('Select a project folder to view its linked documents and artifacts for download.')).not.toBeInTheDocument();

    const briefPreview = screen.getByLabelText('Brief Preview');
    expect(within(briefPreview).getByText('Business objective')).toBeInTheDocument();
    expect(within(briefPreview).getByText('Token model')).toBeInTheDocument();
    expect(within(briefPreview).getByText('Investor access')).toBeInTheDocument();
    expect(within(briefPreview).queryByText('Key workflows')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Subscription/ }));
    expect(screen.getByRole('heading', { name: 'Subscription' })).toBeVisible();
    expect(screen.getByText('Define permitted stablecoins, subscription windows, and payment-per-token terms.')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /Asset Servicing/ }));
    expect(screen.getByRole('heading', { name: 'Asset Servicing' })).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Hide left navigation' }));
    expect(screen.queryByLabelText('Project navigation')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show left navigation' }));
    expect(screen.getByLabelText('Project navigation')).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Hide right context' }));
    expect(screen.queryByLabelText('Project status')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show right context' }));
    expect(screen.getByLabelText('Project status')).toBeVisible();
  });
});
