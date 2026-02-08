"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Heart,
  Footprints,
  Moon,
  Droplets,
  Dumbbell,
  Flame,
  Plus,
  Zap,
  Smartphone,
  ChevronRight,
  Target,
  Award,
} from "lucide-react";

interface HealthLog {
  id: string;
  type: string;
  value: number;
  unit?: string;
  notes?: string;
  source: string;
  loggedAt: string;
}

interface TodayStats {
  steps: number;
  activeMinutes: number;
  sleepHours: number;
  workouts: HealthLog[];
  waterOz: number;
  calories: number;
}

// Goals for each metric
const GOALS = {
  steps: 10000,
  activeMinutes: 30,
  sleepHours: 8,
  waterOz: 64,
  calories: 2000,
  workouts: 1,
};

// XP rewards
const XP_REWARDS = {
  WORKOUT: 100,
  STEPS: 25,
  SLEEP: 50,
  WATER: 10,
  ACTIVE_MINUTES: 30,
};

export default function HealthPage() {
  const [stats, setStats] = useState<TodayStats>({
    steps: 0,
    activeMinutes: 0,
    sleepHours: 0,
    workouts: [],
    waterOz: 0,
    calories: 0,
  });
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Log form state
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [logType, setLogType] = useState<string>("");
  const [logValue, setLogValue] = useState<string>("");
  const [logNotes, setLogNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Fetch health data
  useEffect(() => {
    async function fetchHealth() {
      try {
        const res = await fetch("/api/health");
        if (res.ok) {
          const data = await res.json();
          setStats(data.today);
          setLogs(data.logs || []);
        }
      } catch (error) {
        console.error("Failed to fetch health data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchHealth();
  }, []);

  const openLogForm = (type: string) => {
    setLogType(type);
    setLogValue("");
    setLogNotes("");
    setIsLogOpen(true);
  };

  const handleSubmitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: logType,
          value: parseFloat(logValue) || 0,
          unit: getUnit(logType),
          notes: logNotes || undefined,
          source: "MANUAL",
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setSuccessMessage(data.message || "Logged successfully!");
        
        // Construct log from response
        const newLog: HealthLog = {
          id: data.id,
          type: data.type || logType,
          value: data.value ?? (parseFloat(logValue) || 0),
          unit: getUnit(logType),
          notes: logNotes || undefined,
          source: "MANUAL",
          loggedAt: new Date().toISOString(),
        };
        setLogs([newLog, ...logs]);
        
        // Update stats
        updateLocalStats(logType, parseFloat(logValue) || 0, newLog);
        
        // Close after showing message
        setTimeout(() => {
          setIsLogOpen(false);
          setSuccessMessage("");
        }, 1500);
      }
    } catch (error) {
      console.error("Failed to log:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateLocalStats = (type: string, value: number, log: HealthLog) => {
    setStats(prev => {
      const updated = { ...prev };
      if (type === "STEPS") updated.steps += value;
      if (type === "ACTIVE_MINUTES") updated.activeMinutes += value;
      if (type === "SLEEP") updated.sleepHours += value;
      if (type === "WATER") updated.waterOz += value;
      if (type === "CALORIES") updated.calories += value;
      if (type === "WORKOUT") updated.workouts = [log, ...updated.workouts];
      return updated;
    });
  };

  const getUnit = (type: string): string => {
    const units: Record<string, string> = {
      STEPS: "steps",
      ACTIVE_MINUTES: "minutes",
      SLEEP: "hours",
      WATER: "oz",
      CALORIES: "kcal",
      WORKOUT: "session",
      WEIGHT: "lbs",
      HEART_RATE: "bpm",
    };
    return units[type] || "";
  };

  const getPlaceholder = (type: string): string => {
    const placeholders: Record<string, string> = {
      STEPS: "e.g., 5000",
      ACTIVE_MINUTES: "e.g., 30",
      SLEEP: "e.g., 7.5",
      WATER: "e.g., 8",
      CALORIES: "e.g., 500",
      WORKOUT: "Duration in minutes",
      WEIGHT: "e.g., 150",
    };
    return placeholders[type] || "Enter value";
  };

  const calculateProgress = (current: number, goal: number): number => {
    return Math.min((current / goal) * 100, 100);
  };

  // Quick log buttons for common entries
  const QuickLog = ({ type, amount, label, icon: Icon }: {
    type: string;
    amount: number;
    label: string;
    icon: React.ElementType;
  }) => (
    <Button
      variant="outline"
      size="sm"
      className="flex-1"
      onClick={async () => {
        const res = await fetch("/api/health", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, value: amount, source: "MANUAL" }),
        });
        if (res.ok) {
          const data = await res.json();
          // Construct log from response
          const newLog: HealthLog = {
            id: data.id,
            type: data.type || type,
            value: data.value ?? amount,
            source: "MANUAL",
            loggedAt: new Date().toISOString(),
          };
          setLogs(prev => [newLog, ...prev]);
          updateLocalStats(type, amount, newLog);
        }
      }}
    >
      <Icon size={14} className="mr-1" />
      {label}
    </Button>
  );

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-[80vh]">
        <div className="animate-pulse text-muted-foreground">Loading health data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-mono text-xl font-bold tracking-widest text-pink-400 neon-glow flex items-center gap-3">
            <Heart size={24} /> VITALS HUB
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your health stats to boost your character
          </p>
        </div>
        <Button onClick={() => openLogForm("WORKOUT")}>
          <Plus size={14} className="mr-2" />
          Log Activity
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="log">Activity Log</TabsTrigger>
          <TabsTrigger value="shortcuts">iOS Shortcuts</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 mt-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Steps */}
            <Card className="hover:border-cyan-500/50 transition-colors cursor-pointer" onClick={() => openLogForm("STEPS")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Footprints className="text-cyan-400" size={20} />
                  <span className="text-xs text-muted-foreground">Goal: {GOALS.steps.toLocaleString()}</span>
                </div>
                <div className="text-2xl font-bold font-mono">{stats.steps.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">steps</div>
                <Progress value={calculateProgress(stats.steps, GOALS.steps)} className="mt-2 h-1" />
              </CardContent>
            </Card>

            {/* Active Minutes */}
            <Card className="hover:border-green-500/50 transition-colors cursor-pointer" onClick={() => openLogForm("ACTIVE_MINUTES")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Flame className="text-green-400" size={20} />
                  <span className="text-xs text-muted-foreground">Goal: {GOALS.activeMinutes} min</span>
                </div>
                <div className="text-2xl font-bold font-mono">{stats.activeMinutes}</div>
                <div className="text-xs text-muted-foreground">active minutes</div>
                <Progress value={calculateProgress(stats.activeMinutes, GOALS.activeMinutes)} className="mt-2 h-1" />
              </CardContent>
            </Card>

            {/* Sleep */}
            <Card className="hover:border-purple-500/50 transition-colors cursor-pointer" onClick={() => openLogForm("SLEEP")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Moon className="text-purple-400" size={20} />
                  <span className="text-xs text-muted-foreground">Goal: {GOALS.sleepHours}h</span>
                </div>
                <div className="text-2xl font-bold font-mono">{stats.sleepHours.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">hours sleep</div>
                <Progress value={calculateProgress(stats.sleepHours, GOALS.sleepHours)} className="mt-2 h-1" />
              </CardContent>
            </Card>

            {/* Water */}
            <Card className="hover:border-blue-500/50 transition-colors cursor-pointer" onClick={() => openLogForm("WATER")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Droplets className="text-blue-400" size={20} />
                  <span className="text-xs text-muted-foreground">Goal: {GOALS.waterOz} oz</span>
                </div>
                <div className="text-2xl font-bold font-mono">{stats.waterOz}</div>
                <div className="text-xs text-muted-foreground">oz water</div>
                <Progress value={calculateProgress(stats.waterOz, GOALS.waterOz)} className="mt-2 h-1" />
              </CardContent>
            </Card>

            {/* Workouts */}
            <Card className="hover:border-orange-500/50 transition-colors cursor-pointer" onClick={() => openLogForm("WORKOUT")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Dumbbell className="text-orange-400" size={20} />
                  <span className="text-xs text-yellow-400 flex items-center gap-1">
                    <Zap size={12} /> +{XP_REWARDS.WORKOUT} XP
                  </span>
                </div>
                <div className="text-2xl font-bold font-mono">{stats.workouts.length}</div>
                <div className="text-xs text-muted-foreground">workouts today</div>
                <Progress value={calculateProgress(stats.workouts.length, GOALS.workouts)} className="mt-2 h-1" />
              </CardContent>
            </Card>

            {/* Calories */}
            <Card className="hover:border-red-500/50 transition-colors cursor-pointer" onClick={() => openLogForm("CALORIES")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Flame className="text-red-400" size={20} />
                  <span className="text-xs text-muted-foreground">Goal: {GOALS.calories}</span>
                </div>
                <div className="text-2xl font-bold font-mono">{stats.calories.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">calories burned</div>
                <Progress value={calculateProgress(stats.calories, GOALS.calories)} className="mt-2 h-1" />
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-mono">QUICK LOG</CardTitle>
              <CardDescription>Tap to quickly log common activities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <QuickLog type="WATER" amount={8} label="+8 oz Water" icon={Droplets} />
                <QuickLog type="STEPS" amount={1000} label="+1K Steps" icon={Footprints} />
                <QuickLog type="ACTIVE_MINUTES" amount={15} label="+15 min" icon={Flame} />
              </div>
            </CardContent>
          </Card>

          {/* XP Rewards Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <Award size={16} className="text-yellow-400" />
                HEALTH XP REWARDS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Dumbbell size={14} className="text-orange-400" />
                  <span>Workout: <span className="text-yellow-400">+100 XP</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <Moon size={14} className="text-purple-400" />
                  <span>7+ hrs sleep: <span className="text-yellow-400">+50 XP</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <Flame size={14} className="text-green-400" />
                  <span>Active mins: <span className="text-yellow-400">+30 XP</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <Target size={14} className="text-cyan-400" />
                  <span>Step goal: <span className="text-yellow-400">+25 XP</span></span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="log" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-mono">ACTIVITY LOG</CardTitle>
              <CardDescription>Your health activities from today</CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No activities logged today. Start tracking!
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.filter((log): log is HealthLog => log != null).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          {log.type === "STEPS" && <Footprints size={16} className="text-cyan-400" />}
                          {log.type === "WORKOUT" && <Dumbbell size={16} className="text-orange-400" />}
                          {log.type === "SLEEP" && <Moon size={16} className="text-purple-400" />}
                          {log.type === "WATER" && <Droplets size={16} className="text-blue-400" />}
                          {log.type === "ACTIVE_MINUTES" && <Flame size={16} className="text-green-400" />}
                          {log.type === "CALORIES" && <Flame size={16} className="text-red-400" />}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{log.type.replace("_", " ")}</div>
                          <div className="text-xs text-muted-foreground">{log.notes || log.source}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold">{log.value} {log.unit}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(log.loggedAt).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shortcuts" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="text-blue-400" />
                  iOS Shortcuts Setup
                </CardTitle>
                <CardDescription>
                  Automatically sync your Apple Health data using iOS Shortcuts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">How it works:</h3>
                  <ol className="text-sm text-muted-foreground space-y-2">
                    <li className="flex gap-2">
                      <span className="text-primary font-mono">1.</span>
                      Create an iOS Shortcut that reads data from Apple Health
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary font-mono">2.</span>
                      The Shortcut sends the data to our API endpoint
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary font-mono">3.</span>
                      Set up automation to run daily (or on-demand)
                    </li>
                  </ol>
                </div>

                <div className="space-y-3">
                  <h3 className="font-medium">API Endpoint:</h3>
                  <div className="bg-black/50 p-3 rounded font-mono text-sm break-all">
                    POST {typeof window !== "undefined" ? window.location.origin : ""}/api/health
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-medium">Request Body (JSON):</h3>
                  <pre className="bg-black/50 p-3 rounded font-mono text-xs overflow-x-auto">
{`{
  "source": "IOS_SHORTCUT",
  "entries": [
    { "type": "STEPS", "value": 8500 },
    { "type": "SLEEP", "value": 7.5 },
    { "type": "ACTIVE_MINUTES", "value": 45 },
    { "type": "WORKOUT", "value": 1, "notes": "Morning Run" }
  ]
}`}
                  </pre>
                </div>

                <div className="space-y-3">
                  <h3 className="font-medium">Supported Types:</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <ChevronRight size={12} /> STEPS
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight size={12} /> SLEEP
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight size={12} /> ACTIVE_MINUTES
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight size={12} /> WORKOUT
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight size={12} /> WATER
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight size={12} /> CALORIES
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight size={12} /> HEART_RATE
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight size={12} /> WEIGHT
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-3">Quick Setup Steps:</h3>
                  <ol className="text-sm space-y-3">
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">1</div>
                      <div>
                        <p className="font-medium">Open Shortcuts app on iPhone</p>
                        <p className="text-muted-foreground text-xs">Create a new shortcut</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">2</div>
                      <div>
                        <p className="font-medium">Add &quot;Find Health Samples&quot; action</p>
                        <p className="text-muted-foreground text-xs">Select Step Count, Sleep Analysis, etc.</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">3</div>
                      <div>
                        <p className="font-medium">Add &quot;Get Contents of URL&quot; action</p>
                        <p className="text-muted-foreground text-xs">Method: POST, Body: JSON with the health data</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">4</div>
                      <div>
                        <p className="font-medium">Set up Automation (optional)</p>
                        <p className="text-muted-foreground text-xs">Run daily at a specific time</p>
                      </div>
                    </li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Log Entry Dialog */}
      <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Log {logType ? logType.replace("_", " ").toLowerCase() : "Activity"}
            </DialogTitle>
            <DialogDescription>
              {logType === "WORKOUT" && "Earn +100 XP for logging a workout!"}
              {logType === "SLEEP" && "Get +50 XP for 7+ hours of sleep!"}
              {logType === "ACTIVE_MINUTES" && "Earn +30 XP for active minutes!"}
              {!["WORKOUT", "SLEEP", "ACTIVE_MINUTES"].includes(logType) && "Track your progress"}
            </DialogDescription>
          </DialogHeader>
          
          {successMessage ? (
            <div className="py-8 text-center">
              <div className="text-green-400 text-lg font-bold mb-2">✓ Logged!</div>
              <div className="text-yellow-400">{successMessage}</div>
            </div>
          ) : (
            <form onSubmit={handleSubmitLog} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Activity Type</Label>
                <Select value={logType} onValueChange={setLogType}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WORKOUT">Workout</SelectItem>
                    <SelectItem value="STEPS">Steps</SelectItem>
                    <SelectItem value="SLEEP">Sleep</SelectItem>
                    <SelectItem value="WATER">Water</SelectItem>
                    <SelectItem value="ACTIVE_MINUTES">Active Minutes</SelectItem>
                    <SelectItem value="CALORIES">Calories Burned</SelectItem>
                    <SelectItem value="WEIGHT">Weight</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">Value ({getUnit(logType) || "amount"})</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.1"
                  value={logValue}
                  onChange={(e) => setLogValue(e.target.value)}
                  placeholder={getPlaceholder(logType)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder="e.g., Morning run, yoga session..."
                  rows={2}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsLogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Logging..." : "Log Activity"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
