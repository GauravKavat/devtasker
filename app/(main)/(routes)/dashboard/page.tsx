import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/unauthorized");
  }

  return (
    <div>
      <h1>Welcome to Dashboard</h1>
    </div>
  );
}
