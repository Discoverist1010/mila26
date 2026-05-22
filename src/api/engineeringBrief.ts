import type { EngineeringBrief, EngineeringBriefRequest } from '../../server/contracts/engineeringBrief';
import { requestJson, type ApiClientResult } from './client';

const routePath = '/api/prd/engineering-brief';

export type EngineeringBriefClientOptions = {
  baseUrl?: string;
  fetcher?: typeof fetch;
};

export type EngineeringBriefResult = ApiClientResult<EngineeringBrief>;

export async function generateEngineeringBrief(
  request: EngineeringBriefRequest,
  options: EngineeringBriefClientOptions = {},
): Promise<EngineeringBriefResult> {
  return requestJson<EngineeringBrief>(routePath, request, options);
}
