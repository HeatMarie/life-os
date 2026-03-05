import { db } from "@/lib/db";
import crypto from "crypto";

/**
 * Cache duration by skill (in seconds)
 */
export const CACHE_DURATIONS = {
  "task-parser": 3600, // 1 hour - suggestions change as user context evolves
  "daily-planner": 3600, // 1 hour - schedule recalculated frequently
  "writing-outline": 86400, // 24 hours - outlines stable longer
  "health-insights": 21600, // 6 hours - updates less frequently
  "project-planner": 43200, // 12 hours - timeline estimates stable short-term
  "analytics": 21600, // 6 hours - insights update periodically
  default: 3600, // 1 hour default
};

/**
 * Generate cache key from skill name and input parameters
 */
export function generateCacheKey(skill: string, input: any): string {
  const inputString = JSON.stringify(input, Object.keys(input).sort());
  const hash = crypto.createHash("md5").update(inputString).digest("hex");
  return hash;
}

/**
 * Get cached AI response if available and not expired
 */
export async function getCachedResponse<T>(skill: string, input: any): Promise<T | null> {
  const inputHash = generateCacheKey(skill, input);

  try {
    const cached = await db.aICacheEntry.findFirst({
      where: {
        skill,
        inputHash,
        expiresAt: {
          gt: new Date(), // Not expired
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (cached) {
      console.log(`✅ Cache HIT for ${skill}`);
      return cached.response as T;
    }

    console.log(`❌ Cache MISS for ${skill}`);
    return null;
  } catch (error) {
    console.error("Error fetching from cache:", error);
    return null;
  }
}

/**
 * Store AI response in cache
 */
export async function cacheResponse(
  skill: string,
  input: any,
  response: any,
  customDuration?: number
): Promise<void> {
  const inputHash = generateCacheKey(skill, input);
  const durationSeconds = customDuration || CACHE_DURATIONS[skill as keyof typeof CACHE_DURATIONS] || CACHE_DURATIONS.default;

  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + durationSeconds);

  try {
    await db.aICacheEntry.create({
      data: {
        skill,
        inputHash,
        response,
        expiresAt,
      },
    });

    console.log(`💾 Cached ${skill} response (expires in ${durationSeconds}s)`);
  } catch (error) {
    console.error("Error caching response:", error);
    // Non-fatal - continue without caching
  }
}

/**
 * Invalidate cache for a specific skill and input
 */
export async function invalidateCache(skill: string, input?: any): Promise<void> {
  if (input) {
    const inputHash = generateCacheKey(skill, input);
    await db.aICacheEntry.deleteMany({
      where: {
        skill,
        inputHash,
      },
    });
  } else {
    // Invalidate all cache entries for this skill
    await db.aICacheEntry.deleteMany({
      where: {
        skill,
      },
    });
  }

  console.log(`🗑️  Invalidated cache for ${skill}`);
}

/**
 * Clean up expired cache entries (should be run periodically)
 */
export async function cleanupExpiredCache(): Promise<number> {
  const result = await db.aICacheEntry.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  console.log(`🧹 Cleaned up ${result.count} expired cache entries`);
  return result.count;
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  const [total, expired, bySkill] = await Promise.all([
    db.aICacheEntry.count(),
    db.aICacheEntry.count({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    }),
    db.aICacheEntry.groupBy({
      by: ["skill"],
      _count: {
        skill: true,
      },
    }),
  ]);

  return {
    total,
    active: total - expired,
    expired,
    bySkill: bySkill.reduce(
      (acc, item) => {
        acc[item.skill] = item._count.skill;
        return acc;
      },
      {} as Record<string, number>
    ),
  };
}
