/* @vitest-environment node */
import { describe, expect, it } from 'vitest';
import {
  ContractOpsProtocolAdviceSchema,
  ContractOpsSpecDraftSchema,
} from '../server/contracts/contractOpsSkills';
import { resolveContractOpsSkillInvocation } from '../server/contractOpsSkills/registry';
import {
  evaluateContractOpsUserTextSafety,
  includesUnsafeContractOpsOutput,
  redactContractOpsSensitiveText,
} from '../server/contractOpsSkills/safety';

describe('Contract Ops expertise skills', () => {
  it('routes Contract Ops tasks to compact distilled skills with trace metadata', () => {
    const invocation = resolveContractOpsSkillInvocation({
      activeTabLabel: 'Contract Ops',
      requestedFocus: 'deployment',
      userMessage: 'Can I deploy this contract to Sepolia with my wallet?',
    });

    expect(invocation).toBeDefined();
    expect(invocation?.trace.taskType).toBe('deployment_readiness');
    expect(invocation?.trace.skillIds).toEqual(['wallet-deployment-reviewer', 'contract-spec-compiler']);
    expect(invocation?.trace.safetyGate).toBe('allowed');
    expect(invocation?.trace.sourceSnapshotHashes.wallets).toMatch(/^[a-f0-9]{64}$/);
    expect(invocation?.trace.sourceSnapshotHashes.qa).toMatch(/^[a-f0-9]{64}$/);
    expect(invocation?.promptInstruction).toMatch(/User wallet signs/i);
    expect(invocation?.promptInstruction).toMatch(/derive contract specs from typed Product Setup state/i);
  });

  it('keeps runtime prompt fragments small and does not inject source snapshots', () => {
    const invocation = resolveContractOpsSkillInvocation({
      activeTabLabel: 'Contract Ops',
      requestedFocus: 'protocol_choice',
      userMessage: 'Compare ERC-20 and ERC-3643 for this tokenised fund.',
    });

    expect(invocation?.trace.taskType).toBe('protocol_advice');
    expect(invocation?.promptInstruction.length).toBeLessThan(1_200);
    expect(invocation?.promptInstruction).not.toMatch(/Scaffold-ETH|foundryup|forge test|magic run/i);
    expect(invocation?.promptInstruction).not.toMatch(/https:\/\/ethskills\.com/i);
  });

  it('blocks private-key and secret-like input before model execution', () => {
    const privateKey = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const result = evaluateContractOpsUserTextSafety(`Use this private key ${privateKey} to deploy`);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/private-key|seed-phrase|recovery-phrase/i);
      expect(result.redactedText).not.toContain(privateKey);
      expect(result.redactedText).toContain('[REDACTED]');
    }
  });

  it('allows public transaction hashes when the user gives clear transaction context', () => {
    const txHash = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
    const result = evaluateContractOpsUserTextSafety(`Here is the deployment transaction hash: ${txHash}`);

    expect(result).toEqual({ ok: true });
  });

  it('allows beginner safety questions that do not disclose secret material', () => {
    expect(evaluateContractOpsUserTextSafety('What is a private key and why should I not paste it?')).toEqual({
      ok: true,
    });
  });

  it('redacts common API key patterns from diagnostic text', () => {
    const redacted = redactContractOpsSensitiveText('OPENAI_API_KEY=sk-test-secret and RPC_KEY=abc123');

    expect(redacted).not.toContain('sk-test-secret');
    expect(redacted).not.toContain('abc123');
    expect(redacted).toContain('[REDACTED]');
  });

  it('detects unsafe Contract Ops output claims without blocking safe warnings', () => {
    expect(includesUnsafeContractOpsOutput('ZiLiOS can deploy this contract to mainnet now.')).toBe(true);
    expect(includesUnsafeContractOpsOutput('Do not use mainnet in the current Sepolia-only prototype.')).toBe(false);
    expect(includesUnsafeContractOpsOutput('The backend should hold private keys for deployment.')).toBe(true);
    expect(includesUnsafeContractOpsOutput('This is not a formal audit.')).toBe(false);
  });

  it('validates protocol advice and contract spec schemas', () => {
    expect(
      ContractOpsProtocolAdviceSchema.parse({
        recommendedArchitectureTarget: 'Customised ERC-20',
        selectedProtocolBase: 'ERC-20',
        currentExecutablePrototype: 'Sepolia restricted ERC-20-compatible',
        confidence: 'medium',
        tradeoffs: ['ERC-20 is practical for the MVP but needs workflow or custom controls for restrictions.'],
        blockers: ['Admin wallet is missing.'],
        laterRequirements: ['Investor wallet list can be added in Investor Wallets.'],
      }),
    ).toMatchObject({
      selectedProtocolBase: 'ERC-20',
    });

    expect(
      ContractOpsSpecDraftSchema.safeParse({
        selectedProtocol: 'ERC-3643',
        contractTemplate: 'Permissioned Fund Token',
        deploymentChain: 'Ethereum Mainnet',
        userWalletSigns: true,
        backendHoldsPrivateKeys: false,
        deploymentBlockers: [],
        laterLifecycleRequirements: [],
        evidenceEvents: [],
      }).success,
    ).toBe(false);
  });
});
