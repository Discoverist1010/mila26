import { mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { isValidNonZeroEvmAddress } from '../../src/domain/recordNavOperationReadModel';
import {
  Mila26LifecycleStatePersistenceSchema,
  ProductSetupRecordPersistenceSchema,
  WorkspaceArtifactRecordInputSchema,
  WorkspaceEvidenceRecordInputSchema,
  type Mila26LifecycleStatePersistence,
  type ProductSetupRecordPersistence,
  type WorkspaceArtifactPersistenceRecord,
  type WorkspaceArtifactRecord,
  type WorkspaceArtifactRecordInput,
  type WorkspaceArtifactsSaveRequest,
  type WorkspaceEvidencePersistenceRecord,
  type WorkspaceEvidenceRecord,
  type WorkspaceEvidenceSaveRequest,
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
  saveEvidenceRecords(input: WorkspaceEvidenceSaveRequest): WorkspaceEvidencePersistenceRecord;
  listEvidenceRecords(projectId: string): WorkspaceEvidencePersistenceRecord;
  saveArtifactRecords(input: WorkspaceArtifactsSaveRequest): WorkspaceArtifactPersistenceRecord;
  listArtifactRecords(projectId: string): WorkspaceArtifactPersistenceRecord;
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
  product_setup_record_json: string | null;
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

type EvidenceRecordRow = {
  id: string;
  project_id: string;
  evidence_type: WorkspaceEvidenceRecord['evidenceType'];
  source_persistence: WorkspaceEvidenceRecord['sourcePersistence'];
  source_attempt_id: string | null;
  lifecycle_snapshot_version: number;
  status: WorkspaceEvidenceRecord['status'];
  chain_id: 11155111;
  network_name: 'Sepolia';
  transaction_hash: string;
  transaction_hash_source: WorkspaceEvidenceRecord['transactionHashSource'];
  receipt_source: WorkspaceEvidenceRecord['receiptSource'];
  receipt_status: WorkspaceEvidenceRecord['receiptStatus'] | null;
  contract_address: string | null;
  contract_address_source: WorkspaceEvidenceRecord['contractAddressSource'];
  event_evidence_source: WorkspaceEvidenceRecord['eventEvidenceSource'];
  event_name: WorkspaceEvidenceRecord['eventName'] | null;
  target_wallet_address: string | null;
  valuation: string | null;
  valuation_reference: string | null;
  token_amount: string | null;
  token_amount_units: string | null;
  artifact_package_id: string | null;
  compile_check_id: string | null;
  created_at_iso: string;
  updated_at_iso: string;
};

type ArtifactRecordRow = {
  id: string;
  project_id: string;
  artifact_type: WorkspaceArtifactRecord['artifactType'];
  artifact_id: string;
  artifact_status: string;
  lifecycle_snapshot_version: number;
  content_hash: string;
  artifact_json: string;
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
  product_setup_record_json TEXT,
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

CREATE TABLE IF NOT EXISTS evidence_records (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  evidence_type TEXT NOT NULL,
  source_persistence TEXT NOT NULL,
  source_attempt_id TEXT,
  lifecycle_snapshot_version INTEGER NOT NULL,
  status TEXT NOT NULL,
  chain_id INTEGER NOT NULL,
  network_name TEXT NOT NULL,
  transaction_hash TEXT NOT NULL,
  transaction_hash_source TEXT NOT NULL,
  receipt_source TEXT NOT NULL,
  receipt_status TEXT,
  contract_address TEXT,
  contract_address_source TEXT NOT NULL,
  event_evidence_source TEXT NOT NULL,
  event_name TEXT,
  target_wallet_address TEXT,
  valuation TEXT,
  valuation_reference TEXT,
  token_amount TEXT,
  token_amount_units TEXT,
  artifact_package_id TEXT,
  compile_check_id TEXT,
  created_at_iso TEXT NOT NULL,
  updated_at_iso TEXT NOT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE(project_id, evidence_type, transaction_hash)
);

CREATE INDEX IF NOT EXISTS evidence_records_project_idx
  ON evidence_records(project_id, updated_at_iso DESC);

CREATE TABLE IF NOT EXISTS artifact_records (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  artifact_type TEXT NOT NULL,
  artifact_id TEXT NOT NULL,
  artifact_status TEXT NOT NULL,
  lifecycle_snapshot_version INTEGER NOT NULL,
  content_hash TEXT NOT NULL,
  artifact_json TEXT NOT NULL,
  created_at_iso TEXT NOT NULL,
  updated_at_iso TEXT NOT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE(project_id, artifact_type, artifact_id, content_hash)
);

CREATE INDEX IF NOT EXISTS artifact_records_project_idx
  ON artifact_records(project_id, updated_at_iso DESC);
`;

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeWalletAddress(walletAddress: string): string {
  return walletAddress.trim().toLowerCase();
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function latestSnapshotVersionFromRow(row: { latest_version: number | null } | undefined): number {
  return row?.latest_version ?? 0;
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

function parseProductSetupRecord(productSetupRecordJson: string | null): ProductSetupRecordPersistence | undefined {
  if (!productSetupRecordJson) return undefined;
  return ProductSetupRecordPersistenceSchema.parse(JSON.parse(productSetupRecordJson));
}

function parseArtifactPayload(row: ArtifactRecordRow): WorkspaceArtifactRecordInput['artifactPayload'] {
  return WorkspaceArtifactRecordInputSchema.parse({
    artifactType: row.artifact_type,
    artifactPayload: JSON.parse(row.artifact_json),
    lifecycleSnapshotVersion: row.lifecycle_snapshot_version,
  }).artifactPayload;
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
    productSetupRecord: parseProductSetupRecord(row.product_setup_record_json),
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

function toEvidenceRecord(row: EvidenceRecordRow, latestSnapshotVersion: number): WorkspaceEvidenceRecord {
  const parsed = WorkspaceEvidenceRecordInputSchema.parse({
    evidenceType: row.evidence_type,
    sourcePersistence: row.source_persistence,
    sourceAttemptId: row.source_attempt_id ?? undefined,
    lifecycleSnapshotVersion: row.lifecycle_snapshot_version,
    status: row.status,
    chainId: row.chain_id,
    networkName: row.network_name,
    transactionHash: row.transaction_hash,
    transactionHashSource: row.transaction_hash_source,
    receiptSource: row.receipt_source,
    receiptStatus: row.receipt_status ?? undefined,
    contractAddress: row.contract_address ?? undefined,
    contractAddressSource: row.contract_address_source,
    eventEvidenceSource: row.event_evidence_source,
    eventName: row.event_name ?? undefined,
    targetWalletAddress: row.target_wallet_address ?? undefined,
    valuation: row.valuation ?? undefined,
    valuationReference: row.valuation_reference ?? undefined,
    tokenAmount: row.token_amount ?? undefined,
    tokenAmountUnits: row.token_amount_units ?? undefined,
    artifactPackageId: row.artifact_package_id ?? undefined,
    compileCheckId: row.compile_check_id ?? undefined,
  });

  return {
    ...parsed,
    id: row.id,
    projectId: row.project_id,
    persistence: 'durable',
    lifecycleSnapshotVersion: row.lifecycle_snapshot_version,
    lifecycleContextStatus:
      latestSnapshotVersion > 0 && row.lifecycle_snapshot_version === latestSnapshotVersion
        ? 'current_context'
        : 'historical_context',
    createdAtIso: row.created_at_iso,
    updatedAtIso: row.updated_at_iso,
  };
}

function toArtifactRecord(row: ArtifactRecordRow, latestSnapshotVersion: number): WorkspaceArtifactRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    artifactType: row.artifact_type,
    artifactId: row.artifact_id,
    artifactStatus: row.artifact_status,
    lifecycleSnapshotVersion: row.lifecycle_snapshot_version,
    lifecycleContextStatus:
      latestSnapshotVersion > 0 && row.lifecycle_snapshot_version === latestSnapshotVersion ? 'current_context' : 'stale_context',
    contentHash: row.content_hash,
    artifactPayload: parseArtifactPayload(row),
    createdAtIso: row.created_at_iso,
    updatedAtIso: row.updated_at_iso,
  };
}

function artifactIdentity(record: WorkspaceArtifactRecordInput): { artifactId: string; artifactStatus: string } {
  switch (record.artifactType) {
    case 'requirement_brief':
      return { artifactId: record.artifactPayload.id, artifactStatus: record.artifactPayload.approvalStatus };
    case 'engineering_brief':
      return { artifactId: record.artifactPayload.id, artifactStatus: 'generated' };
    case 'smart_contract_spec':
      return { artifactId: record.artifactPayload.specId, artifactStatus: record.artifactPayload.status };
    case 'artifact_preview':
      return { artifactId: record.artifactPayload.artifactId, artifactStatus: record.artifactPayload.status };
    case 'check_result':
      return { artifactId: record.artifactPayload.checkId, artifactStatus: record.artifactPayload.status };
    case 'evidence_lite':
      return { artifactId: record.artifactPayload.evidenceId, artifactStatus: record.artifactPayload.status };
    case 'product_setup_pack':
      return { artifactId: `product-setup-pack-${record.artifactPayload.recordId}`, artifactStatus: 'generated' };
  }
}

export function createWorkspacePersistenceRepository(db: DatabaseSync): WorkspacePersistenceRepository {
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(schemaSql);
  const snapshotColumns = db.prepare('PRAGMA table_info(lifecycle_snapshots)').all() as Array<{ name: string }>;
  if (!snapshotColumns.some((column) => column.name === 'product_setup_record_json')) {
    db.exec('ALTER TABLE lifecycle_snapshots ADD COLUMN product_setup_record_json TEXT;');
  }

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

  function getLatestSnapshotVersion(projectId: string): number {
    return latestSnapshotVersionFromRow(
      db
        .prepare('SELECT COALESCE(MAX(version), 0) AS latest_version FROM lifecycle_snapshots WHERE project_id = ?')
        .get(projectId) as { latest_version: number | null } | undefined,
    );
  }

  function getEvidenceRecords(projectId: string): WorkspaceEvidenceRecord[] {
    const latestSnapshotVersion = getLatestSnapshotVersion(projectId);
    const rows = db
      .prepare('SELECT * FROM evidence_records WHERE project_id = ? ORDER BY updated_at_iso DESC, id ASC')
      .all(projectId) as EvidenceRecordRow[];
    return rows.map((row) => toEvidenceRecord(row, latestSnapshotVersion));
  }

  function getArtifactRecords(projectId: string): WorkspaceArtifactRecord[] {
    const latestSnapshotVersion = getLatestSnapshotVersion(projectId);
    const rows = db
      .prepare('SELECT * FROM artifact_records WHERE project_id = ? ORDER BY updated_at_iso DESC, id ASC')
      .all(projectId) as ArtifactRecordRow[];
    return rows.map((row) => toArtifactRecord(row, latestSnapshotVersion));
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
      const productSetupRecordJson = input.productSetupRecord ? JSON.stringify(input.productSetupRecord) : null;

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
            id, project_id, version, source, lifecycle_state_json, product_setup_record_json, investor_wallet_count, created_at_iso
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          snapshotId,
          input.projectId,
          nextVersion,
          input.source,
          lifecycleStateJson,
          productSetupRecordJson,
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
    saveEvidenceRecords(input) {
      const latestSnapshotVersion = getLatestSnapshotVersion(input.projectId);
      if (latestSnapshotVersion === 0) {
        throw new WorkspacePersistenceValidationError('Save a workspace snapshot before storing durable evidence.');
      }
      const records = input.records.map((record) => WorkspaceEvidenceRecordInputSchema.parse(record));

      const createdAtIso = nowIso();
      const insertEvidenceRecord = db.prepare(
        `INSERT INTO evidence_records (
          id, project_id, evidence_type, source_persistence, source_attempt_id, lifecycle_snapshot_version, status,
          chain_id, network_name, transaction_hash, transaction_hash_source, receipt_source, receipt_status,
          contract_address, contract_address_source, event_evidence_source, event_name, target_wallet_address,
          valuation, valuation_reference, token_amount, token_amount_units, artifact_package_id, compile_check_id,
          created_at_iso, updated_at_iso
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(project_id, evidence_type, transaction_hash) DO UPDATE SET
          source_attempt_id = excluded.source_attempt_id,
          lifecycle_snapshot_version = excluded.lifecycle_snapshot_version,
          status = excluded.status,
          receipt_source = excluded.receipt_source,
          receipt_status = excluded.receipt_status,
          contract_address = excluded.contract_address,
          contract_address_source = excluded.contract_address_source,
          event_evidence_source = excluded.event_evidence_source,
          event_name = excluded.event_name,
          target_wallet_address = excluded.target_wallet_address,
          valuation = excluded.valuation,
          valuation_reference = excluded.valuation_reference,
          token_amount = excluded.token_amount,
          token_amount_units = excluded.token_amount_units,
          artifact_package_id = excluded.artifact_package_id,
          compile_check_id = excluded.compile_check_id,
          updated_at_iso = excluded.updated_at_iso`,
      );

      db.exec('BEGIN');
      try {
        for (const record of records) {
          const lifecycleSnapshotVersion = record.lifecycleSnapshotVersion ?? latestSnapshotVersion;
          const evidenceId = `${input.projectId}-${record.evidenceType}-${record.transactionHash.slice(2, 12).toLowerCase()}`;
          insertEvidenceRecord.run(
            evidenceId,
            input.projectId,
            record.evidenceType,
            record.sourcePersistence,
            record.sourceAttemptId ?? null,
            lifecycleSnapshotVersion,
            record.status,
            record.chainId,
            record.networkName,
            record.transactionHash,
            record.transactionHashSource,
            record.receiptSource,
            record.receiptStatus ?? null,
            record.contractAddress ?? null,
            record.contractAddressSource,
            record.eventEvidenceSource,
            record.eventName ?? null,
            record.targetWalletAddress ?? null,
            record.valuation ?? null,
            record.valuationReference ?? null,
            record.tokenAmount ?? null,
            record.tokenAmountUnits ?? null,
            record.artifactPackageId ?? null,
            record.compileCheckId ?? null,
            createdAtIso,
            createdAtIso,
          );
        }
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }

      return {
        projectId: input.projectId,
        latestSnapshotVersion: getLatestSnapshotVersion(input.projectId),
        evidenceRecords: getEvidenceRecords(input.projectId),
      };
    },
    listEvidenceRecords(projectId) {
      return {
        projectId,
        latestSnapshotVersion: getLatestSnapshotVersion(projectId),
        evidenceRecords: getEvidenceRecords(projectId),
      };
    },
    saveArtifactRecords(input) {
      const latestSnapshotVersion = getLatestSnapshotVersion(input.projectId);
      if (latestSnapshotVersion === 0) {
        throw new WorkspacePersistenceValidationError('Save a workspace snapshot before storing generated artifacts.');
      }
      const records = input.records.map((record) => WorkspaceArtifactRecordInputSchema.parse(record));

      const createdAtIso = nowIso();
      const insertArtifactRecord = db.prepare(
        `INSERT INTO artifact_records (
          id, project_id, artifact_type, artifact_id, artifact_status, lifecycle_snapshot_version,
          content_hash, artifact_json, created_at_iso, updated_at_iso
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(project_id, artifact_type, artifact_id, content_hash) DO UPDATE SET
          artifact_status = excluded.artifact_status,
          lifecycle_snapshot_version = excluded.lifecycle_snapshot_version,
          updated_at_iso = excluded.updated_at_iso`,
      );

      db.exec('BEGIN');
      try {
        for (const record of records) {
          const artifactJson = JSON.stringify(record.artifactPayload);
          const contentHash = sha256(artifactJson);
          const { artifactId, artifactStatus } = artifactIdentity(record);
          const lifecycleSnapshotVersion = record.lifecycleSnapshotVersion ?? latestSnapshotVersion;
          const rowId = `${input.projectId}-${record.artifactType}-${artifactId}-${contentHash.slice(0, 12)}`;
          insertArtifactRecord.run(
            rowId,
            input.projectId,
            record.artifactType,
            artifactId,
            artifactStatus,
            lifecycleSnapshotVersion,
            contentHash,
            artifactJson,
            createdAtIso,
            createdAtIso,
          );
        }
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }

      return {
        projectId: input.projectId,
        latestSnapshotVersion: getLatestSnapshotVersion(input.projectId),
        artifactRecords: getArtifactRecords(input.projectId),
      };
    },
    listArtifactRecords(projectId) {
      return {
        projectId,
        latestSnapshotVersion: getLatestSnapshotVersion(projectId),
        artifactRecords: getArtifactRecords(projectId),
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
