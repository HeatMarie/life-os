"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Filter, ArrowUpDown, Coins, TrendingUp } from "lucide-react";

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

interface InventoryItem {
  id: string;
  upgradeLevel: number;
  equipment: Equipment;
}

interface InventoryGridProps {
  inventoryItems: InventoryItem[];
  inventoryCount: number;
  inventoryCapacity: number;
  characterLevel: number;
  onEquip: (itemId: string) => void;
  onSell: (itemId: string) => void;
  onUpgrade: (itemId: string) => void;
  onExpandInventory: () => void;
  isLoading?: boolean;
  canExpandInventory: boolean;
  expansionCost: number;
}

const RARITY_COLORS = {
  COMMON: "border-gray-500/50 bg-gray-500/5 hover:bg-gray-500/10",
  RARE: "border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/15 rarity-rare",
  EPIC: "border-pink-500/50 bg-pink-500/10 hover:bg-pink-500/15 rarity-epic",
  LEGENDARY:
    "border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/15 rarity-legendary",
};

const RARITY_TEXT_COLORS = {
  COMMON: "text-gray-400",
  RARE: "text-cyan-400",
  EPIC: "text-pink-400",
  LEGENDARY: "text-yellow-400",
};

const SLOT_ICONS = {
  WEAPON: "⚔️",
  ARMOR: "🛡️",
  HELM: "⛑️",
  BOOTS: "👢",
  ACCESSORY: "💍",
  TRINKET: "✨",
};

function calculateStat(baseStat: number, upgradeLevel: number): number {
  return Math.floor(baseStat * Math.pow(1.3, upgradeLevel));
}

function getSellPrice(rarity: string, upgradeLevel: number): number {
  const basePrices: Record<string, number> = {
    COMMON: 25,
    RARE: 75,
    EPIC: 150,
    LEGENDARY: 200,
  };
  return basePrices[rarity] + upgradeLevel * 50;
}

