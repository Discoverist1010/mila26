# Code Reviewer Lessons — MILA26

## Status: ACTIVE — GROWS WITH EACH REVIEW

**Version:** 1.2.0
**Last updated:** 2026-06-06
**Applies to:** MILA26 repository  
**File path:** `docs/handover/06-code-reviewer-lessons.md`

---

## RELATED FILES (Code Reviewer Trio)

| File | Role |
|------|------|
| `docs/handover/05-code-reviewer-skill.md` | Reviewer identity, principles, report format |
| `docs/contracts/code-reviewer-checklist.md` | Executable phases (**authority for severities**) |
| `docs/handover/06-code-reviewer-lessons.md` | This file — pattern memory (`MILA26-XXX`) |

**Workflow:** Read checkpoint → **scan this file against the diff** → run checklist phases → write report → update this file.

Pattern-to-phase map: see checklist section **PATTERN ID QUICK MAP**.

---

## PURPOSE

This file is the reviewer's memory. It accumulates patterns caught during code reviews so that future reviews start smarter. It is the mechanism by which the Code Reviewer Skill (`05-code-reviewer-skill.md`) self-improves over time.

**Without this file:** Every review starts from zero. The reviewer must rediscover patterns that were already caught before.

**With this file:** The reviewer checks known patterns first, catches recurrences faster, and builds institutional knowledge that survives beyond any single review session.

---

## HOW TO USE THIS FILE

### Before Each Review

1. Read this file after `00-mila26-current-checkpoint.md` and **before** `code-reviewer-checklist.md` (see skill pre-review order)
2. Pay special attention to patterns with **Catch Count ≥ 2** (recurring problems)
3. Search the diff for all **CRITICAL**-severity patterns below, then run checklist Phase 0 onward
4. On quick reviews, still run CRITICAL pattern detection even when checklist stops at Phase 3

### After Each Review

1. Identify any new patterns not already in this file
2. Add new patterns with:
   - A unique Pattern ID (increment from last used)
   - Descriptive name
   - Category and severity
   - Detection method (how to find it in future diffs)
   - Concrete example if available
   - Catch count starting at 1
3. For existing patterns that appeared again:
   - Increment the catch count
   - Add the new occurrence to the Occurrences log
   - Consider upgrading severity if recurrence suggests systemic issue
4. Update the Review Session Log with summary of the review

### Pattern Severity Upgrade Rule

- First occurrence: Log at detected severity
- Second occurrence (same pattern, same module): Keep severity
- Third occurrence (same pattern, different modules): Consider upgrading severity one level
- Fifth occurrence: Pattern is systemic — upgrade to CRITICAL and flag for architecture review

---

## PATTERN LIBRARY

Each pattern lists **Checklist** phase(s) where applicable. Full cross-reference: `docs/contracts/code-reviewer-checklist.md` § PATTERN ID QUICK MAP.

### Pattern ID: MILA26-001

**Name:** Fake transaction hash or contract address  
**Category:** Safety / Guardrail  
**Severity:** CRITICAL  
**First caught:** 2026-05-31 (seeded from architecture review)  
**Catch count:** 0  
**Checklist:** Phase 1.1, 1.3; Phase 2.1  
**Description:** Hardcoded `0x...` values presented as real transaction hashes or contract addresses before actual wallet-signed deployment has occurred. This includes placeholder values in UI, test fixtures that could be mistaken for real data, and "example" addresses shown in production UI paths.  
**Detection:** Search diff for `0x` followed by 64 hex characters. For each match, verify the context: is it a known constant, a test fixture clearly marked as mock, or a provider-returned value? If it appears in UI or API response without clear "mock" labeling, flag it.  
**Example:**

```typescript
// DANGEROUS — flagged as CRITICAL
const txHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const contractAddress = "0xabcdef1234567890abcdef1234567890abcdef12";

// ACCEPTABLE — clearly a test fixture
const MOCK_TX_HASH = "0x0000000000000000000000000000000000000000000000000000000000000000"; // tests only
```

**Occurrences:** None yet — seeded from architecture review

---

### Pattern ID: MILA26-002

**Name:** Unsafe guardrail label in UI or response  
**Category:** Guardrail  
**Severity:** CRITICAL  
**First caught:** 2026-05-31 (seeded from checkpoint guardrail definitions)  
**Catch count:** 0  
**Checklist:** Phase 1.1  
**Description:** Using labels like "Ready to deploy," "Deployed," "Live," "Signed," "Confirmed," "Verified," "Audited," or "Production ready" before the corresponding capability actually exists. These labels appear in UI text, API responses, console logs, or documentation and create false claims about system capabilities. After execution tracks exist, submitted/confirmed labels remain unsafe unless they are qualified with provider-returned transaction or receipt-confirmed provenance.  
**Detection:** Search diff for unsafe label list (see `docs/contracts/code-reviewer-checklist.md` Phase 1.1). Check all UI text strings, status labels, API response messages, and console log statements. For submitted/confirmed states, verify explicit provider/receipt source fields and tests.  
**Example:**

