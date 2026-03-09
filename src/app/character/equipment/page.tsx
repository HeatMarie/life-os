"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EquipmentPaperdoll } from "@/components/game/equipment-paperdoll";
import { InventoryGrid } from "@/components/game/inventory-grid";
import { EquipmentCompareModal } from "@/components/game/equipment-compare-modal";
import { SetBonusDisplay } from "@/components/game/set-bonus-display";
import { Shield, ArrowLeft, Loader2 } from "lucide-react";
import { INVENTORY_EXPANSION } from "@/lib/game/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface InventoryItem {
  id: string;
  upgradeLevel: number;
  equipment: Equipment;
}

export default function EquipmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [equippedItems, setEquippedItems] = useState<EquippedItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryCount, setInventoryCount] = useState(0);
  const [inventoryCapacity, setInventoryCapacity] = useState(20);
  const [setBonuses, setBonuses] = useState<any>(null);
  const [characterLevel, setCharacterLevel] = useState(1);
  const [characterGold, setCharacterGold] = useState(0);

  // Modal states
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [compareData, setCompareData] = useState<{
    currentItem: EquippedItem | null;
    newItem: InventoryItem;
  } | null>(null);

  const [sellConfirmOpen, setSellConfirmOpen] = useState(false);
  const [sellItem, setSellItem] = useState<InventoryItem | null>(null);

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeItem, setUpgradeItem] = useState<{
    item: EquippedItem | InventoryItem;
    isEquipped: boolean;
    slot?: string;
  } | null>(null);

  const fetchEquipment = async () => {
    try {
      const response = await fetch("/api/equipment");
      if (!response.ok) throw new Error("Failed to fetch equipment");

      const data = await response.json();
      setEquippedItems(data.equippedItems || []);
      setInventoryItems(data.inventoryItems || []);
      setInventoryCount(data.inventoryCount || 0);
      setInventoryCapacity(data.inventoryCapacity || 20);
      setBonuses(data.setBonuses || null);
    } catch (error) {
      console.error("Error fetching equipment:", error);
    }
  };

  const fetchCharacter = async () => {
    try {
      const response = await fetch("/api/character");
      if (!response.ok) throw new Error("Failed to fetch character");

      const data = await response.json();
      setCharacterLevel(data.level || 1);
      setCharacterGold(data.gold || 0);
    } catch (error) {
      console.error("Error fetching character:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchEquipment(), fetchCharacter()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleEquip = async (itemId: string) => {
    const item = inventoryItems.find((i) => i.id === itemId);
    if (!item) return;

    // Check if slot is occupied
    const currentlyEquipped = equippedItems.find(
      (e) => e.slot === item.equipment.slot
    );

    if (currentlyEquipped) {
      // Show comparison modal
      setCompareData({
        currentItem: currentlyEquipped,
        newItem: item,
      });
      setCompareModalOpen(true);
    } else {
      // Equip directly
      await performEquip(itemId);
    }
  };

  const performEquip = async (itemId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch("/api/equipment/equip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventoryItemId: itemId }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to equip item");
        return;
      }

      await fetchEquipment();
      setCompareModalOpen(false);
      setCompareData(null);
    } catch (error) {
      console.error("Error equipping item:", error);
      alert("Failed to equip item");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnequip = async (slot: string) => {
    if (inventoryCount >= inventoryCapacity) {
      alert("Inventory is full! Cannot unequip item.");
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch("/api/equipment/unequip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to unequip item");
        return;
      }

      await fetchEquipment();
    } catch (error) {
      console.error("Error unequipping item:", error);
      alert("Failed to unequip item");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSell = (itemId: string) => {
    const item = inventoryItems.find((i) => i.id === itemId);
    if (!item) return;

    setSellItem(item);
    setSellConfirmOpen(true);
  };

  const confirmSell = async () => {
    if (!sellItem) return;

    setActionLoading(true);
    try {
      const response = await fetch("/api/equipment/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventoryItemId: sellItem.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to sell item");
        return;
      }

      const data = await response.json();
      setCharacterGold(data.newGold);
      await fetchEquipment();
      setSellConfirmOpen(false);
      setSellItem(null);
    } catch (error) {
      console.error("Error selling item:", error);
      alert("Failed to sell item");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpgradeFromInventory = (itemId: string) => {
    const item = inventoryItems.find((i) => i.id === itemId);
    if (!item) return;

    setUpgradeItem({ item, isEquipped: false });
    setUpgradeModalOpen(true);
  };

  const handleUpgradeFromEquipped = (slot: string) => {
    const item = equippedItems.find((e) => e.slot === slot);
    if (!item) return;

    setUpgradeItem({ item, isEquipped: true, slot });
    setUpgradeModalOpen(true);
  };

  const confirmUpgrade = async () => {
    if (!upgradeItem) return;

    setActionLoading(true);
    try {
      const body = upgradeItem.isEquipped
        ? { equippedSlot: upgradeItem.slot }
        : { inventoryItemId: upgradeItem.item.id };

      const response = await fetch("/api/equipment/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to upgrade item");
        return;
      }

      const data = await response.json();
      setCharacterGold(data.goldRemaining);
      await fetchEquipment();
      setUpgradeModalOpen(false);
      setUpgradeItem(null);
    } catch (error) {
      console.error("Error upgrading item:", error);
      alert("Failed to upgrade item");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExpandInventory = async () => {
    if (inventoryCapacity >= INVENTORY_EXPANSION.MAX_SLOTS) {
      alert("Inventory is already at maximum capacity!");
      return;
    }

    const purchasesMade = Math.floor(
      (inventoryCapacity - 20) / INVENTORY_EXPANSION.SLOTS_PER_PURCHASE
    );
    const cost = Math.floor(
      INVENTORY_EXPANSION.BASE_COST *
        Math.pow(INVENTORY_EXPANSION.COST_SCALING, purchasesMade)
    );

    if (characterGold < cost) {
      alert(`Not enough gold! Need ${cost}g but only have ${characterGold}g.`);
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch("/api/equipment/expand-inventory", {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to expand inventory");
        return;
      }

      const data = await response.json();
      setInventoryCapacity(data.newCapacity);
      setCharacterGold(data.goldRemaining);
    } catch (error) {
      console.error("Error expanding inventory:", error);
      alert("Failed to expand inventory");
    } finally {
      setActionLoading(false);
    }
  };

  const getUpgradeCost = (currentLevel: number) => {
    const costs: Record<number, { gold: number; material: string }> = {
      0: { gold: 100, material: "Upgrade Stone" },
      1: { gold: 300, material: "Enhancement Crystal" },
      2: { gold: 500, material: "Mythic Essence" },
    };
    return costs[currentLevel] || null;
  };

  const getSellPrice = (rarity: string, upgradeLevel: number): number => {
    const basePrices: Record<string, number> = {
      COMMON: 25,
      RARE: 75,
      EPIC: 150,
      LEGENDARY: 200,
    };
    return basePrices[rarity] + upgradeLevel * 50;
  };

  const calculateExpansionCost = () => {
    const purchasesMade = Math.floor(
      (inventoryCapacity - 20) / INVENTORY_EXPANSION.SLOTS_PER_PURCHASE
    );
    return Math.floor(
      INVENTORY_EXPANSION.BASE_COST *
        Math.pow(INVENTORY_EXPANSION.COST_SCALING, purchasesMade)
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400">
            EQUIPMENT & INVENTORY
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your equipment and inventory
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Gold</div>
            <div className="text-xl font-mono font-bold text-yellow-400">
              {characterGold} 💰
            </div>
          </div>
          <Button variant="outline" onClick={() => router.push("/character")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Character
          </Button>
        </div>
      </div>

      <Tabs defaultValue="equipment" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="space-y-6">
          {/* Equipment Paperdoll */}
          <Card className="border-cyan-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-cyan-400" />
                Equipped Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EquipmentPaperdoll
                equippedItems={equippedItems}
                onUnequip={handleUnequip}
                onUpgrade={handleUpgradeFromEquipped}
                isLoading={actionLoading}
              />
            </CardContent>
          </Card>

          {/* Set Bonuses */}
          <Card className="border-purple-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-400" />
                Set Bonuses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SetBonusDisplay setBonuses={setBonuses} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          {/* Inventory Grid */}
          <Card className="border-cyan-500/30">
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <InventoryGrid
                inventoryItems={inventoryItems}
                inventoryCount={inventoryCount}
                inventoryCapacity={inventoryCapacity}
                characterLevel={characterLevel}
                onEquip={handleEquip}
                onSell={handleSell}
                onUpgrade={handleUpgradeFromInventory}
                onExpandInventory={handleExpandInventory}
                isLoading={actionLoading}
                canExpandInventory={inventoryCapacity < INVENTORY_EXPANSION.MAX_SLOTS}
                expansionCost={calculateExpansionCost()}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Compare Modal */}
      {compareData && (
        <EquipmentCompareModal
          open={compareModalOpen}
          onOpenChange={setCompareModalOpen}
          currentItem={compareData.currentItem}
          newItem={compareData.newItem}
          onSwap={() => performEquip(compareData.newItem.id)}
          isLoading={actionLoading}
        />
      )}

      {/* Sell Confirmation Modal */}
      <Dialog open={sellConfirmOpen} onOpenChange={setSellConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sell Item?</DialogTitle>
            <DialogDescription>
              Are you sure you want to sell this item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {sellItem && (
            <div className="border border-border rounded-lg p-4 my-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{sellItem.equipment.icon}</span>
                <div>
                  <div className="font-mono font-bold">{sellItem.equipment.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {sellItem.equipment.rarity}
                    {sellItem.upgradeLevel > 0 && ` +${sellItem.upgradeLevel}`}
                  </div>
                </div>
              </div>
              <div className="text-lg font-mono font-bold text-yellow-400">
                Sell for: {getSellPrice(sellItem.equipment.rarity, sellItem.upgradeLevel)}g
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSellConfirmOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmSell} disabled={actionLoading}>
              {actionLoading ? "Selling..." : "Sell Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Modal */}
      <Dialog open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade Item?</DialogTitle>
            <DialogDescription>
              Upgrade your equipment to increase its stats by 30%.
            </DialogDescription>
          </DialogHeader>
          {upgradeItem && (
            <div className="space-y-4 my-4">
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{upgradeItem.item.equipment.icon}</span>
                  <div>
                    <div className="font-mono font-bold">{upgradeItem.item.equipment.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Level {upgradeItem.item.upgradeLevel} → {upgradeItem.item.upgradeLevel + 1}
                    </div>
                  </div>
                </div>
              </div>
              {upgradeItem.item.upgradeLevel < 3 && (
                <div className="border border-cyan-500/30 bg-cyan-500/10 rounded-lg p-4">
                  <div className="font-mono font-bold text-cyan-400 mb-2">Cost:</div>
                  <div className="space-y-1 text-sm">
                    <div>
                      Gold: {getUpgradeCost(upgradeItem.item.upgradeLevel)?.gold || 0}g
                    </div>
                    <div>
                      Material: {getUpgradeCost(upgradeItem.item.upgradeLevel)?.material || "None"}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Note: Material requirements are not yet implemented. Only gold will be deducted.
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeModalOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button variant="neon" onClick={confirmUpgrade} disabled={actionLoading}>
              {actionLoading ? "Upgrading..." : "Upgrade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
