"use client";

import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function UnauthorizedPage() {
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
