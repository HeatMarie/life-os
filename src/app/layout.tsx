import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider } from "@/lib/auth-context";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LifeOS — Gamified Productivity RPG",
  description: "Your life as an RPG. Complete quests, defeat bosses, level up.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getAuthenticatedUser();
  const isAuthenticated = !!user;

  // Build a serialisable AuthUser to pass as SSR seed data
  const initialUser = user
    ? {
        id: user.id,
        email: user.email,
        name: user.name ?? null,
        character: user.character
          ? {
              name: user.character.name,
              class: user.character.class,
              level: user.character.level,
              xp: user.character.xp,
              xpToNextLevel: user.character.xpToNextLevel,
              hp: user.character.hp,
              maxHp: user.character.maxHp,
              energy: user.character.energy,
              maxEnergy: user.character.maxEnergy,
              currentStreak: user.character.currentStreak,
              tasksCompleted: user.character.tasksCompleted,
              status: user.character.status,
            }
          : null,
      }
    : null;

  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased cyber-grid`}
      >
        <AuthProvider initialUser={initialUser}>
          {isAuthenticated ? (
            <div className="flex min-h-screen">
              <AppSidebar />
              <main className="flex-1 overflow-auto">
                {children}
              </main>
            </div>
          ) : (
            <main className="min-h-screen">
              {children}
            </main>
          )}
        </AuthProvider>
      </body>
    </html>
  );
}
