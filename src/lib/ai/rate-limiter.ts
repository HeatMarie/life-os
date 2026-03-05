import { db } from "@/lib/db";

/**
 * Rate limiting configuration for AI calls
 */
const RATE_LIMITS = {
  free: {
    dailyTokenLimit: 10000, // 10K tokens/day for free tier
    monthlyTokenLimit: 200000, // 200K tokens/month
  },
  pro: {
    dailyTokenLimit: 50000, // 50K tokens/day for paid users ($0.50/day budget)
    monthlyTokenLimit: 1000000, // 1M tokens/month
  },
};

/**
 * Claude Sonnet 4 pricing (per million tokens)
 */
const PRICING = {
  "claude-sonnet-4": {
    input: 3.0, // $3 per million input tokens
    output: 15.0, // $15 per million output tokens
  },
  "claude-haiku-4": {
    input: 0.25,
    output: 1.25,
  },
};

/**
 * Check if user has exceeded their daily token limit
 */
export async function checkRateLimit(
  userId: string,
  requiredTokens: number = 0
): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
}> {
  // Get user's AI preferences for custom limits
  const preferences = await db.aIPreferences.findUnique({
    where: { userId },
  });

  const dailyLimit = preferences?.dailyTokenLimit || RATE_LIMITS.free.dailyTokenLimit;

  // Calculate start of today (midnight)
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Get today's usage
  const todayUsage = await db.aIUsage.aggregate({
    where: {
      userId,
      date: {
        gte: startOfDay,
      },
    },
    _sum: {
      tokensUsed: true,
    },
  });

  const tokensUsedToday = todayUsage._sum.tokensUsed || 0;
  const remaining = Math.max(0, dailyLimit - tokensUsedToday);

  // Calculate reset time (midnight tomorrow)
  const resetAt = new Date();
  resetAt.setDate(resetAt.getDate() + 1);
  resetAt.setHours(0, 0, 0, 0);

  return {
    allowed: tokensUsedToday + requiredTokens <= dailyLimit,
    remaining,
    limit: dailyLimit,
    resetAt,
  };
}

/**
 * Track AI usage for a skill execution
 */
export async function trackAIUsage(params: {
  userId: string;
  skill: string;
  tokensUsed: number;
  provider?: string;
  model?: string;
  success?: boolean;
}): Promise<void> {
  const { userId, skill, tokensUsed, provider = "anthropic", model = "claude-sonnet-4", success = true } = params;

  // Calculate cost (rough estimate - input vs output tokens not differentiated)
  const pricing = PRICING[model as keyof typeof PRICING] || PRICING["claude-sonnet-4"];
  const cost = (tokensUsed / 1_000_000) * pricing.input; // Using input pricing as average

  await db.aIUsage.create({
    data: {
      userId,
      skill,
      tokensUsed,
      cost,
      provider,
      model,
      success,
      date: new Date(),
    },
  });
}

/**
 * Get user's AI usage statistics
 */
export async function getAIUsageStats(userId: string, days: number = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const usage = await db.aIUsage.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  const totalTokens = usage.reduce((sum, u) => sum + u.tokensUsed, 0);
  const totalCost = usage.reduce((sum, u) => sum + u.cost, 0);
  const bySkill = usage.reduce(
    (acc, u) => {
      if (!acc[u.skill]) {
        acc[u.skill] = { tokens: 0, cost: 0, calls: 0 };
      }
      acc[u.skill].tokens += u.tokensUsed;
      acc[u.skill].cost += u.cost;
      acc[u.skill].calls += 1;
      return acc;
    },
    {} as Record<string, { tokens: number; cost: number; calls: number }>
  );

  return {
    period: { days, startDate, endDate: new Date() },
    totalTokens,
    totalCost,
    bySkill,
    history: usage,
  };
}

/**
 * Check if user should receive rate limit warning
 */
export async function shouldWarnRateLimit(userId: string): Promise<boolean> {
  const { remaining, limit } = await checkRateLimit(userId);
  const percentRemaining = (remaining / limit) * 100;

  // Warn when below 20% remaining
  return percentRemaining < 20;
}
