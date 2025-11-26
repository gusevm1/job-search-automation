import { NextRequest } from "next/server";
import { getProfile } from "@/lib/data/profile-store";
import { createPlan, executePlanWithProgress } from "@/lib/agent/scrape-strategy";
import { saveScrapePlan } from "@/lib/data/jobs-store";
import type { ScrapePlan, ScrapeTask } from "@/types/jobs";

// ============================================
// Rate Limiting (mirrors main scrape route)
// ============================================
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5; // Max 5 scrapes per minute per user

function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }

  if (userLimit.count >= RATE_LIMIT_MAX) {
    return {
      allowed: false,
      retryAfter: Math.ceil((userLimit.resetTime - now) / 1000),
    };
  }

  userLimit.count++;
  return { allowed: true };
}

// ============================================
// Input Validation
// ============================================
function validateUserId(userId: unknown): string | null {
  if (typeof userId !== "string") return null;
  if (!/^[a-zA-Z0-9_]{10,50}$/.test(userId)) return null;
  return userId;
}

function validateMode(mode: unknown): "full" | "quick" {
  if (mode === "quick") return "quick";
  return "full";
}

// ============================================
// Plan Summarization for SSE Events
// ============================================
interface PlanSummary {
  id: string;
  status: ScrapePlan["status"];
  mode: ScrapePlan["mode"];
  tasks: Array<{
    id: string;
    board: string;
    query: string;
    status: ScrapeTask["status"];
    jobsFound: number;
    error?: string;
  }>;
  totalJobsFound: number;
  newJobsAdded: number;
  duplicatesSkipped: number;
}

function summarizePlan(plan: ScrapePlan): PlanSummary {
  return {
    id: plan.id,
    status: plan.status,
    mode: plan.mode,
    tasks: plan.tasks.map((t) => ({
      id: t.id,
      board: t.board,
      query: t.query.query,
      status: t.status,
      jobsFound: t.jobsFound,
      error: t.error,
    })),
    totalJobsFound: plan.totalJobsFound,
    newJobsAdded: plan.newJobsAdded,
    duplicatesSkipped: plan.duplicatesSkipped,
  };
}

// ============================================
// SSE Streaming Endpoint
// ============================================

/**
 * GET /api/jobs/scrape/stream
 * Server-Sent Events endpoint for real-time scrape progress
 *
 * Query params:
 * - userId: User ID (required)
 * - mode: "full" | "quick" (optional, defaults to "full")
 *
 * Event types:
 * - plan_created: Initial plan created
 * - progress: Task status update
 * - complete: Scrape finished successfully
 * - error: Error occurred
 */
export async function GET(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams;
  const userIdRaw = searchParams.get("userId");
  const modeRaw = searchParams.get("mode");

  // Validate userId
  const userId = validateUserId(userIdRaw);
  if (!userId) {
    return new Response(
      JSON.stringify({ error: "Invalid userId format" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Check rate limit
  const rateCheck = checkRateLimit(userId);
  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({
        error: "Rate limit exceeded",
        retryAfter: rateCheck.retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(rateCheck.retryAfter),
        },
      }
    );
  }

  // Get user profile
  const profile = await getProfile(userId);
  if (!profile) {
    return new Response(
      JSON.stringify({ error: "Profile not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const mode = validateMode(modeRaw);
  const encoder = new TextEncoder();

  console.log(`[SSE] Starting ${mode} scrape stream for user ${userId}`);

  // Create the SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (type: string, data: Record<string, unknown>) => {
        try {
          const event = `data: ${JSON.stringify({ type, ...data })}\n\n`;
          controller.enqueue(encoder.encode(event));
        } catch (error) {
          console.error("[SSE] Failed to send event:", error);
        }
      };

      try {
        // Phase 1: Create plan
        sendEvent("plan_created", { status: "creating_plan" });

        const plan = createPlan(profile, mode);
        await saveScrapePlan(userId, plan);

        sendEvent("plan_ready", {
          plan: summarizePlan(plan),
        });

        // Phase 2: Execute with progress updates
        await executePlanWithProgress(plan, profile, (updatedPlan) => {
          const runningTasks = updatedPlan.tasks.filter((t) => t.status === "running");
          const completedTasks = updatedPlan.tasks.filter((t) => t.status === "completed");
          const failedTasks = updatedPlan.tasks.filter((t) => t.status === "failed");

          // Calculate running total of jobs found
          const jobsFoundSoFar = updatedPlan.tasks.reduce(
            (sum, t) => sum + (t.jobsFound || 0),
            0
          );

          sendEvent("progress", {
            plan: summarizePlan(updatedPlan),
            runningTasks: runningTasks.map((t) => ({
              id: t.id,
              board: t.board,
              query: t.query.query,
            })),
            completedCount: completedTasks.length,
            failedCount: failedTasks.length,
            totalTasks: updatedPlan.tasks.length,
            jobsFoundSoFar,
          });
        });

        // Phase 3: Send final result
        sendEvent("complete", {
          plan: summarizePlan(plan),
          totalJobsFound: plan.totalJobsFound,
          newJobsAdded: plan.newJobsAdded,
          duplicatesSkipped: plan.duplicatesSkipped,
        });

        console.log(
          `[SSE] Scrape complete: ${plan.totalJobsFound} found, ${plan.newJobsAdded} new, ${plan.duplicatesSkipped} duplicates`
        );
      } catch (error) {
        console.error("[SSE] Scrape error:", error);
        sendEvent("error", {
          message: error instanceof Error ? error.message : "Unknown error occurred",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}
