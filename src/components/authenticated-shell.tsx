"use client";

import { useAuth } from "@/lib/auth-context";
import { AppSidebar } from "@/components/app-sidebar";

/**
 * Client component that conditionally renders the authenticated shell
 * (sidebar + main wrapper) based on the reactive auth context.
 *
 * This ensures that cross-tab logouts and session expiry are reflected
 * immediately without waiting for a server re-render of the root layout.
 */
export function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (user) {
    return (
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      {children}
    </main>
  );
}
