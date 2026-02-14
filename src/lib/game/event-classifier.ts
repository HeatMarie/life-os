// ══════════════════════════════════════════════════════════════════════════════
// LIFE OS — EVENT CLASSIFIER
// ══════════════════════════════════════════════════════════════════════════════
// Auto-detects whether a calendar event is an ACTION_ITEM or REMINDER
// based on keywords in the title and description

export type EventType = "ACTION_ITEM" | "REMINDER";

export interface ClassificationResult {
  eventType: EventType;
  confidence: number; // 0-1, how confident we are in this classification
  reason: string; // Human-readable explanation
}

// Keywords that strongly indicate REMINDER (non-actionable events)
const REMINDER_KEYWORDS = [
  // Celebrations & holidays
  "birthday",
  "anniversary",
  "holiday",
  "christmas",
  "thanksgiving",
  "easter",
  "new year",
  "valentine",
  "halloween",
  "mother's day",
  "father's day",
  "memorial day",
  "labor day",
  "independence day",
  "4th of july",
  "july 4th",
  
  // Reminders
  "reminder",
  "remember",
  "don't forget",
  "note to self",
  
  // Observances
  "observance",
  "awareness day",
  "awareness month",
  
  // Religious
  "sabbath",
  "ramadan",
  "eid",
  "passover",
  "hanukkah",
  "diwali",
  
  // Other non-actionable
  "out of office",
  "ooo",
  "vacation day",
  "pto",
  "blocked",
  "focus time",
  "no meetings",
];

// Keywords that strongly indicate ACTION_ITEM (requires user action/presence)
const ACTION_KEYWORDS = [
  // Meetings
  "meeting",
  "meet",
  "call",
  "zoom",
  "teams",
  "google meet",
  "standup",
  "stand-up",
  "scrum",
  "sync",
  "1:1",
  "one on one",
  "1-on-1",
  "check-in",
  "check in",
  "huddle",
  "retro",
  "retrospective",
  "sprint",
  "planning",
  "review",
  "demo",
  "presentation",
  "workshop",
  "training",
  "onboarding",
  
  // Social
  "dinner",
  "lunch",
  "breakfast",
  "coffee",
  "drinks",
  "happy hour",
  "hangout",
  "hang out",
  "party",
  "get together",
  "visit",
  "date",
  "movie",
  "concert",
  "show",
  "game",
  "play",
  
  // Appointments
  "appointment",
  "doctor",
  "dentist",
  "therapy",
  "haircut",
  "interview",
  "consultation",
  
  // Work events
  "deadline",
  "due date",
  "submission",
  "release",
  "launch",
  "deploy",
  "go live",
  
  // Physical activities
  "gym",
  "workout",
  "class",
  "lesson",
  "practice",
  "rehearsal",
  "run",
  "yoga",
  "pilates",
  "swim",
];

// Words that suggest it's about someone else (likely reminder)
const THIRD_PARTY_INDICATORS = [
  "'s birthday",
  "'s anniversary",
  "their birthday",
  "their anniversary",
];

/**
 * Classifies an event as ACTION_ITEM or REMINDER based on title and description.
 * 
 * ACTION_ITEM: Requires user presence/action (meetings, hangouts, appointments)
 * REMINDER: Informational only (birthdays, holidays, notes)
 * 
 * @param title - The event title
 * @param description - Optional event description
 * @returns Classification result with type, confidence, and reason
 */
