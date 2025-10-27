"use client";

import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from "@/components/ui/shadcn-io/kanban";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Plus, CalendarIcon } from "lucide-react";
import { format } from "date-fns";

type BackgroundColor = string;

type Column = {
  id: string;
  name: string;
  color?: BackgroundColor;
};

type Feature = {
  id: string;
  name: string;
  column: string;
  description?: string;
  startAt: Date;
  endAt: Date;
  owner?: {
    name: string;
    image: string;
  };
};

const columns: Column[] = [
  { id: "backlog", name: "Backlog", color: "#94a3b8" },
  { id: "todo", name: "To Do", color: "#60a5fa" },
  { id: "in-progress", name: "In Progress", color: "#fbbf24" },
  { id: "done", name: "Done", color: "#34d399" },
];

const initialFeatures: Feature[] = [
  {
    id: "1",
    name: "User Authentication",
    column: "backlog",
    startAt: new Date(2024, 0, 15),
    endAt: new Date(2024, 0, 30),
    owner: {
      name: "John Doe",
      image: "https://github.com/shadcn.png",
    },
  },
  {
    id: "2",
    name: "Dashboard UI",
    column: "todo",
    startAt: new Date(2024, 1, 1),
    endAt: new Date(2024, 1, 15),
    owner: {
      name: "Jane Smith",
      image: "https://github.com/vercel.png",
    },
  },
  {
    id: "3",
    name: "API Integration",
    column: "in-progress",
    startAt: new Date(2024, 1, 5),
    endAt: new Date(2024, 1, 20),
  },
  {
    id: "4",
    name: "Testing Suite",
    column: "done",
    startAt: new Date(2024, 0, 1),
    endAt: new Date(2024, 0, 14),
    owner: {
      name: "Bob Johnson",
      image: "https://github.com/github.png",
    },
  },
];

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default function Kanban() {
  const [features, setFeatures] = useState<Feature[]>(initialFeatures);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  });
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  const handleAddTask = () => {
    if (!newTask.title || !newTask.startDate || !newTask.endDate) {
      return;
    }

    const task: Feature = {
      id: Date.now().toString(),
      name: newTask.title,
      description: newTask.description,
      column: selectedColumn,
      startAt: newTask.startDate,
      endAt: newTask.endDate,
    };

    setFeatures([...features, task]);
    setIsDialogOpen(false);
    setNewTask({
      title: "",
      description: "",
      startDate: undefined,
      endDate: undefined,
    });
    setShowStartCalendar(false);
    setShowEndCalendar(false);
  };

  const openDialog = (columnId: string) => {
    setSelectedColumn(columnId);
    setIsDialogOpen(true);
  };

  return (
    <>
      <KanbanProvider
        columns={columns}
        data={features}
        onDataChange={setFeatures}
      >
        {(column) => (
          <KanbanBoard id={column.id} key={column.id}>
            <KanbanHeader>
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: column.color }}
                />
                <span>{column.name}</span>
              </div>
            </KanbanHeader>
            <KanbanCards id={column.id}>
              {(feature: (typeof features)[number]) => (
                <KanbanCard
                  column={column.id}
                  id={feature.id}
                  key={feature.id}
                  name={feature.name}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <p className="m-0 flex-1 font-medium text-sm">
                        {feature.name}
                      </p>
                      {feature.description && (
                        <p className="m-0 text-muted-foreground text-xs">
                          {feature.description}
                        </p>
                      )}
                    </div>
                    {feature.owner && (
                      <Avatar className="h-4 w-4 shrink-0">
                        <AvatarImage src={feature.owner.image} />
                        <AvatarFallback>
                          {feature.owner.name?.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                  <p className="m-0 text-muted-foreground text-xs">
                    {shortDateFormatter.format(feature.startAt)} -{" "}
                    {dateFormatter.format(feature.endAt)}
                  </p>
                </KanbanCard>
              )}
            </KanbanCards>
            <div className="px-2 pb-2 pt-2">
              <button
                onClick={() => openDialog(column.id)}
                className="w-full cursor-pointer gap-4 rounded-md border-2 border-dashed border-muted-foreground/25 bg-transparent px-3 py-4 shadow-sm transition-colors hover:border-muted-foreground/50 hover:bg-muted/50"
              >
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Plus className="h-4 w-4" />
                  <span className="text-sm">Add Task</span>
                </div>
              </button>
            </div>
          </KanbanBoard>
        )}
      </KanbanProvider>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>
              Create a new task in the{" "}
              {columns.find((c) => c.id === selectedColumn)?.name} column.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
                placeholder="Enter task title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Task Description</Label>
              <Input
                id="description"
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
                placeholder="Enter task description (optional)"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <div className="relative">
                  <Button
                    id="startDate"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    onClick={() => setShowStartCalendar(!showStartCalendar)}
                    type="button"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newTask.startDate ? (
                      format(newTask.startDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                  {showStartCalendar && (
                    <div className="absolute top-full left-0 z-50 mt-2 rounded-md border bg-popover p-0 shadow-md">
                      <Calendar
                        mode="single"
                        selected={newTask.startDate}
                        onSelect={(date) => {
                          setNewTask({ ...newTask, startDate: date });
                          setShowStartCalendar(false);
                        }}
                        initialFocus
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date</Label>
                <div className="relative">
                  <Button
                    id="endDate"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    onClick={() => setShowEndCalendar(!showEndCalendar)}
                    type="button"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newTask.endDate ? (
                      format(newTask.endDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                  {showEndCalendar && (
                    <div className="absolute top-full left-0 z-50 mt-2 rounded-md border bg-popover p-0 shadow-md">
                      <Calendar
                        mode="single"
                        selected={newTask.endDate}
                        onSelect={(date) => {
                          setNewTask({ ...newTask, endDate: date });
                          setShowEndCalendar(false);
                        }}
                        initialFocus
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTask}>Add Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