```typescript
// DANGEROUS — flagged as CRITICAL
status: "Deployed"
label: "Ready to sign"

// CORRECT — honest state representation
status: "Deployment execution: Blocked"
label: "User wallet signing required later"
```

**Occurrences:** None yet — seeded from checkpoint guardrail definitions

---

### Pattern ID: MILA26-003

**Name:** Scope creep — incidental edit outside track allowance  
**Category:** Scope  
**Severity:** HIGH  
**First caught:** 2026-05-31 (seeded from track discipline review)  
**Catch count:** 0  
**Checklist:** Phase 0.4  
**Description:** A track's diff includes small or drive-by changes to files outside the "Allowed" list when those files were not the primary deliverable — import reorder, formatting, adjacent refactors. Distinct from **MILA26-021** (CRITICAL), which covers files that are wholly out of scope, prohibited items, or unapproved dependencies.  
**Detection:** Compare changed files to "Allowed". If a file is touched only for incidental edits (not a new deliverable), flag HIGH. If the file should not appear at all, use **MILA26-021**.  
**Example:**

```text
Track 14B "Allowed": src/wallet/deployment.ts, tests/wallet-deployment.test.ts
Diff includes: src/wallet/deployment.ts, tests/wallet-deployment.test.ts, src/App.tsx (refactored import order)

→ Flag src/App.tsx as HIGH — Scope Creep (checklist 0.4)
```

**Occurrences:** None yet — seeded from track discipline review

---

### Pattern ID: MILA26-021

**Name:** Scope violation — disallowed file, prohibited item, or unapproved dependency  
**Category:** Scope  
**Severity:** CRITICAL  
**First caught:** 2026-05-31 (trio alignment; split from MILA26-003)  
**Catch count:** 0  
**Checklist:** Phase 0.1–0.3  
**Description:** Changed file not in the track "Allowed" list (and not a necessary test for an allowed change), any "Must not add" item present in the diff, or a new `package.json` dependency without track approval. Blocks merge.  
**Detection:** List every diff path; reject any not in Allowed. Grep diff for each "Must not add" entry. Diff lockfiles/manifests for new dependencies.  
**Example:**

```text
Track 14B "Allowed": src/wallet/deployment.ts, tests/wallet-deployment.test.ts
Diff adds: src/billing/stripe.ts

→ CRITICAL — Scope Violation (file not allowed)
```

**Occurrences:** None yet — introduced in v1.0.1 trio alignment

---

### Pattern ID: MILA26-004

**Name:** Generic variable naming in wide scope  
**Category:** Naming  
**Severity:** MEDIUM  
**First caught:** 2026-05-31 (seeded from code quality review)  
**Catch count:** 0  
**Description:** Use of `data`, `result`, `item`, `temp`, `val`, `obj`, `arr`, `ret`, `res`, or `tmp` in any scope wider than a 3-line arrow function. These names carry zero domain meaning and force readers to trace code to understand what the variable represents.  
**Detection:** Regex search for `\b(data|result|item|temp|val|obj|arr|ret|res|tmp)\b` in variable declarations (`const`/`let`/`var`). Exclude matches inside arrow functions shorter than 3 lines and destructuring where the source has a meaningful name.  
**Example:**

```typescript
// FLAGGED — what data? what result?
const data = await fetchDeploymentStatus();
const result = processDeployment(data);

// BETTER — domain-meaningful names
const deploymentStatus = await fetchDeploymentStatus();
const gateReadiness = assessGateReadiness(deploymentStatus);
```

**Occurrences:** None yet — seeded from code quality review

---

### Pattern ID: MILA26-005

**Name:** Right rail workflow button  
**Category:** Architecture  
**Severity:** HIGH  
**First caught:** 2026-05-31 (seeded from lifecycle workspace architecture review)
**Catch count:** 0  
**Description:** A workflow/action button appearing in the right rail instead of the central Engineering Bot surface. The right rail must remain passive status-only. Buttons like "Deploy," "Approve," "Sign," or "Generate" in the right rail violate the lifecycle workspace architecture where Engineering Bot is the sole lifecycle workflow decision orchestrator. Operation-specific SCP controls are only acceptable after the corresponding operation track approves and gates them.
**Detection:** Check right-rail component JSX for `<button>`, `<Button>`, or any element with `onClick` that triggers a workflow action (not UI toggles like show/hide panels). UI toggles for panel visibility are acceptable.  
**Example:**

