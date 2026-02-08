"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  LayoutList,
  LayoutGrid,
  Zap,
  CheckCircle2,
  Loader2,
} from "lucide-react";

// Task type from API
interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  areaId: string | null;
  area: { id: string; name: string } | null;
  dueDate: string | null;
  xpReward: number;
  energyCost: number;
}

interface Area {
  id: string;
  type: string;
  displayName: string;
  icon: string;
  color: string;
  sortOrder: number;
}

const STATUS_LABELS: Record<string, string> = {
  TODO: "TODO",
  IN_PROGRESS: "IN PROGRESS",
  WAITING: "WAITING",
  SOMEDAY: "SOMEDAY",
  DONE: "DONE",
};

const STATUS_COLORS: Record<string, string> = {
  TODO: "text-yellow-500 border-yellow-500/30",
  IN_PROGRESS: "text-cyan-400 border-cyan-400/30",
  WAITING: "text-pink-400 border-pink-400/30",
  SOMEDAY: "text-muted-foreground border-border",
  DONE: "text-green-500 border-green-500/30",
};

const AREA_COLORS: Record<string, string> = {
  WORK: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
  HOME: "text-pink-400 border-pink-400/30 bg-pink-400/10",
  WRITING: "text-green-400 border-green-400/30 bg-green-400/10",
  SIDE_PROJECTS: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
};

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "bg-red-500",
  HIGH: "bg-pink-500",
  MEDIUM: "bg-yellow-500",
  LOW: "bg-muted-foreground",
  NONE: "bg-border",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch tasks and areas
  useEffect(() => {
    async function fetchData() {
      try {
        const [tasksRes, areasRes] = await Promise.all([
          fetch("/api/tasks"),
          fetch("/api/areas"),
        ]);
        
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          setTasks(tasksData);
        }
        
        if (areasRes.ok) {
          const areasData = await areasRes.json();
          setAreas(areasData);
        }
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter out completed tasks and apply area filter
  const activeTasks = tasks.filter(t => t.status !== "DONE");
  const filteredTasks = filter === "all" 
    ? activeTasks 
    : activeTasks.filter((t) => t.areaId === filter);

  const groupedTasks = {
    TODO: filteredTasks.filter((t) => t.status === "TODO"),
    IN_PROGRESS: filteredTasks.filter((t) => t.status === "IN_PROGRESS"),
    WAITING: filteredTasks.filter((t) => t.status === "WAITING"),
    SOMEDAY: filteredTasks.filter((t) => t.status === "SOMEDAY"),
  };

  const totalEnergy = filteredTasks.reduce((sum, t) => sum + t.energyCost, 0);
  const potentialXP = filteredTasks.reduce((sum, t) => sum + t.xpReward, 0);

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-mono text-xl font-bold tracking-widest text-primary neon-glow-cyan">
            QUEST LOG
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredTasks.length} active quests • {totalEnergy} ⚡ total energy • {potentialXP} XP potential
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-none ${viewMode === "list" ? "bg-primary/10 text-primary" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <LayoutList size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-none ${viewMode === "board" ? "bg-primary/10 text-primary" : ""}`}
              onClick={() => setViewMode("board")}
            >
              <LayoutGrid size={14} />
            </Button>
          </div>
          <Button variant="neon" size="sm">
            <Plus size={14} />
            NEW QUEST
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "neon" : "ghost"}
          size="sm"
          onClick={() => setFilter("all")}
          className="text-xs"
        >
          All Areas
        </Button>
        {areas.map((area) => (
          <Button
            key={area.id}
            variant={filter === area.id ? "neon" : "ghost"}
            size="sm"
            onClick={() => setFilter(area.id)}
            className="text-xs"
          >
            {area.displayName}
          </Button>
        ))}
      </div>

      {/* Energy Warning */}
      {totalEnergy > 60 && (
        <Card className="border-orange-500/30 bg-orange-500/10">
          <CardContent className="p-4 flex items-center gap-3">
            <Zap size={20} className="text-orange-500" />
            <div>
              <div className="text-sm font-medium text-orange-400">Burnout Warning</div>
              <div className="text-xs text-muted-foreground">
                Your active tasks require {totalEnergy} energy. Consider redistributing to avoid burnout.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task Board View */}
      {viewMode === "board" ? (
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(groupedTasks).map(([status, statusTasks]) => (
            <div key={status} className="space-y-3">
              <div className={`flex items-center gap-2 px-2 py-1 rounded border ${STATUS_COLORS[status] || STATUS_COLORS.TODO}`}>
                <div className="text-xs font-bold tracking-widest">{STATUS_LABELS[status] || status}</div>
                <div className="text-xs opacity-60">{statusTasks.length}</div>
              </div>
              <div className="space-y-2">
                {statusTasks.map((task) => (
                  <Card key={task.id} className="py-3 hover:bg-secondary/20 cursor-pointer transition-colors">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2 mb-2">
                        <div className={`w-1 h-6 rounded-full ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.MEDIUM}`} />
                        <div className="flex-1 text-sm font-medium">{task.title}</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${AREA_COLORS[task.areaId || ""] || "text-muted-foreground border-border"}`}>
                          {task.area?.name?.toUpperCase() || "GENERAL"}
                        </span>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-yellow-500">+{task.xpReward} XP</span>
                          <span className="text-muted-foreground">⚡{task.energyCost}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Task List View */
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filteredTasks.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No quests found. Create your first quest!
                </div>
              ) : filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <button className="w-5 h-5 rounded-full border-2 border-muted-foreground hover:border-primary hover:bg-primary/20 transition-colors flex items-center justify-center">
                      <CheckCircle2 size={14} className="opacity-0 hover:opacity-100" />
                    </button>
                    <div className={`w-1 h-8 rounded-full ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.MEDIUM}`} />
                    <div>
                      <div className="text-sm font-medium">{task.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${AREA_COLORS[task.areaId || ""] || "text-muted-foreground border-border"}`}>
                          {task.area?.name?.toUpperCase() || "GENERAL"}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${STATUS_COLORS[task.status] || STATUS_COLORS.TODO}`}>
                          {STATUS_LABELS[task.status] || task.status}
                        </span>
                        {task.dueDate && (
                          <span className="text-[10px] text-muted-foreground">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-mono text-xs text-yellow-500">+{task.xpReward} XP</div>
                      <div className="text-[10px] text-muted-foreground">⚡ {task.energyCost}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
