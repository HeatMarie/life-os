"use client";

import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface HealthBarProps {
  current: number;
  max: number;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function HealthBar({
  current,
  max,
  className,
  showLabel = true,
  size = "md",
}: HealthBarProps) {
  const percentage = max > 0 ? (current / max) * 100 : 0;
  const isCritical = percentage <= 10;
  const isDanger = percentage <= 25;

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className={cn("space-y-1", className)}>
      {showLabel && (
        <div className="flex justify-between text-xs font-mono">
          <span className={cn(
            isCritical ? "text-red-500 neon-glow-red" : 
            isDanger ? "text-orange-500" : "text-red-400"
          )}>
            HP
          </span>
          <span className="text-muted-foreground">
            {current}/{max}
          </span>
        </div>
      )}
      <Progress
        value={percentage}
        className={cn(
          sizeClasses[size],
          "bg-red-950/50"
        )}
        indicatorClassName={cn(
          "transition-all duration-300",
          isCritical ? "bg-red-600 health-critical" :
          isDanger ? "bg-orange-500" : "bg-red-500"
        )}
      />
    </div>
  );
}

interface EnergyBarProps {
  current: number;
  max: number;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function EnergyBar({
  current,
  max,
  className,
  showLabel = true,
  size = "md",
}: EnergyBarProps) {
  const percentage = max > 0 ? (current / max) * 100 : 0;
  const isLow = percentage <= 20;
  const isDepleted = percentage === 0;

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className={cn("space-y-1", className)}>
      {showLabel && (
        <div className="flex justify-between text-xs font-mono">
          <span className={cn(
            isDepleted ? "text-yellow-600 energy-depleted" :
            isLow ? "text-yellow-500" : "text-yellow-400"
          )}>
            ⚡ ENERGY
          </span>
          <span className="text-muted-foreground">
            {current}/{max}
          </span>
        </div>
      )}
      <Progress
        value={percentage}
        className={cn(
          sizeClasses[size],
          "bg-yellow-950/50"
        )}
        indicatorClassName={cn(
          "transition-all duration-300",
          isDepleted ? "bg-yellow-800 energy-depleted" :
          isLow ? "bg-yellow-600" : "bg-yellow-500"
        )}
      />
    </div>
  );
}

interface XPBarProps {
  current: number;
  toNext: number;
  level: number;
  className?: string;
  showLabel?: boolean;
}

export function XPBar({
  current,
  toNext,
  level,
  className,
  showLabel = true,
}: XPBarProps) {
  const percentage = toNext > 0 ? (current / toNext) * 100 : 0;

  return (
    <div className={cn("space-y-1", className)}>
      {showLabel && (
        <div className="flex justify-between text-xs font-mono">
          <span className="text-cyan-400 neon-glow-cyan">LVL {level}</span>
          <span className="text-muted-foreground">
            {current}/{toNext} XP
          </span>
        </div>
      )}
      <Progress
        value={percentage}
        className="h-1.5 bg-cyan-950/50"
        indicatorClassName="bg-cyan-500"
      />
    </div>
  );
}

interface BossHealthBarProps {
  current: number;
  max: number;
  name: string;
  className?: string;
  isDamaged?: boolean;
}

export function BossHealthBar({
  current,
  max,
  name,
  className,
  isDamaged = false,
}: BossHealthBarProps) {
  const percentage = max > 0 ? (current / max) * 100 : 0;

  return (
    <div className={cn("space-y-2", className, isDamaged && "boss-damaged")}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-mono font-bold text-red-400 neon-glow-red">
          💀 {name}
        </span>
        <span className="text-xs font-mono text-muted-foreground">
          {current}/{max} HP
        </span>
      </div>
      <div className="h-3 bg-red-950/50 rounded-full overflow-hidden">
        <div
          className="h-full boss-health-bar rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
