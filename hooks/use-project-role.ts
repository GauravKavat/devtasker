"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "@/lib/supabase/client-singleton";

async function ensureUser(clerkUserId: string) {
  const supabase = getSupabaseClient();

  let { data: dbUser } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (!dbUser) {
    const { data: newUser } = await supabase
      .from("users")
      .insert({ clerk_user_id: clerkUserId } as any)
      .select("id")
      .single();
    dbUser = newUser;
  }

  return dbUser;
}

async function fetchUserRole(projectId: string, clerkUserId: string) {
  const supabase = getSupabaseClient();
  const dbUser = await ensureUser(clerkUserId);

  if (!dbUser) return null;

  const { data, error } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", (dbUser as any).id)
    .single();

  if (error) return null;
  return (data as any)?.role || null;
}

export function useProjectRole(projectId: string) {
  const { user } = useUser();

  const query = useQuery({
    queryKey: ["project-role", projectId, user?.id],
    queryFn: () => fetchUserRole(projectId, user!.id),
    enabled: !!projectId && !!user,
  });

  const role = query.data;
  const isAdmin = role === "admin";
  const isMember = role === "member";
  const hasAccess = isAdmin || isMember;

  return {
    role,
    isAdmin,
    isMember,
    hasAccess,
    loading: query.isLoading,
  };
}
