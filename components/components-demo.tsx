"use client";

import * as React from "react";
import { TaskForm, type TaskFormValues } from "@/components/task-form";
import { TaskDialog } from "@/components/task-dialog";
import { RichTextEditor } from "@/components/rich-text-editor";
import {
  LineChartCard,
  BarChartCard,
  AreaChartCard,
  PieChartCard,
  DonutChartCard,
  type LineChartData,
  type BarChartData,
  type AreaChartData,
  type PieChartData,
} from "@/components/charts";
import { FileUploader, FILE_TYPES } from "@/components/file-uploader";
import { TimePicker, TimeInput } from "@/components/time-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

// Sample data for charts
const lineChartData: LineChartData[] = [
  { name: "Mon", tasks: 12, completed: 8 },
  { name: "Tue", tasks: 15, completed: 11 },
  { name: "Wed", tasks: 18, completed: 14 },
  { name: "Thu", tasks: 14, completed: 10 },
  { name: "Fri", tasks: 20, completed: 16 },
  { name: "Sat", tasks: 8, completed: 6 },
  { name: "Sun", tasks: 5, completed: 4 },
];

const barChartData: BarChartData[] = [
  { name: "Backlog", count: 24 },
  { name: "Todo", count: 18 },
  { name: "In Progress", count: 12 },
  { name: "Review", count: 8 },
  { name: "Done", count: 45 },
];

const areaChartData: AreaChartData[] = [
  { name: "Week 1", bugs: 15, features: 8, improvements: 5 },
  { name: "Week 2", bugs: 12, features: 12, improvements: 7 },
  { name: "Week 3", bugs: 8, features: 15, improvements: 10 },
  { name: "Week 4", bugs: 5, features: 18, improvements: 12 },
];

const pieChartData: PieChartData[] = [
  { name: "Frontend", value: 35, color: "#3b82f6" },
  { name: "Backend", value: 28, color: "#10b981" },
  { name: "Design", value: 18, color: "#f59e0b" },
  { name: "Testing", value: 12, color: "#ef4444" },
  { name: "DevOps", value: 7, color: "#8b5cf6" },
];

