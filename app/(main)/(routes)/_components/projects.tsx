"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useProjects,
  useCreateProject,
  useDeleteProject,
  useUpdateProject,
} from "@/hooks/use-projects";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Plus,
  Loader2,
  Trash2,
  FolderKanban,
  Pen,
  Calendar as CalendarIcon,
  Copy,
  Check,
} from "lucide-react";
import { createSlug } from "@/lib/utils";
import { format } from "date-fns";

export default function Projects() {
  const router = useRouter();
  const { projects, loading, error } = useProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const updateProject = useUpdateProject();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isProjectIdDialogOpen, setIsProjectIdDialogOpen] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for create dialog
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    startDate: undefined as Date | undefined,
    deadline: undefined as Date | undefined,
  });

  // State for edit dialog
  const [editProject, setEditProject] = useState({
    name: "",
    description: "",
    startDate: undefined as Date | undefined,
    deadline: undefined as Date | undefined,
  });

  // Track which calendar is open (only one at a time)
  const [openCalendar, setOpenCalendar] = useState<string | null>(null);

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      alert("Please enter a project name");
      return;
    }

    if (!newProject.deadline) {
      alert("Please select a project deadline");
      return;
    }

    setIsSubmitting(true);
    try {
      const startDate = newProject.startDate
        ? newProject.startDate.toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      const deadline = newProject.deadline.toISOString().split("T")[0];

      const result = await createProject(
        newProject.name,
        newProject.description,
        startDate,
        deadline,
      );

      setIsCreateDialogOpen(false);
      setNewProject({
        name: "",
        description: "",
        startDate: undefined,
        deadline: undefined,
      });
      setOpenCalendar(null);

      // Show the project ID dialog
      if (result && (result as any).id) {
        setCreatedProjectId((result as any).id);
        setIsProjectIdDialogOpen(true);
      }
    } catch (err) {
      console.error("Failed to create project:", err, JSON.stringify(err));
      alert(
        `Failed to create project: ${(err as any).message || JSON.stringify(err)}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyProjectId = async () => {
    try {
      await navigator.clipboard.writeText(createdProjectId);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      alert("Failed to copy project ID");
    }
  };

  const handleEditProject = async () => {
    if (!editProject.name.trim()) {
      alert("Please enter a project name");
      return;
    }

    if (!projectToEdit) return;

    setIsSubmitting(true);
    try {
      const startDate = editProject.startDate
        ? editProject.startDate.toISOString().split("T")[0]
        : projectToEdit.start_date || new Date().toISOString().split("T")[0];

      const deadline = editProject.deadline
        ? editProject.deadline.toISOString().split("T")[0]
        : projectToEdit.deadline;

      await updateProject(projectToEdit.id, {
        name: editProject.name,
        description: editProject.description,
        start_date: startDate,
        deadline: deadline,
      });
      setIsEditDialogOpen(false);
      setProjectToEdit(null);
      setEditProject({
        name: "",
        description: "",
        startDate: undefined,
        deadline: undefined,
      });
      setOpenCalendar(null);
    } catch (err) {
      console.error("Failed to update project:", err);
      alert("Failed to update project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    setIsSubmitting(true);
    try {
      await deleteProject(projectToDelete);
      setIsDeleteDialogOpen(false);
      setProjectToDelete(null);
    } catch (err) {
      console.error("Failed to delete project:", err);
      alert("Failed to delete project");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive">Failed to load projects</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage and organize your projects
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
            <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              Get started by creating your first project. Projects help you
              organize tasks and collaborate with your team.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() =>
                router.push(`/projects/${createSlug(project.name)}`)
              }
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{project.name}</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectToEdit(project);
                        setEditProject({
                          name: project.name,
                          description: project.description || "",
                          startDate: project.start_date
                            ? new Date(project.start_date)
                            : undefined,
                          deadline: project.deadline
                            ? new Date(project.deadline)
                            : undefined,
                        });
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Pen className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectToDelete(project.id);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
                {project.description && (
                  <CardDescription className="line-clamp-2">
                    {project.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pb-2">
                {project.deadline && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarIcon className="h-4 w-4" />
                    <span>
                      Deadline:{" "}
                      {format(new Date(project.deadline), "MMM d, yyyy")}
                    </span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground">
                Created {format(new Date(project.created_at), "MMM d, yyyy")}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create Project Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add a new project to organize your tasks and workflows.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Project Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={newProject.name}
                onChange={(e) =>
                  setNewProject({ ...newProject, name: e.target.value })
                }
                placeholder="Enter project name"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newProject.description}
                onChange={(e) =>
                  setNewProject({ ...newProject, description: e.target.value })
                }
                placeholder="Enter project description (optional)"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Popover
                open={openCalendar === "create-start"}
                onOpenChange={(open) =>
                  setOpenCalendar(open ? "create-start" : null)
                }
              >
                <PopoverTrigger asChild>
                  <Button
                    id="start-date"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    type="button"
                    disabled={isSubmitting}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newProject.startDate ? (
                      format(newProject.startDate, "PPP")
                    ) : (
                      <span>Pick a date (defaults to today)</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={newProject.startDate}
                    onSelect={(date) => {
                      setNewProject({ ...newProject, startDate: date });
                      setOpenCalendar(null);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="deadline">
                Deadline <span className="text-destructive">*</span>
              </Label>
              <Popover
                open={openCalendar === "create-deadline"}
                onOpenChange={(open) =>
                  setOpenCalendar(open ? "create-deadline" : null)
                }
              >
                <PopoverTrigger asChild>
                  <Button
                    id="deadline"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    type="button"
                    disabled={isSubmitting}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newProject.deadline ? (
                      format(newProject.deadline, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={newProject.deadline}
                    onSelect={(date) => {
                      setNewProject({ ...newProject, deadline: date });
                      setOpenCalendar(null);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setOpenCalendar(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={
                isSubmitting || !newProject.name || !newProject.deadline
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update your project details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">
                Project Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-name"
                value={editProject.name}
                onChange={(e) =>
                  setEditProject({ ...editProject, name: e.target.value })
                }
                placeholder="Enter project name"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={editProject.description}
                onChange={(e) =>
                  setEditProject({
                    ...editProject,
                    description: e.target.value,
                  })
                }
                placeholder="Enter project description (optional)"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-start-date">Start Date</Label>
              <Popover
                open={openCalendar === "edit-start"}
                onOpenChange={(open) =>
                  setOpenCalendar(open ? "edit-start" : null)
                }
              >
                <PopoverTrigger asChild>
                  <Button
                    id="edit-start-date"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    type="button"
                    disabled={isSubmitting}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editProject.startDate ? (
                      format(editProject.startDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={editProject.startDate}
                    onSelect={(date) => {
                      setEditProject({ ...editProject, startDate: date });
                      setOpenCalendar(null);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-deadline">
                Deadline <span className="text-destructive">*</span>
              </Label>
              <Popover
                open={openCalendar === "edit-deadline"}
                onOpenChange={(open) =>
                  setOpenCalendar(open ? "edit-deadline" : null)
                }
              >
                <PopoverTrigger asChild>
                  <Button
                    id="edit-deadline"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    type="button"
                    disabled={isSubmitting}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editProject.deadline ? (
                      format(editProject.deadline, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={editProject.deadline}
                    onSelect={(date) => {
                      setEditProject({ ...editProject, deadline: date });
                      setOpenCalendar(null);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setOpenCalendar(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditProject}
              disabled={isSubmitting || !editProject.name}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              project and all associated data including columns, tasks, and
              meetings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Project"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Project Created Success Dialog with Project ID */}
      <AlertDialog
        open={isProjectIdDialogOpen}
        onOpenChange={setIsProjectIdDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Project Created Successfully! 🎉
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your project has been created. Here is your Project ID for
              reference:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              <code className="flex-1 text-sm font-mono break-all">
                {createdProjectId}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyProjectId}
                className="shrink-0"
              >
                {isCopied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Save this ID if you need it for API integrations or references.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setIsProjectIdDialogOpen(false);
                setCreatedProjectId("");
                setIsCopied(false);
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
