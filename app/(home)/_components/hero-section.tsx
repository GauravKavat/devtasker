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
    <main className="overflow-hidden m-[10%]">
      <div>
        <h1 className="text-4xl font-bold text-center">Welcome to DevTasker</h1>
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
      </div>
    </main>
  );
}
