import { labelForModule } from '../domain/moduleCatalog';
import type { AgentResult, EvidencePack, RequirementBrief, SecurityReview } from '../domain/schemas';

export function generateEvidencePack(
  brief: RequirementBrief,
  results: AgentResult[],
  securityReview: SecurityReview,
): EvidencePack {
  const enabledModules = brief.modules.filter((module) => module.enabled);
  const artifactRows = results
    .flatMap((result) => result.artifacts)
    .map((artifact) => `| ${artifact.filename} | ${artifact.kind} | ${artifact.sourceTaskId} |`)
    .join('\n');

  const markdown = `# MILA26 Evidence Pack

Generated at: ${new Date().toISOString()}

## Requirement Summary

- Fund: ${brief.fundFacts.fundName} (${brief.fundFacts.tokenSymbol})
- Jurisdiction: ${brief.fundFacts.jurisdiction}
- Target investors: ${brief.fundFacts.targetInvestors}
- Deployment target: ${brief.deploymentTarget}
- Requirement brief id: ${brief.id}

## Module Rationale

${enabledModules.map((module) => `- ${labelForModule(module.id)}: ${module.rationale}`).join('\n')}

## Security Constraints

${brief.securityConstraints.map((constraint) => `- ${constraint}`).join('\n')}

## Generated Artifact Inventory

| File | Kind | Source task |
| --- | --- | --- |
${artifactRows}

## Security Review

- Approved: ${securityReview.approved ? 'Yes' : 'No'}
${securityReview.findings.map((finding) => `- ${finding}`).join('\n')}

## Work Evidence

${results.map((result) => `- ${result.role}: ${result.summary}`).join('\n')}

## Notes

This pack evidences engineering preparation work only. It does not certify legal, regulatory, tax, or investment compliance.
`;

  return {
    id: `evidence-${brief.id}`,
    generatedAt: new Date().toISOString(),
    markdown,
  };
}
