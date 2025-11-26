import { NextRequest, NextResponse } from "next/server";
import { getJob, updateJobStatus } from "@/lib/data/jobs-store";
import { JobStatus } from "@/types/jobs";

/**
 * GET /api/jobs/[jobId]
 * Get a single job by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "userId is required" },
        { status: 400 }
      );
    }

    const job = await getJob(userId, jobId);

    if (!job) {
      return NextResponse.json(
        { success: false, message: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error("Get job error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to get job",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/jobs/[jobId]
 * Update job status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const body = await request.json();
    const { userId, status, notes } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "userId is required" },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { success: false, message: "status is required" },
        { status: 400 }
      );
    }

    const validStatuses: JobStatus[] = [
      "new",
      "viewed",
      "saved",
      "applied",
      "hidden",
      "rejected",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }

    const updatedJob = await updateJobStatus(userId, jobId, status, notes);

    if (!updatedJob) {
      return NextResponse.json(
        { success: false, message: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, job: updatedJob });
  } catch (error) {
    console.error("Update job error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to update job",
      },
      { status: 500 }
    );
  }
}
