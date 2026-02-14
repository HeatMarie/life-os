import Anthropic from "@anthropic-ai/sdk";

// AI provider types
export type AIProvider = "huggingface" | "anthropic";

export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIResponse {
  content: string;
  provider: AIProvider;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

// HuggingFace Inference API
async function callHuggingFace(
  messages: AIMessage[],
  systemPrompt?: string
): Promise<AIResponse> {
  const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
  const HF_MODEL = process.env.HUGGINGFACE_MODEL || "mistralai/Mistral-7B-Instruct-v0.2";

  if (!HF_API_KEY) {
    throw new Error("HUGGINGFACE_API_KEY not configured");
  }

  // Format messages for HuggingFace
  const formattedMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  if (systemPrompt) {
    formattedMessages.unshift({ role: "system", content: systemPrompt });
  }

  const response = await fetch(
    `https://api-inference.huggingface.co/models/${HF_MODEL}/v1/chat/completions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: HF_MODEL,
        messages: formattedMessages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HuggingFace API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  return {
    content: data.choices?.[0]?.message?.content || "",
    provider: "huggingface",
    model: HF_MODEL,
    usage: data.usage
      ? {
          inputTokens: data.usage.prompt_tokens || 0,
          outputTokens: data.usage.completion_tokens || 0,
        }
      : undefined,
  };
}

// Anthropic Claude API
async function callAnthropic(
  messages: AIMessage[],
  systemPrompt?: string
): Promise<AIResponse> {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514";

  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const client = new Anthropic({
    apiKey: ANTHROPIC_API_KEY,
  });

  // Filter out system messages for Claude (they go in system param)
  const claudeMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages: claudeMessages,
  });

  const textContent = response.content.find((c) => c.type === "text");

  return {
    content: textContent?.text || "",
    provider: "anthropic",
    model: CLAUDE_MODEL,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  };
}

// Main AI function with fallback
export async function askAI(
  messages: AIMessage[],
  options?: {
    systemPrompt?: string;
    preferredProvider?: AIProvider;
    fallbackEnabled?: boolean;
  }
): Promise<AIResponse> {
  const {
    systemPrompt,
    preferredProvider = "huggingface",
    fallbackEnabled = true,
  } = options || {};

  const providers: AIProvider[] =
    preferredProvider === "huggingface"
      ? ["huggingface", "anthropic"]
      : ["anthropic", "huggingface"];

  for (const provider of providers) {
    try {
      if (provider === "huggingface") {
        return await callHuggingFace(messages, systemPrompt);
      } else {
        return await callAnthropic(messages, systemPrompt);
      }
    } catch (error) {
      console.error(`AI provider ${provider} failed:`, error);
      
      if (!fallbackEnabled || provider === providers[providers.length - 1]) {
        throw error;
      }
      
      console.log(`Falling back to next provider...`);
    }
  }

  throw new Error("All AI providers failed");
}

// Pre-built prompts for common use cases
export const AI_PROMPTS = {
  taskBreakdown: `You are a productivity assistant for a gamified task management app called NEXUS. 
Help the user break down large tasks into smaller, actionable subtasks. 
Each subtask should be completable in 15-60 minutes.
Format your response as a bulleted list of subtasks.`,

  dailyPlanning: `You are NEXUS, a gamified life operating system AI assistant.
Help the user plan their day optimally based on their energy levels, priorities, and goals.
Consider task difficulty, energy costs, and XP rewards when making suggestions.
Be encouraging and use light RPG-themed language.`,

  writingAssistant: `You are a writing coach integrated into NEXUS.
Help the user improve their writing, brainstorm ideas, or overcome writer's block.
Be supportive and constructive with feedback.`,

  goalSetting: `You are a goal-setting specialist in NEXUS.
Help users define SMART goals and break them down into achievable milestones.
Frame goals as epic quests when appropriate.`,

  reflection: `You are a journaling companion in NEXUS.
Help the user reflect on their day, identify patterns, and celebrate wins.
Ask thoughtful questions to encourage deeper reflection.`,

  // Event story prompts for the Life Chronicle
  eventCompleted: `You are NEXUS, a life OS narrative engine writing the hero's chronicle.
Write a brief (1-2 sentences max) RPG-themed story entry for completing an event.
Be creative, uplifting, and use adventure/quest language.
Include the XP earned and any special effects.
Keep it short and impactful.`,

  eventMissed: `You are NEXUS, a life OS narrative engine writing the hero's chronicle.
Write a brief (1-2 sentences max) story entry for a missed event.
Be sympathetic but frame it as a learning moment, not harsh criticism.
Use gentle RPG language like "the path was difficult" or "the hero stumbled".
End with hope for tomorrow.`,

  eventCanceled: `You are NEXUS, a life OS narrative engine writing the hero's chronicle.
Write a brief (1-2 sentences max) story entry for when the user canceled their own event.
Be understanding - sometimes retreat is necessary.
Frame it as a strategic decision, not failure.
Keep the tone supportive.`,

  eventRescheduled: `You are NEXUS, a life OS narrative engine writing the hero's chronicle.
Write a brief (1-2 sentences max) creative story entry for when an event was canceled or rescheduled by someone else.
Frame it positively - the universe granted a respite, the tides shifted, an unexpected gift of time.
Be whimsical and uplifting.`,

  bossDefeated: `You are NEXUS, a life OS narrative engine writing the hero's chronicle.
Write a brief (2-3 sentences) EPIC story entry for defeating a boss (completing a major project).
This is a big deal! Use triumphant, heroic language.
Mention the XP reward and celebrate the achievement.`,

  levelUp: `You are NEXUS, a life OS narrative engine writing the hero's chronicle.
Write a brief (1-2 sentences) celebratory story entry for leveling up.
Use triumphant RPG language. Mention the new level and stat gains.`,

  dailySummary: `You are NEXUS, a life OS narrative engine writing the hero's chronicle.
Write a brief (2-3 sentences) daily summary of the hero's adventures.
Summarize key achievements, XP earned, and battles fought.
End with anticipation for tomorrow's quests.`,
};

// Generate AI story for an event
export async function generateEventStory(
  eventTitle: string,
  eventType: "completed" | "missed" | "canceled" | "rescheduled" | "bossDefeated" | "levelUp",
  context: {
    xpEarned?: number;
    hpChange?: number;
    bossDamage?: number;
    bossName?: string;
    newLevel?: number;
    characterName?: string;
  }
): Promise<string> {
  const promptKey = eventType === "completed" ? "eventCompleted" :
                    eventType === "missed" ? "eventMissed" :
                    eventType === "canceled" ? "eventCanceled" :
                    eventType === "rescheduled" ? "eventRescheduled" :
                    eventType === "bossDefeated" ? "bossDefeated" :
                    "levelUp";

  const systemPrompt = AI_PROMPTS[promptKey];
  
  let userMessage = `Event: "${eventTitle}"`;
  if (context.xpEarned) userMessage += `\nXP Earned: ${context.xpEarned}`;
  if (context.hpChange) userMessage += `\nHP Change: ${context.hpChange > 0 ? "+" : ""}${context.hpChange}`;
  if (context.bossDamage) userMessage += `\nBoss Damage: ${context.bossDamage}`;
  if (context.bossName) userMessage += `\nBoss: ${context.bossName}`;
  if (context.newLevel) userMessage += `\nNew Level: ${context.newLevel}`;
  if (context.characterName) userMessage += `\nHero: ${context.characterName}`;

  try {
    const response = await askAI(
      [{ role: "user", content: userMessage }],
      { systemPrompt, preferredProvider: "anthropic" }
    );
    return response.content;
  } catch {
    // Fallback to generic narratives if AI fails
    const fallbacks: Record<string, string> = {
      completed: `The hero completed "${eventTitle}"${context.xpEarned ? ` and earned ${context.xpEarned} XP` : ""}. Another step forward on the journey!`,
      missed: `The hero missed "${eventTitle}". The path was shrouded, but tomorrow brings new light.`,
      canceled: `The hero chose to step back from "${eventTitle}". Sometimes wisdom lies in retreat.`,
      rescheduled: `"${eventTitle}" was rescheduled by the fates. The universe grants an unexpected moment of respite.`,
      bossDefeated: `VICTORY! The hero vanquished ${context.bossName || "the boss"}! ${context.xpEarned || 0} XP claimed in triumph!`,
      levelUp: `LEVEL UP! The hero has reached level ${context.newLevel || "?"}! Power surges through their veins!`,
    };
    return fallbacks[eventType] || `"${eventTitle}" - a moment in the chronicle.`;
  }
}

