/* @vitest-environment node */
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../server/app';
import {
  createInMemoryWorkspacePersistenceRepository,
  type WorkspacePersistenceRepository,
} from '../server/persistence/workspacePersistenceRepository';
import { createInitialMila26LifecycleState, createInvestorRegistryEntry } from '../src/domain/lifecycleState';

const firstWallet = '0x1111111111111111111111111111111111111111';

let repositories: WorkspacePersistenceRepository[] = [];

function createRepository() {
  const repository = createInMemoryWorkspacePersistenceRepository();
  repositories.push(repository);
  return repository;
}

afterEach(() => {
  repositories.forEach((repository) => repository.close());
  repositories = [];
});

describe('workspace persistence API', () => {
  it('saves and loads the latest workspace snapshot through API envelopes', async () => {
    const repository = createRepository();
    const app = createApp({ workspacePersistenceRepository: repository });
    const lifecycleState = {
      ...createInitialMila26LifecycleState(),
      investorRegistryEntries: [
        createInvestorRegistryEntry({
          id: 'investor-wallet-1',
          label: 'Investor 01',
          walletAddress: firstWallet,
        }),
      ],
    };

    const saveResponse = await app.inject({
      method: 'POST',
      url: '/api/workspace/save',
      payload: {
        projectId: 'alpha-income-fund',
        projectName: 'Alpha Income Fund I',
        lifecycleState,
      },
    });

    const loadResponse = await app.inject({
      method: 'POST',
      url: '/api/workspace/load-latest',
      payload: {
        projectId: 'alpha-income-fund',
      },
    });

    await app.close();

    expect(saveResponse.statusCode).toBe(200);
    expect(saveResponse.json()).toMatchObject({
      ok: true,
      data: {
        project: {
          id: 'alpha-income-fund',
          name: 'Alpha Income Fund I',
          investorCap: 50,
        },
        snapshot: {
          version: 1,
          investorWalletCount: 1,
        },
        investorWallets: [
          {
            id: 'investor-wallet-1',
            validationStatus: 'valid',
            status: 'ready_to_whitelist',
          },
        ],
      },
    });
    expect(loadResponse.statusCode).toBe(200);
    expect(loadResponse.json().data.snapshot.lifecycleState.investorRegistryEntries[0].walletAddress).toBe(firstWallet);
    expect(JSON.stringify(loadResponse.json())).not.toMatch(/privateKey|walletPrivateKey|signedPayload/i);
  });

  it('rejects private-key shaped fields instead of stripping and persisting them', async () => {
    const repository = createRepository();
    const app = createApp({ workspacePersistenceRepository: repository });

    const response = await app.inject({
      method: 'POST',
      url: '/api/workspace/save',
      payload: {
        projectId: 'alpha-income-fund',
        projectName: 'Alpha Income Fund I',
        lifecycleState: {
          ...createInitialMila26LifecycleState(),
          investorRegistryEntries: [
            {
              id: 'investor-wallet-1',
              walletAddress: firstWallet,
              status: 'ready_to_whitelist',
              source: 'manual',
              privateKey: '0xabc',
            },
          ],
        },
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
    expect(repository.loadLatestWorkspace('alpha-income-fund')).toBeUndefined();
  });

  it('returns validation errors for duplicate investor wallet addresses', async () => {
    const repository = createRepository();
    const app = createApp({ workspacePersistenceRepository: repository });
    const existing = createInvestorRegistryEntry({
      id: 'investor-wallet-1',
      walletAddress: firstWallet,
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/workspace/save',
      payload: {
        projectId: 'alpha-income-fund',
        projectName: 'Alpha Income Fund I',
        lifecycleState: {
          ...createInitialMila26LifecycleState(),
          investorRegistryEntries: [
            existing,
            createInvestorRegistryEntry({
              id: 'investor-wallet-2',
              walletAddress: firstWallet.toUpperCase(),
              existingEntries: [existing],
            }),
          ],
        },
      },
    });

    await app.close();

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Investor Registry contains duplicate wallet addresses.',
        details: {
          firstEntryId: 'investor-wallet-1',
          duplicateEntryId: 'investor-wallet-2',
        },
      },
    });
    expect(repository.loadLatestWorkspace('alpha-income-fund')).toBeUndefined();
  });

  it('returns not found for a project without a persisted snapshot', async () => {
    const repository = createRepository();
    const app = createApp({ workspacePersistenceRepository: repository });

    const response = await app.inject({
      method: 'POST',
      url: '/api/workspace/load-latest',
      payload: {
        projectId: 'missing-project',
      },
    });

    await app.close();

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'No persisted workspace snapshot found for this project.',
      },
    });
  });
});
