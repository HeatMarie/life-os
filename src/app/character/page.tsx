import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StatDisplay } from "@/components/game/stat-display";
import { Sparkles, User, Shield, Sword } from "lucide-react";
import { getRank } from "@/lib/game/constants";
import Link from "next/link";

export default async function CharacterPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }

  const character = await db.character.findUnique({
    where: { userId: user.id },
  });

  if (!character) {
    redirect("/character/create");
  }

  // Get equipped items to calculate equipment bonuses
  const equippedItems = await db.equippedItem.findMany({
    where: { userId: user.id },
    include: {
      definition: true,
    },
  });

  // Calculate equipment bonuses
  const equipmentBonuses = {
    strength: 0,
    stamina: 0,
    focus: 0,
    discipline: 0,
    charisma: 0,
  };

  for (const item of equippedItems) {
    if (item.definition.bonuses) {
      const bonuses = item.definition.bonuses as Record<string, number>;
      if (bonuses.strength) equipmentBonuses.strength += bonuses.strength;
      if (bonuses.stamina) equipmentBonuses.stamina += bonuses.stamina;
      if (bonuses.focus) equipmentBonuses.focus += bonuses.focus;
      if (bonuses.discipline) equipmentBonuses.discipline += bonuses.discipline;
      if (bonuses.charisma) equipmentBonuses.charisma += bonuses.charisma;
    }
  }

  const rankTitle = getRank(character.level);

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400">
            CHARACTER SHEET
          </h1>
          <p className="text-muted-foreground mt-1">View and manage your stats</p>
        </div>
        <Link href="/">
          <Button variant="outline">← Dashboard</Button>
        </Link>
      </div>

      {/* Character Info */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-cyan-500/30 bg-gradient-to-br from-card to-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-cyan-400" />
              Character Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
              <span className="font-mono text-muted-foreground">Name</span>
              <span className="font-mono font-bold text-cyan-400 text-lg">
                {character.name}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-pink-500/10 border border-pink-500/30">
              <span className="font-mono text-muted-foreground">Class</span>
              <span className="font-mono font-bold text-pink-400 text-lg">
                {character.class}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <span className="font-mono text-muted-foreground">Level</span>
              <span className="font-mono font-bold text-yellow-400 text-2xl">
                {character.level}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <span className="font-mono text-muted-foreground">Rank</span>
              <span className="font-mono font-bold text-purple-400">
                {rankTitle}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/30 bg-gradient-to-br from-card to-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-400" />
              Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <span className="font-mono text-muted-foreground">HP</span>
              <span className="font-mono font-bold text-red-400">
                {character.hp} / {character.maxHp}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <span className="font-mono text-muted-foreground">Energy</span>
              <span className="font-mono font-bold text-yellow-400">
                {character.energy} / {character.maxEnergy}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <span className="font-mono text-muted-foreground">Mana</span>
              <span className="font-mono font-bold text-purple-400">
                {character.mana} / {character.maxMana}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <span className="font-mono text-muted-foreground">Gold</span>
              <span className="font-mono font-bold text-yellow-400 text-xl">
                {character.gold} 💰
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Section */}
      <Card className="border-cyan-500/30 bg-gradient-to-br from-card to-background">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sword className="h-5 w-5 text-cyan-400" />
              Character Stats
            </CardTitle>
            {character.statPointsAvailable > 0 && (
              <div className="flex items-center gap-3">
                <div className="text-sm font-mono">
                  <span className="text-muted-foreground">Available Points: </span>
                  <span className="text-cyan-400 font-bold text-lg">
                    {character.statPointsAvailable}
                  </span>
                </div>
                <Button variant="neon" size="sm" asChild>
                  <Link href="/#allocate-stats">Allocate Points</Link>
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <StatDisplay
            stats={{
              strength: character.strength,
              stamina: character.stamina,
              focus: character.focus,
              discipline: character.discipline,
              charisma: character.charisma,
            }}
            equipmentBonuses={equipmentBonuses}
            showVitality={true}
          />
        </CardContent>
      </Card>

      {/* Progress Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-green-500/30">
          <CardHeader>
            <CardTitle className="text-sm">Tasks Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black font-mono text-green-400">
              {character.tasksCompleted}
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/30">
          <CardHeader>
            <CardTitle className="text-sm">Bosses Defeated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black font-mono text-red-400">
              {character.bossesDefeated}
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/30">
          <CardHeader>
            <CardTitle className="text-sm">Current Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black font-mono text-yellow-400">
              {character.currentStreak} 🔥
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equipment Section */}
      <Card className="border-purple-500/30 bg-gradient-to-br from-card to-background">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-400" />
              Equipped Items
            </CardTitle>
            <Button variant="neon" size="sm" asChild>
              <Link href="/character/equipment">View Equipment</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {equippedItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No items equipped. Complete tasks to find equipment!
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {equippedItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border border-purple-500/30 bg-purple-500/10"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{item.definition.icon}</span>
                    <div className="flex-1">
                      <div className="font-mono font-medium text-purple-400">
                        {item.definition.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.definition.slot}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
