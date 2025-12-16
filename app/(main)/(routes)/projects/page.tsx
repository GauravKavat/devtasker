"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { UserNav } from "@/components/user-nav";
import Projects from "../_components/projects";
import { Loader2 } from "lucide-react";

function ProjectsContentWithParams() {
  const router = useRouter();

  const getBreadcrumbInfo = () => {
    return { section: "Projects", page: "Overview" };
  };

  const breadcrumbInfo = getBreadcrumbInfo();

  const renderContent = () => {
    return <Projects />;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 sm:gap-4 border-b px-4 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0"
            onClick={() => {
              router.push("/");
            }}
          >
            <Image
              src="/devtasker.svg"
              alt="DevTasker Logo"
              width={24}
              height={24}
              className="dark:invert sm:w-7 sm:h-7"
            />
            <h1 className="text-xl sm:text-2xl font-semibold hidden xs:block">
              DevTasker
            </h1>
          </div>
        </div>
        <div className="flex items-center shrink-0">
          <UserNav />
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
        {renderContent()}
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait for auth to load
    if (isLoaded) {
      if (!isSignedIn) {
        // If not signed in after loading, redirect to home
        router.push("/");
      } else {
        // Auth is good, show content
        setIsChecking(false);
      }
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading while checking auth
  if (!isLoaded || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ProjectsContentWithParams />
    </Suspense>
  );
}
