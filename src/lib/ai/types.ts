import { z } from "zod";

/**
 * Base interface for all Claude skills
 */
export interface ClaudeSkill<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  execute(input: TInput): Promise<TOutput>;
}

/**
 * Skill execution context - includes rate limiting, caching, user info
 */
export interface SkillContext {
  userId: string;
  skillName: string;
  cacheEnabled?: boolean;
  cacheDuration?: number; // seconds
  maxTokens?: number;
}

/**
 * Common skill output wrapper
 */
export interface SkillResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    tokensUsed?: number;
    cost?: number;
    cached?: boolean;
    provider?: "anthropic" | "huggingface";
    executionTime?: number; // milliseconds
    rateLimitExceeded?: boolean;
    resetAt?: Date; // When rate limit resets
  };
}

// Schema definitions for validation

export const TaskParseInputSchema = z.object({
  userInput: z.string().min(1),
  context: z.object({
    recentTasks: z.array(z.any()).optional(),
    currentEnergy: z.number().optional(),
    currentDate: z.date().optional(),
  }).optional(),
});

export const TaskParseOutputSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW", "NONE"]),
  areaId: z.string().optional(),
  suggestedEnergyCost: z.number().min(5).max(100),
  suggestedDueDate: z.date().optional(),
  confidence: z.number().min(0).max(1),
});

export type TaskParseInput = z.infer<typeof TaskParseInputSchema>;
export type TaskParseOutput = z.infer<typeof TaskParseOutputSchema>;

export const DailyPlannerInputSchema = z.object({
  userId: z.string(),
  date: z.date(),
  tasks: z.array(z.any()),
  events: z.array(z.any()),
  character: z.object({
    name: z.string().optional(),
    class: z.string().optional(),
    level: z.number().optional(),
    xp: z.number().optional(),
    hp: z.number(),
    maxHp: z.number(),
    energy: z.number(),
    maxEnergy: z.number(),
    currentStreak: z.number(),
  }),
  healthData: z.array(z.any()).optional(),
});

export const DailyPlannerOutputSchema = z.object({
  energyAnalysis: z.object({
    available: z.number(),
    required: z.number(),
    surplus: z.number(),
  }),
  burnoutRisk: z.enum(["low", "medium", "high"]),
  schedule: z.array(z.object({
    taskId: z.string(),
    suggestedTime: z.string(),
    reasoning: z.string(),
  })),
  warnings: z.array(z.string()),
  recommendations: z.array(z.string()),
});

export type DailyPlannerInput = z.infer<typeof DailyPlannerInputSchema>;
export type DailyPlannerOutput = z.infer<typeof DailyPlannerOutputSchema>;
