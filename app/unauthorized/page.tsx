"use client";

import { Button } from "@/components/ui/button";
import { ShieldAlert, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function UnauthorizedContent() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRetrying, setIsRetrying] = useState(false);
  const [autoRetryCount, setAutoRetryCount] = useState(0);

  // Get the redirect URL from query params, default to /projects
  const redirectUrl = searchParams.get("redirect") || "/projects";

  // Auto-retry mechanism - sometimes users land here due to race conditions
  useEffect(() => {
    if (isLoaded && isSignedIn && autoRetryCount < 2) {
      // User is actually signed in, this might be a race condition
      const timer = setTimeout(() => {
        setAutoRetryCount((prev) => prev + 1);
        router.push(redirectUrl);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isLoaded, isSignedIn, router, autoRetryCount, redirectUrl]);

  const handleRetry = async () => {
    setIsRetrying(true);

    // Wait a moment for session to sync
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (isSignedIn) {
      router.push(redirectUrl);
    } else {
      router.push("/");
    }
  };

  // If user is signed in, show a different message
  if (isLoaded && isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-yellow-600 dark:bg-yellow-700">
        <div className="max-w-md w-full mx-auto p-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-yellow-700 dark:bg-yellow-800 p-6 ring-4 ring-white dark:ring-white">
                <RefreshCw className="h-16 w-16 text-white" />
              </div>
            </div>

            <h1 className="text-4xl font-bold text-white mb-4">
              Session Sync Issue
            </h1>

            <p className="text-lg text-white/90 mb-2">
              Your session is active but there was a timing issue.
            </p>

            <p className="text-base text-white/80 mb-8">
              This sometimes happens right after logging in. Click retry to
              continue.
            </p>

            <div className="flex flex-col gap-4">
              <Button
                className="w-full rounded-xl"
                size="lg"
                onClick={handleRetry}
                disabled={isRetrying}
              >
                {isRetrying ? "Retrying..." : "Retry Access"}
              </Button>

              <Link href="/">
                <Button
                  variant="outline"
                  className="w-full rounded-xl"
                  size="lg"
                >
                  Return to Homepage
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User is not signed in
  return (
    <div className="min-h-screen flex items-center justify-center bg-red-600 dark:bg-red-700">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-red-700 dark:bg-red-800 p-6 ring-4 ring-white dark:ring-white">
              <ShieldAlert className="h-16 w-16 text-white" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-white mb-4">Access Denied</h1>

          <p className="text-lg text-white/90 mb-2">
            You need to be logged in to access this page.
          </p>

          <p className="text-base text-white/80 mb-8">
            Please sign in to continue or go back to the homepage.
          </p>

          <div className="flex flex-col gap-4">
            <Link href="/">
              <Button className="w-full rounded-xl" size="lg">
                Go Back Home & Sign In
              </Button>
            </Link>

            <Link href="/">
              <Button variant="outline" className="w-full rounded-xl" size="lg">
                Return to Homepage
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
        </div>
      }
    >
      <UnauthorizedContent />
    </Suspense>
  );
}
