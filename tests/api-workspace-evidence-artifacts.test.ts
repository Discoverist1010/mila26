/* @vitest-environment node */
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../server/app';
import type { EngineeringBriefRequirementBrief } from '../server/contracts/engineeringBrief';
import {
  createInMemoryWorkspacePersistenceRepository,
  type WorkspacePersistenceRepository,
} from '../server/persistence/workspacePersistenceRepository';
import { createInitialMila26LifecycleState, createInvestorRegistryEntry } from '../src/domain/lifecycleState';
import {
  createInitialProductSetupRecord,
  createProductSetupPackPayload,
  createProductSetupPrdDocxContent,
  createProductSetupPrdMarkdown,
} from '../src/domain/productSetup';
import type { FundFacts } from '../src/domain/schemas';

const transactionHash = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const contractAddress = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const investorWallet = '0x1111111111111111111111111111111111111111';
const productSetupFacts: FundFacts = {
  fundName: 'Alpha Income Fund I',
  tokenSymbol: 'AIF',
  jurisdiction: 'Singapore',
  targetInvestors: 'Approved investors',
  totalSupply: 1_000_000,
  initialNav: 1_000_000,
};

let repositories: WorkspacePersistenceRepository[] = [];

function createRepository() {
  const repository = createInMemoryWorkspacePersistenceRepository();
  repositories.push(repository);
  return repository;
}

function createRequirementBriefArtifact(): EngineeringBriefRequirementBrief {
  return {
    id: 'requirement-brief-1',
    createdAt: '2026-06-07T00:00:00.000Z',
    sourceBriefId: 'brief-1',
    projectName: 'Alpha Income Fund I',
    assetProfile: {
      fundName: 'Alpha Income Fund I',
      tokenSymbol: 'AIF',
      jurisdiction: 'Singapore',
      targetInvestors: 'Approved investors',
      totalSupply: 1_000_000,
      initialNav: 1_000_000,
    },
    tokenModel: {
      standardPreference: 'ERC-20',
      assumption: 'Fungible tokenised fund units are the current alpha path.',
    },
    investorAccess: {
      walletWhitelistRequired: true,
      assumptions: ['Investor wallets are whitelisted before token distribution.'],
    },
    valuationPolicy: {
      cadence: 'Manual',
      assumptions: ['NAV updates are recorded as asset-servicing evidence.'],
    },
    selectedServicingModules: [
      {
        id: 'erc20-base',
        enabled: true,
        rationale: 'Restricted ERC-20-compatible token units.',
      },
    ],
    networkBoundary: 'ethereum-testnet-only',
    deploymentBoundary: {
      currentTarget: 'testnet-enabled',
      signing: 'user-wallet-signs',
    },
    backendCustodyBoundary: 'backend-holds-no-private-keys',
    complianceSecurityAssumptions: ['No legal, KYC, audit, or investment-advice approval is implied.'],
    approvalStatus: 'approved',
    unresolvedQuestions: [],
  };
}

async function saveWorkspace(app: ReturnType<typeof createApp>, walletAddress = investorWallet) {
  return app.inject({
    method: 'POST',
    url: '/api/workspace/save',
    payload: {
      projectId: 'alpha-income-fund',
      projectName: 'Alpha Income Fund I',
      lifecycleState: {
        ...createInitialMila26LifecycleState(),
        investorRegistryEntries: [
          createInvestorRegistryEntry({
            id: `investor-wallet-${walletAddress.slice(-2)}`,
            walletAddress,
          }),
        ],
      },
    },
  });
}

afterEach(() => {
  repositories.forEach((repository) => repository.close());
  repositories = [];
});