```jsx
// FLAGGED — workflow button in right rail
<div className="right-rail">
  <Button onClick={handleDeploy}>Deploy to Sepolia</Button>  // HIGH violation
</div>

// ACCEPTABLE — passive status display
<div className="right-rail">
  <StatusBadge status={deploymentStatus} />
</div>
```

**Occurrences:** None yet — seeded from lifecycle workspace architecture review

---

### Pattern ID: MILA26-006

**Name:** Active SCP operation before operation track  
**Category:** Architecture / Safety  
**Severity:** CRITICAL  
**First caught:** 2026-05-31 (seeded from SCP role definition)  
**Catch count:** 0  
**Description:** SCP showing active Mint, Burn, Pause, NAV, or Distribution controls before the corresponding operation track is complete. Before wallet-signed testnet deployment, SCP must show only passive status/evidence/boundary. After deployment, operations unlock only when their specific operation track is complete.  
**Detection:** Check SCP view model (`SmartContractControlPanelViewModel`) and SCP UI components for enabled operation buttons, non-locked operation status, or absence of "Locked" labels.  
**Example:**

```typescript
// FLAGGED — active operation before Track 15A
scpActions: [
  { name: "Record NAV Event", enabled: true, handler: handleRecordNAV }  // CRITICAL
]

// CORRECT — locked until operation track
scpActions: [
  { name: "Record NAV Event", enabled: false, disabledReason: "Locked until operation track" }
]
```

**Occurrences:** None yet — seeded from SCP role definition

---

### Pattern ID: MILA26-007

**Name:** Frontend LLM call or secret exposure  
**Category:** Security  
**Severity:** CRITICAL  
**First caught:** 2026-05-31 (seeded from non-negotiable principles)  
**Catch count:** 0  
**Description:** OpenAI API call, fetch to LLM endpoint, or `VITE_*LLM*` environment variable in frontend code. All LLM calls must be backend-only. Frontend must never have access to LLM API keys or make direct LLM calls.  
**Detection:** Search for `openai` imports in frontend code, fetch calls to known LLM endpoints (`api.openai.com`, `anthropic.com`), and `VITE_` prefixed environment variables containing `LLM`, `OPENAI`, or `AI`.  
**Example:**

```typescript
// FLAGGED — CRITICAL
import OpenAI from 'openai';  // in frontend code
const VITE_OPENAI_API_KEY = "...";  // in .env or code

// CORRECT — backend-only LLM calls
// Frontend calls backend API, backend calls LLM
const response = await fetch('/api/engineering-brief', { ... });
```

**Occurrences:** None yet — seeded from non-negotiable principles

---

### Pattern ID: MILA26-008

**Name:** Monolithic context or global state introduction  
**Category:** Architecture  
**Severity:** HIGH  
**First caught:** 2026-05-31 (seeded from architecture principles)  
**Catch count:** 0  
**Description:** Introduction of a `ProjectLifecycleContext`, large React context object, global state library (Redux, Zustand, Jotai), or any state management that violates the typed-artifact + local-state architecture. MILA26 uses separate typed artifacts, thin derived read models, and local React state only.  
**Detection:** Search for `createContext` with large value objects, `useReducer` at app level, imports from `redux`, `zustand`, `jotai`, or similar libraries. Also flag new context providers wrapping large portions of the component tree.  
**Example:**

```typescript
// FLAGGED — monolithic context
const ProjectContext = createContext({
  requirementBrief: ...,
  engineeringBrief: ...,
  deploymentGate: ...,
  walletState: ...,
  scpState: ...,
  // everything in one context
});

// CORRECT — typed artifacts + local state
const [deploymentIntent, setDeploymentIntent] = useState<UnsignedDeploymentIntent | null>(null);
```

**Occurrences:** None yet — seeded from architecture principles

---

### Pattern ID: MILA26-009

**Name:** Premature abstraction  
**Category:** Rigidity  
**Severity:** MEDIUM  
**First caught:** 2026-05-31 (seeded from code structure review)  
**Catch count:** 0  
**Description:** Interface, abstract class, factory function, or strategy pattern created when only ONE implementation exists. Premature abstraction adds complexity without benefit and makes future changes harder because the abstraction must be evolved or broken.  
**Detection:** For every new interface, abstract class, or factory function, count the number of implementations in the codebase. If count = 1, flag it. Exception: interfaces that define a public API contract for external consumers (documented in `docs/contracts/`).  
**Example:**

```typescript
// FLAGGED — only one implementation exists
interface IDeploymentAdapter {  // "I" prefix also Hungarian notation smell
  deploy(config: DeployConfig): Promise<DeployResult>;
}
class SepoliaDeploymentAdapter implements IDeploymentAdapter { ... }  // only implementation

// BETTER — start concrete, abstract when second implementation exists
class DeploymentAdapter {
  deploy(config: DeployConfig): Promise<DeployResult> { ... }
}
```

