"use client";

import { useState } from "react";
import { useProjects } from "@/hooks/use-projects";
import {
  useMeetings,
  useCreateMeeting,
  useDeleteMeeting,
} from "@/hooks/use-meetings";
import { Loader2, Plus, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import "@toast-ui/calendar/dist/toastui-calendar.min.css";

interface CalendarProps {
  projectId?: string;
}

interface MeetingFormData {
  title: string;
  description: string;
  startDate: Date | undefined;
  startTime: string;
  endDate: Date | undefined;
  endTime: string;
  attendees: string;
}

export default function Calendar({ projectId }: CalendarProps) {
  const { projects, loading: projectsLoading } = useProjects();
  const {
    meetings,
    loading: meetingsLoading,
    refetch,
  } = useMeetings(projectId);
  const createMeeting = useCreateMeeting();
  const deleteMeeting = useDeleteMeeting();
  const { user } = useUser();
  const { theme } = useTheme();

  const project = projects.find((p) => p.id === projectId);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<MeetingFormData>({
    title: "",
    description: "",
    startDate: undefined,
    startTime: "09:00",
    endDate: undefined,
    endTime: "10:00",
    attendees: "",
  });

  const handleCreateMeeting = async () => {
    if (!projectId || !user || !formData.startDate || !formData.endDate) return;

    try {
      setIsSubmitting(true);

      const [startHour, startMinute] = formData.startTime.split(":");
      const startDateTime = new Date(formData.startDate);
      startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

      const [endHour, endMinute] = formData.endTime.split(":");
      const endDateTime = new Date(formData.endDate);
      endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

      const attendeesList = formData.attendees
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email.length > 0);

      await createMeeting({
        project_id: projectId,
        title: formData.title,
        description: formData.description || null,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        created_by: user.id,
        attendees: attendeesList.length > 0 ? attendeesList : null,
        google_calendar_event_id: null,
      });

      setFormData({
        title: "",
        description: "",
        startDate: undefined,
        startTime: "09:00",
        endDate: undefined,
        endTime: "10:00",
        attendees: "",
      });

      setIsCreateDialogOpen(false);
      refetch();
    } catch (error) {
      console.error("Error creating meeting:", error);
      alert("Failed to create meeting");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEventClick = (event: any) => {
    const meeting = meetings.find((m) => m.id === event.id);
    if (meeting) {
      setSelectedMeeting(meeting);
      setIsViewDialogOpen(true);
    }
  };

  const handleDeleteMeeting = async () => {
    if (!selectedMeeting) return;

    if (!confirm("Are you sure you want to delete this meeting?")) return;

    try {
      setIsSubmitting(true);
      await deleteMeeting(selectedMeeting.id);
      setIsViewDialogOpen(false);
      setSelectedMeeting(null);
      refetch();
    } catch (error) {
      console.error("Error deleting meeting:", error);
      alert("Failed to delete meeting");
    } finally {
      setIsSubmitting(false);
    }
  };

  const loading = projectsLoading || meetingsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-end mb-4 px-4 pt-4">
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Meeting
        </Button>
      </div>

      <div className="flex-1 px-4 pb-4">
        <div className="border rounded-lg p-8 bg-card">
          <p className="text-center text-muted-foreground">
            Calendar component placeholder
          </p>
        </div>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Schedule a Meeting</DialogTitle>
            <DialogDescription>
              Create a new meeting for your team.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Meeting Title</Label>
              <Input
                id="title"
                placeholder="Daily Standup"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Discuss project progress..."
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !formData.startDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate
                        ? format(formData.startDate, "PPP")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarPicker
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) =>
                        setFormData({ ...formData, startDate: date })
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !formData.endDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate
                        ? format(formData.endDate, "PPP")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarPicker
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) =>
                        setFormData({ ...formData, endDate: date })
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="attendees">
                Attendees (comma-separated emails)
              </Label>
              <Input
                id="attendees"
                placeholder="john@example.com, jane@example.com"
                value={formData.attendees}
                onChange={(e) =>
                  setFormData({ ...formData, attendees: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateMeeting}
              disabled={
                !formData.title ||
                !formData.startDate ||
                !formData.endDate ||
                isSubmitting
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Meeting"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedMeeting?.title}</DialogTitle>
            <DialogDescription>
              {selectedMeeting?.description || "No description"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Start Time</Label>
              <p className="text-sm">
                {selectedMeeting &&
                  format(new Date(selectedMeeting.start_time), "PPP p")}
              </p>
            </div>
            <div className="grid gap-2">
              <Label>End Time</Label>
              <p className="text-sm">
                {selectedMeeting &&
                  selectedMeeting.end_time &&
                  format(new Date(selectedMeeting.end_time), "PPP p")}
              </p>
            </div>
            {selectedMeeting?.attendees &&
              selectedMeeting.attendees.length > 0 && (
                <div className="grid gap-2">
                  <Label>Attendees</Label>
                  <p className="text-sm">
                    {selectedMeeting.attendees.join(", ")}
                  </p>
                </div>
              )}
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={handleDeleteMeeting}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete Meeting
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
