"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Book,
  Loader2,
  Calendar,
  Trophy,
  Swords,
  Heart,
  Skull,
  Clock,
  ChevronDown,
  Sparkles,
  Filter,
} from "lucide-react";

interface StoryEntry {
  id: string;
  entryType: string;
  title: string;
  narrative: string;
  xpEarned: number | null;
  hpChange: number | null;
  bossDamage: number | null;
  aiGenerated: boolean;
  createdAt: string;
  event: {
    id: string;
    title: string;
    startsAt: string;
    area: { type: string; color: string };
    project: { name: string } | null;
  } | null;
}

interface Pagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

const ENTRY_TYPE_CONFIG = {
  EVENT_COMPLETED: {
    icon: Calendar,
    color: "text-green-400",
    bgColor: "bg-green-400/10",
    borderColor: "border-green-400/30",
    label: "Quest Complete",
  },
  EVENT_MISSED: {
    icon: Skull,
    color: "text-red-400",
    bgColor: "bg-red-400/10",
    borderColor: "border-red-400/30",
    label: "Quest Failed",
  },
  EVENT_CANCELED: {
    icon: Clock,
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
    borderColor: "border-orange-400/30",
    label: "Strategic Retreat",
  },
  EVENT_RESCHEDULED: {
    icon: Sparkles,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-400/30",
    label: "Fate Shifted",
  },
  BOSS_DAMAGE: {
    icon: Swords,
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    borderColor: "border-purple-400/30",
    label: "Boss Battle",
  },
  BOSS_DEFEATED: {
    icon: Trophy,
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10",
    borderColor: "border-yellow-400/30",
    label: "Victory!",
  },
  LEVEL_UP: {
    icon: Sparkles,
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10",
    borderColor: "border-yellow-400/30",
    label: "Level Up!",
  },
  ACHIEVEMENT: {
    icon: Trophy,
    color: "text-cyan-400",
    bgColor: "bg-cyan-400/10",
    borderColor: "border-cyan-400/30",
    label: "Achievement",
  },
  STREAK_MILESTONE: {
    icon: Heart,
    color: "text-pink-400",
    bgColor: "bg-pink-400/10",
    borderColor: "border-pink-400/30",
    label: "Streak!",
  },
  DAILY_SUMMARY: {
    icon: Book,
    color: "text-muted-foreground",
    bgColor: "bg-muted/10",
    borderColor: "border-muted/30",
    label: "Daily Log",
  },
};

