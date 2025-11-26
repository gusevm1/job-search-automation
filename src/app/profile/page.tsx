"use client";

import { useState, useEffect } from "react";
import {
  Upload,
  FileText,
  User,
  Briefcase,
  GraduationCap,
  Wrench,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
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
import { EditableProfile } from "@/components/profile/editable-profile-section";
import type { UserProfile } from "@/types/user-profile";

interface UploadResponse {
  success: boolean;
  userId?: string;
  filename?: string;
  fileSize?: number;
  message?: string;
}

type ExtractionStatus = "idle" | "loading" | "extracting" | "success" | "error";

export default function Profile() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadedCV, setUploadedCV] = useState<{
    filename: string;
    userId: string;
  } | null>(null);
  const [extractionStatus, setExtractionStatus] =
    useState<ExtractionStatus>("loading");
  const [extractedProfile, setExtractedProfile] = useState<UserProfile | null>(
    null
  );
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing profile on mount
  useEffect(() => {
    async function loadExistingProfile() {
      try {
        const response = await fetch("/api/profile/load");
        const data = await response.json();

        if (data.success && data.profile) {
          setExtractedProfile(data.profile);
          setUploadedCV({
            filename: data.profile.cvMetadata?.originalFilename || "CV",
            userId: data.userId || data.profile.id,
          });
          setExtractionStatus("success");
        } else {
          setExtractionStatus("idle");
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
        setExtractionStatus("idle");
      }
    }

    loadExistingProfile();
  }, []);

  const handleUploadComplete = async (
    file: File,
    response: UploadResponse
  ) => {
    if (response.success && response.userId && response.filename) {
      setUploadedCV({
        filename: response.filename,
        userId: response.userId,
      });

      // Automatically trigger extraction
      setExtractionStatus("extracting");
      setExtractionError(null);

      try {
        const extractResponse = await fetch("/api/profile/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: response.userId }),
        });

        const extractData = await extractResponse.json();

        if (extractData.success) {
          setExtractedProfile(extractData.profile);
          setExtractionStatus("success");
          setIsDialogOpen(false); // Close dialog on success
        } else {
          throw new Error(extractData.message || "Extraction failed");
        }
      } catch (error) {
        setExtractionStatus("error");
        setExtractionError(
          error instanceof Error ? error.message : "Extraction failed"
        );
      }
    }
  };

  const handleUploadError = (error: string) => {
    console.error("Upload error:", error);
  };

  const retryExtraction = async () => {
    if (!uploadedCV) return;

    setExtractionStatus("extracting");
    setExtractionError(null);

    try {
      const response = await fetch("/api/profile/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uploadedCV.userId }),
      });

      const data = await response.json();

      if (data.success) {
        setExtractedProfile(data.profile);
        setExtractionStatus("success");
      } else {
        throw new Error(data.message || "Extraction failed");
      }
    } catch (error) {
      setExtractionStatus("error");
      setExtractionError(
        error instanceof Error ? error.message : "Extraction failed"
      );
    }
  };

  const handleSaveProfile = async (updatedProfile: UserProfile) => {
    if (!uploadedCV?.userId) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/profile/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: uploadedCV.userId,
          profile: updatedProfile,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setExtractedProfile(data.profile);
      } else {
        throw new Error(data.message || "Failed to save profile");
      }
    } catch (error) {
      console.error("Save error:", error);
      // Could show a toast notification here
    } finally {
      setIsSaving(false);
    }
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
              {extractedProfile ? "Update CV" : "Upload CV"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload your CV</DialogTitle>
              <DialogDescription>
                Upload your CV in PDF or DOCX format. We&apos;ll extract your
                information automatically.
              </DialogDescription>
            </DialogHeader>
            <CVUploadDropzone
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              className="mt-4"
            />
            {extractionStatus === "extracting" && (
              <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Extracting profile data from your CV...
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* CV Status Card */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-4">
          <div
            className={`rounded-full p-3 ${
              extractionStatus === "success"
                ? "bg-green-500/10"
                : extractionStatus === "error"
                  ? "bg-destructive/10"
                  : extractionStatus === "extracting" || extractionStatus === "loading"
                    ? "bg-primary/10"
                    : "bg-muted"
            }`}
          >
            {extractionStatus === "extracting" || extractionStatus === "loading" ? (
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            ) : extractionStatus === "success" ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : extractionStatus === "error" ? (
              <AlertCircle className="h-6 w-6 text-destructive" />
            ) : (
              <FileText className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">CV Status</h3>
            {extractionStatus === "loading" ? (
              <p className="text-sm text-muted-foreground">
                Loading profile...
              </p>
            ) : extractionStatus === "extracting" ? (
              <p className="text-sm text-muted-foreground">
                Extracting profile data...
              </p>
            ) : extractionStatus === "success" ? (
              <p className="text-sm text-green-600">
                Profile loaded from{" "}
                <span className="font-medium">{uploadedCV?.filename}</span>
                {" - "}
                <span className="text-muted-foreground">Click Edit to make changes</span>
              </p>
            ) : extractionStatus === "error" ? (
              <p className="text-sm text-destructive">{extractionError}</p>
            ) : uploadedCV ? (
              <p className="text-sm text-muted-foreground">
                Uploaded:{" "}
                <span className="text-foreground">{uploadedCV.filename}</span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No CV uploaded yet. Click &quot;Upload CV&quot; to get started.
              </p>
            )}
          </div>
          {extractionStatus === "error" && (
            <Button variant="outline" size="sm" onClick={retryExtraction}>
              Retry
            </Button>
          )}
          {extractionStatus === "success" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDialogOpen(true)}
            >
              Replace
            </Button>
          )}
        </div>
      </div>

      {/* Extracted Profile Display with Edit Capability */}
      {extractedProfile ? (
        <EditableProfile
          profile={extractedProfile}
          onSave={handleSaveProfile}
          isSaving={isSaving}
        />
      ) : (
        /* Empty State - Profile Sections Preview */
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-primary/10 p-2">
                <User className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold">Personal Information</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {uploadedCV
                ? "Extraction in progress..."
                : "Upload your CV to auto-fill your personal details."}
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-primary/10 p-2">
                <Briefcase className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold">Work Experience</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {uploadedCV
                ? "Extraction in progress..."
                : "Your work history will be extracted from your CV."}
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-primary/10 p-2">
                <GraduationCap className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold">Education</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {uploadedCV
                ? "Extraction in progress..."
                : "Your educational background will be extracted."}
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-primary/10 p-2">
                <Wrench className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold">Skills</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {uploadedCV
                ? "Extraction in progress..."
                : "Technical and soft skills will be identified."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
