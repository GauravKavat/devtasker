"use client";

import { Button } from "@/components/ui/button";
import { useUser, useAuth } from "@clerk/nextjs";
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
      await getToken();

      // Small delay to ensure cookie propagation
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Now navigate to projects
      router.push("/projects");
    } catch (error) {
      console.error("Navigation error:", error);
      setIsNavigating(false);
    }
  };

  const handleDiveIn2 = async () => {
    // Prevent multiple clicks
    if (isNavigating) return;

    // Only navigate if user is actually signed in and loaded
    if (!isLoaded || !isSignedIn) return;

    try {
      setIsNavigating(true);

      // Wait for session token to ensure server-side session is ready
      await getToken();

      // Small delay to ensure cookie propagation
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Now navigate to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Navigation error:", error);
      setIsNavigating(false);
    }
  };

  return (
    <main className="overflow-hidden m-[10%]">
      <div>
        <h1 className="text-4xl font-bold text-center">
          Welcome to DevTasker
        </h1>
        {isLoaded && isSignedIn && (
          <Button
            className="mt-4"
            variant="outline"
            onClick={handleDiveIn}
            disabled={isNavigating}
          >
            {isNavigating ? "Loading..." : "Dive In"}
          </Button>
        )}
        {isLoaded && isSignedIn && (
          <Button
            className="mt-4 ml-4"
            variant="outline"
            onClick={handleDiveIn2}
            disabled={isNavigating}
          >
            {isNavigating ? "Loading..." : "Dive In 2"}
          </Button>
        )}
      </div>
    </main>
  );
}
