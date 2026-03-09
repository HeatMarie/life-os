"use client";

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
import { Sword, Heart, Brain, Target, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface EquipmentStats {
  strengthBonus: number;
  staminaBonus: number;
  focusBonus: number;
  disciplineBonus: number;
  charismaBonus: number;
}

interface Equipment {
  id: string;
  name: string;
  description: string;
  slot: string;
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
  levelRequirement: number;
  icon: string;
  strengthBonus: number;
  staminaBonus: number;
  focusBonus: number;
  disciplineBonus: number;
  charismaBonus: number;
  setName?: string | null;
  setClass?: string | null;
}

interface EquipmentCompareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentItem: {
    id: string;
    equipment: Equipment;
    upgradeLevel: number;
  } | null;
  newItem: {
    id: string;
    equipment: Equipment;
    upgradeLevel: number;
  };
  onSwap: () => void;
  isLoading?: boolean;
}

const STAT_ICONS = {
  strength: Sword,
  stamina: Heart,
  focus: Brain,
  discipline: Target,
  charisma: Sparkles,
};

const STAT_COLORS = {
  strength: "text-red-400",
  stamina: "text-green-400",
  focus: "text-cyan-400",
  discipline: "text-yellow-400",
  charisma: "text-pink-400",
};

const RARITY_COLORS = {
  COMMON: "border-gray-500/50 bg-gray-500/10 text-gray-400",
  RARE: "border-cyan-500/50 bg-cyan-500/10 text-cyan-400",
  EPIC: "border-pink-500/50 bg-pink-500/10 text-pink-400",
  LEGENDARY: "border-yellow-500/50 bg-yellow-500/10 text-yellow-400",
};

function calculateStat(baseStat: number, upgradeLevel: number): number {
  return Math.floor(baseStat * Math.pow(1.3, upgradeLevel));
}

function StatRow({
  statKey,
  currentValue,
  newValue,
  label,
}: {
  statKey: keyof typeof STAT_ICONS;
  currentValue: number;
  newValue: number;
  label: string;
}) {
  const Icon = STAT_ICONS[statKey];
  const colorClass = STAT_COLORS[statKey];
  const diff = newValue - currentValue;

  if (currentValue === 0 && newValue === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between py-2 border-b border-border/30">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", colorClass)} />
        <span className="text-sm font-mono">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn("font-mono font-bold", currentValue > 0 ? colorClass : "text-muted-foreground")}>
          {currentValue > 0 ? `+${currentValue}` : "—"}
        </span>
        <ArrowRight className="h-3 w-3 text-muted-foreground" />
        <span className={cn("font-mono font-bold", newValue > 0 ? colorClass : "text-muted-foreground")}>
          {newValue > 0 ? `+${newValue}` : "—"}
        </span>
        {diff !== 0 && (
          <span
            className={cn(
              "text-xs font-mono ml-2",
              diff > 0 ? "text-green-400" : "text-red-400"
            )}
          >
            ({diff > 0 ? "+" : ""}{diff})
          </span>
        )}
      </div>
    </div>
  );
}

export function EquipmentCompareModal({
  open,
  onOpenChange,
  currentItem,
  newItem,
  onSwap,
  isLoading = false,
}: EquipmentCompareModalProps) {
  const currentStats = currentItem
    ? {
        strength: calculateStat(currentItem.equipment.strengthBonus, currentItem.upgradeLevel),
        stamina: calculateStat(currentItem.equipment.staminaBonus, currentItem.upgradeLevel),
        focus: calculateStat(currentItem.equipment.focusBonus, currentItem.upgradeLevel),
        discipline: calculateStat(currentItem.equipment.disciplineBonus, currentItem.upgradeLevel),
        charisma: calculateStat(currentItem.equipment.charismaBonus, currentItem.upgradeLevel),
      }
    : {
        strength: 0,
        stamina: 0,
        focus: 0,
        discipline: 0,
        charisma: 0,
      };

  const newStats = {
    strength: calculateStat(newItem.equipment.strengthBonus, newItem.upgradeLevel),
    stamina: calculateStat(newItem.equipment.staminaBonus, newItem.upgradeLevel),
    focus: calculateStat(newItem.equipment.focusBonus, newItem.upgradeLevel),
    discipline: calculateStat(newItem.equipment.disciplineBonus, newItem.upgradeLevel),
    charisma: calculateStat(newItem.equipment.charismaBonus, newItem.upgradeLevel),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400">
            COMPARE EQUIPMENT
          </DialogTitle>
          <DialogDescription>
            Compare stats before swapping equipment
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6">
          {/* Item Headers */}
          <div className="grid grid-cols-2 gap-4">
            {/* Current Item */}
            <div className={cn("border rounded-lg p-4", currentItem ? RARITY_COLORS[currentItem.equipment.rarity] : "border-border bg-muted/20")}>
              <div className="text-center space-y-2">
                <div className="text-3xl">{currentItem?.equipment.icon || "—"}</div>
                <div className="font-mono font-bold">
                  {currentItem ? currentItem.equipment.name : "Empty Slot"}
                </div>
                {currentItem && (
                  <>
                    <div className="text-xs text-muted-foreground">
                      {currentItem.equipment.rarity}
                      {currentItem.upgradeLevel > 0 && ` +${currentItem.upgradeLevel}`}
                    </div>
                    {currentItem.equipment.setName && (
                      <div className="text-xs font-mono text-purple-400">
                        Set: {currentItem.equipment.setName}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* New Item */}
            <div className={cn("border rounded-lg p-4", RARITY_COLORS[newItem.equipment.rarity])}>
              <div className="text-center space-y-2">
                <div className="text-3xl">{newItem.equipment.icon}</div>
                <div className="font-mono font-bold">{newItem.equipment.name}</div>
                <div className="text-xs text-muted-foreground">
                  {newItem.equipment.rarity}
                  {newItem.upgradeLevel > 0 && ` +${newItem.upgradeLevel}`}
                </div>
                {newItem.equipment.setName && (
                  <div className="text-xs font-mono text-purple-400">
                    Set: {newItem.equipment.setName}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stat Comparison */}
          <div className="border border-cyan-500/30 rounded-lg p-4 bg-card/50">
            <div className="font-mono font-bold text-cyan-400 mb-3 text-center">
              STAT COMPARISON
            </div>
            <div className="space-y-1">
              <StatRow
                statKey="strength"
                currentValue={currentStats.strength}
                newValue={newStats.strength}
                label="Strength"
              />
              <StatRow
                statKey="stamina"
                currentValue={currentStats.stamina}
                newValue={newStats.stamina}
                label="Stamina"
              />
              <StatRow
                statKey="focus"
                currentValue={currentStats.focus}
                newValue={newStats.focus}
                label="Focus"
              />
              <StatRow
                statKey="discipline"
                currentValue={currentStats.discipline}
                newValue={newStats.discipline}
                label="Discipline"
              />
              <StatRow
                statKey="charisma"
                currentValue={currentStats.charisma}
                newValue={newStats.charisma}
                label="Charisma"
              />
            </div>
          </div>

          {/* Descriptions */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="text-muted-foreground">
              {currentItem?.equipment.description || "No item equipped"}
            </div>
            <div className="text-muted-foreground">
              {newItem.equipment.description}
            </div>
          </div>
        </DialogBody>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="neon" onClick={onSwap} disabled={isLoading}>
            {isLoading ? "Swapping..." : "Swap Equipment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
