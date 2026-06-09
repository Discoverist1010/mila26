import { createApp } from '../server/app';
import { loadBackendEnv } from '../server/env';

type LiveChatCase = {
  name: string;
  userMessage: string;
  assistantMode: 'advisor' | 'engineering';
  expected: RegExp[];
  forbidden: RegExp[];
};

const defaultCallLimit = 5;
const maxCallLimit = 10;

const liveChatCases: LiveChatCase[] = [
  {
    name: 'advisor-admin-wallet',
    assistantMode: 'advisor',
    userMessage: 'Explain admin wallet in Product Setup. What should I provide?',
    expected: [/admin wallet/i, /address|public|on-chain account/i],
    forbidden: [/mainnet deployment happened/i, /this is legal advice/i],
  },
  {
    name: 'advisor-burn-lock',
    assistantMode: 'advisor',
    userMessage: 'Explain burn versus lock for redemption in simple terms.',
    expected: [/burn/i, /lock/i, /redemption/i],
    forbidden: [/audit (?:is )?complete/i, /makes?.*legally compliant/i],
  },
  {
    name: 'engineering-messy-product-note',
    assistantMode: 'engineering',
    userMessage:
      'We are tokenising a private credit product for 30 investors, USDC subscriptions, quarterly redemption, whitelisted wallets, NAV uploaded quarterly.',
    expected: [/USDC|stablecoin/i, /wallet/i, /redemption|quarterly/i],
    forbidden: [/transaction hash is 0x/i, /contract address is 0x/i, /has been deployed/i, /Goerli|Polygon|Arbitrum|Amoy/i],
  },
  {
    name: 'engineering-deployment-blockers',
    assistantMode: 'engineering',
    userMessage: 'List the Product Setup fields likely missing before Sepolia Contract Ops deployment.',
    expected: [/Sepolia|testnet/i, /wallet/i],
    forbidden: [/mainnet deployment/i, /share your private key/i, /Goerli|Polygon|Arbitrum|Amoy/i],
  },
  {
    name: 'mixed-protocol-fit',
    assistantMode: 'engineering',
    userMessage:
      'I am not sure which protocol fits. I want approved wallets only, USDC subscriptions, and redemption delays.',
    expected: [/recommended architecture target|architecture target|ERC|token/i, /current executable prototype|prototype|Sepolia/i, /wallet/i],
    forbidden: [/ERC-721 is active/i, /legally compliant/i, /Goerli|Polygon|Arbitrum|Amoy/i],
  },
  {
    name: 'advisor-subscription-wallet',
    assistantMode: 'advisor',
    userMessage: 'What is a subscription receiving wallet and why does ZiLi-OS need it?',
    expected: [/subscription/i, /wallet|address|account/i, /public|on-chain|blockchain/i],
    forbidden: [/send your seed phrase/i, /paste your recovery phrase/i],
  },
  {
    name: 'engineering-unsupported-clawback',
    assistantMode: 'engineering',
    userMessage: 'Can I add conditional transfer with clawback to this tokenised product?',
    expected: [/clawback|conditional/i, /MVP|prototype|custom/i],
    forbidden: [/already implemented/i, /deployed/i],
  },
  {
    name: 'advisor-whitelist',
    assistantMode: 'advisor',
    userMessage: 'Explain whitelisted wallets without calling it KYC approval.',
    expected: [/whitelist/i, /wallet/i],
    forbidden: [/whitelisting is KYC approval/i, /whitelisting is legal approval/i],
  },
  {
    name: 'engineering-pack',
    assistantMode: 'engineering',
    userMessage: 'What should the Product Setup Pack include before review?',
    expected: [/Product Setup/i, /requirements|PRD|evidence|engineering/i],
    forbidden: [/formal audit complete/i, /formally audited/i, /production-ready for mainnet/i],
  },
  {
    name: 'engineering-asset-servicing',
    assistantMode: 'engineering',
    userMessage: 'How should NAV upload and investor updates be captured for asset servicing?',
    expected: [/NAV|valuation/i, /investor/i],
    forbidden: [/oracle is live/i, /wallet push is implemented/i],
  },
];

