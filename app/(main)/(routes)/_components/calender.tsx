"use client";

import { useEffect, useMemo, useState } from "react";
import { useProjects } from "@/hooks/use-projects";
import {
  useMeetings,
  useCreateMeeting,
  useDeleteMeeting,
} from "@/hooks/use-meetings";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
} from "lucide-react";
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
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ButtonGroup } from "@/components/ui/button-group";

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

type CalendarView = "month" | "week" | "day";

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
  const [calendarView, setCalendarView] = useState<CalendarView>("month");
  const [rangeText, setRangeText] = useState("");
  const [anchorDate, setAnchorDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );

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
    const meeting = meetings.find((m) => m.id === event?.id);
    if (meeting) {
      setSelectedMeeting(meeting);
      setIsViewDialogOpen(true);
    }
  };

  const updateRangeText = (baseDate: Date) => {
    if (calendarView === "month") {
      setRangeText(format(baseDate, "MMMM yyyy"));
      return;
    }

    if (calendarView === "week") {
      const rangeStart = startOfWeek(baseDate, { weekStartsOn: 1 });
      const rangeEnd = endOfWeek(baseDate, { weekStartsOn: 1 });
      setRangeText(
        `${format(rangeStart, "MMM d")} - ${format(
          rangeEnd,
          "MMM d, yyyy",
        )}`,
      );
      return;
    }

    setRangeText(format(baseDate, "PPP"));
  };

  const handleViewChange = (nextView: CalendarView) => {
    setCalendarView(nextView);
    updateRangeText(anchorDate);
  };

  const handlePrev = () => {
    setAnchorDate((current) => {
      const nextDate =
        calendarView === "month"
          ? addMonths(current, -1)
          : calendarView === "week"
            ? addWeeks(current, -1)
            : addDays(current, -1);
      updateRangeText(nextDate);
      return nextDate;
    });
  };

  const handleNext = () => {
    setAnchorDate((current) => {
      const nextDate =
        calendarView === "month"
          ? addMonths(current, 1)
          : calendarView === "week"
            ? addWeeks(current, 1)
            : addDays(current, 1);
      updateRangeText(nextDate);
      return nextDate;
    });
  };

  const handleToday = () => {
    const today = new Date();
    setAnchorDate(today);
    setSelectedDate(today);
    updateRangeText(today);
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

  const currentRange = useMemo(() => {
    if (calendarView === "month") {
      return {
        start: startOfMonth(anchorDate),
        end: endOfMonth(anchorDate),
      };
    }

    if (calendarView === "week") {
      return {
        start: startOfWeek(anchorDate, { weekStartsOn: 1 }),
        end: endOfWeek(anchorDate, { weekStartsOn: 1 }),
      };
    }

    return {
      start: anchorDate,
      end: anchorDate,
    };
  }, [anchorDate, calendarView]);

  const visibleMeetings = useMemo(
    () =>
      meetings
        .filter((meeting) => {
          const start = new Date(meeting.start_time);
          return isWithinInterval(start, currentRange);
        })
        .sort(
          (a, b) =>
            new Date(a.start_time).getTime() -
            new Date(b.start_time).getTime(),
        ),
    [meetings, currentRange],
  );

  const selectedDayMeetings = useMemo(() => {
    const date = selectedDate ?? anchorDate;
    return meetings
      .filter((meeting) => isSameDay(new Date(meeting.start_time), date))
      .sort(
        (a, b) =>
          new Date(a.start_time).getTime() -
          new Date(b.start_time).getTime(),
      );
  }, [meetings, selectedDate, anchorDate]);

  useEffect(() => {
    updateRangeText(anchorDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarView, anchorDate, meetings.length, theme]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center pb-4">
        <div className="flex justify-between space-x-4 gap-2">
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
          <ButtonGroup>
            <Button variant="outline" size="sm" onClick={handlePrev}>
              <ChevronLeft />
              Previous Month
            </Button>
            <Button variant="outline" size="sm" onClick={handleNext}>
              Next Month
              <ChevronRight />
            </Button>
          </ButtonGroup>

          <ButtonGroup>
            <Button
              variant={calendarView === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewChange("month")}
            >
              Month
            </Button>
            <Button
              variant={calendarView === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewChange("week")}
            >
              Week
            </Button>
            <Button
              variant={calendarView === "day" ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewChange("day")}
            >
              Day
            </Button>
          </ButtonGroup>
        </div>

        <div className="ml-auto flex items-center space-x-4">
          <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
              Schedule Meeting
          </Button>
        </div>
      </div>

      <div className="flex-1">
        <div className="h-full min-h-[70vh] rounded-xl border bg-card/80">
          <div className="grid h-full grid-cols-1 lg:grid-cols-[1.1fr_1.4fr]">
            <div className="flex h-full flex-col border-b lg:border-b-0 lg:border-r">
              <div className="flex-1 p-4">
                <CalendarPicker
                  mode="single"
                  selected={selectedDate}
                  month={anchorDate}
                  onMonthChange={(date) => setAnchorDate(date)}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    if (date) setAnchorDate(date);
                  }}
                  className="h-full w-full"
                />
              </div>
              <div className="border-t px-4 py-3">
                <p className="text-sm font-medium">
                  {selectedDate ? format(selectedDate, "PPP") : "Selected day"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedDayMeetings.length} meeting
                  {selectedDayMeetings.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <div className="flex h-full flex-col">
              <div className="border-b px-4 py-3">
                <p className="text-sm font-medium">
                  {calendarView === "day"
                    ? "Agenda for day"
                    : calendarView === "week"
                      ? "Agenda for week"
                      : "Agenda for month"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {visibleMeetings.length} meeting
                  {visibleMeetings.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex-1 overflow-auto p-4">
                {visibleMeetings.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                    <p className="text-sm text-muted-foreground">
                      No meetings scheduled for this period.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCreateDialogOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Schedule Meeting
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {visibleMeetings.map((meeting) => (
                      <button
                        key={meeting.id}
                        type="button"
                        onClick={() => handleEventClick(meeting)}
                        className="flex w-full items-start justify-between gap-4 rounded-lg border bg-card px-4 py-3 text-left transition hover:border-primary/40 hover:bg-accent"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {meeting.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(meeting.start_time), "PPP p")}
                            {meeting.end_time
                              ? ` - ${format(new Date(meeting.end_time), "p")}`
                              : ""}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
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