describe('workspace evidence and artifact API', () => {
  it('stores and lists durable evidence records through API envelopes', async () => {
    const repository = createRepository();
    const app = createApp({ workspacePersistenceRepository: repository });
    await saveWorkspace(app);

    const saveResponse = await app.inject({
      method: 'POST',
      url: '/api/workspace/evidence/save',
      payload: {
        projectId: 'alpha-income-fund',
        records: [
          {
            evidenceType: 'deployment',
            sourcePersistence: 'local_session_only',
            status: 'confirmed',
            chainId: 11155111,
            networkName: 'Sepolia',
            transactionHash,
            transactionHashSource: 'provider_returned',
            receiptSource: 'provider_receipt',
            receiptStatus: 'success',
            contractAddress,
            contractAddressSource: 'receipt_returned',
            eventEvidenceSource: 'absent',
          },
        ],
      },
    });
    const listResponse = await app.inject({
      method: 'POST',
      url: '/api/workspace/evidence/list',
      payload: { projectId: 'alpha-income-fund' },
    });

    await app.close();

    expect(saveResponse.statusCode).toBe(200);
    expect(saveResponse.json()).toMatchObject({
      ok: true,
      data: {
        latestSnapshotVersion: 1,
        evidenceRecords: [
          {
            evidenceType: 'deployment',
            persistence: 'durable',
            sourcePersistence: 'local_session_only',
            lifecycleContextStatus: 'current_context',
            transactionHash,
          },
        ],
      },
    });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json().data.evidenceRecords).toHaveLength(1);
    expect(JSON.stringify(listResponse.json())).not.toMatch(/privateKey|signedPayload/i);
  });

  it('rejects private-key shaped evidence fields instead of stripping and persisting them', async () => {
    const repository = createRepository();
    const app = createApp({ workspacePersistenceRepository: repository });
    await saveWorkspace(app);

    const response = await app.inject({
      method: 'POST',
      url: '/api/workspace/evidence/save',
      payload: {
        projectId: 'alpha-income-fund',
        records: [
          {
            evidenceType: 'deployment',
            sourcePersistence: 'local_session_only',
            status: 'submitted',
            chainId: 11155111,
            networkName: 'Sepolia',
            transactionHash,
            transactionHashSource: 'provider_returned',
            receiptSource: 'absent',
            contractAddressSource: 'absent',
            eventEvidenceSource: 'absent',
            privateKey: '0xabc',
          },
        ],
      },
    });

    await app.close();

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
      },
    });
  });

  it('stores generated artifacts and reports stale context after lifecycle state changes', async () => {
    const repository = createRepository();
    const app = createApp({ workspacePersistenceRepository: repository });
    await saveWorkspace(app);

    const saveArtifactsResponse = await app.inject({
      method: 'POST',
      url: '/api/workspace/artifacts/save',
      payload: {
        projectId: 'alpha-income-fund',
        records: [
          {
            artifactType: 'requirement_brief',
            artifactPayload: createRequirementBriefArtifact(),
          },
        ],
      },
    });
    await saveWorkspace(app, '0x2222222222222222222222222222222222222222');
    const listArtifactsResponse = await app.inject({
      method: 'POST',
      url: '/api/workspace/artifacts/list',
      payload: { projectId: 'alpha-income-fund' },
    });

    await app.close();

    expect(saveArtifactsResponse.statusCode).toBe(200);
    expect(saveArtifactsResponse.json()).toMatchObject({
      ok: true,
      data: {
        artifactRecords: [
          {
            artifactType: 'requirement_brief',
            artifactStatus: 'approved',
            lifecycleContextStatus: 'current_context',
          },
        ],
      },
    });
    expect(listArtifactsResponse.statusCode).toBe(200);
    expect(listArtifactsResponse.json()).toMatchObject({
      ok: true,
      data: {
        latestSnapshotVersion: 2,
        artifactRecords: [
          {
            artifactType: 'requirement_brief',
            lifecycleContextStatus: 'stale_context',
          },
        ],
      },
    });
  });

  it('stores Product Setup PRD downloadable artifact content for later redownload', async () => {
    const repository = createRepository();
    const app = createApp({ workspacePersistenceRepository: repository });
    await saveWorkspace(app);
    const record = createInitialProductSetupRecord(productSetupFacts);
    const options = { generatedAtIso: '2026-06-07T00:00:00.000Z', versionLabel: 'v1.0' };
    const basePayload = createProductSetupPackPayload(record, undefined, options);
    const markdown = createProductSetupPrdMarkdown(record, undefined, options);
    const docxContent = createProductSetupPrdDocxContent(record, undefined, options);
    const setupJson = JSON.stringify({ artifact: basePayload, productSetupRecord: record }, null, 2);

    const saveArtifactsResponse = await app.inject({
      method: 'POST',
      url: '/api/workspace/artifacts/save',
      payload: {
        projectId: 'alpha-income-fund',
        records: [
          {
            artifactType: 'product_setup_pack',
            artifactPayload: {
              ...basePayload,
              downloadableArtifacts: {
                markdown,
                setupJson,
                docxBase64: Buffer.from(docxContent).toString('base64'),
              },
            },
          },
        ],
      },
    });
    const listArtifactsResponse = await app.inject({
      method: 'POST',
      url: '/api/workspace/artifacts/list',
      payload: { projectId: 'alpha-income-fund' },
    });

    await app.close();

    expect(saveArtifactsResponse.statusCode).toBe(200);
    expect(listArtifactsResponse.statusCode).toBe(200);
    expect(listArtifactsResponse.json().data.artifactRecords[0]).toMatchObject({
      artifactType: 'product_setup_pack',
      artifactStatus: 'PRD generated',
      artifactPayload: {
        versionLabel: 'v1.0',
        downloadableArtifacts: {
          markdown: expect.stringContaining('Product Requirements Document'),
          setupJson: expect.stringContaining('product-setup-alpha-income-fund-i'),
          docxBase64: expect.any(String),
        },
      },
    });
  });
});
