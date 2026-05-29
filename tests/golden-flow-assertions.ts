import { expect } from 'vitest';

const unsafePreExecutionClaimPatterns = [
  /\btxHash\b/i,
  /\bdeployedAddress\b/i,
  /0x[a-fA-F0-9]{6,}/,
  /ready to sign/i,
  /sign now/i,
  /ready to deploy/i,
  /ready for signature/i,
  /deployment ready/i,
  /production ready/i,
  /mainnet ready/i,
  /audit passed/i,
  /security approved/i,
  /\blive\b/i,
  /\bverified\b/i,
  /minted today/i,
  /burned today/i,
  /transfer status open/i,
  /Sepolia operation/i,
];

export function expectNoPrematureBlockchainExecutionClaims(text: string) {
  for (const pattern of unsafePreExecutionClaimPatterns) {
    expect(text).not.toMatch(pattern);
  }
}