**Occurrences:** None yet — seeded from code structure review

---

### Pattern ID: MILA26-010

**Name:** Silent error swallow  
**Category:** Brittleness  
**Severity:** HIGH  
**First caught:** 2026-05-31 (seeded from error handling review)  
**Catch count:** 0  
**Description:** Try-catch block that catches an error and only logs it without re-throwing, returning an error state, or otherwise communicating the failure to the caller. This creates silent failures where the application continues as if nothing went wrong, leading to data inconsistency or misleading UI state.  
**Detection:** Search for `catch` blocks. Check if they contain only `console.log`/`console.error` without a `throw`, return of error state, or callback with error. Empty catch blocks `catch(e) {}` are the most severe form.  
**Example:**

```typescript
// FLAGGED — silent swallow
try {
  await syncCalendarEvent(reminder);
} catch (e) {
  console.error('sync failed', e);  // caller never knows
}

// BETTER — communicate failure
try {
  await syncCalendarEvent(reminder);
} catch (e) {
  return { status: 'sync_failed', error: sanitizeError(e) };
}
```

**Occurrences:** None yet — seeded from error handling review

---

### Pattern ID: MILA26-011

**Name:** Missing account/chain re-check before transaction  
**Category:** Blockchain Safety  
**Severity:** CRITICAL  
**First caught:** 2026-05-31 (seeded from Track 14B safety refinements)  
**Catch count:** 0  
**Checklist:** Phase 2.4  
**Description:** Wallet transaction code that checks account and chain at connection time but does NOT re-check immediately before `eth_sendTransaction`. Between connection and transaction submission, the user could switch accounts or chains in their wallet. The code must re-read `eth_accounts` and `eth_chainId` immediately before sending.  
**Detection:** In any function that calls `eth_sendTransaction`, verify there are `eth_accounts` and `eth_chainId` calls immediately before (not just at connection time). Check that the function blocks if account changed or chain is no longer Sepolia.  
**Example:**

```typescript
// FLAGGED — no re-check before send
async function deploy() {
  if (!isConnected || !isSepolia) return;  // checked at connection time only
  const txHash = await provider.request({ method: 'eth_sendTransaction', ... });
}

// CORRECT — re-check immediately before send
async function deploy() {
  const accounts = await provider.request({ method: 'eth_accounts' });
  const chainId = await provider.request({ method: 'eth_chainId' });
  if (!accounts.length || accounts[0] !== connectedAccount) throw new Error('Account changed');
  if (chainId !== SEPOLIA_CHAIN_ID) throw new Error('Wrong chain');
  const txHash = await provider.request({ method: 'eth_sendTransaction', ... });
}
```

**Occurrences:** None yet — seeded from Track 14B safety refinements

---

### Pattern ID: MILA26-012

**Name:** Unbounded receipt polling  
**Category:** Blockchain Safety / Brittleness  
**Severity:** HIGH  
**First caught:** 2026-05-31 (seeded from Track 14B safety refinements)  
**Catch count:** 0  
**Checklist:** Phase 2.4  
**Description:** Receipt polling after transaction submission that has no maximum attempts, no timeout, and no cancellation mechanism. This can poll forever if the transaction is stuck, and can continue polling after the component unmounts or a new transaction attempt starts.  
**Detection:** Search for `eth_getTransactionReceipt` calls inside loops, intervals, or recursive `setTimeout`. Verify: maximum attempts defined, timeout defined, polling stops on component unmount, polling stops if a new deployment attempt starts.  
**Example:**

```typescript
// FLAGGED — unbounded polling
while (!receipt) {
  receipt = await provider.request({ method: 'eth_getTransactionReceipt', params: [txHash] });
  await sleep(2000);
}

// CORRECT — bounded, cancellable
for (let i = 0; i < MAX_ATTEMPTS && !cancelled; i++) {
  const receipt = await provider.request({ method: 'eth_getTransactionReceipt', params: [txHash] });
  if (receipt) return receipt;
  await sleep(2000);
}
throw new Error('Receipt polling exceeded maximum attempts');
```

**Occurrences:** None yet — seeded from Track 14B safety refinements

---

### Pattern ID: MILA26-013

