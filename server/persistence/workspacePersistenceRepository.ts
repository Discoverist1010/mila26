import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { isValidNonZeroEvmAddress } from '../../src/domain/recordNavOperationReadModel';
import {
  Mila26LifecycleStatePersistenceSchema,
  type Mila26LifecycleStatePersistence,
  type WorkspacePersistenceInvestorWallet,
  type WorkspacePersistenceProject,
  type WorkspacePersistenceRecord,
  type WorkspacePersistenceSaveRequest,
  type WorkspacePersistenceSnapshot,
} from '../contracts/workspacePersistence';

export class WorkspacePersistenceValidationError extends Error {
  constructor(
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'WorkspacePersistenceValidationError';
  }
}

export type WorkspacePersistenceRepository = {
  saveWorkspaceSnapshot(input: WorkspacePersistenceSaveRequest): WorkspacePersistenceRecord;
  loadLatestWorkspace(projectId: string): WorkspacePersistenceRecord | undefined;
  close(): void;
};

type ProjectRow = {
  id: string;
  name: string;
  investor_cap: number;
  created_at_iso: string;
  updated_at_iso: string;
};

type SnapshotRow = {
  id: string;
  project_id: string;
  version: number;
  source: WorkspacePersistenceSaveRequest['source'];
  lifecycle_state_json: string;
  investor_wallet_count: number;
  created_at_iso: string;
};

type InvestorWalletRow = {
  id: string;
  project_id: string;
  label: string | null;
  wallet_address: string;
  normalized_wallet_address: string;
  validation_status: WorkspacePersistenceInvestorWallet['validationStatus'];
  status: WorkspacePersistenceInvestorWallet['status'];
  source: WorkspacePersistenceInvestorWallet['source'];
  created_at_iso: string;
  updated_at_iso: string;
};

const schemaSql = `
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  investor_cap INTEGER NOT NULL DEFAULT 50,
  created_at_iso TEXT NOT NULL,
  updated_at_iso TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lifecycle_snapshots (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  source TEXT NOT NULL,
  lifecycle_state_json TEXT NOT NULL,
  investor_wallet_count INTEGER NOT NULL,
  created_at_iso TEXT NOT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE(project_id, version)
);

CREATE TABLE IF NOT EXISTS investor_wallets (
  id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  label TEXT,
  wallet_address TEXT NOT NULL,
  normalized_wallet_address TEXT NOT NULL,
  validation_status TEXT NOT NULL,
  status TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at_iso TEXT NOT NULL,
  updated_at_iso TEXT NOT NULL,
  PRIMARY KEY(project_id, id),
  UNIQUE(project_id, normalized_wallet_address),
  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS lifecycle_snapshots_project_version_idx
  ON lifecycle_snapshots(project_id, version DESC);

CREATE INDEX IF NOT EXISTS investor_wallets_project_idx
  ON investor_wallets(project_id);
`;

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeWalletAddress(walletAddress: string): string {
  return walletAddress.trim().toLowerCase();
}

function assertNoDuplicateInvestorWallets(lifecycleState: Mila26LifecycleStatePersistence): void {
  const seen = new Map<string, string>();

  for (const entry of lifecycleState.investorRegistryEntries) {
    const normalized = normalizeWalletAddress(entry.walletAddress);
    const existingId = seen.get(normalized);
    if (existingId) {
      throw new WorkspacePersistenceValidationError('Investor Registry contains duplicate wallet addresses.', {
        firstEntryId: existingId,
        duplicateEntryId: entry.id,
        walletAddress: entry.walletAddress,
      });
    }
    seen.set(normalized, entry.id);
  }
}

function parseLifecycleState(lifecycleStateJson: string): Mila26LifecycleStatePersistence {
  return Mila26LifecycleStatePersistenceSchema.parse(JSON.parse(lifecycleStateJson));
}

function toProject(row: ProjectRow): WorkspacePersistenceProject {
  return {
    id: row.id,
    name: row.name,
    investorCap: row.investor_cap,
    createdAtIso: row.created_at_iso,
    updatedAtIso: row.updated_at_iso,
  };
}

function toSnapshot(row: SnapshotRow): WorkspacePersistenceSnapshot {
  return {
    id: row.id,
    projectId: row.project_id,
    version: row.version,
    source: row.source,
    lifecycleState: parseLifecycleState(row.lifecycle_state_json),
    investorWalletCount: row.investor_wallet_count,
    createdAtIso: row.created_at_iso,
  };
}

function toInvestorWallet(row: InvestorWalletRow): WorkspacePersistenceInvestorWallet {
  return {
    id: row.id,
    projectId: row.project_id,
    label: row.label ?? undefined,
    walletAddress: row.wallet_address,
    normalizedWalletAddress: row.normalized_wallet_address,
    validationStatus: row.validation_status,
    status: row.status,
    source: row.source,
    createdAtIso: row.created_at_iso,
    updatedAtIso: row.updated_at_iso,
  };
}

