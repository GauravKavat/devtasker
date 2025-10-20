"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import HeroComponent from "./heroComponent";

export default function Hero() {
  return (
    <div className="flex flex-row items-center justify-between min-h-screen ml-[5%] mr-[5%]">
      <div className="flex flex-col gap-y-8">
        <div className="flex flex-col items-start justify-start gap-y-4">
          <div className="flex text-5xl font-extrabold">
            <div>Development,</div>
            <div className="underline">Simplified</div>
          </div>
          <p className="mt-4 text-lg font-medium text-left max-w-xl">
            Free your team from project management overhead. Our streamlined
            workflow lets you focus on writing code, not just tracking it.
          </p>
        </div>
        <Dialog>
          <DialogTrigger className="h-8 rounded-xl font-semibold border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50">
            Where Kanban meets git
          </DialogTrigger>
          <DialogContent className="rounded-2xl min-h-[50%] min-w-[60%]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                Are you absolutely sure?
              </DialogTitle>
              <DialogDescription className="text-lg">
                This action cannot be undone. This will permanently delete your
                account and remove your data from our servers.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
      <div>
        <HeroComponent />
      </div>
    </div>
  );
}
