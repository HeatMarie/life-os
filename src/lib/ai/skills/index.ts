import { skillRegistry } from "../claude-skills";
import { TaskParserSkill } from "./task-parser";
import { DailyPlannerSkill } from "./daily-planner";

/**
 * Initialize and register all Claude skills
 */
export function initializeSkills() {
  // Register P0 skills
  skillRegistry.register(new TaskParserSkill());
  skillRegistry.register(new DailyPlannerSkill());

  console.log(`✅ Registered ${skillRegistry.list().length} Claude skills:`, skillRegistry.list());
}

// Auto-initialize on module load
initializeSkills();

// Export for convenient access
export {
  skillRegistry as registry,
  TaskParserSkill,
  DailyPlannerSkill,
};

// Export skill execution helper
export { executeSkill } from "../claude-skills";
