"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { STAT_EFFECTS, RANKS } from "@/lib/game/constants";
import { calculateVitality } from "@/lib/game/stats";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sword,
  Heart,
  Brain,
  Target,
  Sparkles,
  Shield,
  Plus,
  Minus,
  Zap,
} from "lucide-react";

interface LevelUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  level: number;
  statPointsAvailable: number;
  currentStats: {
    strength: number;
    stamina: number;
    focus: number;
    discipline: number;
    charisma: number;
  };
  onAllocate: (stats: {
    strength: number;
    stamina: number;
    focus: number;
    discipline: number;
    charisma: number;
  }) => Promise<void>;
}

const STAT_ICONS = {
  strength: Sword,
  stamina: Heart,
  focus: Brain,
  discipline: Target,
  charisma: Sparkles,
};

const STAT_COLORS = {
  strength: "text-red-400 border-red-400/30 bg-red-400/10",
  stamina: "text-green-400 border-green-400/30 bg-green-400/10",
  focus: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
  discipline: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  charisma: "text-pink-400 border-pink-400/30 bg-pink-400/10",
};

const STAT_NAMES = {
  strength: "Strength",
  stamina: "Stamina",
  focus: "Focus",
  discipline: "Discipline",
  charisma: "Charisma",
};

function getStatTooltip(statName: string): string {
  const statKey = statName.toUpperCase() as keyof typeof STAT_EFFECTS;
  const effects = STAT_EFFECTS[statKey];

  const lines: string[] = [];

  if (statKey === "STRENGTH") {
    lines.push(`+${effects.bossDamage} Boss Damage per point`);
    lines.push(`+${effects.maxHP} Max HP per point`);
  } else if (statKey === "STAMINA") {
    lines.push(`+${effects.maxEnergy} Max Energy per point`);
    lines.push(`-${(effects.energyCostReduction * 100).toFixed(0)}% Energy Cost per point`);
    lines.push(`+${effects.energyRegen} Energy Regen/day per point`);
  } else if (statKey === "FOCUS") {
    lines.push(`+${(effects.xpBonus * 100).toFixed(0)}% XP (Deep Work/Learning/Reading)`);
    lines.push(`+${effects.maxMana} Max Mana per point`);
    lines.push(`+${(effects.lootCrit * 100).toFixed(1)}% Loot Crit Chance per point`);
  } else if (statKey === "DISCIPLINE") {
    lines.push(`+${(effects.streakXPBonus * 100).toFixed(1)}% Streak XP per point`);
    lines.push(`+${(effects.habitXPBonus * 100).toFixed(0)}% Habit XP per point`);
    lines.push(`+${effects.manaRegen} Mana Regen/hour per point`);
  } else if (statKey === "CHARISMA") {
    lines.push(`+${(effects.socialXPBonus * 100).toFixed(0)}% Social XP per point`);
    lines.push(`+${(effects.guildXPContribution * 100).toFixed(0)}% Guild Contribution per point`);
  }

  return lines.join("\n");
}

function getRankTitle(level: number): string | null {
  const rankEntry = RANKS.find((r) => r.level === level);
  return rankEntry ? rankEntry.rank : null;
}

interface StatAllocatorProps {
  statKey: keyof typeof STAT_NAMES;
  label: string;
  currentValue: number;
  allocated: number;
  onIncrement: () => void;
  onDecrement: () => void;
  Icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  tooltip: string;
  canIncrement: boolean;
}

