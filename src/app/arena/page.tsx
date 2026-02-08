"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BossHealthBar } from "@/components/game/status-bars";
import {
  Skull,
  Swords,
  Trophy,
  Clock,
  Target,
  Zap,
  Loader2,
} from "lucide-react";

// Boss type from API
interface Boss {
  id: string;
  name: string;
  description: string | null;
  hp: number;
  maxHp: number;
  status: string;
  deadline: string | null;
  icon: string | null;
  xpReward: number;
  project: {
    id: string;
    name: string;
    tasks?: { id: string }[];
  } | null;
}

const BOSS_TIPS = [
  "Complete project tasks to deal damage to the boss!",
  "Higher priority tasks deal more damage.",
  "Use Boss Bane items for 50% extra damage.",
  "Defeat bosses before their deadline or they escape!",
];

function DaysUntil({ date }: { date: string }) {
  const target = new Date(date);
  const now = new Date();
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diff < 0) return <span className="text-red-400">ESCAPED</span>;
  if (diff === 0) return <span className="text-orange-400">TODAY</span>;
  if (diff <= 7) return <span className="text-orange-400">{diff} days</span>;
  if (diff <= 30) return <span className="text-yellow-400">{diff} days</span>;
  return <span className="text-green-400">{diff} days</span>;
}

export default function ArenaPage() {
  const [bosses, setBosses] = useState<Boss[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [randomTip, setRandomTip] = useState(BOSS_TIPS[0]);

  // Fetch bosses
  useEffect(() => {
    async function fetchBosses() {
      try {
        const res = await fetch("/api/bosses");
        if (res.ok) {
          const data = await res.json();
          setBosses(data);
        }
      } catch (error) {
        console.error("Failed to fetch bosses:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBosses();
    setRandomTip(BOSS_TIPS[Math.floor(Math.random() * BOSS_TIPS.length)]);
  }, []);

  const activeBosses = bosses.filter((b) => b.status === "ACTIVE");
  const defeatedBosses = bosses.filter((b) => b.status === "DEFEATED");

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-red-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-mono text-xl font-bold tracking-widest text-red-400 neon-glow-red flex items-center gap-3">
            <Swords size={24} /> BATTLE ARENA
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeBosses.length} active boss{activeBosses.length !== 1 ? "es" : ""} • {defeatedBosses.length} defeated
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
          <Trophy size={14} className="text-yellow-500" />
          <span className="font-mono text-xs text-yellow-500">{defeatedBosses.length} SLAIN</span>
        </div>
      </div>

      {/* Combat Tips */}
      <Card className="border-purple-500/30 bg-purple-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Zap size={16} className="text-purple-400 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-purple-400 mb-1">COMBAT TIP</div>
              <div className="text-sm text-muted-foreground">
                {randomTip}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Bosses */}
      <div className="space-y-4">
        <h2 className="font-mono text-sm font-bold tracking-widest text-red-400 flex items-center gap-2">
          <Skull size={16} /> ACTIVE BOSSES
        </h2>
        
        {activeBosses.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Skull size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground">No active bosses. Create a project with a deadline to spawn a boss!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {activeBosses.map((boss) => (
              <Card key={boss.id} className="border-red-500/30 bg-gradient-to-br from-red-500/10 to-transparent overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    {/* Boss Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-24 h-24 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-5xl shadow-[0_0_30px_hsl(0_90%_55%/0.3)]">
                        {boss.icon}
                      </div>
                    </div>
                    
                    {/* Boss Info */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="font-mono text-lg font-bold text-red-400 neon-glow-red">
                          💀 {boss.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">{boss.description}</p>
                      </div>
                      
                      {/* HP Bar */}
                      <BossHealthBar
                        current={boss.hp}
                        max={boss.maxHp}
                        name=""
                      />
                      
                      {/* Stats Grid */}
                      <div className="grid grid-cols-4 gap-4">
                        <div className="p-3 rounded-lg bg-card border border-border">
                          <div className="text-[10px] text-muted-foreground mb-1">PROJECT</div>
                          <div className="text-xs font-medium">{boss.project?.name || "Unknown"}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-card border border-border">
                          <div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                            <Clock size={10} /> DEADLINE
                          </div>
                          <div className="text-xs font-medium">
                            {boss.deadline ? <DaysUntil date={boss.deadline} /> : <span className="text-muted-foreground">None</span>}
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-card border border-border">
                          <div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                            <Target size={10} /> LINKED TASKS
                          </div>
                          <div className="text-xs font-medium text-cyan-400">{boss.project?.tasks?.length || 0}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-card border border-border">
                          <div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                            <Swords size={10} /> HP LEFT
                          </div>
                          <div className="text-xs font-medium text-pink-400">{Math.round((boss.hp / boss.maxHp) * 100)}%</div>
                        </div>
                      </div>
                      
                      {/* Rewards */}
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <div className="flex items-center gap-4">
                          <div className="text-xs">
                            <span className="text-muted-foreground">Reward: </span>
                            <span className="font-mono text-yellow-500">+{boss.xpReward} XP</span>
                          </div>
                          <div className="text-xs">
                            <span className="text-muted-foreground">+ Epic Loot Drop</span>
                          </div>
                        </div>
                        <Button variant="danger" size="sm">
                          <Target size={14} />
                          VIEW TASKS
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Defeated Bosses */}
      <div className="space-y-4">
        <h2 className="font-mono text-sm font-bold tracking-widest text-green-400 flex items-center gap-2">
          <Trophy size={16} /> DEFEATED BOSSES
        </h2>
        
        {defeatedBosses.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Trophy size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground">No defeated bosses yet. Complete project tasks to deal damage!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {defeatedBosses.map((boss) => (
              <Card key={boss.id} className="border-green-500/30">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-green-500/20 border border-green-500/40 flex items-center justify-center text-2xl">
                    {boss.icon || "💀"}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-green-400">{boss.name}</div>
                    <div className="text-xs text-muted-foreground">
                      XP: +{boss.xpReward}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
