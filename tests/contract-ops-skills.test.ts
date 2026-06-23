/* @vitest-environment node */
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contractOpsSkillCards, contractOpsTaskSkills } from '../server/contractOpsSkills/catalog';
import {
  ContractOpsSkillIdSchema,
  ContractOpsSkillTaskSchema,
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
  it('keeps delivery-role skills upgraded for Contract Ops capability reviews', () => {
    const deliveryRoles = readFileSync('docs/handover/08-delivery-role-skills.md', 'utf8');

    expect(deliveryRoles).toContain('Version:** 1.5.0');
    expect(deliveryRoles).toMatch(/Product Setup -> Contract Ops handoff scenarios/i);
    expect(deliveryRoles).toMatch(/skill cards, runtime catalog entries, prompt fragments, and tests/i);
    expect(deliveryRoles).toMatch(/prompt-injection cannot override Sepolia-only/i);
    expect(deliveryRoles).toMatch(/generated Solidity is produced only from confirmed contract specs/i);
    expect(deliveryRoles).toMatch(/ZiLiOS responses are tab-aware/i);
    expect(deliveryRoles).toMatch(/skill catalog versions, source hashes, and focused evals\/tests/i);
  });

  it('keeps the typed runtime skill catalog aligned with repo skill docs', () => {
    expect(existsSync('docs/skills/mila26-contract-ops/SKILL.md')).toBe(true);

    const skillIds = Object.keys(contractOpsSkillCards);
    expect(skillIds.sort()).toEqual(ContractOpsSkillIdSchema.options.slice().sort());

    for (const card of Object.values(contractOpsSkillCards)) {
      expect(existsSync(card.docPath)).toBe(true);
      expect(card.version).toMatch(/^mila26-contract-ops-skill-v\d+$/);
      expect(card.promptFragment.length).toBeLessThan(260);
      expect(card.requiredSafetyGates.length).toBeGreaterThan(0);
      expect(card.outputSchemas.length).toBeGreaterThan(0);
      expect(Object.values(card.sourceHashes).every((hash) => /^[a-f0-9]{64}$/.test(hash))).toBe(true);
    }

    expect(Object.keys(contractOpsTaskSkills).sort()).toEqual(ContractOpsSkillTaskSchema.options.slice().sort());
    for (const [taskType, taskSkillIds] of Object.entries(contractOpsTaskSkills)) {
      expect(taskSkillIds.length).toBeGreaterThan(0);
      for (const skillId of taskSkillIds) {
        expect(contractOpsSkillCards[skillId].taskTypes).toContain(taskType);
      }
    }
  });

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
    expect(invocation?.trace.skillVersions['wallet-deployment-reviewer']).toBe('mila26-contract-ops-skill-v2');
    expect(invocation?.trace.schemaNames).toContain('ContractOpsDeploymentReadiness');
    expect(invocation?.trace.schemaNames).toContain('ContractOpsSpecDraft');
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

  it('prioritizes specialist intent over incidental ERC wording', () => {
    expect(
      resolveContractOpsSkillInvocation({
        activeTabLabel: 'Contract Ops',
        userMessage: 'Review ERC-3643 Solidity for audit, access control, and pause risks.',
      })?.trace.taskType,
    ).toBe('solidity_review');

    expect(
      resolveContractOpsSkillInvocation({
        activeTabLabel: 'Contract Ops',
        userMessage: 'Generate a Solidity implementation plan for a customized ERC-20 whitelist token.',
      })?.trace.taskType,
    ).toBe('solidity_generation_plan');

    expect(
      resolveContractOpsSkillInvocation({
        activeTabLabel: 'Contract Ops',
        userMessage: 'Which constructor parameters and ABI hash will appear in the deployment preview?',
      })?.trace.taskType,
    ).toBe('deployment_preview');
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
