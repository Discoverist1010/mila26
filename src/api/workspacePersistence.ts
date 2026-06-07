import type {
  WorkspacePersistenceLoadRequest,
  WorkspacePersistenceRecord,
  WorkspacePersistenceSaveRequest,
} from '../../server/contracts/workspacePersistence';
import { requestJson, type ApiClientResult } from './client';

const saveRoutePath = '/api/workspace/save';
const loadLatestRoutePath = '/api/workspace/load-latest';

export type WorkspacePersistenceClientOptions = {
  baseUrl?: string;
  fetcher?: typeof fetch;
};

export type WorkspacePersistenceResult = ApiClientResult<WorkspacePersistenceRecord>;

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
