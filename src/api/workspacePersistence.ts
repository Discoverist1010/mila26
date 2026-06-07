import type {
  WorkspaceArtifactPersistenceRecord,
  WorkspaceArtifactsListRequest,
  WorkspaceArtifactsSaveRequest,
  WorkspaceEvidenceListRequest,
  WorkspaceEvidencePersistenceRecord,
  WorkspaceEvidenceSaveRequest,
  WorkspacePersistenceLoadRequest,
  WorkspacePersistenceRecord,
  WorkspacePersistenceSaveRequest,
} from '../../server/contracts/workspacePersistence';
import { requestJson, type ApiClientResult } from './client';

const saveRoutePath = '/api/workspace/save';
const loadLatestRoutePath = '/api/workspace/load-latest';
const saveEvidenceRoutePath = '/api/workspace/evidence/save';
const listEvidenceRoutePath = '/api/workspace/evidence/list';
const saveArtifactsRoutePath = '/api/workspace/artifacts/save';
const listArtifactsRoutePath = '/api/workspace/artifacts/list';

export type WorkspacePersistenceClientOptions = {
  baseUrl?: string;
  fetcher?: typeof fetch;
};

export type WorkspacePersistenceResult = ApiClientResult<WorkspacePersistenceRecord>;
export type WorkspaceEvidencePersistenceResult = ApiClientResult<WorkspaceEvidencePersistenceRecord>;
export type WorkspaceArtifactPersistenceResult = ApiClientResult<WorkspaceArtifactPersistenceRecord>;

export async function saveWorkspaceSnapshot(
  request: WorkspacePersistenceSaveRequest,
  options: WorkspacePersistenceClientOptions = {},
): Promise<WorkspacePersistenceResult> {
  return requestJson<WorkspacePersistenceRecord>(saveRoutePath, request, options);
}

export async function loadLatestWorkspaceSnapshot(
  request: WorkspacePersistenceLoadRequest,
  options: WorkspacePersistenceClientOptions = {},
): Promise<WorkspacePersistenceResult> {
  return requestJson<WorkspacePersistenceRecord>(loadLatestRoutePath, request, options);
}

export async function saveWorkspaceEvidenceRecords(
  request: WorkspaceEvidenceSaveRequest,
  options: WorkspacePersistenceClientOptions = {},
): Promise<WorkspaceEvidencePersistenceResult> {
  return requestJson<WorkspaceEvidencePersistenceRecord>(saveEvidenceRoutePath, request, options);
}

export async function listWorkspaceEvidenceRecords(
  request: WorkspaceEvidenceListRequest,
  options: WorkspacePersistenceClientOptions = {},
): Promise<WorkspaceEvidencePersistenceResult> {
  return requestJson<WorkspaceEvidencePersistenceRecord>(listEvidenceRoutePath, request, options);
}

export async function saveWorkspaceArtifactRecords(
  request: WorkspaceArtifactsSaveRequest,
  options: WorkspacePersistenceClientOptions = {},
): Promise<WorkspaceArtifactPersistenceResult> {
  return requestJson<WorkspaceArtifactPersistenceRecord>(saveArtifactsRoutePath, request, options);
}

export async function listWorkspaceArtifactRecords(
  request: WorkspaceArtifactsListRequest,
  options: WorkspacePersistenceClientOptions = {},
): Promise<WorkspaceArtifactPersistenceResult> {
  return requestJson<WorkspaceArtifactPersistenceRecord>(listArtifactsRoutePath, request, options);
}
