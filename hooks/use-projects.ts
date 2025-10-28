"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Project, Database } from "@/lib/supabase/types";

function getSupabaseClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  ) as any;
}

export function useProjects() {
  const { user } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const supabase = getSupabaseClient();

      // First, get or create the user in our database
      const { data: dbUser } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", user.id)
        .single();

      if (!dbUser) {
        // Create user if doesn't exist
        const { data: newUser, error: createUserError } = await supabase
          .from("users")
          .insert({
            clerk_user_id: user.id,
          } as any)
          .select("id")
          .single();

        // if (createUserError || !newUser)
        //   throw new Error("Failed to create user");
      }

      // Fetch projects
      const { data, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("owner_id", (dbUser?.id as any) || "")
        .order("created_at", { ascending: false });

      if (projectsError) throw projectsError;

      setProjects((data as Project[]) || []);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProjects();

    // Subscribe to real-time changes
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel("projects-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => fetchProjects(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProjects]);

  return { projects, loading, error, refetch: fetchProjects };
}

export function useCreateProject() {
  const { user } = useUser();

  return useCallback(
    async (name: string, description?: string): Promise<Project> => {
      if (!user) throw new Error("User not authenticated");

      const supabase = getSupabaseClient();

      // Get or create user in database
      let { data: dbUser } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", user.id)
        .single();

      if (!dbUser) {
        const { data: newUser, error: createUserError } = await supabase
          .from("users")
          .insert({
            clerk_user_id: user.id,
          } as any)
          .select("id")
          .single();

        if (createUserError || !newUser)
          throw createUserError || new Error("Failed to create user");
        dbUser = newUser;
      }

      // Create project
      const { data, error } = await supabase
        .from("projects")
        .insert({
          name,
          description: description || null,
          owner_id: dbUser!.id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error("Failed to create project");

      // Create default columns for the project
      const defaultColumns = [
        { name: "Backlog", position: 0, color: "#94a3b8" },
        { name: "To Do", position: 1, color: "#60a5fa" },
        { name: "In Progress", position: 2, color: "#fbbf24" },
        { name: "Done", position: 3, color: "#34d399" },
      ];

      const { error: columnsError } = await supabase.from("columns").insert(
        defaultColumns.map((col) => ({
          ...col,
          project_id: (data as any).id,
        })) as any,
      );

      if (columnsError) throw columnsError;

      return data as Project;
    },
    [user],
  );
}

export function useDeleteProject() {
  return useCallback(async (projectId: string) => {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (error) throw error;
  }, []);
}

export function useUpdateProject() {
  return useCallback(
    async (
      projectId: string,
      updates: { name?: string; description?: string },
    ) => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", projectId)
        .select()
        .single();

      if (error) throw error;
      return data as Project;
    },
    [],
  );
}
