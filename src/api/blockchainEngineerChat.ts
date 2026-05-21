import type {
  BlockchainEngineerChatRequest,
  BlockchainEngineerChatResponse,
} from '../../server/contracts/chat';
import { requestJson, type ApiClientResult } from './client';

const routePath = '/api/chat/blockchain-engineer';

export type BlockchainEngineerChatClientOptions = {
  baseUrl?: string;
  fetcher?: typeof fetch;
};

export type BlockchainEngineerChatResult = ApiClientResult<BlockchainEngineerChatResponse>;

export async function askBlockchainEngineer(
  request: BlockchainEngineerChatRequest,
  options: BlockchainEngineerChatClientOptions = {},
): Promise<BlockchainEngineerChatResult> {
  if (!request.userMessage.trim()) {
    return { ok: false, code: 'CLIENT_VALIDATION_ERROR', message: 'Enter a question before asking the bot.' };
  }

  return requestJson<BlockchainEngineerChatResponse>(routePath, request, options);
}
