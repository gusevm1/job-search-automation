"use client";

import { useState } from "react";
import { Upload, FileText, User, Briefcase, GraduationCap, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CVUploadDropzone } from "@/components/profile/cv-upload-dropzone";

interface UploadResponse {
  success: boolean;
  userId?: string;
  filename?: string;
  fileSize?: number;
  message?: string;
}

export default function Profile() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadedCV, setUploadedCV] = useState<{
    filename: string;
    userId: string;
  } | null>(null);

  const handleUploadComplete = (file: File, response: UploadResponse) => {
    if (response.success && response.userId && response.filename) {
      setUploadedCV({
        filename: response.filename,
        userId: response.userId,
      });
      // Keep dialog open to show success, user can close it
    }
  };

  const handleUploadError = (error: string) => {
    console.error("Upload error:", error);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">
            Manage your profile and CV information
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Upload className="h-4 w-4" />
              Upload CV
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload your CV</DialogTitle>
              <DialogDescription>
                Upload your CV in PDF or DOCX format. We&apos;ll extract your information automatically.
              </DialogDescription>
            </DialogHeader>
            <CVUploadDropzone
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              className="mt-4"
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* CV Status Card */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-muted p-3">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">CV Status</h3>
            {uploadedCV ? (
              <p className="text-sm text-muted-foreground">
                Uploaded: <span className="text-foreground">{uploadedCV.filename}</span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No CV uploaded yet. Click &quot;Upload CV&quot; to get started.
              </p>
            )}
          </div>
          {uploadedCV && (
            <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
              Replace
            </Button>
          )}
        </div>
      </div>

      {/* Profile Sections Preview */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Personal Info */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-primary/10 p-2">
              <User className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold">Personal Information</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {uploadedCV
              ? "Upload complete. Extraction pending..."
              : "Upload your CV to auto-fill your personal details."}
          </p>
        </div>

        {/* Work Experience */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-primary/10 p-2">
              <Briefcase className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold">Work Experience</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {uploadedCV
              ? "Upload complete. Extraction pending..."
              : "Your work history will be extracted from your CV."}
          </p>
        </div>

        {/* Education */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-primary/10 p-2">
              <GraduationCap className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold">Education</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {uploadedCV
              ? "Upload complete. Extraction pending..."
              : "Your educational background will be extracted."}
          </p>
        </div>

        {/* Skills */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-primary/10 p-2">
              <Wrench className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold">Skills</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {uploadedCV
              ? "Upload complete. Extraction pending..."
              : "Technical and soft skills will be identified."}
          </p>
        </div>
      </div>

      {/* Next Steps */}
      {uploadedCV && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-6">
          <h3 className="font-semibold mb-2">Next Steps</h3>
          <p className="text-sm text-muted-foreground">
            Your CV has been uploaded! The CV extraction agent will process it to extract:
          </p>
          <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>Personal information and contact details</li>
            <li>Work experience with achievements</li>
            <li>Education and certifications</li>
            <li>Technical and soft skills</li>
          </ul>
        </div>
      )}
    </div>
  );
}
