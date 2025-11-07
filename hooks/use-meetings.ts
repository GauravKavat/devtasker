"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client-singleton";
import { useUser } from "@clerk/nextjs";

export interface Meeting {
  id: string;
  project_id: string;
  title: string;
  description?: string | null;
  start_time: string;
  end_time?: string | null;
  created_by: string;
  created_at: string;
  attendees?: string[] | null;
  google_calendar_event_id?: string | null;
}

export function useMeetings(projectId?: string) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    if (!projectId) {
      setMeetings([]);
      setLoading(false);
      return;
    }

    fetchMeetings();

    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`meetings-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meetings",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchMeetings();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const fetchMeetings = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from("meetings")
        .select("*")
        .eq("project_id", projectId)
        .order("start_time", { ascending: true });

      if (error) throw error;
      setMeetings((data as any) || []);
    } catch (err) {
      console.error("Error fetching meetings:", err);
    } finally {
      setLoading(false);
    }
  };

  return { meetings, loading, refetch: fetchMeetings };
}

export function useCreateMeeting() {
  return async (meetingData: {
    project_id: string;
    title: string;
    description?: string | null;
    start_time: string;
    end_time?: string | null;
    created_by: string;
    attendees?: string[] | null;
    google_calendar_event_id?: string | null;
  }) => {
    const supabase = getSupabaseClient();

    // @ts-ignore - meetings table types
    const { data, error } = await supabase
      .from("meetings")
      // @ts-ignore
      .insert(meetingData)
      .select()
      .single();

    if (error) throw error;
    return data as Meeting;
  };
}

export function useUpdateMeeting() {
  return async (id: string, updates: Partial<Meeting>) => {
    const supabase = getSupabaseClient();

    // @ts-ignore - meetings table types
    const { data, error } = await supabase
      .from("meetings")
      // @ts-ignore
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Meeting;
  };
}

export function useDeleteMeeting() {
  return async (id: string) => {
    const supabase = getSupabaseClient();

    // @ts-ignore - meetings table types
    const { error } = await supabase
      .from("meetings")
      // @ts-ignore
      .delete()
      .eq("id", id);

    if (error) throw error;
  };
}