**Name:** Duplicate transaction submission possible  
**Category:** Blockchain Safety  
**Severity:** HIGH  
**First caught:** 2026-05-31 (seeded from Track 14B safety refinements)  
**Catch count:** 0  
**Checklist:** Phase 2.4  
**Description:** Transaction submission code that doesn't guard against duplicate submissions. If a user clicks "Deploy" twice quickly, or if a React re-render triggers the effect twice, two transactions could be sent. The code must check if a deployment is already `awaiting_wallet_confirmation` or `submitted` before sending.  
**Detection:** Check the deployment function for a guard that checks current deployment status. Verify status is set to `awaiting_wallet_confirmation` BEFORE calling `eth_sendTransaction`, not after. Verify the guard is synchronous (not dependent on async state that could be stale).  
**Example:**

```typescript
// FLAGGED — no duplicate guard
async function handleDeploy() {
  const txHash = await provider.request({ method: 'eth_sendTransaction', ... });
  setStatus('submitted');
}

// CORRECT — guard before send
async function handleDeploy() {
  if (status === 'awaiting_wallet_confirmation' || status === 'submitted') {
    return; // already in progress
  }
  setStatus('awaiting_wallet_confirmation');
  const txHash = await provider.request({ method: 'eth_sendTransaction', ... });
  setStatus('submitted');
}
```

**Occurrences:** None yet — seeded from Track 14B safety refinements

---

### Pattern ID: MILA26-014

**Name:** Manual bytecode or hash construction  
**Category:** Blockchain Safety / Artifact Integrity  
**Severity:** CRITICAL  
**First caught:** 2026-05-31 (seeded from Track 14B artifact rules)  
**Catch count:** 0  
**Description:** Bytecode, ABI, or deployment artifact that is manually written, hardcoded, or constructed from string concatenation instead of being derived from the compiled Solidity contract output. All bytecode and ABI must come from the Hardhat compilation artifacts generated by `npm run contracts:build`.  
**Detection:** Search for long hex strings that look like bytecode, search for ABI arrays that are hardcoded rather than imported from artifact files, check that deployment artifact imports reference the compiled output.  
**Example:**

```typescript
// FLAGGED — manual bytecode
const bytecode = "0x6080604052348015..." // where did this come from?

// CORRECT — derived from compiled artifact
import artifact from '../../artifacts/contracts/Mila26RestrictedFundToken.sol/Mila26RestrictedFundToken.json';
const bytecode = artifact.bytecode;
```

**Occurrences:** None yet — seeded from Track 14B artifact rules

---

### Pattern ID: MILA26-015

**Name:** Domain logic in UI component  
**Category:** Architecture / Layer Isolation  
**Severity:** HIGH  
**First caught:** 2026-05-31 (seeded from architecture review)  
**Catch count:** 0  
**Description:** Business logic, validation rules, state transition logic, or domain calculations implemented directly inside a React component instead of in a dedicated domain module. This makes the logic untestable in isolation and couples business rules to UI rendering.  
**Detection:** Check React components for: complex conditional logic that determines business state, date/time calculations for business rules, validation logic beyond simple field presence, direct manipulation of domain objects without calling domain functions.  
**Example:**

```typescript
// FLAGGED — domain logic in component
function DeploymentPanel() {
  // Business rule implemented in component
  const canDeploy = requirementBrief.approved
    && engineeringBrief.generated
    && closureLedger.openItems.length === 0
    && compileResult.passed;

  // Domain calculation in component
  const readinessScore = (artifacts.length / requiredArtifacts) * 100;
}

// CORRECT — domain logic in dedicated module
import { canRequestDeployment } from '../domain/deploymentGateReadModel';
import { calculateReadinessScore } from '../domain/projectLifecycleReadModel';
```

**Occurrences:** None yet — seeded from architecture review

---

### Pattern ID: MILA26-016

**Name:** Hardcoded configuration that should be environment-driven  
**Category:** Brittleness  
**Severity:** MEDIUM  
**First caught:** 2026-05-31 (seeded from configuration review)  
**Catch count:** 0  
**Description:** Values that vary between environments (API URLs, chain IDs, feature flags, timeouts) hardcoded in source files instead of being read from environment variables or a configuration module. This makes the code impossible to configure without changing source code.  
**Detection:** Search for URLs, numeric constants for timeouts/limits, chain IDs, and feature toggles that are hardcoded rather than imported from a config module or environment variable.  
**Example:**

```typescript
// FLAGGED — hardcoded config
const SEPOLIA_RPC = "https://sepolia.infura.io/v3/...";
const MAX_POLLING_ATTEMPTS = 30;

// CORRECT — environment-driven
const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL;
const MAX_POLLING_ATTEMPTS = parseInt(process.env.RECEIPT_POLLING_MAX_ATTEMPTS || '30');
```

**Occurrences:** None yet — seeded from configuration review

---

### Pattern ID: MILA26-017

