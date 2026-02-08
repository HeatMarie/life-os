import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ListTodo,
  CheckCircle2,
  Calendar,
  Target,
  Zap,
  Swords,
  Skull,
  Sparkles,
  Trophy,
  Package,
  Flame,
} from "lucide-react";
import { db } from "@/lib/db";
import Link from "next/link";

// Helper to get streak multiplier
function getStreakMultiplier(streak: number): string {
  if (streak >= 30) return "2x";
  if (streak >= 14) return "1.75x";
  if (streak >= 7) return "1.5x";
  if (streak >= 3) return "1.25x";
  return "1x";
}

const AREA_COLORS: Record<string, string> = {
  WORK: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
  HOME: "text-pink-400 border-pink-400/30 bg-pink-400/10",
  WRITING: "text-green-400 border-green-400/30 bg-green-400/10",
  SIDE_PROJECTS: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  work: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
  home: "text-pink-400 border-pink-400/30 bg-pink-400/10",
  writing: "text-green-400 border-green-400/30 bg-green-400/10",
  "side-projects": "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
};

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "text-red-400",
  HIGH: "text-pink-400",
  MEDIUM: "text-yellow-400",
  LOW: "text-muted-foreground",
  urgent: "text-red-400",
  high: "text-pink-400",
  medium: "text-yellow-400",
  low: "text-muted-foreground",
};

const PRIORITY_BAR_COLORS: Record<string, string> = {
  URGENT: "bg-red-500",
  HIGH: "bg-pink-500",
  MEDIUM: "bg-yellow-500",
  LOW: "bg-muted-foreground",
};

