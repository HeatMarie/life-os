import { askAI } from "./client";
import { checkRateLimit, trackAIUsage } from "./rate-limiter";
import { getCachedResponse, cacheResponse } from "./cache";
import type {
  ClaudeSkill,
  SkillContext,
  SkillResult,
  TaskParseInput,
  TaskParseOutput,
  DailyPlannerInput,
  DailyPlannerOutput,
} from "./types";

/**
 * Registry of all available Claude skills
 */
class ClaudeSkillRegistry {
  private skills: Map<string, ClaudeSkill<any, any>> = new Map();

  register(skill: ClaudeSkill<any, any>) {
    this.skills.set(skill.name, skill);
  }

  get(name: string): ClaudeSkill<any, any> | undefined {
    return this.skills.get(name);
  }

  list(): string[] {
    return Array.from(this.skills.keys());
  }
}

export const skillRegistry = new ClaudeSkillRegistry();

/**
 * Execute a Claude skill with context, rate limiting, and caching
 */
export async function executeSkill<TInput, TOutput>(
  skillName: string,
  input: TInput,
  context: SkillContext
): Promise<SkillResult<TOutput>> {
  const skill = skillRegistry.get(skillName);

  if (!skill) {
    return {
      success: false,
      error: `Skill not found: ${skillName}`,
    };
  }

  try {
    // 1. Check rate limits before execution
    const estimatedTokens = context.maxTokens || 1000; // Conservative estimate
    const rateLimit = await checkRateLimit(context.userId, estimatedTokens);

    if (!rateLimit.allowed) {
      console.warn(`❌ Rate limit exceeded for user ${context.userId}`);
      return {
        success: false,
        error: `AI quota exceeded. Daily limit: ${rateLimit.limit} tokens. Used: ${rateLimit.limit - rateLimit.remaining}. Resets at: ${rateLimit.resetAt.toLocaleString()}`,
        metadata: {
          tokensUsed: 0,
          cost: 0,
          cached: false,
          provider: "anthropic",
          rateLimitExceeded: true,
          resetAt: rateLimit.resetAt,
        },
      };
    }

    // 2. Check cache before execution (if caching enabled)
    if (context.cacheEnabled !== false) {
      const cached = await getCachedResponse<TOutput>(skillName, input);
      if (cached) {
        console.log(`✅ Returning cached response for ${skillName}`);
        return {
          success: true,
          data: cached,
          metadata: {
            tokensUsed: 0,
            cost: 0,
            cached: true,
            provider: "anthropic",
          },
        };
      }
    }

    // 3. Execute the skill
    const startTime = Date.now();
    const data = await skill.execute(input);
    const executionTime = Date.now() - startTime;

    // Estimate tokens used (this is a rough estimate - ideally get from API response)
    // Claude Sonnet 4: Typical input ~500-2000 tokens, output ~200-1000 tokens
    const estimatedTokensUsed = estimatedTokens;

    // 4. Track usage in database
    await trackAIUsage({
      userId: context.userId,
      skill: skillName,
      tokensUsed: estimatedTokensUsed,
      provider: "anthropic",
      model: "claude-sonnet-4-20250514",
      success: true,
    });

    console.log(`✅ Tracked AI usage: ${estimatedTokensUsed} tokens for ${skillName}`);

    // 5. Cache response (if caching enabled)
    if (context.cacheEnabled !== false) {
      await cacheResponse(skillName, input, data, context.cacheDuration);
      console.log(`💾 Cached response for ${skillName}`);
    }

    return {
      success: true,
      data,
      metadata: {
        tokensUsed: estimatedTokensUsed,
        cost: (estimatedTokensUsed / 1_000_000) * 3.0, // $3 per million tokens
        cached: false,
        provider: "anthropic",
        executionTime,
      },
    };
  } catch (error) {
    console.error(`Skill execution failed: ${skillName}`, error);

    // Track failed attempt
    await trackAIUsage({
      userId: context.userId,
      skill: skillName,
      tokensUsed: 0,
      success: false,
    }).catch((e) => console.error("Failed to track error:", e));

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Helper to build character context for prompts
 */
export function buildCharacterContext(character: {
  name: string;
  class: string;
  level: number;
  xp: number;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  currentStreak: number;
}): string {
  return `
Character Profile:
- Name: ${character.name}
- Class: ${character.class}
- Level: ${character.level} (${character.xp} XP)
- HP: ${character.hp}/${character.maxHp}
- Energy: ${character.energy}/${character.maxEnergy}
- Current Streak: ${character.currentStreak} days
`.trim();
}