export default function ComponentsDemo() {
  const toast = useToast();
  const [taskDialogOpen, setTaskDialogOpen] = React.useState(false);
  const [richTextContent, setRichTextContent] = React.useState(
    "<h2>Welcome to the Rich Text Editor</h2><p>This is a <strong>powerful</strong> editor built with <em>Tiptap</em>. You can:</p><ul><li>Format text with <strong>bold</strong>, <em>italic</em>, and <code>code</code></li><li>Create lists and headings</li><li>Add links and quotes</li></ul><blockquote>Try editing this content!</blockquote>",
  );
  const [selectedTime, setSelectedTime] = React.useState<Date | undefined>(
    new Date(),
  );
  const [uploadedFiles, setUploadedFiles] = React.useState<File[]>([]);

  const handleTaskSubmit = async (values: TaskFormValues) => {
    console.log("Task submitted:", values);
    toast.success(
      "Task created successfully!",
      `Task "${values.title}" has been added.`,
    );
  };

  const handleFileUpload = async (files: File[]) => {
    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log("Files uploaded:", files);
    toast.success(
      "Files uploaded successfully!",
      `${files.length} file(s) uploaded.`,
    );
  };

  const showToasts = () => {
    toast.success("Success!", "This is a success message.");
    setTimeout(() => {
      toast.error("Error!", "This is an error message.");
    }, 1000);
    setTimeout(() => {
      toast.warning("Warning!", "This is a warning message.");
    }, 2000);
    setTimeout(() => {
      toast.info("Info!", "This is an info message.");
    }, 3000);
  };

  const showPromiseToast = () => {
    const promise = new Promise((resolve) => setTimeout(resolve, 2000));
    toast.promise(promise, {
      loading: "Loading...",
      success: "Operation completed!",
      error: "Operation failed!",
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Components Demo</h1>
        <p className="text-muted-foreground">
          Explore all the newly implemented components with React Hook Form,
          Tiptap, Recharts, Sonner, react-dropzone, and custom time picker.
        </p>
      </div>

      <Separator />

      <Tabs defaultValue="task-form" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="task-form">Task Form</TabsTrigger>
          <TabsTrigger value="rich-text">Rich Text</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="toasts">Toasts</TabsTrigger>
          <TabsTrigger value="file-upload">File Upload</TabsTrigger>
          <TabsTrigger value="time-picker">Time Picker</TabsTrigger>
        </TabsList>

        {/* Task Form Tab */}
        <TabsContent value="task-form" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Creation Form</CardTitle>
              <p className="text-sm text-muted-foreground">
                React Hook Form with Zod validation, date pickers, and select
                components.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <TaskForm onSubmit={handleTaskSubmit} submitLabel="Create Task" />

              <Separator />

              <div>
                <h3 className="font-medium mb-2">Or use in a Dialog:</h3>
                <Button onClick={() => setTaskDialogOpen(true)}>
                  Open Task Dialog
                </Button>
                <TaskDialog
                  open={taskDialogOpen}
                  onOpenChange={setTaskDialogOpen}
                  onSubmit={handleTaskSubmit}
                  mode="create"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rich Text Editor Tab */}
        <TabsContent value="rich-text" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rich Text Editor</CardTitle>
              <p className="text-sm text-muted-foreground">
                Full-featured rich text editor with Tiptap, supporting
                formatting, links, lists, and more.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <RichTextEditor
                content={richTextContent}
                onChange={setRichTextContent}
                placeholder="Start typing your content..."
                minHeight="300px"
              />

              <div className="space-y-2">
                <p className="text-sm font-medium">HTML Output:</p>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                  {richTextContent}
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Read-only Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                content={richTextContent}
                editable={false}
                minHeight="200px"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <LineChartCard
              title="Task Completion Trend"
              description="Weekly task completion overview"
              data={lineChartData}
              dataKeys={[
                { key: "tasks", name: "Total Tasks", color: "#3b82f6" },
                { key: "completed", name: "Completed", color: "#10b981" },
              ]}
              height={300}
            />

            <BarChartCard
              title="Tasks by Status"
              description="Current task distribution"
              data={barChartData}
              dataKeys={[{ key: "count", name: "Tasks", color: "#8b5cf6" }]}
              height={300}
            />

            <AreaChartCard
              title="Work Items by Type"
              description="Monthly breakdown of work items"
              data={areaChartData}
              dataKeys={[
                { key: "bugs", name: "Bugs", color: "#ef4444" },
                { key: "features", name: "Features", color: "#3b82f6" },
                { key: "improvements", name: "Improvements", color: "#10b981" },
              ]}
              height={300}
              stacked
            />

            <PieChartCard
              title="Team Workload"
              description="Distribution by department"
              data={pieChartData}
              height={300}
              valueFormatter={(value) => `${value}%`}
            />

            <DonutChartCard
              title="Project Progress"
              description="Overall project completion"
              data={[
                { name: "Completed", value: 65, color: "#10b981" },
                { name: "Remaining", value: 35, color: "#e5e7eb" },
              ]}
              height={300}
              valueFormatter={(value) => `${value}%`}
            />
          </div>
        </TabsContent>

        {/* Toasts Tab */}
        <TabsContent value="toasts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Toast Notifications</CardTitle>
              <p className="text-sm text-muted-foreground">
                Global toast notification system using Sonner with different
                variants.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <Button onClick={showToasts} variant="outline">
                  Show All Toast Types
                </Button>
                <Button onClick={showPromiseToast} variant="outline">
                  Show Promise Toast
                </Button>
                <Button
                  onClick={() =>
                    toast.success(
                      "Success!",
                      "Operation completed successfully.",
                    )
                  }
                  variant="outline"
                >
                  Success Toast
                </Button>
                <Button
                  onClick={() => toast.error("Error!", "Something went wrong.")}
                  variant="outline"
                >
                  Error Toast
                </Button>
                <Button
                  onClick={() =>
                    toast.warning("Warning!", "Please review this action.")
                  }
                  variant="outline"
                >
                  Warning Toast
                </Button>
                <Button
                  onClick={() =>
                    toast.info("Info", "Here's some information for you.")
                  }
                  variant="outline"
                >
                  Info Toast
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* File Upload Tab */}
        <TabsContent value="file-upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>File Uploader</CardTitle>
              <p className="text-sm text-muted-foreground">
                Drag and drop file uploader with react-dropzone, supporting
                multiple files and previews.
              </p>
            </CardHeader>
            <CardContent>
              <FileUploader
                onFilesChange={setUploadedFiles}
                onUpload={handleFileUpload}
                maxFiles={5}
                maxSize={10 * 1024 * 1024} // 10MB
                showPreview
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Images Only</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUploader
                onFilesChange={setUploadedFiles}
                maxFiles={3}
                maxSize={5 * 1024 * 1024}
                accept={FILE_TYPES.images}
                showPreview
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documents Only</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUploader
                onFilesChange={(files) => {
                  console.log("Documents selected:", files);
                  toast.info(
                    "Documents selected",
                    `${files.length} document(s) ready for upload.`,
                  );
                }}
                maxFiles={5}
                accept={FILE_TYPES.documents}
                showPreview={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Picker Tab */}
        <TabsContent value="time-picker" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Time Picker</CardTitle>
              <p className="text-sm text-muted-foreground">
                Custom time picker component using Radix UI Popover and Input
                components.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Popover Time Picker</h3>
                <TimePicker
                  value={selectedTime}
                  onChange={(date) => {
                    setSelectedTime(date);
                    if (date) {
                      toast.success(
                        "Time selected",
                        `You selected: ${date.toLocaleTimeString()}`,
                      );
                    }
                  }}
                  placeholder="Select a time"
                  className="max-w-xs"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-medium">Inline Time Input</h3>
                <TimeInput
                  value={selectedTime}
                  onChange={setSelectedTime}
                  className="max-w-xs"
                />
              </div>

              {selectedTime && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm">
                    <strong>Selected Time:</strong>{" "}
                    {selectedTime.toLocaleTimeString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ISO String: {selectedTime.toISOString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Meeting Scheduler Example</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Time</label>
                  <TimePicker value={selectedTime} onChange={setSelectedTime} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Time</label>
                  <TimePicker
                    value={
                      selectedTime
                        ? new Date(selectedTime.getTime() + 60 * 60 * 1000)
                        : undefined
                    }
                    onChange={() => {}}
                  />
                </div>
              </div>
              <Button className="w-full">Schedule Meeting</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