function StatCard({ 
  label, 
  value, 
  sub, 
  icon: Icon 
}: { 
  label: string; 
  value: string | number; 
  sub?: string; 
  icon: React.ElementType;
}) {
  return (
    <Card className="relative overflow-hidden py-4">
      <div className="absolute top-2 right-3 opacity-15">
        <Icon size={28} />
      </div>
      <CardContent className="p-4 pt-0">
        <div className="text-[10px] font-bold tracking-widest text-muted-foreground mb-1">
          {label}
        </div>
        <div className="font-mono text-2xl font-bold text-primary neon-glow-cyan">
          {value}
        </div>
        {sub && (
          <div className="text-xs text-muted-foreground mt-1">{sub}</div>
        )}
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  // Fetch data from database
  const userId = "demo-user"; // TODO: Get from auth session

  // Fetch character
  const character = await db.character.findUnique({
    where: { userId },
  });

  // Fetch tasks
  const tasks = await db.task.findMany({
    where: { userId },
    include: { area: true },
  });

  // Fetch bosses
  const bosses = await db.boss.findMany({
    where: { status: "ACTIVE" },
    include: { project: true },
  });

  // Fetch achievements
  const userAchievements = await db.userAchievement.findMany({
    where: { userId },
    include: { achievement: true },
  });

  // Fetch areas for distribution (areas are system-level, not user-specific)
  const areas = await db.area.findMany({
    include: { 
      tasks: {
        where: { userId }
      } 
    },
    orderBy: { sortOrder: "asc" },
  });

  // Calculate stats
  const activeTasks = tasks.filter(t => t.status !== "DONE").length;
  const inProgressTasks = tasks.filter(t => t.status === "IN_PROGRESS").length;
  const completedTasks = tasks.filter(t => t.status === "DONE").length;
  const streak = character?.currentStreak ?? 0;
  const activeProjects = await db.project.count({ where: { userId, status: "ACTIVE" } });
  const totalProjects = await db.project.count({ where: { userId } });

  // Get tasks completed today for combo
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tasksToday = tasks.filter(t => 
    t.completedAt && new Date(t.completedAt) >= todayStart
  ).length;

  // Priority quests (high/urgent, not done)
  const priorityQuests = tasks
    .filter(t => (t.priority === "HIGH" || t.priority === "URGENT") && t.status !== "DONE")
    .slice(0, 4);

  // Area distribution
  const areaDistribution = areas.map(area => ({
    name: area.displayName,
    color: area.type === "WORK" ? "cyan" : area.type === "HOME" ? "pink" : area.type === "WRITING" ? "green" : "yellow",
    count: area.tasks.filter(t => t.status !== "DONE").length,
  }));

  // Achievements sample
  const achievementSample = await db.achievement.findMany({
    take: 6,
    orderBy: { xpReward: "asc" },
  });

  const unlockedCodes = new Set(userAchievements.map(ua => ua.achievement.code));

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-mono text-xl font-bold tracking-widest text-primary neon-glow-cyan">
            COMMAND NEXUS
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_hsl(150_100%_45%/0.8)]" />
          <span className="font-mono text-xs text-green-500">ALL SYSTEMS ONLINE</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-6 gap-3">
        <StatCard label="ACTIVE QUESTS" value={activeTasks} sub={`${inProgressTasks} in progress`} icon={ListTodo} />
        <StatCard label="QUESTS CLEARED" value={completedTasks} sub={`${streak}d streak`} icon={CheckCircle2} />
        <StatCard label="TODAY'S EVENTS" value={0} sub="scheduled" icon={Calendar} />
        <StatCard label="ACTIVE PROJECTS" value={activeProjects} sub={`${totalProjects} total`} icon={Target} />
        <StatCard label="XP MULTIPLIER" value={getStreakMultiplier(streak)} sub={`${streak}d streak`} icon={Zap} />
        <StatCard label="COMBO" value={`${tasksToday}x`} sub="today" icon={Swords} />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="col-span-2 space-y-6">
          {/* Priority Quests */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-primary">PRIORITY QUESTS</CardTitle>
              <Link href="/tasks" className="text-xs text-cyan-400 hover:underline">VIEW ALL</Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {priorityQuests.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground text-sm">
                  No priority quests. Add some tasks!
                </p>
              ) : priorityQuests.map((quest) => (
                <div
                  key={quest.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-secondary/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-8 rounded-full ${PRIORITY_BAR_COLORS[quest.priority] || "bg-yellow-500"}`} />
                    <div>
                      <div className="text-sm font-medium text-foreground">{quest.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${AREA_COLORS[quest.areaId || ""] || "text-muted-foreground border-border"}`}>
                          {quest.area?.displayName?.toUpperCase() || quest.areaId || "GENERAL"}
                        </span>
                        <span className={`text-[10px] ${PRIORITY_COLORS[quest.priority]}`}>
                          {quest.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="font-mono text-xs text-yellow-500">+{quest.xpReward} XP</div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Active Bosses */}
          <Card className="border-red-500/25 bg-red-500/5">
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-red-400 flex items-center gap-2">
                <Skull size={16} /> ACTIVE BOSSES
              </CardTitle>
              <Link href="/arena" className="text-xs text-cyan-400 hover:underline">ARENA</Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {bosses.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground text-sm">
                  No active bosses. Create a project to spawn one!
                </p>
              ) : bosses.map((boss) => (
                <div key={boss.id} className="p-4 rounded-lg border border-red-500/30 bg-red-500/10">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-mono text-sm font-bold text-red-400 neon-glow-red">
                        {boss.icon || "💀"} {boss.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Project: {boss.project?.name || "Unknown"}
                      </div>
                    </div>
                    {boss.deadline && (
                      <div className="text-xs text-orange-400">
                        <Flame size={12} className="inline mr-1" />
                        Deadline: {new Date(boss.deadline).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-red-400">HP</span>
                      <span className="text-muted-foreground">{boss.hp}/{boss.maxHp}</span>
                    </div>
                    <div className="h-3 bg-red-950/50 rounded-full overflow-hidden">
                      <div
                        className="h-full boss-health-bar rounded-full"
                        style={{ width: `${(boss.hp / boss.maxHp) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle>TODAY&apos;S SCHEDULE</CardTitle>
              <Link href="/calendar" className="text-xs text-cyan-400 hover:underline">FULL CALENDAR</Link>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-muted-foreground text-sm">
                No events today. Clear skies ahead.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Daily Challenges */}
          <Card className="border-purple-500/25 bg-purple-500/5">
            <CardHeader className="py-4">
              <CardTitle className="text-purple-400 flex items-center gap-2">
                <Sparkles size={14} /> DAILY CHALLENGES
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg border border-purple-500/30 bg-purple-500/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-foreground">Complete a high-priority task</span>
                  <span className="font-mono text-[10px] text-yellow-500">+75 XP</span>
                </div>
                <Progress
                  value={priorityQuests.length > 0 ? 0 : 100}
                  className="h-1"
                  indicatorClassName="bg-purple-500"
                />
              </div>
              <div className="p-3 rounded-lg border border-purple-500/30 bg-purple-500/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-foreground">Complete 3 tasks today</span>
                  <span className="font-mono text-[10px] text-yellow-500">+100 XP</span>
                </div>
                <Progress
                  value={Math.min(100, (tasksToday / 3) * 100)}
                  className="h-1"
                  indicatorClassName={tasksToday >= 3 ? "bg-green-500" : "bg-purple-500"}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quest Distribution */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle>QUEST DISTRIBUTION</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {areaDistribution.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground text-sm">
                  No areas defined yet.
                </p>
              ) : areaDistribution.map((area) => (
                <div key={area.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className={`text-${area.color}-400`}>{area.name}</span>
                    <span className="text-muted-foreground">{area.count}</span>
                  </div>
                  <Progress
                    value={activeTasks > 0 ? (area.count / activeTasks) * 100 : 0}
                    className="h-1.5"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-yellow-500 flex items-center gap-2">
                <Package size={14} /> INVENTORY
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center py-6 text-muted-foreground text-xs">
                Complete quests to earn loot drops!
              </p>
              <div className="border-t border-border pt-3 mt-3">
                <div className="text-[10px] font-bold text-muted-foreground tracking-widest mb-2">
                  LOOT TABLE
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">💠 XP Shard</span>
                    <span className="text-muted-foreground">30%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyan-400">💎 XP Crystal</span>
                    <span className="text-muted-foreground">15%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyan-400">🛡️ Streak Shield</span>
                    <span className="text-muted-foreground">10%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-pink-400">⭐ Double XP</span>
                    <span className="text-muted-foreground">4%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-500">🗡️ Boss Bane</span>
                    <span className="text-muted-foreground">1%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievements Preview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-yellow-500 flex items-center gap-2">
                <Trophy size={14} /> ACHIEVEMENTS
              </CardTitle>
              <Link href="/achievements" className="text-xs text-cyan-400 hover:underline">VIEW ALL</Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {achievementSample.map((achievement) => {
                  const isUnlocked = unlockedCodes.has(achievement.code);
                  return (
                    <div
                      key={achievement.id}
                      className={`p-2 rounded-md border text-center ${
                        isUnlocked
                          ? `${achievement.rarity === "LEGENDARY" ? "rarity-legendary border-yellow-500/40" : achievement.rarity === "EPIC" ? "rarity-epic border-pink-500/40" : achievement.rarity === "RARE" ? "rarity-rare border-cyan-500/40" : "border-border"}`
                          : "border-border opacity-40"
                      }`}
                    >
                      <div className="text-xl">{isUnlocked ? achievement.icon : "🔒"}</div>
                      <div className="text-[8px] font-bold mt-1 truncate">{achievement.name}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
