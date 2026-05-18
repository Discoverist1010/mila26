import { describe, expect, it } from 'vitest';
import { runSecurityReview } from '../src/agents/security';
import type { AgentResult } from '../src/domain/schemas';

describe('security reviewer bot', () => {
  it('blocks secret-like generated content', () => {
    const result: AgentResult = {
      taskId: 'task-api',
      role: 'api_worker',
      summary: 'unsafe output',
      risks: [],
      tests: [],
      artifacts: [
        {
          id: 'unsafe',
          kind: 'api-note',
          filename: 'api/example.md',
          sourceTaskId: 'task-api',
          content: 'This generated artifact tries to handle a private key.',
        },
      ],
    };

    const review = runSecurityReview([result]);
    expect(review.approved).toBe(false);
    expect(review.blockedArtifacts).toEqual(['unsafe']);
  });
});
