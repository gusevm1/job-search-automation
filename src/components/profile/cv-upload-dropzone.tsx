"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CVUploadDropzoneProps {
  onUploadComplete?: (file: File, response: UploadResponse) => void;
  onUploadError?: (error: string) => void;
  maxSizeMB?: number;
  className?: string;
}

interface UploadResponse {
  success: boolean;
  userId?: string;
  filename?: string;
  fileSize?: number;
  message?: string;
}

type UploadStatus = "idle" | "dragging" | "uploading" | "success" | "error";

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
};

const ACCEPTED_EXTENSIONS = [".pdf", ".docx"];

export function CVUploadDropzone({
  onUploadComplete,
  onUploadError,
  maxSizeMB = 10,
  className,
}: CVUploadDropzoneProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file type
      const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
      if (!ACCEPTED_EXTENSIONS.includes(extension)) {
        return `Invalid file type. Please upload a PDF or DOCX file.`;
      }

      // Check file size
      if (file.size > maxSizeBytes) {
        return `File too large. Maximum size is ${maxSizeMB}MB.`;
      }

      return null;
    },
    [maxSizeBytes, maxSizeMB]
  );

  const uploadFile = useCallback(
    async (file: File) => {
      setStatus("uploading");
      setProgress(0);
      setErrorMessage(null);

      const formData = new FormData();
      formData.append("cv", file);

      try {
        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 10, 90));
        }, 200);

        const response = await fetch("/api/profile/upload", {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);
        setProgress(100);

        const data: UploadResponse = await response.json();

        if (data.success) {
          setStatus("success");
          onUploadComplete?.(file, data);
        } else {
          throw new Error(data.message || "Upload failed");
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed";
        setStatus("error");
        setErrorMessage(message);
        onUploadError?.(message);
      }
    },
    [onUploadComplete, onUploadError]
  );

  const handleFile = useCallback(
    (file: File) => {
      const error = validateFile(file);
      if (error) {
        setStatus("error");
        setErrorMessage(error);
        onUploadError?.(error);
        return;
      }

      setSelectedFile(file);
      uploadFile(file);
    },
    [validateFile, uploadFile, onUploadError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setStatus("idle");

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setStatus("dragging");
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setStatus("idle");
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleClick = useCallback(() => {
    if (status !== "uploading") {
      fileInputRef.current?.click();
    }
  }, [status]);

  const handleReset = useCallback(() => {
    setStatus("idle");
    setSelectedFile(null);
    setErrorMessage(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-all cursor-pointer",
          status === "idle" && "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          status === "dragging" && "border-primary bg-primary/5",
          status === "uploading" && "border-primary/50 bg-muted/30 cursor-wait",
          status === "success" && "border-green-500/50 bg-green-500/5",
          status === "error" && "border-destructive/50 bg-destructive/5"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Idle State */}
        {status === "idle" && (
          <>
            <div className="rounded-full bg-muted p-4 mb-4">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium mb-1">Drop your CV here</p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              PDF or DOCX, max {maxSizeMB}MB
            </p>
          </>
        )}

        {/* Dragging State */}
        {status === "dragging" && (
          <>
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Upload className="h-8 w-8 text-primary animate-bounce" />
            </div>
            <p className="text-lg font-medium text-primary">Drop to upload</p>
          </>
        )}

        {/* Uploading State */}
        {status === "uploading" && selectedFile && (
          <>
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{selectedFile.name}</span>
            </div>
            <div className="w-full max-w-xs bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Uploading... {progress}%
            </p>
          </>
        )}

        {/* Success State */}
        {status === "success" && selectedFile && (
          <>
            <div className="rounded-full bg-green-500/10 p-4 mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">{selectedFile.name}</span>
              <span className="text-xs text-muted-foreground">
                ({formatFileSize(selectedFile.size)})
              </span>
            </div>
            <p className="text-sm text-green-600 mb-4">
              CV uploaded successfully!
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Upload a different file
            </button>
          </>
        )}

        {/* Error State */}
        {status === "error" && (
          <>
            <div className="rounded-full bg-destructive/10 p-4 mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            {selectedFile && (
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium">{selectedFile.name}</span>
              </div>
            )}
            <p className="text-sm text-destructive mb-4">{errorMessage}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Try again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
