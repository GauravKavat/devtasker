"use client";

import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 p-6">
              <FileQuestion className="h-16 w-16 text-blue-600 dark:text-blue-500" />
            </div>
          </div>

          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
            404
          </h1>

          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Page Not Found
          </h2>

          <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
            Oops! The page you're looking for doesn't exist.
          </p>

          <p className="text-base text-gray-500 dark:text-gray-500 mb-8">
            It might have been moved or deleted, or you may have mistyped the
            URL.
          </p>

          <div className="flex flex-col gap-4">
            <Link href="/">
              <Button className="w-full rounded-xl" size="lg">
                Go Back Home
              </Button>
            </Link>

            <Link href="/projects">
              <Button variant="outline" className="w-full rounded-xl" size="lg">
                Go to Projects
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
