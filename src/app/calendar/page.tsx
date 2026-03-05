"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CloudOff,
  Loader2,
  MapPin,
  Trash2,
  Edit,
  X,
  Zap,
  CheckCircle,
  Bell,
  Target,
  XCircle,
  Swords,
  Download,
} from "lucide-react";

// Types
type ViewMode = "day" | "week" | "month";
type EventType = "ACTION_ITEM" | "REMINDER";
type EventStatus = "SCHEDULED" | "COMPLETED" | "CANCELED_BY_SELF" | "CANCELED_BY_OTHER" | "MISSED" | "RESCHEDULED";

interface Project {
  id: string;
  name: string;
  boss?: { id: string; name: string; hp: number; maxHp: number } | null;
}

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  areaId?: string;
  area?: {
    id: string;
    displayName: string;
    color: string;
  };
  calendarId?: string;
  calendarName?: string;
  calendarColor?: string;
  googleEventId?: string;
  isFromGoogle?: boolean;
  // Game fields
  eventType?: EventType;
  status?: EventStatus;
  projectId?: string;
  project?: Project | null;
  xpEarned?: number;
  hpPenalty?: number;
  bossDamage?: number;
  // Task connection
  taskId?: string;
  xpReward?: number;
}

interface Area {
  id: string;
  displayName: string;
  color: string;
}

interface GoogleCalendar {
  id: string;
  summary: string;
  backgroundColor: string;
  primary: boolean;
}

const HOURS = Array.from({ length: 18 }, (_, i) => i + 5); // 5 AM to 11 PM
const TIME_SLOTS = Array.from({ length: 37 }, (_, i) => ({ hour: Math.floor(i / 2) + 5, minute: (i % 2) * 30 })); // 5:00 to 11:00 PM every 30 min

