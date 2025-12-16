"use client";

import * as React from "react";
import { useDropzone, type DropzoneOptions } from "react-dropzone";
import {
  Upload,
  X,
  File,
  FileImage,
  FileText,
  FileVideo,
  FileAudio,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface FileWithPreview extends File {
  preview?: string;
}

interface FileUploaderProps {
  onFilesChange?: (files: File[]) => void;
  onUpload?: (files: File[]) => Promise<void>;
  maxFiles?: number;
  maxSize?: number; // in bytes
  accept?: Record<string, string[]>;
  disabled?: boolean;
  className?: string;
  showPreview?: boolean;
}

function getFileIcon(file: File) {
  const type = file.type.split("/")[0];

  switch (type) {
    case "image":
      return <FileImage className="size-8 text-blue-500" />;
    case "video":
      return <FileVideo className="size-8 text-purple-500" />;
    case "audio":
      return <FileAudio className="size-8 text-green-500" />;
    case "text":
      return <FileText className="size-8 text-yellow-500" />;
    default:
      return <File className="size-8 text-gray-500" />;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

export function FileUploader({
  onFilesChange,
  onUpload,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB default
  accept,
  disabled = false,
  className,
  showPreview = true,
}: FileUploaderProps) {
  const [files, setFiles] = React.useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);

  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : undefined,
        }),
      );

      setFiles((prev) => {
        const combined = [...prev, ...newFiles];
        const limited = combined.slice(0, maxFiles);
        onFilesChange?.(limited);
        return limited;
      });
    },
    [maxFiles, onFilesChange],
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      maxFiles,
      maxSize,
      accept,
      disabled: disabled || uploading,
      multiple: maxFiles > 1,
    });

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const file = prev[index];
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      const updated = prev.filter((_, i) => i !== index);
      onFilesChange?.(updated);
      return updated;
    });
  };

  const handleUpload = async () => {
    if (!onUpload || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress (replace with actual upload progress if available)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      await onUpload(files);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Clear files after successful upload
      setTimeout(() => {
        files.forEach((file) => {
          if (file.preview) {
            URL.revokeObjectURL(file.preview);
          }
        });
        setFiles([]);
        setUploadProgress(0);
        setUploading(false);
      }, 500);
    } catch (error) {
      console.error("Upload failed:", error);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Cleanup previews on unmount
  React.useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          "hover:border-primary hover:bg-accent/50",
          isDragActive && "border-primary bg-accent",
          disabled && "opacity-50 cursor-not-allowed",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <Upload
            className={cn(
              "size-12 text-muted-foreground",
              isDragActive && "text-primary",
            )}
          />
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {isDragActive
                ? "Drop the files here"
                : "Drag & drop files here, or click to select"}
            </p>
            <p className="text-xs text-muted-foreground">
              {maxFiles > 1
                ? `Upload up to ${maxFiles} files`
                : "Upload a single file"}
              {maxSize && ` (max ${formatFileSize(maxSize)} each)`}
            </p>
          </div>
        </div>
      </div>

      {/* File Rejections */}
      {fileRejections.length > 0 && (
        <div className="space-y-1">
          {fileRejections.map(({ file, errors }) => (
            <div
              key={file.name}
              className="text-sm text-destructive bg-destructive/10 rounded-md p-2"
            >
              <p className="font-medium">{file.name}</p>
              {errors.map((error) => (
                <p key={error.code} className="text-xs">
                  {error.message}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Selected Files ({files.length}/{maxFiles})
            </p>
            {onUpload && (
              <Button
                size="sm"
                onClick={handleUpload}
                disabled={uploading || files.length === 0}
              >
                {uploading ? "Uploading..." : "Upload Files"}
              </Button>
            )}
          </div>

          {uploading && <Progress value={uploadProgress} className="h-2" />}

          <div className="grid gap-2">
            {files.map((file, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-start gap-3">
                  {/* File Icon/Preview */}
                  {showPreview && file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="size-16 object-cover rounded"
                      onLoad={() => {
                        // Free memory when image is loaded
                        if (file.preview) {
                          URL.revokeObjectURL(file.preview);
                        }
                      }}
                    />
                  ) : (
                    <div className="shrink-0">{getFileIcon(file)}</div>
                  )}

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  {/* Remove Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeFile(index)}
                    disabled={uploading}
                    className="shrink-0"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Common file type presets
export const FILE_TYPES = {
  images: {
    "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"],
  },
  documents: {
    "application/pdf": [".pdf"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
      ".docx",
    ],
    "text/plain": [".txt"],
  },
  videos: {
    "video/*": [".mp4", ".webm", ".ogg", ".mov"],
  },
  audio: {
    "audio/*": [".mp3", ".wav", ".ogg", ".m4a"],
  },
  all: undefined,
};
