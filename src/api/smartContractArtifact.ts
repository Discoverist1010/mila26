import { requestJson, type ApiClientResult } from './client';
import type {
  SmartContractArtifactRequest,
  SmartContractArtifactResponse,
} from '../../server/contracts/smartContractArtifact';

const routePath = '/api/smart-contract/artifact';

export type SmartContractArtifactClientOptions = {
  baseUrl?: string;
  fetcher?: typeof fetch;
};

export type SmartContractArtifactResult = ApiClientResult<SmartContractArtifactResponse>;

export async function generateSmartContractArtifact(
  request: SmartContractArtifactRequest,
  options: SmartContractArtifactClientOptions = {},
): Promise<SmartContractArtifactResult> {
  return requestJson<SmartContractArtifactResponse>(routePath, request, options);
}
