import type {
  SmartContractArtifactSpec,
  SmartContractArtifactSpecRequest,
} from '../../server/contracts/smartContractArtifactSpec';
import { requestJson, type ApiClientResult } from './client';

const routePath = '/api/smart-contract/artifact-spec';

export type SmartContractArtifactSpecClientOptions = {
  baseUrl?: string;
  fetcher?: typeof fetch;
};

export type SmartContractArtifactSpecResult = ApiClientResult<SmartContractArtifactSpec>;

export async function generateSmartContractArtifactSpec(
  request: SmartContractArtifactSpecRequest,
  options: SmartContractArtifactSpecClientOptions = {},
): Promise<SmartContractArtifactSpecResult> {
  return requestJson<SmartContractArtifactSpec>(routePath, request, options);
}
