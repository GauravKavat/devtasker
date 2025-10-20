import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import Sidebar from "@/app/(main)/(routes)/_components/sidebar";

export default async function Dashboard() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/unauthorized");
  }

  return (
    <div className="flex flex-row gap-x-4 w-full">
      <Sidebar />
      <div className="flex items-center">
        <h1>Welcome to Dashboard</h1>
      </div>
    </div>
  );
}
