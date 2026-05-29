import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../src/App';
import type { EngineeringBrief } from '../server/contracts/engineeringBrief';

function createJsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
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

describe('App Blockchain Engineer Bot panel', () => {
  it('shows local preview before asking and then renders a backend answer', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        ok: true,
        data: {
          messageId: 'chat-1',
          agentId: 'blockchain-engineer',
          content: 'Backend mock says ERC-20 is suitable for fungible portfolio shares.',
          protocolComparison: {
            erc20: 'Fungible portfolio shares with broad wallet support.',
            erc721: 'Unique investor positions with token-specific metadata.',
            recommendation: 'Use ERC-20 unless the Requirement Brief requires unique positions.',
          },
          suggestedRequirementUpdates: [
            {
              field: 'token.standardPreference',
              proposedValue: 'ERC-20',
              rationale: 'The stated income fund goal looks fungible for the MVP.',
              confidence: 0.84,
            },
          ],
          openQuestions: ['Should every approved investor hold identical share units?'],
          riskNotes: ['Backend must not hold private keys.'],
          nextRecommendedAction: 'Confirm ERC-20 versus ERC-721 before approving the Requirement Brief.',
          createdAt: '2026-05-21T00:00:00.000Z',
        },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    expect(screen.getByText('KangLe AI')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'MILA Income Fund / Tokenized Income Fund' })).toBeVisible();
    expect(screen.getByLabelText('Project navigation')).toBeVisible();
    expect(screen.getByLabelText('Project status')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Engineering Bot decision workspace' })).toBeVisible();
    expect(screen.getByLabelText('Engineering Bot workspace')).toBeVisible();
    expect(screen.getByText('Chief Engineering Officer')).toBeVisible();
    expect(screen.getByText('Master Orchestrator')).toBeVisible();
    expect(screen.getByText('mila26-cockpit2')).toBeVisible();
    expect(screen.getByLabelText('Top stage progress')).toBeVisible();
    expect(screen.getByText('Setup / Explore')).toBeVisible();
    expect(screen.getAllByText('Smart Contract Control').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('Current-stage activities')).toBeVisible();
    expect(screen.getByText('Goal intake')).toBeVisible();
    expect(screen.getByText('Project Closure Ledger')).toBeVisible();
    expect(screen.getAllByText('Requirement Brief pending').length).toBeGreaterThan(0);
    expect(screen.getByText('1 unresolved open item(s)')).toBeVisible();
    expect(screen.getByText('0 blocking item(s)')).toBeVisible();
    expect(screen.getByText('Need help? Ask the Engineering Bot')).toBeVisible();
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
    expect(screen.getByText('Engineering Bot reply')).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Engineering Bot MILA' })).toBeVisible();
    expect(screen.getByText('Press Enter to send, Shift+Enter for a new line.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Send' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Ask a question' })).not.toBeInTheDocument();
    expect(screen.queryByText('Next Recommended Action')).not.toBeInTheDocument();
    expect(screen.getByTestId('smart-contract-control')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Smart Contract Control Panel' })).toBeVisible();
    expect(screen.getByText('NAV Updated')).toBeVisible();
    expect(screen.getByText('Distribution Recorded')).toBeVisible();
    expect(screen.getAllByRole('button', { name: 'Trigger Event' }).length).toBeGreaterThan(0);
    expect(screen.getByText('SCP readiness')).toBeVisible();
    expect(screen.getAllByText('Preview only').length).toBeGreaterThan(0);

    const botComposer = screen.getByRole('textbox', { name: 'Engineering Bot MILA' });
    fireEvent.change(botComposer, {
      target: { value: 'Should we use ERC-20 or ERC-721?' },
    });
    fireEvent.keyDown(botComposer, { key: 'Enter', code: 'Enter' });

    expect(screen.getByRole('button', { name: 'Sending...' })).toBeDisabled();
    expect(screen.getByTestId('engineer-answer')).toHaveTextContent('Waiting for Blockchain Engineer Bot...');

    await waitFor(() => {
      expect(screen.getByText('Backend response.')).toBeVisible();
    });
    expect(screen.getByTestId('engineer-answer')).toHaveTextContent('Backend mock says ERC-20');
    expect(screen.getByText('Protocol comparison')).toBeVisible();
    expect(screen.getByText('ERC-20: Fungible portfolio shares with broad wallet support.')).toBeVisible();
    expect(screen.getByText('ERC-721: Unique investor positions with token-specific metadata.')).toBeVisible();
    expect(screen.getByText('Suggested requirement updates')).toBeVisible();
    expect(screen.getByText('token.standardPreference: ERC-20. The stated income fund goal looks fungible for the MVP.')).toBeVisible();
    expect(screen.getByText('Open questions')).toBeVisible();
    expect(screen.getByText('Should every approved investor hold identical share units?')).toBeVisible();
    expect(screen.getByText('Risk notes')).toBeVisible();
    expect(screen.getByText('Backend must not hold private keys.')).toBeVisible();
    expect(screen.getByText('Recommended next action')).toBeVisible();
    expect(screen.getByText('Confirm ERC-20 versus ERC-721 before approving the Requirement Brief.')).toBeVisible();
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
    expect(screen.getAllByText('Ready for artifact specification').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ready for Smart Contract Spec').length).toBeGreaterThan(0);
    expect(screen.getByText('Lifecycle: Ready for artifact specification')).toBeVisible();
    const nextAction = screen.getByRole('button', { name: 'Prepare Smart Contract Spec' });
    expect(nextAction).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Approve Brief and Run Coding Bot' })).not.toBeInTheDocument();
  });

  it('prepares a Smart Contract Spec and artifact preview through the central workflow action', async () => {
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

    expect(screen.getByRole('button', { name: 'Review Deployment Gate' })).toBeDisabled();
    expect(screen.getByText(/Deployment gate review remains a later/i)).toBeVisible();
    expect(screen.getByText('Backend artifacts generated.')).toBeVisible();
    expect(screen.getByText('Smart contract preparation review')).toBeVisible();
    expect(screen.getByText('Demo-ready preview')).toBeVisible();
    expect(screen.getByText('Smart Contract Spec')).toBeVisible();
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
    expect(screen.getByText('Known Track 10A local foundation result')).toBeVisible();
    expect(generatedArtifacts.getByText('Deployment Gate Review')).toBeVisible();
    expect(generatedArtifacts.getByText('Review-ready')).toBeVisible();
    expect(generatedArtifacts.getByText('Pre-deployment readiness: Complete. Deployment execution: Blocked.')).toBeVisible();
    expect(generatedArtifacts.getByText('Track 11A read model')).toBeVisible();
    expect(screen.getByText('Deployment / Signing / Audit')).toBeVisible();
    expect(screen.getByText('Not deployed, not audited, not signed, no wallet connected, no address, no transaction hash.')).toBeVisible();
    expect(screen.getByTestId('engineer-answer')).toHaveTextContent('Smart contract preparation is complete for demo review');
    expect(screen.getByTestId('engineer-answer')).toHaveTextContent('represented the known local compile/test foundation as passed');
    expect(screen.getByText('Recommended next action')).toBeVisible();
    expect(screen.getByText('Deployment Gate and wallet-signing design remain later steps. Local compile/test status does not imply deployment readiness.')).toBeVisible();
    expect(screen.getAllByText('Artifact preview generated').length).toBeGreaterThan(0);
    expect(screen.getByText('Smart Contract Spec: Generated')).toBeVisible();
    expect(screen.getByText('Artifact preview: Generated, not compiled')).toBeVisible();
    expect(screen.getByText('Check result: Spec-consistency result available')).toBeVisible();
    expect(screen.getByText('Evidence-lite: Available for later evidence pack wiring')).toBeVisible();
    expect(screen.getByText('Local compile/test foundation: Passed')).toBeVisible();
    expect(screen.getByText('Solidity fixture: Compiles locally')).toBeVisible();
    expect(screen.getByText('Contract tests: Passed locally')).toBeVisible();
    expect(screen.getByText('Tested capabilities: ERC-20 basics, whitelist restrictions, issuer mint/allocation, valuation event, distribution event, pause/unpause, access control')).toBeVisible();
    expect(screen.getAllByText('Deployment Gate Review: Review-ready').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pre-deployment readiness: Complete').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Deployment execution: Blocked').length).toBeGreaterThan(0);
    expect(screen.getByText('Wallet signing not implemented: Not implemented')).toBeVisible();
    expect(screen.getByText('User wallet signing required later: Required')).toBeVisible();
    expect(screen.getByText('Contract address absent: No contract address')).toBeVisible();
    expect(screen.getByText('Transaction hash absent: No transaction hash')).toBeVisible();
    expect(screen.getByText('Remaining gate items')).toBeVisible();
    expect(screen.getByText('Design wallet signing before any future Ethereum testnet deployment.')).toBeVisible();
    expect(screen.getByText('Deployment: Not executed')).toBeVisible();
    expect(screen.getByText('Wallet signing: Not started')).toBeVisible();
    expect(screen.getByText('Audit: Not audited')).toBeVisible();
    expect(screen.getByText('Ethereum testnet: Only')).toBeVisible();
    expect(screen.getByText('Mainnet: Disabled')).toBeVisible();
    expect(screen.getByText('Backend private keys: None held')).toBeVisible();
    expect(screen.getByText('Future deployment signer: User wallet')).toBeVisible();
    expect(screen.getByText('Transaction hash: None exists')).toBeVisible();
    expect(screen.getByText('ValuationUpdated')).toBeVisible();
    expect(screen.getByText('ContractPaused')).toBeVisible();
    expect(screen.getByText('ContractUnpaused')).toBeVisible();
    expect(screen.getByText('No contract address - not deployed')).toBeVisible();
    expect(screen.queryByText(/0x[a-fA-F0-9]{6,}/)).not.toBeInTheDocument();
    expect(screen.queryByText(/txHash/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ready to deploy|ready for signature|submitted|confirmed|production ready|mainnet ready/i)).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.map(([url]) => String(url)).join(' ')).not.toMatch(/hardhat|contracts:build|test:contracts/i);
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

  it('supports passive side rails and an expandable artifact-focused Brief Preview', () => {
    render(<App />);

    const rightRail = screen.getByLabelText('Project status');
    expect(within(rightRail).queryByText('Next Recommended Action')).not.toBeInTheDocument();
    expect(within(rightRail).queryByRole('button', { name: 'Create Requirement Doc' })).not.toBeInTheDocument();
    expect(within(rightRail).queryByRole('button', { name: 'Prepare Smart Contract Spec' })).not.toBeInTheDocument();
    expect(within(rightRail).queryByRole('button', { name: 'Approve Brief and Run Coding Bot' })).not.toBeInTheDocument();
    expect(within(rightRail).getByText('Step 1 To-Do Checklist')).toBeVisible();
    expect(within(rightRail).getByText('Create Requirement Brief')).toBeVisible();
    expect(within(rightRail).getByText('Review closure readiness')).toBeVisible();
    expect(within(rightRail).getByText('Step 1 Artifacts')).toBeVisible();
    expect(within(rightRail).getByText('Safe-by-Design Summary')).toBeVisible();

    const briefPreview = screen.getByLabelText('Brief Preview');
    expect(within(briefPreview).getByText('Business objective')).toBeVisible();
    expect(within(briefPreview).getByText('Token model')).toBeVisible();
    expect(within(briefPreview).getByText('Investor access')).toBeVisible();
    expect(within(briefPreview).queryByText('Key workflows')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Expand Brief Preview' }));
    expect(within(briefPreview).getByText('Key workflows')).toBeVisible();
    expect(within(briefPreview).getByText('Deployment boundary')).toBeVisible();
    expect(within(briefPreview).getByText('Open items')).toBeVisible();
    expect(within(briefPreview).getAllByText('Requirement Brief pending').length).toBeGreaterThan(0);
    expect(within(briefPreview).getByText('Create the brief before closure checks can be reviewed.')).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Collapse Brief Preview' }));
    expect(within(briefPreview).queryByText('Key workflows')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Hide left rail' }));
    expect(screen.queryByLabelText('Project navigation')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show left rail' }));
    expect(screen.getByLabelText('Project navigation')).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Hide right rail' }));
    expect(screen.queryByLabelText('Project status')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show right rail' }));
    expect(screen.getByLabelText('Project status')).toBeVisible();
  });
});
