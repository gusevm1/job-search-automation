import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import {
  saveUploadedCV,
  generateUserId,
  ensureDataDirs,
} from "@/lib/data/profile-store";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_EXTENSIONS = [".pdf", ".docx"];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("cv") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        { success: false, message: "Invalid file type. Please upload a PDF or DOCX file." },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Generate user ID (in a real app, this would come from auth)
    // For now, we'll use a session-based approach or generate new
    const userId = generateUserId();

    // Ensure data directories exist
    await ensureDataDirs();

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save the file
    const savedPath = await saveUploadedCV(userId, file.name, buffer);

    return NextResponse.json({
      success: true,
      userId,
      filename: file.name,
      fileSize: file.size,
      fileType: extension.slice(1) as "pdf" | "docx",
      savedPath,
      message: "CV uploaded successfully",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to upload file" },
      { status: 500 }
    );
  }
}
