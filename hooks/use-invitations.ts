"use client";

import { useCallback, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateInvitation() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      projectId,
      email,
      role,
    }: {
      projectId: string;
      email: string;
      role?: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const response = await fetch("/api/invitations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, email, role: role || "member" }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create invitation");
      }

      return response.json();
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["project-members", variables.projectId],
      });
    },
  });

  return useCallback(
    async (projectId: string, email: string, role?: string) => {
      return await mutation.mutateAsync({ projectId, email, role });
    },
    [mutation]
  );
}

export function useAcceptInvitation() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptInvitation = useCallback(
    async (token: string) => {
      if (!user) throw new Error("User not authenticated");

      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/invitations/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to accept invitation");
        }

        const data = await response.json();
        return data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  return { acceptInvitation, loading, error };
}

export function useVerifyInvitation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyInvitation = useCallback(async (token: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/invitations/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Invalid invitation");
      }

      const data = await response.json();
      return data.invitation;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { verifyInvitation, loading, error };
}
