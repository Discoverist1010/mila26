import type { AgentResult, SecurityReview } from '../domain/schemas';

const forbiddenPatterns = [
  { pattern: /sk-[a-zA-Z0-9_-]+/, label: 'OpenAI-style API key' },
  { pattern: /private\s*key/i, label: 'private key handling' },
  { pattern: /seed\s*phrase/i, label: 'seed phrase handling' },
  { pattern: /innerHTML\s*=/, label: 'raw innerHTML assignment' },
  { pattern: /localStorage\.setItem\([^)]*key/i, label: 'secret-like localStorage write' },
  { pattern: /ENABLE_REAL_DEPLOY\s*=\s*true/, label: 'real deployment enabled by default' },
];

export function runSecurityReview(results: AgentResult[]): SecurityReview {
  const findings: string[] = [];
  const blockedArtifacts: string[] = [];

  for (const result of results) {
    for (const artifact of result.artifacts) {
      for (const rule of forbiddenPatterns) {
        if (rule.pattern.test(artifact.content)) {
          findings.push(`${artifact.filename} includes ${rule.label}.`);
          blockedArtifacts.push(artifact.id);
        }
      }
    }
  }

  if (findings.length === 0) {
    findings.push('No hardcoded secrets, seed phrase handling, unsafe HTML rendering, or real deploy enablement detected.');
  }

  return {
    approved: blockedArtifacts.length === 0,
    findings,
    blockedArtifacts,
  };
}