**Name:** Test verifies implementation, not behavior  
**Category:** Test Quality  
**Severity:** MEDIUM  
**First caught:** 2026-05-31 (seeded from test quality review)  
**Catch count:** 0  
**Description:** Tests that assert on internal implementation details (specific function calls, internal state shape, order of internal operations) rather than on observable behavior (outputs, side effects, API responses). These tests break when implementation changes even if behavior is correct.  
**Detection:** Check tests for: assertions on private function calls, assertions on internal state that isn't part of the public API, tests that mock domain objects instead of external dependencies, tests that verify "function X was called" when what matters is "the result is correct."  
**Example:**

```typescript
// FLAGGED — tests implementation
expect(service.internalHelper).toHaveBeenCalledWith('specific-arg');
expect(service.internalState.step).toBe(3);

// CORRECT — tests behavior
const result = await service.deploy(intent);
expect(result.status).toBe('submitted');
expect(result.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
```

**Occurrences:** None yet — seeded from test quality review

---

### Pattern ID: MILA26-018

**Name:** Missing safe label in UI after state change  
**Category:** Guardrail  
**Severity:** HIGH  
**First caught:** 2026-05-31 (seeded from guardrail audit design)  
**Catch count:** 0  
**Description:** When a new UI state is introduced (e.g., after a new track adds a feature), the corresponding safe labels are not added. For example, adding a deployment preparation state but not adding "Deployment execution: Blocked" label, or showing wallet status without "Backend never holds private keys."  
**Detection:** For each new UI state or status display added in the diff, verify that all applicable safe labels from the guardrail list are present. Cross-reference with the safe labels list in `docs/contracts/code-reviewer-checklist.md` Phase 1.2.  
**Example:**

```typescript
// FLAGGED — new state without safe labels
{status === 'preparing' && <div>Preparing deployment...</div>}

// CORRECT — safe labels included
{status === 'preparing' && (
  <div>
    <div>Preparing deployment...</div>
    <div className="safety-boundary">Deployment execution: Not started</div>
    <div className="safety-boundary">Backend never holds private keys</div>
  </div>
)}
```

**Occurrences:** None yet — seeded from guardrail audit design

---

### Pattern ID: MILA26-019

**Name:** Stale closure or async state reference  
**Category:** Brittleness  
**Severity:** HIGH  
**First caught:** 2026-05-31 (seeded from async patterns review)  
**Catch count:** 0  
**Description:** An async callback (`setTimeout`, `setInterval`, event handler, or promise chain) that captures a state value in its closure and uses it after the state has changed. Common with React `useState` where the captured value is stale by the time the async operation completes.  
**Detection:** Search for `useState` values used inside `setTimeout`, `setInterval`, or `.then()` callbacks without a ref or without re-reading the current value. Check if the logic depends on the captured value being current.  
**Example:**

```typescript
// FLAGGED — stale closure
const [status, setStatus] = useState('idle');
async function deploy() {
  setStatus('awaiting');
  // If deploy is called again quickly, this timeout still sees old status
  setTimeout(() => {
    if (status === 'awaiting') {  // status might have changed
      setStatus('timeout');
    }
  }, 30000);
}

// CORRECT — use ref for latest value
const statusRef = useRef(status);
statusRef.current = status;
```

**Occurrences:** None yet — seeded from async patterns review

---

### Pattern ID: MILA26-020

**Name:** Missing .env.example entry for new environment variable  
**Category:** Documentation / Developer Experience  
**Severity:** LOW  
**First caught:** 2026-05-31 (seeded from developer experience review)  
**Catch count:** 0  
**Checklist:** Phase 8.6  
**Description:** A new environment variable is introduced in code but no corresponding entry is added to `.env.example`. This means other developers (or future AI agents) don't know the variable exists or what format it requires.  
**Detection:** Search for `process.env.` in the diff. For each new environment variable accessed, verify there's a corresponding entry in `.env.example` with a comment explaining its purpose and format.  
**Example:**

```text
# .env.example — must include:
SEPOLIA_RPC_URL=                    # Ethereum Sepolia RPC endpoint URL
RECEIPT_POLLING_MAX_ATTEMPTS=30     # Maximum attempts for transaction receipt polling
```

**Occurrences:** None yet — seeded from developer experience review

---

### Pattern ID: MILA26-022

**Name:** Operation bypasses lifecycle source of truth
**Category:** Architecture / Brittleness
**Severity:** HIGH
**First caught:** 2026-06-06 (Sprint Track 1 review)
**Catch count:** 1
**Checklist:** Phase 3.2, 5.6, 7.3, 9.4
**Description:** An operation surface accepts a direct typed value and can execute without checking the shared lifecycle read model that is supposed to own readiness. In Sprint Track 1, SCP Whitelist Wallet could accept any valid EVM address even though Investor Registry was the intended wallet whitelist source of truth. This weakens cross-tab state integrity and lets operation controls bypass lifecycle gates.
**Detection:** For each operation button or transaction path, identify the domain/read model that owns readiness. Verify the `canRequest...` or equivalent gate depends on that read model, not only local field validation. Search for editable operation inputs such as target wallet, stablecoin, redemption wallet, amount, date, or payout fields and verify direct input cannot bypass the relevant lifecycle tab state.
**Example:**

