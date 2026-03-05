import { askAI } from "../client";
import { buildCharacterContext } from "../claude-skills";
import {
  ClaudeSkill,
  DailyPlannerInput,
  DailyPlannerOutput,
  DailyPlannerInputSchema,
  DailyPlannerOutputSchema,
} from "../types";

/**
 * Daily Planning Assistant Skill
 *
 * Analyzes user's tasks, calendar events, energy levels, and health data
 * to create an optimized daily schedule with burnout warnings.
 *
 * Leverages Claude's 100K+ token context to analyze entire workload simultaneously.
 */
export class DailyPlannerSkill implements ClaudeSkill<DailyPlannerInput, DailyPlannerOutput> {
  name = "daily-planner";
  description = "Create optimized daily schedule with energy management";

  async execute(input: DailyPlannerInput): Promise<DailyPlannerOutput> {
    // Validate input
    const validated = DailyPlannerInputSchema.parse(input);

    const characterContext = buildCharacterContext({
      name: validated.character.name || "Hero",
      class: validated.character.class || "WARRIOR",
      level: validated.character.level || 1,
      xp: validated.character.xp || 0,
      hp: validated.character.hp,
      maxHp: validated.character.maxHp,
      energy: validated.character.energy,
      maxEnergy: validated.character.maxEnergy,
      currentStreak: validated.character.currentStreak,
    });

    const systemPrompt = `You are an intelligent daily planning assistant for NEXUS, an RPG-themed productivity system.

Your role is to analyze a user's tasks, calendar, energy levels, and health data to create an optimized daily schedule that:
1. Respects energy budget (prevent burnout)
2. Prioritizes high-impact tasks
3. Balances different life areas
4. Considers time-of-day energy patterns
5. Warns about overcommitment

**Energy Budget Analysis:**
- Available energy: Current energy level
- Required energy: Sum of all planned task energy costs
- Surplus/Deficit: Available - Required
- BURNOUT RISK:
  - LOW: Surplus > 100 energy
  - MEDIUM: Deficit 0-50 energy
  - HIGH: Deficit > 50 energy

**Scheduling Principles:**
- Morning (6am-12pm): HIGH energy tasks, deep work
- Afternoon (12pm-5pm): MEDIUM energy tasks, meetings
- Evening (5pm-10pm): LOW energy tasks, routines

**Warnings to Issue:**
- "You're overcommitted by X energy - consider rescheduling"
- "High burnout risk - recommend light day or rest"
- "Your streak is at risk if you overextend"
- "HP is low - prioritize health recovery tasks"

Return JSON with this structure:
{
  "energyAnalysis": {
    "available": number,
    "required": number,
    "surplus": number (can be negative)
  },
  "burnoutRisk": "low" | "medium" | "high",
  "schedule": [
    {
      "taskId": "task-id-here",
      "suggestedTime": "9:00 AM" or "Morning" or "Afternoon",
      "reasoning": "Why this time slot is optimal"
    }
  ],
  "warnings": ["warning message 1", "warning message 2"],
  "recommendations": ["recommendation 1", "recommendation 2"]
}`;

    // Build comprehensive context with all data
    const tasksContext = validated.tasks
      .map(
        (t: any, i: number) =>
          `${i + 1}. ${t.title} - Priority: ${t.priority}, Energy: ${t.energyCost || 15}, Due: ${t.dueDate || "none"}`
      )
      .join("\n");

    const eventsContext = validated.events
      .map((e: any) => `- ${e.title} at ${new Date(e.startsAt).toLocaleTimeString()}`)
      .join("\n");

    const healthContext = validated.healthData
      ? validated.healthData
          .slice(0, 7)
          .map((h: any) => `- ${h.type}: ${h.value} ${h.unit || ""}`)
          .join("\n")
      : "No recent health data";

    const prompt = `Analyze this user's day and create an optimized schedule:

${characterContext}

**Today's Date:** ${validated.date.toLocaleDateString()}

**Scheduled Tasks (${validated.tasks.length}):**
${tasksContext}

**Calendar Events (${validated.events.length}):**
${eventsContext}

**Recent Health Data:**
${healthContext}

Analyze the energy budget, detect burnout risk, create optimal schedule, and provide warnings/recommendations.

Return the analysis as JSON.`;

    const response = await askAI(
      [{ role: "user", content: prompt }],
      {
        systemPrompt,
        preferredProvider: "anthropic", // Use Claude for complex analysis
        fallbackEnabled: true,
      }
    );

    // Parse response
    try {
      const parsed = JSON.parse(response.content);
      return DailyPlannerOutputSchema.parse(parsed);
    } catch (error) {
      console.error("Failed to parse daily planner response:", error);

      // Fallback: basic energy analysis
      const totalRequired = validated.tasks.reduce((sum: number, t: any) => sum + (t.energyCost || 15), 0);
      const available = validated.character.energy;
      const surplus = available - totalRequired;

      return {
        energyAnalysis: {
          available,
          required: totalRequired,
          surplus,
        },
        burnoutRisk: surplus < -50 ? "high" : surplus < 0 ? "medium" : "low",
        schedule: validated.tasks.slice(0, 5).map((t: any) => ({
          taskId: t.id,
          suggestedTime: "Flexible",
          reasoning: "Energy analysis required",
        })),
        warnings: surplus < 0 ? ["Insufficient energy for all tasks today"] : [],
        recommendations: ["Focus on highest priority tasks first"],
      };
    }
  }
}
