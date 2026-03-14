"use client";

import { Shield, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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

interface EquippedItem {
  id: string;
  slot: string;
  upgradeLevel: number;
  equipment: Equipment;
}

interface EquipmentPaperdollProps {
  equippedItems: EquippedItem[];
  onUnequip: (slot: string) => void;
  onUpgrade: (slot: string) => void;
  isLoading?: boolean;
}

const SLOT_ORDER: Array<{ slot: string; label: string; position: string }> = [
  { slot: "HELM", label: "Helm", position: "col-start-2 row-start-1" },
  { slot: "WEAPON", label: "Weapon", position: "col-start-1 row-start-2" },
  { slot: "ARMOR", label: "Armor", position: "col-start-2 row-start-2" },
  { slot: "ACCESSORY", label: "Accessory", position: "col-start-3 row-start-2" },
  { slot: "BOOTS", label: "Boots", position: "col-start-2 row-start-3" },
  { slot: "TRINKET", label: "Trinket", position: "col-start-3 row-start-3" },
];

const RARITY_COLORS = {
  COMMON: "border-gray-500/50 bg-gray-500/5",
  RARE: "border-cyan-500/50 bg-cyan-500/10 rarity-rare",
  EPIC: "border-pink-500/50 bg-pink-500/10 rarity-epic",
  LEGENDARY: "border-yellow-500/50 bg-yellow-500/10 rarity-legendary",
};

const RARITY_TEXT_COLORS = {
  COMMON: "text-gray-400",
  RARE: "text-cyan-400",
  EPIC: "text-pink-400",
  LEGENDARY: "text-yellow-400",
};

function calculateStat(baseStat: number, upgradeLevel: number): number {
  return Math.floor(baseStat * Math.pow(1.3, upgradeLevel));
}

function EquipmentSlot({
  slotInfo,
  equippedItem,
  onUnequip,
  onUpgrade,
  isLoading,
}: {
  slotInfo: { slot: string; label: string; position: string };
  equippedItem?: EquippedItem;
  onUnequip: (slot: string) => void;
  onUpgrade: (slot: string) => void;
  isLoading: boolean;
}) {
  const isEmpty = !equippedItem;

  const stats = equippedItem
    ? [
        {
          label: "STR",
          value: calculateStat(equippedItem.equipment.strengthBonus, equippedItem.upgradeLevel),
        },
        {
          label: "STA",
          value: calculateStat(equippedItem.equipment.staminaBonus, equippedItem.upgradeLevel),
        },
        {
          label: "FOC",
          value: calculateStat(equippedItem.equipment.focusBonus, equippedItem.upgradeLevel),
        },
        {
          label: "DIS",
          value: calculateStat(equippedItem.equipment.disciplineBonus, equippedItem.upgradeLevel),
        },
        {
          label: "CHA",
          value: calculateStat(equippedItem.equipment.charismaBonus, equippedItem.upgradeLevel),
        },
      ].filter((stat) => stat.value > 0)
    : [];

  return (
    <div className={cn("relative", slotInfo.position)}>
      <div
        className={cn(
          "border-2 rounded-lg p-4 transition-all h-full flex flex-col",
          isEmpty
            ? "border-dashed border-border/50 bg-muted/20 hover:border-border"
            : RARITY_COLORS[equippedItem.equipment.rarity]
        )}
      >
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Shield className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-xs font-mono text-muted-foreground">
              {slotInfo.label}
            </span>
            <span className="text-xs text-muted-foreground/70">Empty</span>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-2">
              <div className="text-3xl">{equippedItem.equipment.icon}</div>
              {equippedItem.equipment.setName && (
                <Sparkles className="h-4 w-4 text-purple-400" />
              )}
            </div>

            <div className="flex-1 min-h-0">
              <div
                className={cn(
                  "font-mono font-bold text-sm mb-1 line-clamp-2",
                  RARITY_TEXT_COLORS[equippedItem.equipment.rarity]
                )}
              >
                {equippedItem.equipment.name}
              </div>

              <div className="text-xs text-muted-foreground mb-2">
                {slotInfo.label}
                {equippedItem.upgradeLevel > 0 && (
                  <span className="ml-1 text-cyan-400">
                    +{equippedItem.upgradeLevel}
                  </span>
                )}
              </div>

              {equippedItem.equipment.setName && (
                <div className="text-xs font-mono text-purple-400 mb-2">
                  {equippedItem.equipment.setName}
                </div>
              )}

              {/* Stat bonuses */}
              {stats.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {stats.map((stat) => (
                    <span
                      key={stat.label}
                      className="text-xs font-mono px-1.5 py-0.5 bg-background/50 rounded border border-border/30"
                    >
                      {stat.label} +{stat.value}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-1 mt-2">
              <Button
                size="xs"
                variant="outline"
                onClick={() => onUnequip(slotInfo.slot)}
                disabled={isLoading}
                className="flex-1 text-xs h-6"
              >
                Unequip
              </Button>
              {equippedItem.upgradeLevel < 3 && (
                <Button
                  size="xs"
                  variant="neon"
                  onClick={() => onUpgrade(slotInfo.slot)}
                  disabled={isLoading}
                  className="flex-1 text-xs h-6"
                >
                  Upgrade
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function EquipmentPaperdoll({
  equippedItems,
  onUnequip,
  onUpgrade,
  isLoading = false,
}: EquipmentPaperdollProps) {
  const equippedBySlot = equippedItems.reduce((acc, item) => {
    acc[item.slot] = item;
    return acc;
  }, {} as Record<string, EquippedItem>);

  return (
    <div className="grid grid-cols-3 gap-4 max-w-4xl mx-auto">
      {SLOT_ORDER.map((slotInfo) => (
        <EquipmentSlot
          key={slotInfo.slot}
          slotInfo={slotInfo}
          equippedItem={equippedBySlot[slotInfo.slot]}
          onUnequip={onUnequip}
          onUpgrade={onUpgrade}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
