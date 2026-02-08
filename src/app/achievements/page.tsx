"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trophy, Lock, Loader2 } from "lucide-react";
import { ACHIEVEMENTS } from "@/lib/game/achievements";

const RARITY_COLORS = {
  COMMON: "text-muted-foreground border-border",
  RARE: "text-cyan-400 border-cyan-400/40",
  EPIC: "text-pink-400 border-pink-400/40",
  LEGENDARY: "text-yellow-500 border-yellow-500/40",
};

const RARITY_GLOW = {
  COMMON: "",
  RARE: "rarity-rare",
  EPIC: "rarity-epic",
  LEGENDARY: "rarity-legendary",
};

export default function AchievementsPage() {
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");
  const [rarityFilter, setRarityFilter] = useState<string>("all");

  useEffect(() => {
    async function fetchAchievements() {
      try {
        const res = await fetch("/api/achievements");
        if (res.ok) {
          const data = await res.json();
          setUnlockedAchievements(data);
        }
      } catch (error) {
        console.error("Error fetching achievements:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAchievements();
  }, []);

  const filteredAchievements = ACHIEVEMENTS.filter((a) => {
    const isUnlocked = unlockedAchievements.includes(a.code);
    
    // Status filter
    if (filter === "unlocked" && !isUnlocked) return false;
    if (filter === "locked" && isUnlocked) return false;
    
    // Rarity filter
    if (rarityFilter !== "all" && a.rarity !== rarityFilter) return false;
    
    return true;
  });

  const unlockedCount = unlockedAchievements.length;
  const totalCount = ACHIEVEMENTS.length;
  const completionPercent = (unlockedCount / totalCount) * 100;

  const groupByRarity = {
    LEGENDARY: filteredAchievements.filter((a) => a.rarity === "LEGENDARY"),
    EPIC: filteredAchievements.filter((a) => a.rarity === "EPIC"),
    RARE: filteredAchievements.filter((a) => a.rarity === "RARE"),
    COMMON: filteredAchievements.filter((a) => a.rarity === "COMMON"),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-mono text-xl font-bold tracking-widest text-yellow-500 neon-glow-gold flex items-center gap-3">
            <Trophy size={24} /> TROPHY CASE
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unlockedCount} / {totalCount} achievements unlocked
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-48">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Completion</span>
              <span className="text-yellow-500">{completionPercent.toFixed(0)}%</span>
            </div>
            <Progress value={completionPercent} className="h-2" indicatorClassName="bg-yellow-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "neon" : "ghost"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "unlocked" ? "neon" : "ghost"}
            size="sm"
            onClick={() => setFilter("unlocked")}
          >
            Unlocked
          </Button>
          <Button
            variant={filter === "locked" ? "neon" : "ghost"}
            size="sm"
            onClick={() => setFilter("locked")}
          >
            Locked
          </Button>
        </div>
        <div className="h-6 w-px bg-border" />
        <div className="flex gap-2">
          <Button
            variant={rarityFilter === "all" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setRarityFilter("all")}
          >
            All Rarities
          </Button>
          <Button
            variant={rarityFilter === "LEGENDARY" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setRarityFilter("LEGENDARY")}
            className="text-yellow-500"
          >
            Legendary
          </Button>
          <Button
            variant={rarityFilter === "EPIC" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setRarityFilter("EPIC")}
            className="text-pink-400"
          >
            Epic
          </Button>
          <Button
            variant={rarityFilter === "RARE" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setRarityFilter("RARE")}
            className="text-cyan-400"
          >
            Rare
          </Button>
          <Button
            variant={rarityFilter === "COMMON" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setRarityFilter("COMMON")}
          >
            Common
          </Button>
        </div>
      </div>

      {/* Achievements Grid */}
      {Object.entries(groupByRarity).map(([rarity, achievements]) => {
        if (achievements.length === 0) return null;
        
        return (
          <div key={rarity} className="space-y-4">
            <h2 className={`font-mono text-sm font-bold tracking-widest ${RARITY_COLORS[rarity as keyof typeof RARITY_COLORS]}`}>
              {rarity} ({achievements.length})
            </h2>
            <div className="grid grid-cols-4 gap-4">
              {achievements.map((achievement) => {
                const isUnlocked = unlockedAchievements.includes(achievement.code);
                
                return (
                  <Card
                    key={achievement.code}
                    className={`transition-all hover:scale-[1.02] ${
                      isUnlocked
                        ? `${RARITY_COLORS[achievement.rarity]} ${RARITY_GLOW[achievement.rarity]}`
                        : "border-border opacity-50"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
                          isUnlocked
                            ? `bg-${achievement.rarity === 'LEGENDARY' ? 'yellow' : achievement.rarity === 'EPIC' ? 'pink' : achievement.rarity === 'RARE' ? 'cyan' : 'muted'}-500/20`
                            : "bg-muted"
                        }`}>
                          {isUnlocked ? achievement.icon : <Lock size={20} className="text-muted-foreground" />}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-bold">{achievement.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {achievement.description}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-[10px] font-bold ${RARITY_COLORS[achievement.rarity]}`}>
                              {achievement.rarity}
                            </span>
                            <span className="font-mono text-[10px] text-yellow-500">
                              +{achievement.xpReward} XP
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {filteredAchievements.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Trophy size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">No achievements match your filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
