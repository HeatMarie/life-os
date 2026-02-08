"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HealthBar, EnergyBar, XPBar } from "@/components/game/status-bars";
import {
  LayoutDashboard,
  ListTodo,
  Swords,
  Calendar,
  BookOpen,
  Trophy,
  Zap,
  Flame,
  Shield,
  Heart,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Character type from API
interface Character {
  name: string;
  class: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  currentStreak: number;
  tasksCompleted: number;
  status: string;
}

// Default character for loading state
const DEFAULT_CHARACTER: Character = {
  name: "LOADING...",
  class: "WARRIOR",
  level: 1,
  xp: 0,
  xpToNextLevel: 250,
  hp: 100,
  maxHp: 100,
  energy: 100,
  maxEnergy: 100,
  currentStreak: 0,
  tasksCompleted: 0,
  status: "ALIVE",
};

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "NEXUS", icon: LayoutDashboard, href: "/" },
  { id: "tasks", label: "QUESTS", icon: ListTodo, href: "/tasks" },
  { id: "arena", label: "ARENA", icon: Swords, href: "/arena" },
  { id: "calendar", label: "SCHEDULE", icon: Calendar, href: "/calendar" },
  { id: "health", label: "VITALS", icon: Heart, href: "/health" },
  { id: "writing", label: "WRITING", icon: BookOpen, href: "/writing" },
  { id: "achievements", label: "TROPHIES", icon: Trophy, href: "/achievements" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [character, setCharacter] = useState<Character>(DEFAULT_CHARACTER);
  const [tasksToday, setTasksToday] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch character data
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch character
        const charRes = await fetch("/api/character");
        if (charRes.ok) {
          const charData = await charRes.json();
          setCharacter(charData);
        }

        // Fetch tasks completed today for combo
        const today = new Date().toISOString().split("T")[0];
        const tasksRes = await fetch(`/api/tasks?status=DONE`);
        if (tasksRes.ok) {
          const tasks = await tasksRes.json();
          const todayTasks = tasks.filter((t: { completedAt: string }) => 
            t.completedAt?.startsWith(today)
          );
          setTasksToday(todayTasks.length);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Get rank based on level
  const getRank = (level: number): string => {
    if (level >= 50) return "LEGENDARY";
    if (level >= 30) return "ELITE";
    if (level >= 20) return "VETERAN";
    if (level >= 10) return "WARRIOR";
    if (level >= 5) return "APPRENTICE";
    return "INIT PROCESS";
  };

  // Get streak multiplier label
  const getStreakMultiplier = (streak: number): string => {
    if (streak >= 30) return "2x";
    if (streak >= 14) return "1.75x";
    if (streak >= 7) return "1.5x";
    if (streak >= 3) return "1.25x";
    return "1x";
  };

  return (
    <div className="w-56 min-h-screen bg-[#090c12] border-r border-border flex flex-col p-3">
      {/* Logo */}
      <div className="px-2 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 bg-primary/15 border border-primary/40 rounded-md flex items-center justify-center">
            <Zap size={14} className="text-primary" />
          </div>
          <span className="font-mono text-base font-bold text-primary neon-glow-cyan">
            NEXUS
          </span>
        </div>
        <div className="text-[10px] text-muted-foreground tracking-widest">
          LIFE OS v3.0 — RPG MODE
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link key={item.id} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-2 h-9 px-3 font-mono text-xs tracking-wider",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <Icon size={14} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Combat Stats */}
      <div className="combat-stats rounded-lg border p-3 mb-3">
        <div className="text-[10px] font-bold tracking-widest text-red-400 mb-3">
          COMBAT STATS
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-foreground flex items-center gap-1.5">
              <Flame size={12} className="text-orange-500" />
              Streak
            </span>
            <span className="font-mono text-xs font-bold text-orange-500">
              {character.currentStreak}d
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-foreground flex items-center gap-1.5">
              <Zap size={12} className="text-yellow-500" />
              Multiplier
            </span>
            <span className="font-mono text-xs font-bold text-yellow-500">
              {getStreakMultiplier(character.currentStreak)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-foreground flex items-center gap-1.5">
              <Swords size={12} className="text-accent" />
              Combo
            </span>
            <span className="font-mono text-xs font-bold text-accent">
              {tasksToday}x
            </span>
          </div>
        </div>
      </div>

      {/* Character Card */}
      <div className="bg-card rounded-lg border border-border p-3">
        {/* Rank & Level */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/40 text-primary">
            {getRank(character.level)}
          </span>
          <span className="font-mono text-[11px] text-yellow-500">
            LVL {character.level}
          </span>
        </div>

        {/* HP & Energy Bars */}
        <div className="space-y-2 mb-3">
          <HealthBar current={character.hp} max={character.maxHp} size="sm" showLabel={false} />
          <EnergyBar current={character.energy} max={character.maxEnergy} size="sm" showLabel={false} />
        </div>

        {/* XP Bar */}
        <XPBar
          current={character.xp}
          toNext={character.xpToNextLevel}
          level={character.level}
          showLabel={true}
        />

        {/* Character Info */}
        <div className="mt-3 pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-primary" />
            <div>
              <div className="text-xs font-semibold text-foreground">
                {character.name}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {character.tasksCompleted} quests cleared
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
