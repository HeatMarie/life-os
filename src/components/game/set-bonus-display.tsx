"use client";

import { Shield, Zap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface SetBonusDisplayProps {
  setBonuses: {
    active: {
      setName: string;
      pieceCount: number;
      bonuses: {
        twoSet?: { maxHP: number; maxEnergy: number };
        fourSet?: { strength: number; stamina: number };
        sixSet?: { bossDamage: number; xpBonus: number };
      };
    }[];
  };
}

export function SetBonusDisplay({ setBonuses }: SetBonusDisplayProps) {
  if (!setBonuses?.active || setBonuses.active.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No set bonuses active. Equip matching set items to gain bonuses!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {setBonuses.active.map((set, index) => (
        <div
          key={`${set.setName}-${index}`}
          className="border border-purple-500/30 bg-purple-500/10 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              <span className="font-mono font-bold text-purple-400">
                {set.setName}
              </span>
            </div>
            <span className="text-sm font-mono text-muted-foreground">
              {set.pieceCount}/6 pieces
            </span>
          </div>

          <div className="space-y-2">
            {/* 2-piece bonus */}
            <div
              className={cn(
                "flex items-center justify-between p-2 rounded border",
                set.pieceCount >= 2
                  ? "border-green-500/30 bg-green-500/10"
                  : "border-border/30 bg-muted/5 opacity-50"
              )}
            >
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-400" />
                <span className="text-sm font-mono">2-Piece Bonus</span>
              </div>
              <div className="text-sm font-mono">
                {set.pieceCount >= 2 ? (
                  <span className="text-green-400">
                    +{set.bonuses.twoSet?.maxHP || 10} HP, +
                    {set.bonuses.twoSet?.maxEnergy || 5} Energy
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    +10 HP, +5 Energy
                  </span>
                )}
              </div>
            </div>

            {/* 4-piece bonus */}
            <div
              className={cn(
                "flex items-center justify-between p-2 rounded border",
                set.pieceCount >= 4
                  ? "border-cyan-500/30 bg-cyan-500/10"
                  : "border-border/30 bg-muted/5 opacity-50"
              )}
            >
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-mono">4-Piece Bonus</span>
              </div>
              <div className="text-sm font-mono">
                {set.pieceCount >= 4 ? (
                  <span className="text-cyan-400">
                    +{set.bonuses.fourSet?.strength || 2} STR, +
                    {set.bonuses.fourSet?.stamina || 2} STA
                  </span>
                ) : (
                  <span className="text-muted-foreground">+2 STR, +2 STA</span>
                )}
              </div>
            </div>

            {/* 6-piece bonus */}
            <div
              className={cn(
                "flex items-center justify-between p-2 rounded border",
                set.pieceCount >= 6
                  ? "border-yellow-500/30 bg-yellow-500/10"
                  : "border-border/30 bg-muted/5 opacity-50"
              )}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-mono">6-Piece Bonus</span>
              </div>
              <div className="text-sm font-mono">
                {set.pieceCount >= 6 ? (
                  <span className="text-yellow-400">
                    +{set.bonuses.sixSet?.bossDamage || 10} Boss DMG, +
                    {((set.bonuses.sixSet?.xpBonus || 0.1) * 100).toFixed(0)}%
                    XP
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    +10 Boss DMG, +10% XP
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
