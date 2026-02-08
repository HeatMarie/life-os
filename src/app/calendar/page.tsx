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
  RefreshCw,
  Loader2,
  MapPin,
  Trash2,
  Edit,
  X,
  Zap,
  CheckCircle,
} from "lucide-react";

// Types
type ViewMode = "day" | "week" | "month";

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

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM to 10 PM

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
  });

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

  // Get event position for day/week view
  const getEventPosition = (event: CalendarEvent) => {
    const start = new Date(event.startsAt);
    const end = new Date(event.endsAt);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    const top = ((startHour - 6) / 16) * 100;
    const height = Math.max(((endHour - startHour) / 16) * 100, 3);
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
  const DayView = () => (
    <div className="relative" style={{ height: "700px" }}>
      {HOURS.map((hour) => (
        <div
          key={hour}
          className="absolute left-0 right-0 border-t border-border/50 flex"
          style={{ top: `${((hour - 6) / 16) * 100}%` }}
        >
          <span className="text-[10px] text-muted-foreground px-2 py-1 w-14 shrink-0">
            {hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
          </span>
        </div>
      ))}
      <div className="absolute left-14 right-2 top-0 bottom-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No events for this day
          </div>
        ) : (
          events.map((event) => {
            const pos = getEventPosition(event);
            const borderColor = event.calendarColor || event.area?.color || "var(--border)";
            return (
              <div
                key={event.id}
                onClick={() => openEventDetail(event)}
                className="absolute left-0 right-0 rounded-lg border-l-4 p-2 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg bg-muted/80 overflow-hidden"
                style={{ top: pos.top, height: pos.height, borderLeftColor: borderColor }}
              >
                <div className="font-semibold text-sm truncate">{event.title}</div>
                <div className="text-xs opacity-70 truncate">
                  {formatTime(event.startsAt)} - {formatTime(event.endsAt)}
                </div>
                {event.calendarName && (
                  <div className="text-xs text-muted-foreground truncate mt-1">
                    {event.calendarName}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  // Week View Component
  const WeekView = () => {
    const weekDays = getWeekDays(currentDate);
    const today = new Date();
    
    return (
      <div className="flex flex-col">
        {/* Day headers */}
        <div className="flex border-b border-border">
          <div className="w-14 shrink-0" />
          {weekDays.map((day, i) => (
            <div
              key={i}
              className={`flex-1 text-center py-2 ${isSameDay(day, today) ? "bg-primary/10" : ""}`}
            >
              <div className="text-xs text-muted-foreground">
                {day.toLocaleDateString("en-US", { weekday: "short" })}
              </div>
              <div className={`text-lg font-bold ${isSameDay(day, today) ? "text-primary" : ""}`}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>
        {/* Time grid */}
        <div className="relative" style={{ height: "600px" }}>
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="absolute left-0 right-0 border-t border-border/30"
              style={{ top: `${((hour - 6) / 16) * 100}%` }}
            >
              <span className="text-[10px] text-muted-foreground px-1 w-14 inline-block">
                {hour === 12 ? "12PM" : hour > 12 ? `${hour - 12}PM` : `${hour}AM`}
              </span>
            </div>
          ))}
          <div className="absolute left-14 right-0 top-0 bottom-0 flex">
            {weekDays.map((day, dayIndex) => {
              const dayEvents = getEventsForDay(day);
              return (
                <div
                  key={dayIndex}
                  className="flex-1 relative border-l border-border/30"
                  onClick={() => openNewEventForm(day)}
                >
                  {dayEvents.map((event) => {
                    const pos = getEventPosition(event);
                    const borderColor = event.calendarColor || event.area?.color || "var(--border)";
                    return (
                      <div
                        key={event.id}
                        onClick={(e) => { e.stopPropagation(); openEventDetail(event); }}
                        className="absolute left-0.5 right-0.5 rounded border-l-2 px-1 py-0.5 cursor-pointer hover:shadow-md bg-muted/90 overflow-hidden"
                        style={{ top: pos.top, height: pos.height, borderLeftColor: borderColor }}
                      >
                        <div className="text-[11px] font-medium truncate">{event.title}</div>
                        <div className="text-[9px] opacity-70 truncate">
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
            <div key={day} className="text-center py-2 text-xs text-muted-foreground font-medium">
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
                className={`min-h-[100px] border-b border-r border-border/50 p-1 cursor-pointer hover:bg-muted/50 ${
                  !isCurrentMonth ? "bg-muted/30 opacity-50" : ""
                }`}
                onClick={() => {
                  setCurrentDate(day);
                  setViewMode("day");
                }}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isToday ? "w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center" : ""
                }`}>
                  {day.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      onClick={(e) => { e.stopPropagation(); openEventDetail(event); }}
                      className="text-[10px] px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                      style={{ 
                        backgroundColor: (event.calendarColor || event.area?.color || "#666") + "33",
                        borderLeft: `2px solid ${event.calendarColor || event.area?.color || "#666"}`
                      }}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-muted-foreground">
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-mono text-xl font-bold tracking-widest text-cyan-400 neon-glow flex items-center gap-3">
            <CalendarIcon size={24} /> TIME MATRIX
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            Sync your quests with spacetime
            <span className="text-xs bg-muted px-2 py-0.5 rounded">
              <Clock size={10} className="inline mr-1" />
              {getUserTimezone().replace("_", " ")}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isConnected ? (
            <Button variant="ghost" size="sm" className="text-green-400">
              <RefreshCw size={14} className="mr-2" />
              Synced with Google
            </Button>
          ) : (
            <Button
              variant="neon"
              size="sm"
              onClick={() => window.location.href = "/api/auth/google"}
            >
              <CloudOff size={14} className="mr-2" />
              Connect Google Calendar
            </Button>
          )}
          <Button variant="neon" size="sm" onClick={() => openNewEventForm()}>
            <Plus size={14} className="mr-2" />
            New Event
          </Button>
        </div>
      </div>

      {/* View Toggle + Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ChevronLeft size={20} />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate(1)}>
                <ChevronRight size={20} />
              </Button>
            </div>
            
            <div className="text-center font-mono text-lg font-bold">
              {getNavigationTitle()}
            </div>
            
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList>
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-6">
        {/* Main Calendar View */}
        <div className="col-span-3">
          <Card>
            <CardContent className="p-4">
              {viewMode === "day" && <DayView />}
              {viewMode === "week" && <WeekView />}
              {viewMode === "month" && <MonthView />}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-sm">TODAY&apos;S STATS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Events</span>
                <span className="font-bold">{events.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">All-day</span>
                <span className="font-bold text-pink-400">
                  {events.filter((e) => e.allDay).length}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-sm">CALENDARS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {calendars.length > 0 ? (
                calendars.map((cal) => (
                  <div key={cal.id} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cal.backgroundColor }}
                    />
                    <span className="text-sm truncate">{cal.summary}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-cyan-400" />
                    <span className="text-sm">Work</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                    <span className="text-sm">Personal</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-sm">QUICK ACTIONS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => openNewEventForm()}
              >
                <Plus size={14} className="mr-2" />
                Schedule Focus Block
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Clock size={14} className="mr-2" />
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
              {selectedEvent?.title}
              {selectedEvent?.xpReward && (
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Zap size={12} /> {selectedEvent.xpReward} XP
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
                {selectedEvent?.description && (
                  <div className="text-sm text-muted-foreground border-t pt-3 mt-3 whitespace-pre-wrap">
                    {selectedEvent.description}
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
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