```typescript
// FLAGGED — typed input bypasses Investor Registry
const canWhitelist = isValidNonZeroEvmAddress(targetWallet) && deploymentConfirmed;

// CORRECT — SCP consults lifecycle read model
const selectedRegistryEntry = lifecycleReadModel.investorRegistry.entries.find((entry) =>
  addressesMatch(entry.normalizedWalletAddress, targetWallet),
);
const canWhitelist =
  deploymentConfirmed &&
  Boolean(selectedRegistryEntry?.canUseForWhitelist);
```

**Occurrences:**
- 2026-06-06 — Sprint Track 1 — `src/App.tsx` — SCP Whitelist Wallet initially accepted valid unregistered target wallets before being gated by Investor Registry readiness.

---

### Pattern ID: MILA26-023

**Name:** Readiness count derived from stale stored status
**Category:** Brittleness / Read Model
**Severity:** MEDIUM
**First caught:** 2026-06-06 (Sprint Track 1 review)
**Catch count:** 1
**Checklist:** Phase 5.6, 7.3, 9.4
**Description:** A summary count or status badge is derived from raw stored state while row-level eligibility is derived from effective validation. This causes contradictory UI, such as duplicate wallets being counted as "ready to whitelist" while their row is blocked. Read-model summaries must derive from effective eligibility, not stale labels.
**Detection:** Compare row-level `can...` / validation logic with summary counts, vault status, lifecycle snapshot text, and tab status. If counts use raw stored statuses while buttons use derived eligibility, flag the mismatch. Require regression tests for duplicates, invalid entries, max-count boundaries, and already-used items.
**Example:**

```typescript
// FLAGGED — raw status ignores later duplicate validation
const readyToWhitelistCount = entries.filter((entry) => entry.status === 'ready_to_whitelist').length;

// CORRECT — summary matches actual handoff eligibility
const readyToWhitelistCount = readModelEntries.filter((entry) => entry.canUseForWhitelist).length;
```

**Occurrences:**
- 2026-06-06 — Sprint Track 1 — `src/domain/lifecycleState.ts` — duplicate wallets initially inflated `readyToWhitelistCount` before the count was derived from `canUseForWhitelist`.

---

### Pattern ID: MILA26-024

**Name:** Stale cache or memory presented as current state
**Category:** State / Memory / Performance
**Severity:** HIGH
**First caught:** 2026-06-06 (seeded from State / Memory / Performance reviewer design)
**Catch count:** 0
**Checklist:** Phase 3.4, 5.8, 9.6
**Description:** Cached, memoized, persisted, or remembered data is reused after a lifecycle input changes, or is displayed without freshness/provenance. This can make the workspace look consistent while silently using outdated investor registry, subscription, redemption, NAV/valuation, wallet, deployment, operation, evidence, or contract-parameter state.
**Detection:** For any cache, memo, persistence, browser storage, project memory, run memory, chat memory, or local-session evidence change, identify the cache key, invalidation rule, freshness label, and source of truth. Verify every input affecting the output is part of the key or invalidation path. Check that wallet signatures, private keys, raw model output, unsafe artifacts, and blocked outputs cannot be cached as approved state.
**Example:**

```typescript
// FLAGGED - cache key ignores redemption delay and wallet state.
const cacheKey = productId;
const params = cachedContractParameters.get(cacheKey);

// CORRECT - derived from current approved lifecycle state, with explicit freshness.
const params = deriveSubscriptionRedemptionParameters(currentLifecycleReadModel);
const freshness = {
  source: 'current_lifecycle_read_model',
  generatedAt: new Date().toISOString(),
};
```

**Occurrences:**
- None yet - seeded proactively for future persistence/cache work.

---

## REVIEW SESSION LOG

| Date | Track/Branch | Issues Found (C/H/M/L) | Patterns Triggered | New Patterns Added | Reviewer Version |
|------|--------------|------------------------|--------------------|--------------------|------------------|
| 2026-05-31 | — (initial seed) | 0/0/0/0 | None | MILA26-001 through MILA26-020 | 1.0.0 |
| 2026-05-31 | — (trio alignment) | 0/0/0/0 | None | MILA26-021; severities aligned with checklist | 1.0.1 |
| 2026-06-06 | Sprint Track 1 review | 0/1/1/0 | MILA26-022, MILA26-023 | MILA26-022, MILA26-023 | 1.1.0 |

