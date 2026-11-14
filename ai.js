// Claude-powered cognitive engine for the Node server.
// Enabled when ANTHROPIC_API_KEY is set; otherwise the site uses the rule-based engine.
import Anthropic from '@anthropic-ai/sdk';
import { AI_BETAS, buildFollowupRequest, buildSynthesisRequest, parseAiMessage } from './public/js/cognitive.js';
import { validateQuestionDef } from './public/js/engine.js';

export function createAi({ apiKey = process.env.ANTHROPIC_API_KEY, client } = {}) {
  const anthropic = client ?? (apiKey ? new Anthropic({ apiKey, maxRetries: 1 }) : null);

  async function run(body, timeout) {
    try {
      const msg = await anthropic.beta.messages.create({ ...body, betas: AI_BETAS }, { timeout });
      return parseAiMessage(msg);
    } catch (err) {
      if (err instanceof Anthropic.AuthenticationError) console.error('[ai] invalid ANTHROPIC_API_KEY');
      else if (err instanceof Anthropic.RateLimitError) console.error('[ai] rate limited');
      else if (err instanceof Anthropic.APIError) console.error(`[ai] API error ${err.status}: ${err.message}`);
      else console.error(`[ai] ${err.message}`);
      throw err;
    }
  }

  return {
    enabled: Boolean(anthropic),

    /** An adaptive question written for this person, or null if the engine can't produce one. */
    async followup(circle, answers, name) {
      if (!anthropic) return null;
      try {
        const raw = await run(buildFollowupRequest(circle, answers, name), 45_000);
        return validateQuestionDef({ ...raw, max: 2, source: 'ai' }, circle);
      } catch {
        return null;
      }
    },

    /** The engine's reasoning about this person's Ikigai (raw shape), or null. */
    async synthesize(answers, name) {
      if (!anthropic) return null;
      try {
        return await run(buildSynthesisRequest(answers, name), 120_000);
      } catch {
        return null;
      }
    },
  };
}