export function classifyEvent(
  title: string,
  description?: string | null
): ClassificationResult {
  const text = `${title} ${description || ""}`.toLowerCase();
  
  // Check for third-party indicators first (someone else's birthday, etc.)
  for (const indicator of THIRD_PARTY_INDICATORS) {
    if (text.includes(indicator)) {
      return {
        eventType: "REMINDER",
        confidence: 0.95,
        reason: `Contains "${indicator}" - likely someone else's event`,
      };
    }
  }
  
  // Count keyword matches
  let reminderScore = 0;
  let actionScore = 0;
  let matchedReminder: string | null = null;
  let matchedAction: string | null = null;
  
  for (const keyword of REMINDER_KEYWORDS) {
    if (text.includes(keyword)) {
      reminderScore += keyword.length > 6 ? 2 : 1; // Longer keywords are more specific
      if (!matchedReminder) matchedReminder = keyword;
    }
  }
  
  for (const keyword of ACTION_KEYWORDS) {
    if (text.includes(keyword)) {
      actionScore += keyword.length > 6 ? 2 : 1;
      if (!matchedAction) matchedAction = keyword;
    }
  }
  
  // Decision logic
  if (actionScore > 0 && reminderScore === 0) {
    return {
      eventType: "ACTION_ITEM",
      confidence: Math.min(0.7 + actionScore * 0.05, 0.95),
      reason: `Contains action keyword "${matchedAction}"`,
    };
  }
  
  if (reminderScore > 0 && actionScore === 0) {
    return {
      eventType: "REMINDER",
      confidence: Math.min(0.7 + reminderScore * 0.05, 0.95),
      reason: `Contains reminder keyword "${matchedReminder}"`,
    };
  }
  
  if (actionScore > reminderScore) {
    return {
      eventType: "ACTION_ITEM",
      confidence: 0.6,
      reason: `Mixed signals, but action keywords (${actionScore}) > reminder keywords (${reminderScore})`,
    };
  }
  
  if (reminderScore > actionScore) {
    return {
      eventType: "REMINDER",
      confidence: 0.6,
      reason: `Mixed signals, but reminder keywords (${reminderScore}) > action keywords (${actionScore})`,
    };
  }
  
  // Default to ACTION_ITEM (safer - user can override)
  // Most calendar events are action items
  return {
    eventType: "ACTION_ITEM",
    confidence: 0.5,
    reason: "No strong indicators found, defaulting to action item",
  };
}

/**
 * Calculate XP reward for completing an event.
 * Based on duration - longer events = more XP.
 * 
 * @param durationMinutes - Event duration in minutes
 * @param eventType - The event type
 * @returns XP earned (0 for reminders)
 */
export function calculateEventXP(
  durationMinutes: number,
  eventType: EventType
): number {
  if (eventType === "REMINDER") {
    return 0;
  }
  
  // Base: 25 XP per 30 minutes, min 15 XP, max 150 XP
  const baseXP = Math.floor((durationMinutes / 30) * 25);
  return Math.max(15, Math.min(baseXP, 150));
}

/**
 * Calculate HP penalty for missing or canceling an event.
 * 
 * @param eventType - The event type
 * @param wasSelfCanceled - Whether user canceled (vs. missed)
 * @param durationMinutes - Event duration for severity calculation
 * @returns HP penalty (always positive, 0 for reminders)
 */
export function calculateEventPenalty(
  eventType: EventType,
  wasSelfCanceled: boolean,
  durationMinutes: number
): number {
  if (eventType === "REMINDER") {
    return 0;
  }
  
  // Base penalty scaled by duration
  const basePenalty = Math.floor((durationMinutes / 60) * 10);
  const penalty = Math.max(5, Math.min(basePenalty, 20));
  
  // Self-canceled is slightly less penalty than missed (at least they acknowledged it)
  return wasSelfCanceled ? Math.floor(penalty * 0.7) : penalty;
}

/**
 * Calculate boss damage for completing a project-linked event.
 * Similar to task damage but scaled for events.
 * 
 * @param durationMinutes - Event duration
 * @returns Boss damage dealt
 */
export function calculateEventBossDamage(durationMinutes: number): number {
  // 10 damage per 30 minutes, min 5, max 40
  const damage = Math.floor((durationMinutes / 30) * 10);
  return Math.max(5, Math.min(damage, 40));
}

/**
 * Check if an event should be considered action-worthy.
 * All-day events might be reminders even without keywords.
 * 
 * @param isAllDay - Whether it's an all-day event
 * @param classification - The classification result
 * @returns Whether to treat as action item
 */
export function isActionableEvent(
  isAllDay: boolean,
  classification: ClassificationResult
): boolean {
  // All-day events with low confidence are likely reminders
  if (isAllDay && classification.confidence < 0.7) {
    return false;
  }
  
  return classification.eventType === "ACTION_ITEM";
}