---

## PATTERN STATISTICS

| Pattern ID | Name | Catch Count | Severity | Last Seen |
|------------|------|-------------|----------|-----------|
| MILA26-001 | Fake transaction hash or contract address | 0 | CRITICAL | — |
| MILA26-002 | Unsafe guardrail label | 0 | CRITICAL | — |
| MILA26-003 | Scope drift | 0 | HIGH | — |
| MILA26-004 | Generic variable naming | 0 | MEDIUM | — |
| MILA26-005 | Right rail workflow button | 0 | HIGH | — |
| MILA26-006 | Active SCP operation before track | 0 | CRITICAL | — |
| MILA26-007 | Frontend LLM call or secret | 0 | CRITICAL | — |
| MILA26-008 | Monolithic context or global state | 0 | HIGH | — |
| MILA26-009 | Premature abstraction | 0 | MEDIUM | — |
| MILA26-010 | Silent error swallow | 0 | HIGH | — |
| MILA26-011 | Missing account/chain re-check | 0 | CRITICAL | — |
| MILA26-012 | Unbounded receipt polling | 0 | HIGH | — |
| MILA26-013 | Duplicate transaction possible | 0 | HIGH | — |
| MILA26-014 | Manual bytecode or hash | 0 | CRITICAL | — |
| MILA26-015 | Domain logic in UI component | 0 | HIGH | — |
| MILA26-016 | Hardcoded configuration | 0 | MEDIUM | — |
| MILA26-017 | Test verifies implementation | 0 | MEDIUM | — |
| MILA26-018 | Missing safe label after state change | 0 | HIGH | — |
| MILA26-019 | Stale closure or async reference | 0 | HIGH | — |
| MILA26-020 | Missing .env.example entry | 0 | LOW | — |
| MILA26-021 | Scope violation (CRITICAL) | 0 | CRITICAL | — |
| MILA26-022 | Operation bypasses lifecycle source of truth | 1 | HIGH | 2026-06-06 |
| MILA26-023 | Readiness count derived from stale stored status | 1 | MEDIUM | 2026-06-06 |
| MILA26-024 | Stale cache or memory presented as current state | 0 | HIGH | — |

---

## SEVERITY DISTRIBUTION (Current)

| Severity | Count | Pattern IDs |
|----------|-------|-------------|
| CRITICAL | 7 | 001, 002, 006, 007, 011, 014, 021 |
| HIGH | 11 | 003, 005, 008, 010, 012, 013, 015, 018, 019, 022, 024 |
| MEDIUM | 5 | 004, 009, 016, 017, 023 |
| LOW | 1 | 020 |

---

## HOW TO ADD A NEW PATTERN

Use this template when adding patterns after a review:

````markdown
### Pattern ID: MILA26-XXX
**Name:** [Brief, descriptive name]
**Category:** [Safety / Guardrail / Scope / Architecture / Naming / Brittleness / Rigidity / Test Quality / Documentation / Blockchain Safety]
**Severity:** [CRITICAL / HIGH / MEDIUM / LOW]
**First caught:** [YYYY-MM-DD] (during review of [Track/Branch])
**Catch count:** 1
**Checklist:** [Phase.section]
**Description:** [What the pattern is, why it's a problem, and the concrete impact]
**Detection:** [Specific steps or regex patterns to find this in future diffs]
**Example:**
```[language]
// FLAGGED — why this is wrong
[code example]

// CORRECT — how it should be done
[code example]
```
**Occurrences:**
- [YYYY-MM-DD] — [Track/Branch] — [File:line] — [Brief note]
````

Then:

1. Increment the last used Pattern ID
2. Add to the Pattern Library section
3. Add to the Pattern Statistics table
4. Update Severity Distribution counts
5. Add entry to Review Session Log

---

## VERSION HISTORY

| Version | Date | Change | Author |
|---------|------|--------|--------|
| 1.2.0 | 2026-06-06 | Added stale cache/memory reviewer pattern | Codex |
| 1.1.0 | 2026-06-06 | Added lifecycle source-of-truth and stale-readiness-count patterns from Sprint Track 1 review | Codex |
| 1.0.2 | 2026-05-31 | Aligned unsafe-label and SCP-control lessons with source-sensitive execution evidence and Track 15A operation-specific controls | AI Bot Factory |
| 1.0.1 | 2026-05-31 | Trio alignment: MILA26-021 scope violation; MILA26-003 scope creep only; checklist phase map | AI Bot Factory |
| 1.0.0 | 2026-05-31 | Initial pattern library seeded with 20 patterns from architecture, guardrail, safety, and code quality review | AI Bot Factory |
