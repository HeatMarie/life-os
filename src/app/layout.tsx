import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppSidebar } from "@/components/app-sidebar";
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

  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased cyber-grid`}
      >
        {isAuthenticated ? (
          <div className="flex min-h-screen">
            <AppSidebar character={user.character} />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        ) : (
          <main className="min-h-screen">
            {children}
          </main>
        )}
      </body>
    </html>
  );
}