// Helper functions
function getWeekDays(date: Date): Date[] {
  const start = new Date(date);
  const day = start.getDay();
  start.setDate(start.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function getMonthDays(date: Date): Date[] {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const startDay = start.getDay();
  const result: Date[] = [];
  
  // Add previous month days
  for (let i = startDay - 1; i >= 0; i--) {
    const d = new Date(start);
    d.setDate(d.getDate() - i - 1);
    result.push(d);
  }
  
  // Add current month days
  for (let i = 1; i <= end.getDate(); i++) {
    result.push(new Date(date.getFullYear(), date.getMonth(), i));
  }
  
  // Add next month days to complete grid (6 rows)
  while (result.length < 42) {
    const d = new Date(result[result.length - 1]);
    d.setDate(d.getDate() + 1);
    result.push(d);
  }
  
  return result;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Use local date (not UTC) for date input values
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTimeInput(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

// Get user's timezone for API requests
function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// ─── Overlap layout utility ─────────────────────────────────────────────────
// Assigns column index + total columns to each event so they tile side-by-side
// instead of stacking on top of one another.
interface LayoutSlot {
  event: CalendarEvent;
  col: number;
  totalCols: number;
}

function layoutOverlappingEvents(events: CalendarEvent[]): LayoutSlot[] {
  if (events.length === 0) return [];

  // Separate all-day from timed events
  const timed = events
    .filter((e) => !e.allDay)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  const slots: LayoutSlot[] = [];

  // Group overlapping events into clusters.
  // Use a visual buffer (15 min) so back-to-back or nearly-adjacent events
  // get placed side-by-side instead of rendering on top of each other.
  const VISUAL_BUFFER_MS = 15 * 60 * 1000; // 15 minutes
  const clusters: CalendarEvent[][] = [];
  let currentCluster: CalendarEvent[] = [];
  let clusterEnd = -Infinity;

  for (const ev of timed) {
    const start = new Date(ev.startsAt).getTime();
    const end = new Date(ev.endsAt).getTime();

    if (start < clusterEnd + VISUAL_BUFFER_MS) {
      // Overlaps or nearly touches the current cluster
      currentCluster.push(ev);
      clusterEnd = Math.max(clusterEnd, end);
    } else {
      if (currentCluster.length > 0) clusters.push(currentCluster);
      currentCluster = [ev];
      clusterEnd = end;
    }
  }
  if (currentCluster.length > 0) clusters.push(currentCluster);

  // For each cluster, assign columns greedily
  for (const cluster of clusters) {
    const columns: number[][] = []; // columns[colIdx] = list of end-times

    for (const ev of cluster) {
      const start = new Date(ev.startsAt).getTime();
      let placed = false;

      for (let col = 0; col < columns.length; col++) {
        const lastEnd = columns[col][columns[col].length - 1];
        // Same buffer for column assignment — don't reuse a column if
        // the previous event just ended
        if (start >= lastEnd + VISUAL_BUFFER_MS) {
          columns[col].push(new Date(ev.endsAt).getTime());
          slots.push({ event: ev, col, totalCols: 0 });
          placed = true;
          break;
        }
      }

      if (!placed) {
        columns.push([new Date(ev.endsAt).getTime()]);
        slots.push({ event: ev, col: columns.length - 1, totalCols: 0 });
      }
    }

    // Set totalCols for every event in this cluster
    const totalCols = columns.length;
    for (const slot of slots) {
      if (cluster.includes(slot.event) && slot.totalCols === 0) {
        slot.totalCols = totalCols;
      }
    }
  }

  return slots;
}

// Create ISO string that preserves local timezone
function toLocalISOString(date: Date): string {
  const offset = date.getTimezoneOffset();
  const offsetHours = Math.abs(Math.floor(offset / 60));
  const offsetMinutes = Math.abs(offset % 60);
  const offsetSign = offset <= 0 ? "+" : "-";
  const offsetStr = `${offsetSign}${String(offsetHours).padStart(2, "0")}:${String(offsetMinutes).padStart(2, "0")}`;
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetStr}`;
}

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  
  // Modal states
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    date: formatDate(new Date()),
    startTime: "09:00",
    endTime: "10:00",
    allDay: false,
    areaId: "",
    createTask: true,
    xpReward: 50,
    eventType: "ACTION_ITEM" as EventType,
    projectId: "",
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);

  // Get date range based on view mode
  const getDateRange = useCallback(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);
    
    if (viewMode === "day") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (viewMode === "week") {
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
    }
    
    return { start, end };
  }, [currentDate, viewMode]);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch areas
        const areasRes = await fetch("/api/areas");
        if (areasRes.ok) {
          const areasData = await areasRes.json();
          setAreas(areasData);
        }
        
        // Fetch projects for linking
        try {
          const projectsRes = await fetch("/api/bosses");
          if (projectsRes.ok) {
            const bossData = await projectsRes.json();
            // Get projects that have bosses
            const projectsWithBosses = bossData.map((boss: { project: Project; id: string; name: string; hp: number; maxHp: number }) => ({
              ...boss.project,
              boss: { id: boss.id, name: boss.name, hp: boss.hp, maxHp: boss.maxHp },
            }));
            setProjects(projectsWithBosses);
          }
        } catch {
          // Projects fetch is optional
        }
        
        // Check Google Calendar connection
        const statusRes = await fetch("/api/calendar/status");
        let connected = false;
        if (statusRes.ok) {
          const status = await statusRes.json();
          connected = status.connected;
          setIsConnected(connected);
        }

        const { start, end } = getDateRange();
        const timezone = getUserTimezone();

        if (connected) {
          setCalendarError(null);
          // Fetch from Google Calendar (use local ISO strings to preserve timezone)
          const gcalRes = await fetch(
            `/api/calendar/events?timeMin=${toLocalISOString(start)}&timeMax=${toLocalISOString(end)}&timeZone=${encodeURIComponent(timezone)}`
          );
          if (gcalRes.ok) {
            const gcalData = await gcalRes.json();
            setCalendars(gcalData.calendars || []);
            const googleEvents: CalendarEvent[] = (gcalData.events || []).map((e: {
              googleEventId: string;
              title: string;
              start: string;
              end: string;
              allDay: boolean;
              description?: string;
              location?: string;
              calendarId?: string;
              calendarName?: string;
              calendarColor?: string;
            }) => ({
              id: e.googleEventId,
              title: e.title,
              startsAt: e.start,
              endsAt: e.end,
              allDay: e.allDay,
              description: e.description,
              location: e.location,
              calendarId: e.calendarId,
              calendarName: e.calendarName,
              calendarColor: e.calendarColor,
              isFromGoogle: true,
            }));
            setEvents(googleEvents);
          } else {
            // Surface API errors to the user
            const errData = await gcalRes.json().catch(() => ({ error: "Unknown error" }));
            const errMsg = errData.error || `Failed to fetch calendar events (${gcalRes.status})`;
            setCalendarError(errMsg);
            console.error("Calendar events fetch failed:", errMsg, errData.details);
            
            // If token expired (401), mark as disconnected so we show the reconnect button
            if (gcalRes.status === 401) {
              setIsConnected(false);
            }
          }
        } else {
          // Fetch from local database (use local ISO strings)
          const res = await fetch(`/api/events?start=${toLocalISOString(start)}&end=${toLocalISOString(end)}`);
          if (res.ok) {
            const data = await res.json();
            setEvents(data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [currentDate, viewMode, getDateRange]);

  // Navigation
  const navigate = (delta: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === "day") {
      newDate.setDate(newDate.getDate() + delta);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + delta * 7);
    } else {
      newDate.setMonth(newDate.getMonth() + delta);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date());

  // Event handlers
  const openEventDetail = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsDetailOpen(true);
  };

  const openNewEventForm = (date?: Date) => {
    const d = date || currentDate;
    setFormData({
      title: "",
      description: "",
      location: "",
      date: formatDate(d),
      startTime: "09:00",
      endTime: "10:00",
      allDay: false,
      areaId: areas[0]?.id || "",
      createTask: true,
      xpReward: 50,
      eventType: "ACTION_ITEM",
      projectId: "",
    });
    setIsEditing(false);
    setIsFormOpen(true);
  };

  const openEditForm = () => {
    if (!selectedEvent) return;
    const startDate = new Date(selectedEvent.startsAt);
    const endDate = new Date(selectedEvent.endsAt);
    setFormData({
      title: selectedEvent.title,
      description: selectedEvent.description || "",
      location: selectedEvent.location || "",
      date: formatDate(startDate),
      startTime: formatTimeInput(startDate),
      endTime: formatTimeInput(endDate),
      allDay: selectedEvent.allDay,
      areaId: selectedEvent.areaId || "",
      createTask: true,
      xpReward: selectedEvent.xpReward || 50,
      eventType: selectedEvent.eventType || "ACTION_ITEM",
      projectId: selectedEvent.projectId || "",
    });
    setIsEditing(true);
    setIsDetailOpen(false);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const startsAt = formData.allDay 
      ? new Date(formData.date + "T00:00:00")
      : new Date(formData.date + "T" + formData.startTime);
    const endsAt = formData.allDay
      ? new Date(formData.date + "T23:59:59")
      : new Date(formData.date + "T" + formData.endTime);

    const payload = {
      title: formData.title,
      description: formData.description,
      location: formData.location,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      allDay: formData.allDay,
      areaId: formData.areaId,
      createTask: formData.createTask,
      xpReward: formData.xpReward,
      eventType: formData.eventType,
      projectId: formData.projectId || undefined,
    };

    try {
      const url = isEditing ? `/api/events/${selectedEvent?.id}` : "/api/events";
      const method = isEditing ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsFormOpen(false);
        // Refresh events
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to save event:", error);
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;
    
    try {
      const res = await fetch(`/api/events/${selectedEvent.id}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        setIsDetailOpen(false);
        setEvents(events.filter(e => e.id !== selectedEvent.id));
      }
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  };

  // Sync Google Calendar events to local DB and create tasks
  const handleSyncEvents = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    
    try {
      const { start, end } = getDateRange();
      // Sync 30 days from today for broader coverage
      const syncStart = new Date();
      const syncEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeMin: syncStart.toISOString(),
          timeMax: syncEnd.toISOString(),
          createTasks: true,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        const msg = `Synced! ${data.eventsImported} events imported, ${data.tasksCreated} quests created`;
        setSyncMessage(msg);
        
        // Refresh the view to show imported events
        const eventsRes = await fetch(`/api/events?start=${start.toISOString()}&end=${end.toISOString()}`);
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          // Merge with Google events or replace local events
          setEvents(eventsData);
        }
        
        // Clear message after 5 seconds
        setTimeout(() => setSyncMessage(null), 5000);
      } else {
        const errorData = await res.json();
        setSyncMessage(`Sync failed: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to sync events:", error);
      setSyncMessage("Sync failed. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Complete or update event status
  const handleEventStatus = async (status: EventStatus) => {
    if (!selectedEvent || selectedEvent.isFromGoogle) return;
    
    setIsCompleting(true);
    try {
      const res = await fetch(`/api/events/${selectedEvent.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      
      if (res.ok) {
        const data = await res.json();
        // Update event in state
        setEvents(events.map(e => 
          e.id === selectedEvent.id 
            ? { ...e, ...data.event, status } 
            : e
        ));
        setSelectedEvent({ ...selectedEvent, status });
        setIsDetailOpen(false);
        
        // Show reward toast or notification
        if (data.rewards?.xpEarned) {
          console.log(`Earned ${data.rewards.xpEarned} XP!`);
        }
      }
    } catch (error) {
      console.error("Failed to update event status:", error);
    } finally {
      setIsCompleting(false);
    }
  };

  // Get event position for day/week view (5 AM – 11 PM = 18 hours)
  const getEventPosition = (event: CalendarEvent) => {
    const start = new Date(event.startsAt);
    const end = new Date(event.endsAt);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    const top = ((startHour - 5) / 18) * 100;
    const height = Math.max(((endHour - startHour) / 18) * 100, 2.2); // min ~24 min visible
    return { top: `${Math.max(0, top)}%`, height: `${height}%` };
  };

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startsAt);
      return isSameDay(eventDate, date);
    });
  };

  // Render navigation title
  const getNavigationTitle = () => {
    if (viewMode === "day") {
      return currentDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } else if (viewMode === "week") {
      const week = getWeekDays(currentDate);
      const start = week[0];
      const end = week[6];
      if (start.getMonth() === end.getMonth()) {
        return `${start.toLocaleDateString("en-US", { month: "long" })} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
      }
      return `${start.toLocaleDateString("en-US", { month: "short" })} ${start.getDate()} - ${end.toLocaleDateString("en-US", { month: "short" })} ${end.getDate()}, ${end.getFullYear()}`;
    }
    return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  // Day View Component
  const DayView = () => {
    const allDayEvents = events.filter((e) => e.allDay);
    const timedEvents = events.filter((e) => !e.allDay);
    const slots = layoutOverlappingEvents(timedEvents);

    return (
      <div className="flex flex-col">
        {/* All-day events banner */}
        {allDayEvents.length > 0 && (
          <div className="border-b border-border/50 px-2 py-2 flex flex-wrap gap-1.5 mb-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-14 shrink-0 pt-1 font-medium">
              All day
            </span>
            <div className="flex flex-wrap gap-1.5 flex-1">
              {allDayEvents.map((event) => {
                const color = event.calendarColor || event.area?.color || "#666";
                return (
                  <div
                    key={event.id}
                    onClick={() => openEventDetail(event)}
                    className="text-xs px-2.5 py-1 rounded-md cursor-pointer transition-colors hover:brightness-125 truncate max-w-60 font-medium"
                    style={{
                      backgroundColor: color + "22",
                      borderLeft: `3px solid ${color}`,
                      color: color,
                    }}
                  >
                    {event.title}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Time grid */}
        <div className="relative" style={{ height: "1080px" }}>
          {/* Half-hour lines */}
          {TIME_SLOTS.map(({ hour, minute }) => {
            const isHour = minute === 0;
            const slotMinutes = (hour - 5) * 60 + minute;
            const pct = (slotMinutes / (18 * 60)) * 100;
            return (
              <div
                key={`${hour}-${minute}`}
                className={`absolute left-0 right-0 border-t ${
                  isHour ? "border-border/40" : "border-border/15"
                }`}
                style={{ top: `${pct}%` }}
              >
                <span className={`px-2 py-0.5 w-14 inline-block select-none ${
                  isHour
                    ? "text-[10px] text-muted-foreground/70"
                    : "text-[9px] text-muted-foreground/35"
                }`}>
                  {isHour
                    ? hour === 0 ? "12 AM" : hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`
                    : hour === 0 ? "12:30" : hour === 12 ? "12:30" : hour > 12 ? `${hour - 12}:30` : `${hour}:30`
                  }
                </span>
              </div>
            );
          })}

          {/* Now indicator */}
          {isSameDay(currentDate, new Date()) && (() => {
            const now = new Date();
            const nowHour = now.getHours() + now.getMinutes() / 60;
            const pct = ((nowHour - 5) / 18) * 100;
            if (pct < 0 || pct > 100) return null;
            return (
              <div className="absolute left-14 right-2 z-20 flex items-center" style={{ top: `${pct}%` }}>
                <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shrink-0" />
                <div className="flex-1 h-px bg-red-500/70" />
              </div>
            );
          })()}

          {/* Events area */}
          <div className="absolute left-14 right-2 top-0 bottom-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : timedEvents.length === 0 && allDayEvents.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No events for this day
              </div>
            ) : (
              slots.map(({ event, col, totalCols }) => {
                const pos = getEventPosition(event);
                const color = event.calendarColor || event.area?.color || "#888";
                const widthPct = 100 / totalCols;
                const leftPct = col * widthPct;
                // Small gap between side-by-side columns
                const gapPx = totalCols > 1 ? 4 : 0;

                return (
                  <div
                    key={event.id}
                    onClick={() => openEventDetail(event)}
                    className="absolute rounded-md border-l-[3px] px-2.5 py-1.5 cursor-pointer transition-all hover:brightness-110 hover:shadow-lg overflow-hidden group border border-border/30"
                    style={{
                      top: `calc(${pos.top} + 1px)`,
                      height: `calc(${pos.height} - 2px)`,
                      left: `calc(${leftPct}% + ${gapPx / 2}px)`,
                      width: `calc(${widthPct}% - ${gapPx}px)`,
                      borderLeftColor: color,
                      borderLeftWidth: "3px",
                      backgroundColor: color + "28",
                    }}
                  >
                    <div className="font-semibold text-sm truncate leading-tight">{event.title}</div>
                    <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {formatTime(event.startsAt)} – {formatTime(event.endsAt)}
                    </div>
                    {event.calendarName && (
                      <div className="text-[10px] text-muted-foreground/60 truncate mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {event.calendarName}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  // Week View Component
  const WeekView = () => {
    const weekDays = getWeekDays(currentDate);
    const today = new Date();
    
    // Collect all-day events across the week
    const allDayByDay = weekDays.map((day) =>
      events.filter((e) => e.allDay && isSameDay(new Date(e.startsAt), day))
    );
    const hasAnyAllDay = allDayByDay.some((d) => d.length > 0);
    
    return (
      <div className="flex flex-col">
        {/* Day headers */}
        <div className="flex border-b border-border">
          <div className="w-12 shrink-0" />
          {weekDays.map((day, i) => (
            <div
              key={i}
              className={`flex-1 text-center py-2 border-l border-border/30 ${isSameDay(day, today) ? "bg-primary/5" : ""}`}
            >
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                {day.toLocaleDateString("en-US", { weekday: "short" })}
              </div>
              <div className={`text-base font-bold leading-tight ${isSameDay(day, today) ? "text-primary" : ""}`}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* All-day row */}
        {hasAnyAllDay && (
          <div className="flex border-b border-border/50">
            <div className="w-12 shrink-0 text-[9px] text-muted-foreground/60 pt-1.5 text-right pr-1.5 uppercase">
              All day
            </div>
            {weekDays.map((_, i) => (
              <div key={i} className="flex-1 border-l border-border/30 p-0.5 min-h-7">
                {allDayByDay[i].map((event) => {
                  const color = event.calendarColor || event.area?.color || "#666";
                  return (
                    <div
                      key={event.id}
                      onClick={() => openEventDetail(event)}
                      className="text-[10px] px-1.5 py-0.5 rounded cursor-pointer truncate hover:brightness-125 font-medium mb-0.5"
                      style={{
                        backgroundColor: color + "22",
                        borderLeft: `2px solid ${color}`,
                        color,
                      }}
                    >
                      {event.title}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Time grid */}
        <div className="relative" style={{ height: "900px" }}>
          {TIME_SLOTS.map(({ hour, minute }) => {
            const isHour = minute === 0;
            const slotMinutes = (hour - 5) * 60 + minute;
            const pct = (slotMinutes / (18 * 60)) * 100;
            return (
              <div
                key={`${hour}-${minute}`}
                className={`absolute left-0 right-0 border-t ${
                  isHour ? "border-border/20" : "border-border/10"
                }`}
                style={{ top: `${pct}%` }}
              >
                <span className={`px-1 w-12 inline-block text-right select-none ${
                  isHour
                    ? "text-[9px] text-muted-foreground/50"
                    : "text-[8px] text-muted-foreground/25"
                }`}>
                  {isHour
                    ? hour === 0 ? "12a" : hour === 12 ? "12p" : hour > 12 ? `${hour - 12}p` : `${hour}a`
                    : ":30"
                  }
                </span>
              </div>
            );
          })}

          {/* Now indicator */}
          {(() => {
            const now = new Date();
            const todayIdx = weekDays.findIndex((d) => isSameDay(d, now));
            if (todayIdx === -1) return null;
            const nowHour = now.getHours() + now.getMinutes() / 60;
            const pct = ((nowHour - 5) / 18) * 100;
            if (pct < 0 || pct > 100) return null;
            const leftPct = (todayIdx / 7) * 100;
            return (
              <div
                className="absolute z-20 flex items-center"
                style={{
                  top: `${pct}%`,
                  left: `calc(48px + ${leftPct}%)`, // 48px = time label width (w-12)
                  width: `${100 / 7}%`,
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 -ml-0.5 shrink-0" />
                <div className="flex-1 h-px bg-red-500/60" />
              </div>
            );
          })()}

          <div className="absolute left-12 right-0 top-0 bottom-0 flex">
            {weekDays.map((day, dayIndex) => {
              const dayEvents = getEventsForDay(day).filter((e) => !e.allDay);
              const slots = layoutOverlappingEvents(dayEvents);
              return (
                <div
                  key={dayIndex}
                  className={`flex-1 relative border-l border-border/20 ${
                    isSameDay(day, today) ? "bg-primary/2" : ""
                  }`}
                  onClick={() => openNewEventForm(day)}
                >
                  {slots.map(({ event, col, totalCols }) => {
                    const pos = getEventPosition(event);
                    const color = event.calendarColor || event.area?.color || "#888";
                    const widthPct = 100 / totalCols;
                    const leftPct = col * widthPct;
                    const gapPx = totalCols > 1 ? 2 : 0;
                    return (
                      <div
                        key={event.id}
                        onClick={(e) => { e.stopPropagation(); openEventDetail(event); }}
                        className="absolute rounded border-l-2 px-1 py-0.5 cursor-pointer hover:brightness-110 hover:shadow-md overflow-hidden transition-all border border-border/20"
                        style={{
                          top: `calc(${pos.top} + 1px)`,
                          height: `calc(${pos.height} - 2px)`,
                          left: `calc(${leftPct}% + ${1 + gapPx / 2}px)`,
                          width: `calc(${widthPct}% - ${3 + gapPx}px)`,
                          borderLeftColor: color,
                          borderLeftWidth: "2px",
                          backgroundColor: color + "28",
                        }}
                      >
                        <div className="text-[10px] font-semibold truncate leading-tight">{event.title}</div>
                        <div className="text-[9px] text-muted-foreground/70 truncate">
                          {formatTime(event.startsAt)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Month View Component
  const MonthView = () => {
    const monthDays = getMonthDays(currentDate);
    const today = new Date();
    const currentMonth = currentDate.getMonth();
    
    return (
      <div>
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              {day}
            </div>
          ))}
        </div>
        {/* Days grid */}
        <div className="grid grid-cols-7">
          {monthDays.map((day, i) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = day.getMonth() === currentMonth;
            const isToday = isSameDay(day, today);
            
            return (
              <div
                key={i}
                className={`min-h-24 border-b border-r border-border/30 p-1.5 cursor-pointer transition-colors hover:bg-muted/40 ${
                  !isCurrentMonth ? "opacity-40" : ""
                } ${isToday ? "bg-primary/4" : ""}`}
                onClick={() => {
                  setCurrentDate(day);
                  setViewMode("day");
                }}
              >
                <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                  isToday ? "bg-primary text-primary-foreground" : "text-foreground/80"
                }`}>
                  {day.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((event) => {
                    const color = event.calendarColor || event.area?.color || "#666";
                    return (
                      <div
                        key={event.id}
                        onClick={(e) => { e.stopPropagation(); openEventDetail(event); }}
                        className="text-[10px] leading-tight px-1.5 py-0.75 rounded cursor-pointer truncate hover:brightness-125 transition-colors font-medium"
                        style={{ 
                          backgroundColor: color + "20",
                          borderLeft: `2px solid ${color}`,
                          color: isCurrentMonth ? undefined : "inherit",
                        }}
                      >
                        {!event.allDay && (
                          <span className="text-muted-foreground/60 mr-0.5">
                            {new Date(event.startsAt).toLocaleTimeString("en-US", { hour: "numeric", hour12: true }).replace(" ", "").toLowerCase()}
                          </span>
                        )}
                        {event.title}
                      </div>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-muted-foreground pl-1.5 font-medium">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-4 max-w-350 mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-mono text-xl font-bold tracking-widest text-cyan-400 neon-glow flex items-center gap-3">
            <CalendarIcon size={22} /> SCHEDULE
          </h1>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
            <Clock size={10} className="inline" />
            {getUserTimezone().replace("_", " ")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSyncEvents}
                disabled={isSyncing}
                className="text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10 h-8 text-xs"
              >
                {isSyncing ? (
                  <Loader2 size={13} className="mr-1.5 animate-spin" />
                ) : (
                  <Download size={13} className="mr-1.5" />
                )}
                {isSyncing ? "Syncing..." : "Import"}
              </Button>
              <div className="flex items-center gap-1.5 text-xs text-green-400/80 px-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Connected
              </div>
            </>
          ) : (
            <Button
              variant="neon"
              size="sm"
              onClick={() => window.location.href = "/api/auth/google"}
              className="h-8 text-xs"
            >
              <CloudOff size={13} className="mr-1.5" />
              Connect Google Calendar
            </Button>
          )}
          <Button variant="neon" size="sm" onClick={() => openNewEventForm()} className="h-8 text-xs">
            <Plus size={13} className="mr-1.5" />
            New Event
          </Button>
        </div>
      </div>
      
      {/* Sync Message */}
      {syncMessage && (
        <div className={`p-3 rounded-lg text-sm font-mono ${
          syncMessage.includes("failed") 
            ? "bg-red-500/20 text-red-400 border border-red-500/50" 
            : "bg-green-500/20 text-green-400 border border-green-500/50"
        }`}>
          {syncMessage}
        </div>
      )}

      {/* Calendar Error */}
      {calendarError && (
        <div className="p-3 rounded-lg text-sm font-mono bg-red-500/20 text-red-400 border border-red-500/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle size={16} />
            <span>{calendarError}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-red-300"
            onClick={() => window.location.href = "/api/auth/google"}
          >
            Reconnect
          </Button>
        </div>
      )}

      {/* View Toggle + Navigation */}
      <Card>
        <CardContent className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
                <ChevronLeft size={18} />
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs px-3" onClick={goToToday}>
                Today
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(1)}>
                <ChevronRight size={18} />
              </Button>
            </div>
            
            <div className="text-center font-mono text-sm font-bold tracking-wide">
              {getNavigationTitle()}
            </div>
            
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList className="h-8">
                <TabsTrigger value="day" className="text-xs px-3 h-6">Day</TabsTrigger>
                <TabsTrigger value="week" className="text-xs px-3 h-6">Week</TabsTrigger>
                <TabsTrigger value="month" className="text-xs px-3 h-6">Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-[1fr_260px] gap-4">
        {/* Main Calendar View */}
        <div>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-auto">
                {viewMode === "day" && <DayView />}
                {viewMode === "week" && <WeekView />}
                {viewMode === "month" && <MonthView />}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Today&apos;s Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Events</span>
                <span className="font-bold tabular-nums">{events.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">All-day</span>
                <span className="font-bold tabular-nums text-pink-400">
                  {events.filter((e) => e.allDay).length}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Calendars</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-4 pb-4">
              {calendars.length > 0 ? (
                calendars.map((cal) => (
                  <div key={cal.id} className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: cal.backgroundColor }}
                    />
                    <span className="text-sm truncate">{cal.summary}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No calendars connected</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 px-4 pb-4">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-8 text-xs"
                onClick={() => openNewEventForm()}
              >
                <Plus size={13} className="mr-2" />
                Schedule Focus Block
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-xs">
                <Clock size={13} className="mr-2" />
                Block Recovery Time
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Event Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              {/* Event type icon */}
              {selectedEvent?.eventType === "REMINDER" ? (
                <Bell size={18} className="text-blue-400" />
              ) : (
                <Target size={18} className="text-green-400" />
              )}
              {selectedEvent?.title}
              {selectedEvent?.eventType === "ACTION_ITEM" && selectedEvent?.status === "SCHEDULED" && (
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Zap size={12} /> XP
                </span>
              )}
              {selectedEvent?.status === "COMPLETED" && (
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle size={12} /> Done
                </span>
              )}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock size={14} />
                  <span>
                    {selectedEvent && formatTime(selectedEvent.startsAt)} -{" "}
                    {selectedEvent && formatTime(selectedEvent.endsAt)}
                  </span>
                </div>
                {selectedEvent?.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin size={14} />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                {selectedEvent?.calendarName && (
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon size={14} />
                    <span>{selectedEvent.calendarName}</span>
                  </div>
                )}
                {selectedEvent?.project && (
                  <div className="flex items-center gap-2 text-sm">
                    <Swords size={14} className="text-purple-400" />
                    <span>
                      Project: {selectedEvent.project.name}
                      {selectedEvent.project.boss && (
                        <span className="text-purple-400 ml-1">
                          (Boss: {selectedEvent.project.boss.name})
                        </span>
                      )}
                    </span>
                  </div>
                )}
                {selectedEvent?.xpEarned && (
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <Zap size={14} />
                    <span>+{selectedEvent.xpEarned} XP earned</span>
                  </div>
                )}
                {selectedEvent?.description && (
                  <div className="text-sm text-muted-foreground border-t pt-3 mt-3 whitespace-pre-wrap">
                    {selectedEvent.description}
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            {/* Action buttons for scheduled events */}
            {!selectedEvent?.isFromGoogle && selectedEvent?.status === "SCHEDULED" && (
              <>
                {selectedEvent?.eventType === "ACTION_ITEM" && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => handleEventStatus("COMPLETED")}
                    disabled={isCompleting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isCompleting ? (
                      <Loader2 size={14} className="mr-2 animate-spin" />
                    ) : (
                      <CheckCircle size={14} className="mr-2" />
                    )}
                    Complete (+XP)
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleEventStatus("CANCELED_BY_SELF")}
                  disabled={isCompleting}
                  className="text-orange-400 hover:text-orange-300"
                >
                  <XCircle size={14} className="mr-2" />
                  Cancel Event
                </Button>
              </>
            )}
            {!selectedEvent?.isFromGoogle && (
              <>
                <Button variant="ghost" size="sm" onClick={openEditForm}>
                  <Edit size={14} className="mr-2" />
                  Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-red-400" onClick={handleDelete}>
                  <Trash2 size={14} className="mr-2" />
                  Delete
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>
              <X size={14} className="mr-2" />
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Form Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Event" : "New Event"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Update event details" : "Create a new event and optionally link it as a quest"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Event title"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">Area</Label>
                <Select
                  value={formData.areaId}
                  onValueChange={(v) => setFormData({ ...formData, areaId: v })}
                >
                  <SelectTrigger id="area">
                    <SelectValue placeholder="Select area" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!formData.allDay && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allDay"
                checked={formData.allDay}
                onChange={(e) => setFormData({ ...formData, allDay: e.target.checked })}
                className="rounded border-border"
              />
              <Label htmlFor="allDay" className="text-sm">All day event</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location (optional)</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Add location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add details"
                rows={3}
              />
            </div>

            {/* Event Type Selector */}
            <div className="space-y-2">
              <Label>Event Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.eventType === "ACTION_ITEM" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormData({ ...formData, eventType: "ACTION_ITEM" })}
                  className={formData.eventType === "ACTION_ITEM" ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  <Target size={14} className="mr-2" />
                  Action Item
                </Button>
                <Button
                  type="button"
                  variant={formData.eventType === "REMINDER" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormData({ ...formData, eventType: "REMINDER" })}
                  className={formData.eventType === "REMINDER" ? "bg-blue-600 hover:bg-blue-700" : ""}
                >
                  <Bell size={14} className="mr-2" />
                  Reminder
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {formData.eventType === "ACTION_ITEM" 
                  ? "Earn XP for completing, take damage if missed" 
                  : "Just a reminder - no XP or penalties"}
              </p>
            </div>

            {/* Project/Boss Linking */}
            {projects.length > 0 && formData.eventType === "ACTION_ITEM" && (
              <div className="space-y-2">
                <Label htmlFor="project">Link to Project (optional)</Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(v) => setFormData({ ...formData, projectId: v })}
                >
                  <SelectTrigger id="project">
                    <SelectValue placeholder="No project linked" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No project</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <span className="flex items-center gap-2">
                          {project.boss && <Swords size={12} className="text-purple-400" />}
                          {project.name}
                          {project.boss && (
                            <span className="text-xs text-purple-400">
                              (Boss: {project.boss.hp}/{project.boss.maxHp} HP)
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.projectId && (
                  <p className="text-xs text-purple-400">
                    Completing this event will deal damage to the project boss!
                  </p>
                )}
              </div>
            )}

            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="createTask"
                  checked={formData.createTask}
                  onChange={(e) => setFormData({ ...formData, createTask: e.target.checked })}
                  className="rounded border-border"
                />
                <Label htmlFor="createTask" className="text-sm flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-400" />
                  Create as Quest (earn XP)
                </Label>
              </div>
              
              {formData.createTask && (
                <div className="space-y-2">
                  <Label htmlFor="xpReward" className="text-xs text-muted-foreground">
                    XP Reward
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="xpReward"
                      type="number"
                      min={10}
                      max={500}
                      value={formData.xpReward}
                      onChange={(e) => setFormData({ ...formData, xpReward: parseInt(e.target.value) || 50 })}
                      className="w-24"
                    />
                    <span className="text-sm text-yellow-400 flex items-center gap-1">
                      <Zap size={14} /> XP
                    </span>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="neon">
                {isEditing ? "Update" : "Create"} Event
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
