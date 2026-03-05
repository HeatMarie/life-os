import { askAI } from "../client";
import {
  ClaudeSkill,
  TaskParseInput,
  TaskParseOutput,
  TaskParseInputSchema,
  TaskParseOutputSchema,
} from "../types";

/**
 * Natural Language Task Parser Skill
 *
 * Parses natural language input into structured task data with suggestions
 * for priority, area, energy cost, and due date.
 *
 * Examples:
 * - "Schedule dentist appointment next Tuesday at 2pm high priority"
 * - "Write blog post about AI by end of week"
 * - "Call mom tomorrow morning"
 */
export class TaskParserSkill implements ClaudeSkill<TaskParseInput, TaskParseOutput> {
  name = "task-parser";
  description = "Parse natural language into structured task data";

  async execute(input: TaskParseInput): Promise<TaskParseOutput> {
    // Validate input
    const validated = TaskParseInputSchema.parse(input);

    const systemPrompt = `You are an intelligent task parser for NEXUS, an RPG-themed productivity app.

Your job is to parse natural language task descriptions into structured data.

**Task Priority Levels:**
- URGENT: Critical, time-sensitive tasks (35 energy)
- HIGH: Important but less urgent (25 energy)
- MEDIUM: Standard tasks (15 energy)
- LOW: Nice-to-have tasks (10 energy)
- NONE: Trivial tasks (5 energy)

**Life Areas:**
- WORK: Professional tasks
- HOME: Personal life, household
- WRITING: Creative writing projects
- SIDE_PROJECTS: Side hustles, learning

**Energy Costs:**
- Complex/long tasks: 25-35 energy
- Standard tasks: 15-20 energy
- Quick tasks: 10 energy
- Trivial tasks: 5 energy

**Date Parsing:**
- "tomorrow" = next day
- "next Tuesday" = next occurrence of Tuesday
- "in 3 days" = 3 days from now
- "by Friday" = due on Friday
- "end of week" = this coming Friday

Return a JSON object with this exact structure:
{
  "title": "Brief task title (3-8 words)",
  "description": "Optional detailed description if context provided",
  "priority": "URGENT|HIGH|MEDIUM|LOW|NONE",
  "areaId": "WORK|HOME|WRITING|SIDE_PROJECTS or null if unclear",
  "suggestedEnergyCost": number (5-100),
  "suggestedDueDate": "ISO date string or null",
  "confidence": number (0.0-1.0 indicating parse confidence)
}`;

    const prompt = `Parse this task input: "${validated.userInput}"

${validated.context ? `Context:\n- Current energy: ${validated.context.currentEnergy || "unknown"}\n- Current date: ${validated.context.currentDate?.toISOString() || new Date().toISOString()}` : ""}

Return structured task data as JSON.`;

    const response = await askAI(
      [{ role: "user", content: prompt }],
      {
        systemPrompt,
        preferredProvider: "anthropic",
        fallbackEnabled: true,
      }
    );

    // Parse Claude's JSON response
    try {
      const parsed = JSON.parse(response.content);

      // Validate output schema
      return TaskParseOutputSchema.parse(parsed);
    } catch (error) {
      console.error("Failed to parse task parser response:", error);

      // Fallback: basic parsing
      return {
        title: validated.userInput.slice(0, 50),
        description: validated.userInput,
        priority: "MEDIUM",
        suggestedEnergyCost: 15,
        confidence: 0.3,
      };
    }
  }
}
