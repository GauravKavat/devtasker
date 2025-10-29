"use client";

import dynamic from "next/dynamic";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client-singleton";

const Kanban = dynamic(() => import("@/app/(main)/(routes)/_components/kanban"), { ssr: false });
const Calendar = dynamic(() => import("@/app/(main)/(routes)/_components/calender"), { ssr: false });
const Github = dynamic(() => import("@/app/(main)/(routes)/_components/github"), { ssr: false });
const Teams = dynamic(() => import("@/app/(main)/(routes)/_components/team"), { ssr: false });
const Roles = dynamic(() => import("@/app/(main)/(routes)/_components/roles"), { ssr: false });

interface DashboardProps { projectId?: string; }

export function Dashboard({ projectId }: DashboardProps) {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") || "dashboard";
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.push("/unauthorized");
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!isSignedIn) return null;

  const getPageContent = () => {
    switch (view) {
      case "kanban": return <Kanban projectId={projectId} />;
      case "calendar": return <Calendar projectId={projectId} />;
      case "github": return <Github projectId={projectId} />;
      case "team": return <Teams projectId={projectId} />;
      case "roles": return <Roles projectId={projectId} />;
      default: return <div className="p-6"><h1 className="text-3xl font-bold">Dashboard</h1></div>;
    }
  };

  return (
    <>
      <header className="flex h-16 items-center gap-2 border-b px-4">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-4" />
        <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbLink href="/projects">Projects</BreadcrumbLink></BreadcrumbItem></BreadcrumbList></Breadcrumb>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4">{getPageContent()}</div>
    </>
  );
}