export function InventoryGrid({
  inventoryItems,
  inventoryCount,
  inventoryCapacity,
  characterLevel,
  onEquip,
  onSell,
  onUpgrade,
  onExpandInventory,
  isLoading = false,
  canExpandInventory,
  expansionCost,
}: InventoryGridProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [filterSlot, setFilterSlot] = useState<string>("ALL");
  const [filterRarity, setFilterRarity] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("rarity");

  // Filter items
  let filteredItems = [...inventoryItems];

  if (filterSlot !== "ALL") {
    filteredItems = filteredItems.filter(
      (item) => item.equipment.slot === filterSlot
    );
  }

  if (filterRarity !== "ALL") {
    filteredItems = filteredItems.filter(
      (item) => item.equipment.rarity === filterRarity
    );
  }

  // Sort items
  filteredItems.sort((a, b) => {
    if (sortBy === "rarity") {
      const rarityOrder = { LEGENDARY: 0, EPIC: 1, RARE: 2, COMMON: 3 };
      return (
        rarityOrder[a.equipment.rarity] - rarityOrder[b.equipment.rarity]
      );
    } else if (sortBy === "slot") {
      return a.equipment.slot.localeCompare(b.equipment.slot);
    } else if (sortBy === "level") {
      return b.equipment.levelRequirement - a.equipment.levelRequirement;
    }
    return 0;
  });

  const selected = selectedItem
    ? inventoryItems.find((item) => item.id === selectedItem)
    : null;

  const canEquipSelected = selected
    ? selected.equipment.levelRequirement <= characterLevel
    : false;

  const totalStats = selected
    ? calculateStat(selected.equipment.strengthBonus, selected.upgradeLevel) +
      calculateStat(selected.equipment.staminaBonus, selected.upgradeLevel) +
      calculateStat(selected.equipment.focusBonus, selected.upgradeLevel) +
      calculateStat(selected.equipment.disciplineBonus, selected.upgradeLevel) +
      calculateStat(selected.equipment.charismaBonus, selected.upgradeLevel)
    : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-5 w-5 text-cyan-400" />
          <span className="font-mono font-bold text-lg">
            Inventory: {inventoryCount} / {inventoryCapacity}
          </span>
        </div>
        {canExpandInventory && (
          <Button
            variant="neon"
            size="sm"
            onClick={onExpandInventory}
            disabled={isLoading}
          >
            <Package className="h-4 w-4 mr-2" />
            Expand ({expansionCost}g)
          </Button>
        )}
      </div>

      {/* Filters & Sort */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterSlot} onValueChange={setFilterSlot}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Slot" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Slots</SelectItem>
              <SelectItem value="WEAPON">Weapon</SelectItem>
              <SelectItem value="ARMOR">Armor</SelectItem>
              <SelectItem value="HELM">Helm</SelectItem>
              <SelectItem value="BOOTS">Boots</SelectItem>
              <SelectItem value="ACCESSORY">Accessory</SelectItem>
              <SelectItem value="TRINKET">Trinket</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Select value={filterRarity} onValueChange={setFilterRarity}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Rarity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Rarity</SelectItem>
            <SelectItem value="LEGENDARY">Legendary</SelectItem>
            <SelectItem value="EPIC">Epic</SelectItem>
            <SelectItem value="RARE">Rare</SelectItem>
            <SelectItem value="COMMON">Common</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rarity">Rarity</SelectItem>
              <SelectItem value="slot">Slot</SelectItem>
              <SelectItem value="level">Level</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Inventory Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No items found</p>
          <p className="text-sm">Complete tasks to find equipment!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredItems.map((item) => {
            const isSelected = selectedItem === item.id;
            const canEquip =
              item.equipment.levelRequirement <= characterLevel;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item.id)}
                className={cn(
                  "border-2 rounded-lg p-3 cursor-pointer transition-all",
                  RARITY_COLORS[item.equipment.rarity],
                  isSelected && "ring-2 ring-cyan-400 scale-105"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{item.equipment.icon}</span>
                  <span className="text-xs">
                    {SLOT_ICONS[item.equipment.slot as keyof typeof SLOT_ICONS]}
                  </span>
                </div>

                <div
                  className={cn(
                    "font-mono font-bold text-xs mb-1 line-clamp-2",
                    RARITY_TEXT_COLORS[item.equipment.rarity]
                  )}
                >
                  {item.equipment.name}
                </div>

                <div className="text-xs text-muted-foreground mb-1">
                  {item.equipment.rarity}
                  {item.upgradeLevel > 0 && (
                    <span className="ml-1 text-cyan-400">
                      +{item.upgradeLevel}
                    </span>
                  )}
                </div>

                {!canEquip && (
                  <div className="text-xs text-red-400">
                    Lvl {item.equipment.levelRequirement}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Action Panel */}
      {selected && (
        <div className="border border-cyan-500/30 bg-card rounded-lg p-4">
          <div className="flex items-start gap-4">
            {/* Item Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">{selected.equipment.icon}</span>
                <div>
                  <div
                    className={cn(
                      "font-mono font-bold text-lg",
                      RARITY_TEXT_COLORS[selected.equipment.rarity]
                    )}
                  >
                    {selected.equipment.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selected.equipment.slot} • {selected.equipment.rarity}
                    {selected.upgradeLevel > 0 && ` +${selected.upgradeLevel}`}
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-3">
                {selected.equipment.description}
              </p>

              {/* Stats */}
              <div className="flex flex-wrap gap-2 mb-3">
                {selected.equipment.strengthBonus > 0 && (
                  <span className="text-xs font-mono px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/30 rounded">
                    STR +
                    {calculateStat(
                      selected.equipment.strengthBonus,
                      selected.upgradeLevel
                    )}
                  </span>
                )}
                {selected.equipment.staminaBonus > 0 && (
                  <span className="text-xs font-mono px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/30 rounded">
                    STA +
                    {calculateStat(
                      selected.equipment.staminaBonus,
                      selected.upgradeLevel
                    )}
                  </span>
                )}
                {selected.equipment.focusBonus > 0 && (
                  <span className="text-xs font-mono px-2 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded">
                    FOC +
                    {calculateStat(
                      selected.equipment.focusBonus,
                      selected.upgradeLevel
                    )}
                  </span>
                )}
                {selected.equipment.disciplineBonus > 0 && (
                  <span className="text-xs font-mono px-2 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded">
                    DIS +
                    {calculateStat(
                      selected.equipment.disciplineBonus,
                      selected.upgradeLevel
                    )}
                  </span>
                )}
                {selected.equipment.charismaBonus > 0 && (
                  <span className="text-xs font-mono px-2 py-1 bg-pink-500/10 text-pink-400 border border-pink-500/30 rounded">
                    CHA +
                    {calculateStat(
                      selected.equipment.charismaBonus,
                      selected.upgradeLevel
                    )}
                  </span>
                )}
              </div>

              {selected.equipment.setName && (
                <div className="text-sm font-mono text-purple-400 mb-2">
                  Set: {selected.equipment.setName}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 min-w-[120px]">
              <Button
                variant="neon"
                size="sm"
                onClick={() => onEquip(selected.id)}
                disabled={!canEquipSelected || isLoading}
              >
                Equip
              </Button>
              {selected.upgradeLevel < 3 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpgrade(selected.id)}
                  disabled={isLoading}
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Upgrade
                </Button>
              )}
              <Button
                variant="danger"
                size="sm"
                onClick={() => onSell(selected.id)}
                disabled={isLoading}
              >
                <Coins className="h-4 w-4 mr-1" />
                Sell (
                {getSellPrice(
                  selected.equipment.rarity,
                  selected.upgradeLevel
                )}
                g)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