function getEntryConfig(type: string) {
  return ENTRY_TYPE_CONFIG[type as keyof typeof ENTRY_TYPE_CONFIG] || ENTRY_TYPE_CONFIG.EVENT_COMPLETED;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function groupEntriesByDate(entries: StoryEntry[]) {
  const groups: { [key: string]: StoryEntry[] } = {};
  
  entries.forEach((entry) => {
    const date = new Date(entry.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let key: string;
    if (date.toDateString() === today.toDateString()) {
      key = "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = "Yesterday";
    } else {
      key = date.toLocaleDateString("en-US", { 
        weekday: "long",
        month: "long", 
        day: "numeric" 
      });
    }
    
    if (!groups[key]) groups[key] = [];
    groups[key].push(entry);
  });
  
  return groups;
}

export default function ChroniclePage() {
  const [entries, setEntries] = useState<StoryEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const fetchEntries = async (offset = 0, append = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);

      const params = new URLSearchParams({
        limit: "30",
        offset: offset.toString(),
      });

      if (filter !== "all") {
        params.set("entryType", filter);
      }

      const res = await fetch(`/api/story?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (append) {
          setEntries((prev) => [...prev, ...data.entries]);
        } else {
          setEntries(data.entries);
        }
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching story entries:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [filter]);

  const loadMore = () => {
    if (pagination?.hasMore) {
      fetchEntries(pagination.offset + pagination.limit, true);
    }
  };

  const groupedEntries = groupEntriesByDate(entries);
  const dateKeys = Object.keys(groupedEntries);

  // Calculate stats
  const totalXP = entries.reduce((sum, e) => sum + (e.xpEarned || 0), 0);
  const totalDamage = entries.reduce((sum, e) => sum + (e.bossDamage || 0), 0);
  const completedEvents = entries.filter((e) => e.entryType === "EVENT_COMPLETED").length;
  const bossesDefeated = entries.filter((e) => e.entryType === "BOSS_DEFEATED").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-mono text-xl font-bold tracking-widest text-cyan-400 neon-glow flex items-center gap-3">
            <Book size={24} /> LIFE CHRONICLE
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your hero&apos;s journey, written in the stars
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-card/60 border-green-400/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-400/10">
              <Calendar className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Quests Done</p>
              <p className="text-lg font-mono font-bold text-green-400">{completedEvents}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/60 border-cyan-400/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-400/10">
              <Sparkles className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">XP Earned</p>
              <p className="text-lg font-mono font-bold text-cyan-400">{totalXP.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/60 border-purple-400/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-400/10">
              <Swords className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Boss Damage</p>
              <p className="text-lg font-mono font-bold text-purple-400">{totalDamage.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/60 border-yellow-400/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-400/10">
              <Trophy className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Bosses Defeated</p>
              <p className="text-lg font-mono font-bold text-yellow-400">{bossesDefeated}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="flex gap-2">
          {["all", "EVENT_COMPLETED", "EVENT_MISSED", "BOSS_DEFEATED", "LEVEL_UP"].map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
              className="text-xs"
            >
              {f === "all" ? "All" : 
               f === "EVENT_COMPLETED" ? "Completed" :
               f === "EVENT_MISSED" ? "Missed" :
               f === "BOSS_DEFEATED" ? "Boss Wins" :
               "Level Ups"}
            </Button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {entries.length === 0 ? (
        <Card className="bg-card/60">
          <CardContent className="p-12 text-center">
            <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Chronicle Entries Yet</h3>
            <p className="text-muted-foreground text-sm">
              Complete events and tasks to start writing your hero&apos;s story!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {dateKeys.map((dateKey) => (
            <div key={dateKey}>
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-sm font-mono text-muted-foreground px-3">
                  {dateKey}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Entries for this date */}
              <div className="space-y-3">
                {groupedEntries[dateKey].map((entry) => {
                  const config = getEntryConfig(entry.entryType);
                  const Icon = config.icon;

                  return (
                    <Card
                      key={entry.id}
                      className={`bg-card/60 ${config.borderColor} border-l-4 hover:bg-card/80 transition-colors`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div className={`p-2 rounded-lg ${config.bgColor}`}>
                            <Icon className={`h-5 w-5 ${config.color}`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className={`text-xs font-mono ${config.color}`}>
                                {config.label}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(entry.createdAt)}
                              </span>
                            </div>
                            <h4 className="font-medium text-sm mb-1 truncate">
                              {entry.title}
                            </h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {entry.narrative}
                            </p>

                            {/* Stats Pills */}
                            {(entry.xpEarned || entry.hpChange || entry.bossDamage) && (
                              <div className="flex gap-2 mt-3">
                                {entry.xpEarned && entry.xpEarned > 0 && (
                                  <span className="text-xs px-2 py-1 rounded bg-cyan-400/10 text-cyan-400">
                                    +{entry.xpEarned} XP
                                  </span>
                                )}
                                {entry.hpChange && entry.hpChange !== 0 && (
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    entry.hpChange > 0 
                                      ? "bg-green-400/10 text-green-400" 
                                      : "bg-red-400/10 text-red-400"
                                  }`}>
                                    {entry.hpChange > 0 ? "+" : ""}{entry.hpChange} HP
                                  </span>
                                )}
                                {entry.bossDamage && entry.bossDamage > 0 && (
                                  <span className="text-xs px-2 py-1 rounded bg-purple-400/10 text-purple-400">
                                    {entry.bossDamage} Boss Damage
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Linked Event */}
                            {entry.event?.project && (
                              <div className="mt-2">
                                <span className="text-xs text-muted-foreground">
                                  Project: {entry.event.project.name}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Load More */}
          {pagination?.hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loadingMore}
                className="gap-2"
              >
                {loadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