export function createWorkspacePersistenceRepository(db: DatabaseSync): WorkspacePersistenceRepository {
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(schemaSql);

  function getProject(projectId: string): WorkspacePersistenceProject | undefined {
    const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) as ProjectRow | undefined;
    return row ? toProject(row) : undefined;
  }

  function getInvestorWallets(projectId: string): WorkspacePersistenceInvestorWallet[] {
    const rows = db
      .prepare('SELECT * FROM investor_wallets WHERE project_id = ? ORDER BY rowid ASC')
      .all(projectId) as InvestorWalletRow[];
    return rows.map(toInvestorWallet);
  }

  function getLatestSnapshot(projectId: string): WorkspacePersistenceSnapshot | undefined {
    const row = db
      .prepare('SELECT * FROM lifecycle_snapshots WHERE project_id = ? ORDER BY version DESC LIMIT 1')
      .get(projectId) as SnapshotRow | undefined;
    return row ? toSnapshot(row) : undefined;
  }

  return {
    saveWorkspaceSnapshot(input) {
      assertNoDuplicateInvestorWallets(input.lifecycleState);

      const createdAtIso = nowIso();
      const existingProject = getProject(input.projectId);
      const projectCreatedAtIso = existingProject?.createdAtIso ?? createdAtIso;
      const latestVersionRow = db
        .prepare('SELECT COALESCE(MAX(version), 0) AS latest_version FROM lifecycle_snapshots WHERE project_id = ?')
        .get(input.projectId) as { latest_version: number };
      const nextVersion = latestVersionRow.latest_version + 1;
      const snapshotId = `${input.projectId}-snapshot-${nextVersion}`;
      const lifecycleStateJson = JSON.stringify(input.lifecycleState);

      db.exec('BEGIN');
      try {
        db.prepare(
          `INSERT INTO projects (id, name, investor_cap, created_at_iso, updated_at_iso)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             name = excluded.name,
             investor_cap = excluded.investor_cap,
             updated_at_iso = excluded.updated_at_iso`,
        ).run(input.projectId, input.projectName, 50, projectCreatedAtIso, createdAtIso);

        db.prepare(
          `INSERT INTO lifecycle_snapshots (
            id, project_id, version, source, lifecycle_state_json, investor_wallet_count, created_at_iso
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          snapshotId,
          input.projectId,
          nextVersion,
          input.source,
          lifecycleStateJson,
          input.lifecycleState.investorRegistryEntries.length,
          createdAtIso,
        );

        db.prepare('DELETE FROM investor_wallets WHERE project_id = ?').run(input.projectId);
        const insertInvestorWallet = db.prepare(
          `INSERT INTO investor_wallets (
            id, project_id, label, wallet_address, normalized_wallet_address, validation_status, status, source, created_at_iso, updated_at_iso
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        );

        for (const entry of input.lifecycleState.investorRegistryEntries) {
          const normalizedWalletAddress = normalizeWalletAddress(entry.walletAddress);
          insertInvestorWallet.run(
            entry.id,
            input.projectId,
            entry.label ?? null,
            entry.walletAddress,
            normalizedWalletAddress,
            isValidNonZeroEvmAddress(entry.walletAddress) ? 'valid' : 'invalid',
            entry.status,
            entry.source ?? 'manual',
            createdAtIso,
            createdAtIso,
          );
        }

        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }

      const project = getProject(input.projectId);
      const snapshot = getLatestSnapshot(input.projectId);
      if (!project || !snapshot) {
        throw new WorkspacePersistenceValidationError('Workspace persistence save did not produce a readable record.');
      }

      return {
        project,
        snapshot,
        investorWallets: getInvestorWallets(input.projectId),
      };
    },
    loadLatestWorkspace(projectId) {
      const project = getProject(projectId);
      const snapshot = getLatestSnapshot(projectId);
      if (!project || !snapshot) return undefined;

      return {
        project,
        snapshot,
        investorWallets: getInvestorWallets(projectId),
      };
    },
    close() {
      db.close();
    },
  };
}

export function createInMemoryWorkspacePersistenceRepository(): WorkspacePersistenceRepository {
  return createWorkspacePersistenceRepository(new DatabaseSync(':memory:'));
}

export function createFileWorkspacePersistenceRepository(dbPath = process.env.MILA26_SQLITE_PATH): WorkspacePersistenceRepository {
  const resolvedPath = resolve(dbPath ?? '.mila26/mila26.sqlite');
  mkdirSync(dirname(resolvedPath), { recursive: true });
  return createWorkspacePersistenceRepository(new DatabaseSync(resolvedPath));
}
