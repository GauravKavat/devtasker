"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client-singleton";

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
      const response = await fetch(`/api/meetings?projectId=${projectId}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch meetings");
      }

      const data = await response.json();
      setMeetings((data.meetings as any) || []);
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
    const response = await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(meetingData),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to create meeting");
    }

    const data = await response.json();
    return data.meeting as Meeting;
  };
}

export function useUpdateMeeting() {
  return async (id: string, updates: Partial<Meeting>) => {
    const response = await fetch(`/api/meetings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to update meeting");
    }

    const data = await response.json();
    return data.meeting as Meeting;
  };
}

export function useDeleteMeeting() {
  return async (id: string) => {
    const response = await fetch(`/api/meetings/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to delete meeting");
    }
  };
}
