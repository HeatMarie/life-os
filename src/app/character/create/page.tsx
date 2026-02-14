"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Sword, Wand2, Zap, Music, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const CHARACTER_CLASSES = [
  {
    id: "WARRIOR",
    name: "Warrior",
    icon: Sword,
    color: "red",
    description: "Masters of discipline and strength",
    bonuses: ["+25% XP from Work tasks", "+20 max HP"],
  },
  {
    id: "MAGE",
    name: "Mage",
    icon: Wand2,
    color: "purple",
    description: "Seekers of knowledge and innovation",
    bonuses: ["+25% XP from Side Projects", "+20 energy regen/day"],
  },
  {
    id: "ROGUE",
    name: "Rogue",
    icon: Zap,
    color: "green",
    description: "Masters of efficiency and home life",
    bonuses: ["+25% XP from Home tasks", "+15% loot drop rate"],
  },
  {
    id: "BARD",
    name: "Bard",
    icon: Music,
    color: "yellow",
    description: "Creative souls and storytellers",
    bonuses: ["+25% XP from Writing", "+1 streak protection/week"],
  },
] as const;

type CharacterClass = typeof CHARACTER_CLASSES[number]["id"];

export default function CharacterCreatePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [selectedClass, setSelectedClass] = useState<CharacterClass | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter a character name");
      return;
    }

    if (!selectedClass) {
      setError("Please select a class");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          class: selectedClass,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create character");
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  const getClassStyles = (color: string, isSelected: boolean) => {
    const colorMap: Record<string, { border: string; bg: string; text: string; glow: string }> = {
      red: {
        border: isSelected ? "border-red-500" : "border-red-500/30",
        bg: isSelected ? "bg-red-500/20" : "bg-red-500/10",
        text: "text-red-400",
        glow: isSelected ? "shadow-[0_0_20px_rgba(239,68,68,0.3)]" : "",
      },
      purple: {
        border: isSelected ? "border-purple-500" : "border-purple-500/30",
        bg: isSelected ? "bg-purple-500/20" : "bg-purple-500/10",
        text: "text-purple-400",
        glow: isSelected ? "shadow-[0_0_20px_rgba(168,85,247,0.3)]" : "",
      },
      green: {
        border: isSelected ? "border-green-500" : "border-green-500/30",
        bg: isSelected ? "bg-green-500/20" : "bg-green-500/10",
        text: "text-green-400",
        glow: isSelected ? "shadow-[0_0_20px_rgba(34,197,94,0.3)]" : "",
      },
      yellow: {
        border: isSelected ? "border-yellow-500" : "border-yellow-500/30",
        bg: isSelected ? "bg-yellow-500/20" : "bg-yellow-500/10",
        text: "text-yellow-400",
        glow: isSelected ? "shadow-[0_0_20px_rgba(234,179,8,0.3)]" : "",
      },
    };
    return colorMap[color];
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      {/* Ambient glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        <Card className="border-cyan-500/20 bg-slate-900/80 backdrop-blur">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-cyan-500/20 border border-cyan-500/30">
                <Sparkles className="w-8 h-8 text-cyan-400" />
              </div>
            </div>
            <CardTitle className="text-2xl text-cyan-400">Create Your Character</CardTitle>
            <CardDescription className="text-slate-400">
              Choose your path and begin your productivity adventure
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleCreate} className="space-y-6">
              {/* Character Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">Character Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your hero's name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={30}
                  className="bg-slate-800/50 border-slate-700 focus:border-cyan-500"
                />
              </div>

              {/* Class Selection */}
              <div className="space-y-3">
                <Label className="text-slate-300">Choose Your Class</Label>
                <div className="grid grid-cols-2 gap-3">
                  {CHARACTER_CLASSES.map((charClass) => {
                    const isSelected = selectedClass === charClass.id;
                    const styles = getClassStyles(charClass.color, isSelected);
                    const Icon = charClass.icon;

                    return (
                      <button
                        key={charClass.id}
                        type="button"
                        onClick={() => setSelectedClass(charClass.id)}
                        className={cn(
                          "p-4 rounded-lg border-2 transition-all duration-200 text-left",
                          styles.border,
                          styles.bg,
                          styles.glow,
                          "hover:scale-[1.02]"
                        )}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={cn("p-2 rounded-lg", styles.bg)}>
                            <Icon className={cn("w-5 h-5", styles.text)} />
                          </div>
                          <span className={cn("font-semibold", styles.text)}>
                            {charClass.name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mb-2">
                          {charClass.description}
                        </p>
                        <ul className="space-y-1">
                          {charClass.bonuses.map((bonus, idx) => (
                            <li key={idx} className="text-xs text-slate-500 flex items-center gap-1">
                              <span className={cn("w-1 h-1 rounded-full", styles.bg.replace("/10", "/50").replace("/20", "/50"))} />
                              {bonus}
                            </li>
                          ))}
                        </ul>
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="neon"
                className="w-full"
                disabled={loading || !name.trim() || !selectedClass}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating character...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Begin Adventure
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center">
            <p className="text-xs text-slate-500 text-center">
              Your class determines bonus XP in specific life areas.
              <br />
              You can always change your focus later!
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
