export type ContractOpsSafetyResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: string;
      redactedText: string;
    };

const privateKeyContextPattern = /\b(private\s*key|seed\s*phrase|recovery\s*phrase|mnemonic|secret\s*key)\b/i;
const likelySecretDisclosurePattern =
  /\b(?:my|our|use|using|paste|pasted|here(?:'s| is)|this is|deploy with|sign with)\b.{0,80}\b(?:private\s*key|seed\s*phrase|recovery\s*phrase|mnemonic|secret\s*key)\b|\b(?:seed\s*phrase|recovery\s*phrase|mnemonic|private\s*key|secret\s*key)\b\s*[:=]/i;
const secretTokenPatterns = [
  /\bsk-[A-Za-z0-9_-]{8,}\b/g,
  /\b(?:OPENAI_API_KEY|MILA26_LLM_[A-Z0-9_]*|RPC_KEY|ALCHEMY_API_KEY|INFURA_API_KEY)\s*=\s*[^\s]+/gi,
  /\b0x[a-fA-F0-9]{64}\b/g,
];

export function redactContractOpsSensitiveText(value: string): string {
  return secretTokenPatterns.reduce((redacted, pattern) => redacted.replace(pattern, '[REDACTED]'), value);
}

export function evaluateContractOpsUserTextSafety(value: string): ContractOpsSafetyResult {
  const hasLongHexSecretLikeValue = /\b0x[a-fA-F0-9]{64}\b/.test(value);

  if (privateKeyContextPattern.test(value) && (likelySecretDisclosurePattern.test(value) || hasLongHexSecretLikeValue)) {
    return {
      ok: false,
      reason: 'User text appears to include private-key, seed-phrase, or recovery-phrase material.',
      redactedText: redactContractOpsSensitiveText(value),
    };
  }

  if (hasLongHexSecretLikeValue && !/\b(tx|transaction|hash|receipt)\b/i.test(value)) {
    return {
      ok: false,
      reason: 'User text includes a long hex value that may be secret material. ZiLiOS should only accept public addresses and provider transaction hashes with clear context.',
      redactedText: redactContractOpsSensitiveText(value),
    };
  }

  return { ok: true };
}

export function includesUnsafeContractOpsOutput(value: string): boolean {
  return [
    /backend\s+(?:will|can|should)\s+(?:sign|deploy|hold private keys?)/i,
    /\b(?:deploy|deployment|execute|execution|send|sign)\b.{0,40}\bmainnet\b/i,
    /\b(?:formal\s+audit\s+(?:complete|passed|done)|passed\s+a\s+formal\s+audit)\b/i,
    /\b(?:is|now|fully|legally)\s+legal(?:ly)?\s+compliant\b/i,
    /\bproduction\s+ready\b/i,
    /\bfake\s+(?:transaction|tx|contract)\b/i,
    /OPENAI_API_KEY|MILA26_LLM_|sk-[A-Za-z0-9_-]{8,}/i,
  ].some((pattern) => pattern.test(value));
}
