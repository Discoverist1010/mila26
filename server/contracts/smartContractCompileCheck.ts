import { z } from 'zod';

export const SmartContractCompileTestStatusSchema = z.enum(['passed', 'failed', 'blocked', 'not_run']);

export const SmartContractTestedCapabilitiesSchema = z.object({
  erc20Basics: SmartContractCompileTestStatusSchema.exclude(['blocked']),
  whitelistRestrictions: SmartContractCompileTestStatusSchema.exclude(['blocked']),
  issuerMintAllocation: SmartContractCompileTestStatusSchema.exclude(['blocked']),
  valuationEvent: SmartContractCompileTestStatusSchema.exclude(['blocked']),
  distributionEvent: SmartContractCompileTestStatusSchema.exclude(['blocked']),
  pauseUnpause: SmartContractCompileTestStatusSchema.exclude(['blocked']),
  accessControl: SmartContractCompileTestStatusSchema.exclude(['blocked']),
});

export const SmartContractCompileTestResultSchema = z.object({
  compileCheckId: z.string().min(1),
  artifactId: z.string().min(1),
  specId: z.string().min(1),
  contractName: z.literal('Mila26RestrictedFundToken'),
  toolchain: z.literal('hardhat'),
  status: SmartContractCompileTestStatusSchema,
  compiler: z.object({
    configured: z.boolean(),
    toolchainStatus: z.enum(['configured', 'not_configured']),
    solidityVersion: z.string().min(1).optional(),
    command: z.literal('npm run contracts:build -- --force'),
    status: SmartContractCompileTestStatusSchema,
    summary: z.string().min(1),
  }),
  testRun: z.object({
    command: z.literal('npm run test:contracts'),
    status: SmartContractCompileTestStatusSchema,
    testCount: z.number().int().nonnegative().optional(),
    summary: z.string().min(1),
  }),
  testedCapabilities: SmartContractTestedCapabilitiesSchema,
  boundaryChecks: z.object({
    deploymentNotExecuted: z.literal(true),
    walletSigningNotPerformed: z.literal(true),
    privateKeysNotUsed: z.literal(true),
    mainnetDisabled: z.literal(true),
    noFakeAddressOrTxHash: z.literal(true),
    auditNotPerformed: z.literal(true),
  }),
  evidenceRefs: z.array(z.string().min(1)),
  blockedReasons: z.array(z.string().min(1)),
  metadata: z.object({
    generatedAt: z.string().min(1),
    generator: z.literal('deterministic_10b_compile_test_result_adapter'),
    source: z.literal('local_hardhat_test_foundation'),
    version: z.string().min(1),
  }),
});

export type SmartContractCompileTestStatus = z.infer<typeof SmartContractCompileTestStatusSchema>;
export type SmartContractTestedCapabilities = z.infer<typeof SmartContractTestedCapabilitiesSchema>;
export type SmartContractCompileTestResult = z.infer<typeof SmartContractCompileTestResultSchema>;
