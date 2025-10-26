"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { UserNav } from "@/components/user-nav";

function ProjectsContent() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Projects</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex flex-col w-full p-6" onClick={() => {}}>
          <h1 className="text-3xl font-bold mb-4">Projects</h1>
          <p className="text-muted-foreground">Manage your projects here.</p>
        </div>
      </div>
    </>
  );
}

export default function ProjectsPage() {
  const router = useRouter();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div
            className="flex items-center justify-center gap-x-4 p-2 border-b border-muted cursor-pointer"
            onClick={() => {
              // redirect to home when click on this <div>
              router.push("/");
            }}
          >
            <Image
              src="/devtasker.svg"
              alt="DevTasker Logo"
              width={28}
              height={28}
              className="dark:invert"
            />
            <h1 className="flex items-baseline text-3xl font-semibold mt-1">
              DevTasker
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          {/* Add your custom sidebar content here */}
        </SidebarContent>
        <SidebarFooter>
          <UserNav />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <ProjectsContent />
      </SidebarInset>
    </SidebarProvider>
  );
}
