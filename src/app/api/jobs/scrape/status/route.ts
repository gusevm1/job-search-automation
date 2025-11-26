import { NextRequest, NextResponse } from "next/server";
import { getScrapeStatus } from "@/lib/agent/scrape-strategy";

/**
 * GET /api/jobs/scrape/status
 * Get the current scrape plan status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "userId is required" },
        { status: 400 }
      );
    }

    const plan = await getScrapeStatus(userId);

    if (!plan) {
      return NextResponse.json({
        success: true,
        plan: null,
        message: "No active scrape plan",
      });
    }

    return NextResponse.json({
      success: true,
      plan: {
        id: plan.id,
        status: plan.status,
        mode: plan.mode,
        createdAt: plan.createdAt,
        startedAt: plan.startedAt,
        completedAt: plan.completedAt,
        tasks: plan.tasks.map((t) => ({
          id: t.id,
          board: t.board,
          query: t.query.query,
          status: t.status,
          jobsFound: t.jobsFound,
          error: t.error,
        })),
        tasksTotal: plan.tasks.length,
        tasksCompleted: plan.tasks.filter((t) => t.status === "completed").length,
        tasksFailed: plan.tasks.filter((t) => t.status === "failed").length,
        totalJobsFound: plan.totalJobsFound,
        newJobsAdded: plan.newJobsAdded,
        duplicatesSkipped: plan.duplicatesSkipped,
      },
    });
  } catch (error) {
    console.error("Get scrape status error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to get status",
      },
      { status: 500 }
    );
  }
}
