"use client";

import { Button } from "@/components/ui/button";
import { useUser, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HeroSection() {
  const { isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleDiveIn = async () => {
    // Prevent multiple clicks
    if (isNavigating) return;

    // Only navigate if user is actually signed in and loaded
    if (!isLoaded || !isSignedIn) return;

    try {
      setIsNavigating(true);

      // Wait for session token to ensure server-side session is ready
      // Retry up to 3 times to handle race conditions
      let token = null;
      for (let i = 0; i < 3; i++) {
        try {
          token = await getToken();
          if (token) break;
        } catch (e) {
          if (i === 2) throw e;
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      // Longer delay to ensure cookie propagation to server middleware
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Now navigate to projects
      router.push("/projects");
    } catch (error) {
      console.error("Navigation error:", error);
      setIsNavigating(false);
    }
  };

  return (
    <main className="relative flex-1 overflow-hidden px-6 pt-24 pb-24 md:px-10 lg:px-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-6">
          <p className="inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs text-muted-foreground">
            Built for modern product teams
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Plan, build, and ship faster with DevTasker
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Keep tasks, timelines, and GitHub activity in one place. DevTasker
            unifies Kanban, roles, and project insights so your team always
            knows what's next.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {isLoaded && isSignedIn ? (
              <Button
                variant="default"
                className="min-w-full bg-red-500 shadow-lg shadow-red-500/30 transition-all hover:-translate-y-0.5 hover:bg-yellow-400 hover:shadow-yellow-400/50 hover:text-black"
                onClick={handleDiveIn}
                disabled={isNavigating}
              >
                {isNavigating ? "Loading..." : "Dive In"}
              </Button>
            ) : (
              <>
                <Button asChild>
                  <Link href="/sign-up">Get Started</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/sign-in">Sign In</Link>
                </Button>
              </>
            )}
          </div>
          <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-foreground/70" />
              Kanban, calendar, and overview in sync
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-foreground/70" />
              GitHub issues, PRs, and branches linked
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-foreground/70" />
              Roles and permissions for every project
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-foreground/70" />
              Real-time visibility for the whole team
            </li>
          </ul>
        </div>

        <div className="flex-1">
          <div className="relative rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active sprint</p>
                <p className="text-lg font-semibold">Launch Prep</p>
              </div>
              <div className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
                12 tasks
              </div>
            </div>
            <div className="mt-6 grid gap-3">
              <div className="rounded-lg border bg-background/60 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Docs refresh</span>
                  <span className="text-muted-foreground">Today</span>
                </div>
                <div className="mt-2 h-2 w-3/4 rounded-full bg-foreground/10">
                  <div className="h-2 w-2/3 rounded-full bg-foreground" />
                </div>
              </div>
              <div className="rounded-lg border bg-background/60 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">API hooks</span>
                  <span className="text-muted-foreground">Wed</span>
                </div>
                <div className="mt-2 h-2 w-2/3 rounded-full bg-foreground/10">
                  <div className="h-2 w-1/2 rounded-full bg-foreground" />
                </div>
              </div>
              <div className="rounded-lg border bg-background/60 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Release checklist</span>
                  <span className="text-muted-foreground">Fri</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-foreground/10">
                  <div className="h-2 w-4/5 rounded-full bg-foreground" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