function StatAllocator({
  statKey,
  label,
  currentValue,
  allocated,
  onIncrement,
  onDecrement,
  Icon,
  colorClass,
  tooltip,
  canIncrement,
}: StatAllocatorProps) {
  const newValue = currentValue + allocated;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center justify-between p-4 rounded-lg border transition-all",
              colorClass,
              allocated > 0 && "ring-2 ring-cyan-400/50 shadow-lg"
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className="h-6 w-6" />
              <div>
                <div className="font-mono font-medium">{label}</div>
                <div className="text-xs text-muted-foreground">
                  {currentValue} → <span className="text-cyan-400 font-bold">{newValue}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="icon-sm"
                variant="outline"
                onClick={onDecrement}
                disabled={allocated === 0}
                className="h-7 w-7"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="w-8 text-center font-mono font-bold text-lg">
                {allocated > 0 && <span className="text-cyan-400">+{allocated}</span>}
                {allocated === 0 && <span className="text-muted-foreground">-</span>}
              </div>
              <Button
                size="icon-sm"
                variant="neon"
                onClick={onIncrement}
                disabled={!canIncrement}
                className="h-7 w-7"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          <div className="space-y-1 text-xs whitespace-pre-line">{tooltip}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function LevelUpModal({
  open,
  onOpenChange,
  level,
  statPointsAvailable,
  currentStats,
  onAllocate,
}: LevelUpModalProps) {
  const [allocations, setAllocations] = useState({
    strength: 0,
    stamina: 0,
    focus: 0,
    discipline: 0,
    charisma: 0,
  });
  const [isAllocating, setIsAllocating] = useState(false);

  // Reset allocations when modal opens
  useEffect(() => {
    if (open) {
      setAllocations({
        strength: 0,
        stamina: 0,
        focus: 0,
        discipline: 0,
        charisma: 0,
      });
    }
  }, [open]);

  const totalAllocated =
    allocations.strength +
    allocations.stamina +
    allocations.focus +
    allocations.discipline +
    allocations.charisma;
  const remainingPoints = statPointsAvailable - totalAllocated;
  const canIncrement = remainingPoints > 0;

  const increment = (stat: keyof typeof allocations) => {
    if (canIncrement) {
      setAllocations((prev) => ({ ...prev, [stat]: prev[stat] + 1 }));
    }
  };

  const decrement = (stat: keyof typeof allocations) => {
    if (allocations[stat] > 0) {
      setAllocations((prev) => ({ ...prev, [stat]: prev[stat] - 1 }));
    }
  };

  const handleConfirm = async () => {
    if (totalAllocated === 0) return;

    setIsAllocating(true);
    try {
      await onAllocate(allocations);
      // Modal will be closed by parent after successful allocation
    } catch (error) {
      console.error("Failed to allocate stats:", error);
    } finally {
      setIsAllocating(false);
    }
  };

  const handleSaveForLater = () => {
    onOpenChange(false);
  };

  const rankTitle = getRankTitle(level);

  // Calculate preview vitality
  const previewVitality = calculateVitality(
    currentStats.strength + allocations.strength,
    currentStats.stamina + allocations.stamina,
    currentStats.focus + allocations.focus
  );
  const currentVitality = calculateVitality(
    currentStats.strength,
    currentStats.stamina,
    currentStats.focus
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-gradient-to-b from-card to-background border-2 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className="space-y-2">
              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-400 to-yellow-400 animate-pulse">
                LEVEL UP!
              </div>
              <div className="text-3xl font-mono text-cyan-400 neon-glow-cyan">
                → LEVEL {level}
              </div>
              {rankTitle && (
                <div className="text-xl font-mono text-yellow-400 neon-glow-gold">
                  {rankTitle}
                </div>
              )}
            </div>
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            You have <span className="text-cyan-400 font-bold text-xl">{statPointsAvailable}</span>{" "}
            stat points to allocate
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Points remaining indicator */}
          <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-cyan-400" />
              <span className="font-mono font-medium">Points Remaining:</span>
            </div>
            <div className="text-3xl font-black font-mono">
              <span
                className={cn(
                  "transition-all",
                  remainingPoints > 0 ? "text-cyan-400" : "text-green-400"
                )}
              >
                {remainingPoints}
              </span>
              <span className="text-muted-foreground text-xl"> / {statPointsAvailable}</span>
            </div>
          </div>

          {/* Stat allocators */}
          <div className="space-y-3">
            {Object.entries(STAT_NAMES).map(([key, label]) => (
              <StatAllocator
                key={key}
                statKey={key as keyof typeof STAT_NAMES}
                label={label}
                currentValue={currentStats[key as keyof typeof currentStats]}
                allocated={allocations[key as keyof typeof allocations]}
                onIncrement={() => increment(key as keyof typeof allocations)}
                onDecrement={() => decrement(key as keyof typeof allocations)}
                Icon={STAT_ICONS[key as keyof typeof STAT_ICONS]}
                colorClass={STAT_COLORS[key as keyof typeof STAT_COLORS]}
                tooltip={getStatTooltip(key as keyof typeof STAT_EFFECTS)}
                canIncrement={canIncrement}
              />
            ))}
          </div>

          {/* Vitality preview */}
          <div className="border border-purple-400/30 bg-purple-400/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-purple-400" />
                <div>
                  <div className="font-mono font-medium text-purple-400">Vitality (Derived)</div>
                  <div className="text-xs text-muted-foreground">
                    = (STR + STA + FOC) / 3
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-2xl font-bold">
                  {currentVitality} →{" "}
                  <span
                    className={cn(
                      previewVitality > currentVitality
                        ? "text-cyan-400"
                        : "text-muted-foreground"
                    )}
                  >
                    {previewVitality}
                  </span>
                </div>
                {previewVitality !== currentVitality && (
                  <div className="text-xs text-cyan-400">
                    +{previewVitality - currentVitality}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogBody>

        <DialogFooter className="gap-2">
          {remainingPoints > 0 ? (
            <Button variant="outline" onClick={handleSaveForLater} className="flex-1">
              Save for Later
            </Button>
          ) : null}
          <Button
            variant="neon"
            onClick={handleConfirm}
            disabled={totalAllocated === 0 || isAllocating}
            className="flex-1 text-lg h-12"
          >
            {isAllocating ? "Allocating..." : "Confirm Allocation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
