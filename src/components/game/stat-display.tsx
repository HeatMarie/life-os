"use client";

import { cn } from "@/lib/utils";
import { STAT_EFFECTS } from "@/lib/game/constants";
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
  Shield
} from "lucide-react";

interface StatDisplayProps {
  stats: {
    strength: number;
    stamina: number;
    focus: number;
    discipline: number;
    charisma: number;
  };
  equipmentBonuses?: {
    strength?: number;
    stamina?: number;
    focus?: number;
    discipline?: number;
    charisma?: number;
  };
  className?: string;
  showVitality?: boolean;
  compact?: boolean;
}

const STAT_ICONS = {
  strength: Sword,
  stamina: Heart,
  focus: Brain,
  discipline: Target,
  charisma: Sparkles,
  vitality: Shield,
};

const STAT_COLORS = {
  strength: "text-red-400 border-red-400/30 bg-red-400/10",
  stamina: "text-green-400 border-green-400/30 bg-green-400/10",
  focus: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
  discipline: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  charisma: "text-pink-400 border-pink-400/30 bg-pink-400/10",
  vitality: "text-purple-400 border-purple-400/30 bg-purple-400/10",
};

const STAT_NAMES = {
  strength: "Strength",
  stamina: "Stamina",
  focus: "Focus",
  discipline: "Discipline",
  charisma: "Charisma",
  vitality: "Vitality",
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

function getVitalityTooltip(vitality: number): string {
  return `Vitality = (STR + STA + FOC) / 3
Current: ${vitality}

Effects:
+0.5 HP Regen/hour per point
Legendary Boss Requirement: 50+`;
}

interface StatRowProps {
  statKey: string;
  label: string;
  baseValue: number;
  equipmentBonus?: number;
  Icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  tooltip: string;
  compact?: boolean;
}

function StatRow({
  statKey,
  label,
  baseValue,
  equipmentBonus = 0,
  Icon,
  colorClass,
  tooltip,
  compact = false,
}: StatRowProps) {
  const total = baseValue + equipmentBonus;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center justify-between p-3 rounded-lg border transition-colors hover:bg-opacity-20",
              colorClass,
              compact && "p-2"
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className={cn("h-5 w-5", compact && "h-4 w-4")} />
              <span className={cn("font-mono font-medium", compact && "text-sm")}>
                {label}
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className={cn("text-lg font-bold", compact && "text-base")}>
                {total}
              </span>
              {equipmentBonus > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({baseValue} + <span className="text-yellow-400">{equipmentBonus}</span>)
                </span>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-1 text-xs whitespace-pre-line">
            {tooltip}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function StatDisplay({
  stats,
  equipmentBonuses = {},
  className,
  showVitality = true,
  compact = false,
}: StatDisplayProps) {
  const totalStrength = stats.strength + (equipmentBonuses.strength ?? 0);
  const totalStamina = stats.stamina + (equipmentBonuses.stamina ?? 0);
  const totalFocus = stats.focus + (equipmentBonuses.focus ?? 0);
  const vitality = calculateVitality(totalStrength, totalStamina, totalFocus);

  const statList: Array<{
    key: string;
    label: string;
    baseValue: number;
    equipmentBonus: number;
    icon: React.ComponentType<{ className?: string }>;
    colorClass: string;
    tooltip: string;
  }> = [
    {
      key: "strength",
      label: STAT_NAMES.strength,
      baseValue: stats.strength,
      equipmentBonus: equipmentBonuses.strength || 0,
      icon: STAT_ICONS.strength,
      colorClass: STAT_COLORS.strength,
      tooltip: getStatTooltip("strength"),
    },
    {
      key: "stamina",
      label: STAT_NAMES.stamina,
      baseValue: stats.stamina,
      equipmentBonus: equipmentBonuses.stamina || 0,
      icon: STAT_ICONS.stamina,
      colorClass: STAT_COLORS.stamina,
      tooltip: getStatTooltip("stamina"),
    },
    {
      key: "focus",
      label: STAT_NAMES.focus,
      baseValue: stats.focus,
      equipmentBonus: equipmentBonuses.focus || 0,
      icon: STAT_ICONS.focus,
      colorClass: STAT_COLORS.focus,
      tooltip: getStatTooltip("focus"),
    },
    {
      key: "discipline",
      label: STAT_NAMES.discipline,
      baseValue: stats.discipline,
      equipmentBonus: equipmentBonuses.discipline || 0,
      icon: STAT_ICONS.discipline,
      colorClass: STAT_COLORS.discipline,
      tooltip: getStatTooltip("discipline"),
    },
    {
      key: "charisma",
      label: STAT_NAMES.charisma,
      baseValue: stats.charisma,
      equipmentBonus: equipmentBonuses.charisma || 0,
      icon: STAT_ICONS.charisma,
      colorClass: STAT_COLORS.charisma,
      tooltip: getStatTooltip("charisma"),
    },
  ];

  return (
    <div className={cn("space-y-2", className)}>
      {statList.map((stat) => (
        <StatRow
          key={stat.key}
          statKey={stat.key}
          label={stat.label}
          baseValue={stat.baseValue}
          equipmentBonus={stat.equipmentBonus}
          Icon={stat.icon}
          colorClass={stat.colorClass}
          tooltip={stat.tooltip}
          compact={compact}
        />
      ))}

      {showVitality && (
        <StatRow
          statKey="vitality"
          label={STAT_NAMES.vitality}
          baseValue={vitality}
          equipmentBonus={0}
          Icon={STAT_ICONS.vitality}
          colorClass={STAT_COLORS.vitality}
          tooltip={getVitalityTooltip(vitality)}
          compact={compact}
        />
      )}
    </div>
  );
}
