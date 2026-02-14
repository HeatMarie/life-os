"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  LayoutList,
  LayoutGrid,
  Zap,
  CheckCircle2,
  Loader2,
  GripVertical,
  Columns3,
  Pencil,
  Trash2,
  FolderPlus,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Task type from API
interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  type: string;
  areaId: string | null;
  area: { id: string; displayName: string; type: string } | null;
  projectId: string | null;
  project: { id: string; name: string; boss?: { name: string; hp: number; maxHp: number } | null } | null;
  bucketId: string | null;
  bucket: Bucket | null;
  startsAt: string | null;
  dueDate: string | null;
  xpReward: number;
  energyCost: number;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  areaId: string;
  area: { id: string; displayName: string; type: string } | null;
  boss: { id: string; name: string; hp: number; maxHp: number; status: string } | null;
  _count?: { tasks: number };
}

interface Bucket {
  id: string;
  name: string;
  color: string | null;
  sortOrder: number;
  isDefault: boolean;
  _count?: { tasks: number };
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

const TASK_TYPES: Record<string, { label: string; icon: string }> = {
  DEEP_WORK: { label: "Deep Work", icon: "🧠" },
  MEETING: { label: "Meeting", icon: "📅" },
  APPOINTMENT: { label: "Appointment", icon: "🏥" },
  SOCIAL: { label: "Social", icon: "👥" },
  ERRAND: { label: "Errand", icon: "🏃" },
  ROUTINE: { label: "Routine", icon: "🔄" },
  ADMIN: { label: "Admin", icon: "📋" },
  CREATIVE: { label: "Creative", icon: "🎨" },
  LEARNING: { label: "Learning", icon: "📚" },
  OTHER: { label: "Other", icon: "📌" },
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  const [isLoading, setIsLoading] = useState(true);
  const [newBucketName, setNewBucketName] = useState("");
  const [newBucketColor, setNewBucketColor] = useState("#06b6d4");
  const [isAddingBucket, setIsAddingBucket] = useState(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverBucket, setDragOverBucket] = useState<string | null>(null);
  
  // Task form state
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    type: "OTHER",
    areaId: "",
    projectId: "",
    bucketId: "",
    startsAt: "",
    dueDate: "",
  });
  const [isSavingTask, setIsSavingTask] = useState(false);
  
  // Project form state
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    areaId: "",
    targetDate: "",
    createBoss: true,
    bossName: "",
  });
  const [isSavingProject, setIsSavingProject] = useState(false);

  // Fetch tasks, areas, buckets, and projects
  const fetchData = useCallback(async () => {
    try {
      const [tasksRes, areasRes, bucketsRes, projectsRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/areas"),
        fetch("/api/buckets"),
        fetch("/api/projects"),
      ]);
      
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData);
      }
      
      if (areasRes.ok) {
        const areasData = await areasRes.json();
        setAreas(areasData);
      }
      
      if (bucketsRes.ok) {
        const bucketsData = await bucketsRes.json();
        setBuckets(bucketsData);
      }
      
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle drag and drop for tasks between buckets
  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverBucket(null);
  };

  const handleDragOver = (e: React.DragEvent, bucketId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverBucket !== bucketId) {
      setDragOverBucket(bucketId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only clear if leaving the bucket entirely (not entering a child)
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!e.currentTarget.contains(relatedTarget)) {
      setDragOverBucket(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, bucketId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverBucket(null);
    
    if (!draggedTask || draggedTask.bucketId === bucketId) {
      setDraggedTask(null);
      return;
    }

    // Check if dropping into "Done" bucket - trigger completion
    const targetBucket = buckets.find((b) => b.id === bucketId);
    const isDoneBucket = targetBucket?.name === "Done";

    if (isDoneBucket && draggedTask.status !== "DONE") {
      // Optimistically update UI immediately
      setTasks((prev) => prev.map((t) => 
        t.id === draggedTask.id 
          ? { ...t, status: "DONE", bucketId }
          : t
      ));
      
      // Complete the task and move it to Done bucket
      try {
        const res = await fetch(`/api/tasks/${draggedTask.id}/complete`, {
          method: "POST",
        });
        if (res.ok) {
          // Also update the bucketId in the backend
          await fetch(`/api/tasks/${draggedTask.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bucketId }),
          });
        } else {
          // Revert on error
          fetchData();
        }
      } catch (error) {
        console.error("Failed to complete task:", error);
        fetchData(); // Revert on error
      }
      setDraggedTask(null);
      return;
    }

    // Optimistically update UI
    setTasks((prev) =>
      prev.map((t) =>
        t.id === draggedTask.id ? { ...t, bucketId } : t
      )
    );

    // Update task in the backend
    try {
      await fetch(`/api/tasks/${draggedTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucketId }),
      });
    } catch (error) {
      console.error("Failed to update task:", error);
      fetchData(); // Revert on error
    }

    setDraggedTask(null);
  };

  // Add new bucket
  const handleAddBucket = async () => {
    if (!newBucketName.trim()) return;

    setIsAddingBucket(true);
    try {
      const res = await fetch("/api/buckets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newBucketName.trim(),
          color: newBucketColor,
        }),
      });

      if (res.ok) {
        const newBucket = await res.json();
        setBuckets((prev) => [...prev, newBucket]);
        setNewBucketName("");
      }
    } catch (error) {
      console.error("Failed to create bucket:", error);
    } finally {
      setIsAddingBucket(false);
    }
  };

  // Complete task
  const handleCompleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/complete`, {
        method: "POST",
      });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      }
    } catch (error) {
      console.error("Failed to complete task:", error);
    }
  };

  // Open task dialog for creating new task
  const handleNewTask = () => {
    setEditingTask(null);
    const defaultBucket = buckets.find((b) => b.name === "To Do");
    setTaskForm({
      title: "",
      description: "",
      priority: "MEDIUM",
      type: "OTHER",
      areaId: areas[0]?.id || "",
      projectId: "",
      bucketId: defaultBucket?.id || "",
      startsAt: "",
      dueDate: "",
    });
    setIsTaskDialogOpen(true);
  };

  // Open task dialog for editing
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      type: task.type || "OTHER",
      areaId: task.areaId || "",
      projectId: task.projectId || "",
      bucketId: task.bucketId || "",
      startsAt: task.startsAt ? task.startsAt.split("T")[0] : "",
      dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
    });
    setIsTaskDialogOpen(true);
  };

  // Save task (create or update)
  const handleSaveTask = async () => {
    if (!taskForm.title.trim() || !taskForm.areaId) return;

    setIsSavingTask(true);
    try {
      if (editingTask) {
        // Update existing task
        const res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: taskForm.title,
            description: taskForm.description || null,
            priority: taskForm.priority,
            type: taskForm.type,
            areaId: taskForm.areaId,
            projectId: taskForm.projectId || null,
            bucketId: taskForm.bucketId || null,
            startsAt: taskForm.startsAt || null,
            dueDate: taskForm.dueDate || null,
          }),
        });
        if (res.ok) {
          await fetchData();
        }
      } else {
        // Create new task
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: taskForm.title,
            description: taskForm.description || null,
            priority: taskForm.priority,
            type: taskForm.type,
            areaId: taskForm.areaId,
            projectId: taskForm.projectId || null,
            bucketId: taskForm.bucketId || null,
            startsAt: taskForm.startsAt || null,
            dueDate: taskForm.dueDate || null,
          }),
        });
        if (res.ok) {
          await fetchData();
        }
      }
      setIsTaskDialogOpen(false);
    } catch (error) {
      console.error("Failed to save task:", error);
    } finally {
      setIsSavingTask(false);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        setIsTaskDialogOpen(false);
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  // Create project
  const handleSaveProject = async () => {
    if (!projectForm.name.trim() || !projectForm.areaId) return;

    setIsSavingProject(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectForm.name,
          description: projectForm.description || null,
          areaId: projectForm.areaId,
          targetDate: projectForm.targetDate || null,
          createBoss: projectForm.createBoss,
          bossName: projectForm.bossName || null,
        }),
      });
      if (res.ok) {
        const newProject = await res.json();
        setProjects((prev) => [...prev, newProject]);
        setIsProjectDialogOpen(false);
        setProjectForm({
          name: "",
          description: "",
          areaId: "",
          targetDate: "",
          createBoss: true,
          bossName: "",
        });
      }
    } catch (error) {
      console.error("Failed to create project:", error);
    } finally {
      setIsSavingProject(false);
    }
  };

  // Find the Done bucket
  const doneBucket = buckets.find(b => b.name === "Done");
  
  // Filter tasks - keep completed tasks visible in board view for Done bucket
  const activeTasks = tasks.filter(t => t.status !== "DONE");
  const completedTasks = tasks.filter(t => t.status === "DONE");
  
  const filteredActiveTasks = filter === "all" 
    ? activeTasks 
    : activeTasks.filter((t) => t.areaId === filter);
  
  const filteredCompletedTasks = filter === "all"
    ? completedTasks
    : completedTasks.filter((t) => t.areaId === filter);

  // Group tasks by bucket for board view
  // Done bucket shows ALL completed tasks, other buckets show active tasks
  const tasksByBucket = buckets.reduce((acc, bucket) => {
    if (bucket.id === doneBucket?.id) {
      // Done bucket shows ALL completed tasks (regardless of their original bucketId)
      acc[bucket.id] = filteredCompletedTasks;
    } else {
      // Other buckets show active tasks assigned to them
      acc[bucket.id] = filteredActiveTasks.filter((t) => t.bucketId === bucket.id);
    }
    return acc;
  }, {} as Record<string, Task[]>);

  // Tasks without a bucket (only active tasks)
  const unassignedTasks = filteredActiveTasks.filter((t) => !t.bucketId);
  
  // For list view, use active tasks only
  const filteredTasks = filteredActiveTasks;

  // Legacy status grouping for backwards compatibility
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
          <Button variant="ghost" size="sm" onClick={() => setIsProjectDialogOpen(true)}>
            <FolderPlus size={14} />
            NEW PROJECT
          </Button>
          <Button variant="neon" size="sm" onClick={handleNewTask}>
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

      {/* Task Board View - Kanban with Buckets */}
      {viewMode === "board" ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {/* Bucket columns */}
          {buckets.map((bucket) => (
            <div
              key={bucket.id}
              className={`flex-shrink-0 w-72 space-y-3 transition-all ${
                dragOverBucket === bucket.id ? 'ring-2 ring-primary/50 rounded-lg' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, bucket.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, bucket.id)}
            >
              {/* Bucket header */}
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded border border-border bg-secondary/30"
                style={{ borderLeftColor: bucket.color || undefined, borderLeftWidth: bucket.color ? 3 : 1 }}
              >
                <Columns3 size={14} className="text-muted-foreground" />
                <div className="text-xs font-bold tracking-widest flex-1">{bucket.name.toUpperCase()}</div>
                <div className="text-xs text-muted-foreground">{tasksByBucket[bucket.id]?.length || 0}</div>
              </div>
              
              {/* Tasks in bucket */}
              <div 
                className={`space-y-2 min-h-[100px] p-2 rounded border border-dashed transition-colors ${
                  dragOverBucket === bucket.id 
                    ? 'bg-primary/10 border-primary/50' 
                    : 'bg-secondary/10 border-border/50'
                }`}
                onDragOver={(e) => handleDragOver(e, bucket.id)}
                onDrop={(e) => handleDrop(e, bucket.id)}
              >
                {(tasksByBucket[bucket.id] || []).map((task) => (
                  <Card 
                    key={task.id} 
                    className="py-3 hover:bg-secondary/20 cursor-grab transition-colors"
                    draggable
                    onDragStart={() => handleDragStart(task)}
                    onDragEnd={handleDragEnd}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2 mb-2">
                        <GripVertical size={12} className="text-muted-foreground mt-1 flex-shrink-0" />
                        <div className={`w-1 h-6 rounded-full flex-shrink-0 ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.MEDIUM}`} />
                        <div className="flex-1 text-sm font-medium">{task.title}</div>
                      </div>
                      <div className="flex items-center justify-between pl-5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${AREA_COLORS[task.area?.type || ""] || "text-muted-foreground border-border"}`}>
                          {task.area?.displayName?.toUpperCase() || "GENERAL"}
                        </span>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-yellow-500">+{task.xpReward} XP</span>
                          <span className="text-muted-foreground">⚡{task.energyCost}</span>
                        </div>
                      </div>
                      {/* Boss indicator */}
                      {task.project?.boss && (
                        <div className="mt-2 pl-5 flex items-center gap-1 text-[10px] text-pink-400">
                          <span>💀</span>
                          <span>{task.project.boss.name}</span>
                          <span className="text-muted-foreground">({task.project.boss.hp}/{task.project.boss.maxHp} HP)</span>
                        </div>
                      )}
                      {/* Date display */}
                      {(task.startsAt || task.dueDate) && (
                        <div className="mt-1 pl-5 text-[10px] text-muted-foreground">
                          {task.startsAt && <span>Start: {new Date(task.startsAt).toLocaleDateString()}</span>}
                          {task.startsAt && task.dueDate && <span> → </span>}
                          {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {(tasksByBucket[bucket.id] || []).length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    Drop quests here
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Unassigned tasks column */}
          {unassignedTasks.length > 0 && (
            <div className="flex-shrink-0 w-72 space-y-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded border border-dashed border-yellow-500/50 bg-yellow-500/10">
                <Columns3 size={14} className="text-yellow-500" />
                <div className="text-xs font-bold tracking-widest flex-1 text-yellow-500">UNASSIGNED</div>
                <div className="text-xs text-yellow-500">{unassignedTasks.length}</div>
              </div>
              <div className="space-y-2 min-h-[100px] p-2 rounded bg-secondary/10 border border-dashed border-border/50">
                {unassignedTasks.map((task) => (
                  <Card 
                    key={task.id} 
                    className="py-3 hover:bg-secondary/20 cursor-grab transition-colors border-yellow-500/30"
                    draggable
                    onDragStart={() => handleDragStart(task)}
                    onDragEnd={handleDragEnd}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2 mb-2">
                        <GripVertical size={12} className="text-muted-foreground mt-1 flex-shrink-0" />
                        <div className={`w-1 h-6 rounded-full flex-shrink-0 ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.MEDIUM}`} />
                        <div className="flex-1 text-sm font-medium">{task.title}</div>
                      </div>
                      <div className="flex items-center justify-between pl-5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${AREA_COLORS[task.area?.type || ""] || "text-muted-foreground border-border"}`}>
                          {task.area?.displayName?.toUpperCase() || "GENERAL"}
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
          )}

          {/* Add New Bucket */}
          <div className="flex-shrink-0 w-72">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" className="w-full h-10 border border-dashed border-border hover:border-primary">
                  <Plus size={14} className="mr-2" />
                  Add Column
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Column</DialogTitle>
                  <DialogDescription>Create a custom column to organize your quests.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="bucketName">Column Name</Label>
                    <Input
                      id="bucketName"
                      value={newBucketName}
                      onChange={(e) => setNewBucketName(e.target.value)}
                      placeholder="e.g., In Review, Blocked..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bucketColor">Color</Label>
                    <div className="flex gap-2">
                      {["#06b6d4", "#22c55e", "#eab308", "#ec4899", "#a855f7", "#ef4444"].map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-8 h-8 rounded-full border-2 transition-all ${newBucketColor === color ? "border-white scale-110" : "border-transparent"}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewBucketColor(color)}
                        />
                      ))}
                    </div>
                  </div>
                  <Button 
                    onClick={handleAddBucket} 
                    disabled={isAddingBucket || !newBucketName.trim()}
                    className="w-full"
                  >
                    {isAddingBucket ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Column"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
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
                    <button 
                      onClick={() => handleCompleteTask(task.id)}
                      className="w-5 h-5 rounded-full border-2 border-muted-foreground hover:border-green-500 hover:bg-green-500/20 transition-colors flex items-center justify-center group"
                    >
                      <CheckCircle2 size={14} className="opacity-0 group-hover:opacity-100 text-green-500" />
                    </button>
                    <div className={`w-1 h-8 rounded-full ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.MEDIUM}`} />
                    <div>
                      <div className="text-sm font-medium">{task.title}</div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${AREA_COLORS[task.area?.type || ""] || "text-muted-foreground border-border"}`}>
                          {task.area?.displayName?.toUpperCase() || "GENERAL"}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${STATUS_COLORS[task.status] || STATUS_COLORS.TODO}`}>
                          {STATUS_LABELS[task.status] || task.status}
                        </span>
                        {task.bucket && (
                          <span 
                            className="text-[10px] px-1.5 py-0.5 rounded border"
                            style={{ borderColor: task.bucket.color || undefined, color: task.bucket.color || undefined }}
                          >
                            {task.bucket.name}
                          </span>
                        )}
                        {task.project?.boss && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded border border-pink-500/30 text-pink-400">
                            💀 {task.project.boss.name}
                          </span>
                        )}
                        {task.startsAt && (
                          <span className="text-[10px] text-muted-foreground">
                            Start: {new Date(task.startsAt).toLocaleDateString()}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className="text-[10px] text-muted-foreground">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => handleEditTask(task)}>
                      <Pencil size={12} />
                    </Button>
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

      {/* Task Create/Edit Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Quest" : "New Quest"}</DialogTitle>
            <DialogDescription>
              {editingTask ? "Update your quest details." : "Create a new quest to earn XP and defeat bosses."}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="taskTitle">Title</Label>
              <Input
                id="taskTitle"
                value={taskForm.title}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="What needs to be done?"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="taskDescription">Description</Label>
              <Textarea
                id="taskDescription"
                value={taskForm.description}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Add more details..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Area</Label>
                <Select
                  value={taskForm.areaId}
                  onValueChange={(value) => setTaskForm((prev) => ({ ...prev, areaId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select area" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.icon} {area.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Priority</Label>
                <Select
                  value={taskForm.priority}
                  onValueChange={(value) => setTaskForm((prev) => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="URGENT">🔴 Urgent</SelectItem>
                    <SelectItem value="HIGH">🟠 High</SelectItem>
                    <SelectItem value="MEDIUM">🟡 Medium</SelectItem>
                    <SelectItem value="LOW">🔵 Low</SelectItem>
                    <SelectItem value="NONE">⚪ None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select
                value={taskForm.type}
                onValueChange={(value) => setTaskForm((prev) => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_TYPES).map(([key, { label, icon }]) => (
                    <SelectItem key={key} value={key}>
                      {icon} {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Project (Boss)</Label>
                <Select
                  value={taskForm.projectId || "none"}
                  onValueChange={(value) => setTaskForm((prev) => ({ ...prev, projectId: value === "none" ? "" : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.boss ? "💀 " : ""}{project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Column</Label>
                <Select
                  value={taskForm.bucketId}
                  onValueChange={(value) => setTaskForm((prev) => ({ ...prev, bucketId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {buckets.map((bucket) => (
                      <SelectItem key={bucket.id} value={bucket.id}>
                        {bucket.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="taskStartsAt">Start Date</Label>
                <Input
                  id="taskStartsAt"
                  type="date"
                  value={taskForm.startsAt}
                  onChange={(e) => setTaskForm((prev) => ({ ...prev, startsAt: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="taskDueDate">Due Date</Label>
                <Input
                  id="taskDueDate"
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-between pt-1">
              {editingTask && (
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteTask(editingTask.id)}
                >
                  <Trash2 size={14} className="mr-2" />
                  Delete
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="ghost" onClick={() => setIsTaskDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveTask}
                  disabled={isSavingTask || !taskForm.title.trim() || !taskForm.areaId}
                >
                  {isSavingTask ? <Loader2 className="w-4 h-4 animate-spin" /> : editingTask ? "Save" : "Create"}
                </Button>
              </div>
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>

      {/* Project Create Dialog */}
      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
            <DialogDescription>
              Create a project to group related quests. Optionally add a boss to defeat!
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                value={projectForm.name}
                onChange={(e) => setProjectForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Website Redesign"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="projectDescription">Description</Label>
              <Textarea
                id="projectDescription"
                value={projectForm.description}
                onChange={(e) => setProjectForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="What's this project about?"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Area</Label>
                <Select
                  value={projectForm.areaId}
                  onValueChange={(value) => setProjectForm((prev) => ({ ...prev, areaId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select area" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.icon} {area.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="projectTargetDate">Target Date</Label>
                <Input
                  id="projectTargetDate"
                  type="date"
                  value={projectForm.targetDate}
                  onChange={(e) => setProjectForm((prev) => ({ ...prev, targetDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2 p-2 rounded-lg border border-pink-500/30 bg-pink-500/5">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="createBoss"
                  checked={projectForm.createBoss}
                  onChange={(e) => setProjectForm((prev) => ({ ...prev, createBoss: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="createBoss" className="text-pink-400">
                  💀 Create Boss for this project
                </Label>
              </div>
              {projectForm.createBoss && (
                <div className="space-y-1">
                  <Label htmlFor="bossName">Boss Name</Label>
                  <Input
                    id="bossName"
                    value={projectForm.bossName}
                    onChange={(e) => setProjectForm((prev) => ({ ...prev, bossName: e.target.value }))}
                    placeholder={`THE ${projectForm.name.toUpperCase() || "BOSS"}`}
                  />
                  <p className="text-xs text-muted-foreground">
                    Each quest added to this project increases boss HP. Complete quests to deal damage!
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsProjectDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveProject}
                disabled={isSavingProject || !projectForm.name.trim() || !projectForm.areaId}
              >
                {isSavingProject ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Project"}
              </Button>
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}