function parseCallLimit(value: string | undefined): number {
  if (!value?.trim()) return defaultCallLimit;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) return defaultCallLimit;
  return Math.min(parsed, maxCallLimit);
}

function assertNoSecretLeak(value: string): void {
  const unsafePatterns = [
    /OPENAI_API_KEY/i,
    /MILA26_LLM_[A-Z0-9_]+/i,
    /VITE_[A-Z0-9_]*LLM[A-Z0-9_]*/i,
    /\bsk-[A-Za-z0-9_-]{6,}/,
    /stack trace/i,
  ];

  const matched = unsafePatterns.find((pattern) => pattern.test(value));
  if (matched) {
    throw new Error(`Unsafe provider/config text appeared in live response: ${matched}`);
  }
}

function assertLiveResponse(testCase: LiveChatCase, body: unknown): void {
  const parsed = body as {
    ok?: boolean;
    data?: {
      content?: string;
      responseSource?: string;
      agentId?: string;
    };
  };

  if (parsed.ok !== true || !parsed.data) {
    throw new Error(`${testCase.name} did not return an ok API envelope.`);
  }

  if (parsed.data.agentId !== 'blockchain-engineer') {
    throw new Error(`${testCase.name} returned the wrong agent id.`);
  }

  if (parsed.data.responseSource !== 'live_model') {
    throw new Error(`${testCase.name} used ${parsed.data.responseSource ?? 'unknown source'} instead of live_model.`);
  }

  const content = parsed.data.content?.trim() ?? '';
  if (content.length < 40) {
    throw new Error(`${testCase.name} returned an unexpectedly short response.`);
  }

  assertNoSecretLeak(content);

  const missingExpected = testCase.expected.find((pattern) => !pattern.test(content));
  if (missingExpected) {
    throw new Error(`${testCase.name} response did not match expected pattern ${missingExpected}.`);
  }

  const matchedForbidden = testCase.forbidden.find((pattern) => pattern.test(content));
  if (matchedForbidden) {
    throw new Error(`${testCase.name} response matched forbidden pattern ${matchedForbidden}.`);
  }
}

async function main() {
  loadBackendEnv();

  if (process.env.LIVE_OPENAI !== '1') {
    console.warn('Live OpenAI chat skipped: LIVE_OPENAI is not set to 1.');
    return;
  }

  if (process.env.MILA26_LLM_PROVIDER !== 'openai') {
    throw new Error('LIVE_OPENAI=1 requires MILA26_LLM_PROVIDER=openai.');
  }

  if (!process.env.MILA26_LLM_MODEL?.trim()) {
    throw new Error('LIVE_OPENAI=1 requires MILA26_LLM_MODEL.');
  }

  if (!process.env.OPENAI_API_KEY?.trim()) {
    throw new Error('LIVE_OPENAI=1 requires OPENAI_API_KEY.');
  }

  const callLimit = parseCallLimit(process.env.MILA26_LIVE_OPENAI_CALL_LIMIT);
  const casesToRun = liveChatCases.slice(0, callLimit);
  const app = createApp();

  try {
    for (const testCase of casesToRun) {
      const response = await app.inject({
        method: 'POST',
        url: '/api/chat/blockchain-engineer',
        payload: {
          userMessage: testCase.userMessage,
          assistantMode: testCase.assistantMode,
          projectContext: {
            productSetupSource: 'live-openai-chat-harness',
          },
        },
      });
      const body = response.json();

      if (response.statusCode !== 200) {
        throw new Error(`${testCase.name} returned HTTP ${response.statusCode}.`);
      }

      assertLiveResponse(testCase, body);
      console.warn(`passed ${testCase.name}`);
    }

    console.warn(
      `Live OpenAI chat passed ${casesToRun.length}/${casesToRun.length} call(s) with model ${process.env.MILA26_LLM_MODEL}.`,
    );
  } finally {
    await app.close();
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Live OpenAI chat failed.');
  process.exit(1);
});
