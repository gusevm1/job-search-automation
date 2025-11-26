import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/data/profile-store";
import { createAndExecutePlan } from "@/lib/agent/scrape-strategy";

// ============================================
// Rate Limiting (Simple in-memory for single instance)
// ============================================
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5; // Max 5 scrapes per minute per user

function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or initialize
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
  // User ID should be alphanumeric with underscores, reasonable length
  if (!/^[a-zA-Z0-9_]{10,50}$/.test(userId)) return null;
  return userId;
}

function validateMode(mode: unknown): "full" | "quick" {
  if (mode === "quick") return "quick";
  return "full"; // Default to full
}

/**
 * POST /api/jobs/scrape
 * Trigger a job scrape based on user's profile
 *
 * SECURITY:
 * - Rate limited to prevent abuse
 * - Input validation on all parameters
 * - Scraper itself sanitizes all extracted content
 */
export async function POST(request: NextRequest) {
  try {
    // Parse body with size limit protection (Next.js handles this)
    const body = await request.json();

    // Validate userId
    const userId = validateUserId(body.userId);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Invalid userId format" },
        { status: 400 }
      );
    }

    // Check rate limit
    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Rate limit exceeded. Please wait before scraping again.",
          retryAfter: rateCheck.retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateCheck.retryAfter),
          },
        }
      );
    }

    // Validate mode
    const mode = validateMode(body.mode);
    const execute = body.execute !== false; // Default true

    // Get user profile
    const profile = await getProfile(userId);
    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Profile not found" },
        { status: 404 }
      );
    }

    console.log(`[Scrape API] Starting ${mode} scrape for user ${userId}`);

    // Create and execute scrape plan
    // NOTE: The scraper sanitizes all extracted content internally
    const plan = await createAndExecutePlan(profile, mode, execute);

    return NextResponse.json({
      success: true,
      plan: {
        id: plan.id,
        status: plan.status,
        mode: plan.mode,
        tasksTotal: plan.tasks.length,
        tasksCompleted: plan.tasks.filter((t) => t.status === "completed").length,
        totalJobsFound: plan.totalJobsFound,
        newJobsAdded: plan.newJobsAdded,
        duplicatesSkipped: plan.duplicatesSkipped,
      },
    });
  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Scrape failed. Please try again later.",
      },
      { status: 500 }
    );
  }
}
