import { NextRequest, NextResponse } from "next/server";
import { getJobs, filterJobs, getJobStats } from "@/lib/data/jobs-store";
import { JobFilters } from "@/types/jobs";

/**
 * GET /api/jobs/list
 * List jobs with optional filtering
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

    // Parse filters from query params
    const filters: JobFilters = {};

    const minScore = searchParams.get("minScore");
    if (minScore) filters.minScore = parseInt(minScore, 10);

    const sources = searchParams.get("sources");
    if (sources) filters.sources = sources.split(",");

    const statuses = searchParams.get("statuses");
    if (statuses) filters.statuses = statuses.split(",") as JobFilters["statuses"];

    const remoteOnly = searchParams.get("remoteOnly");
    if (remoteOnly === "true") filters.remoteOnly = true;

    const locations = searchParams.get("locations");
    if (locations) filters.locations = locations.split(",");

    const salaryMin = searchParams.get("salaryMin");
    if (salaryMin) filters.salaryMin = parseInt(salaryMin, 10);

    const datePosted = searchParams.get("datePosted");
    if (datePosted) filters.datePosted = datePosted as JobFilters["datePosted"];

    const seniorityLevels = searchParams.get("seniorityLevels");
    if (seniorityLevels)
      filters.seniorityLevels = seniorityLevels.split(",") as JobFilters["seniorityLevels"];

    const companySizes = searchParams.get("companySizes");
    if (companySizes)
      filters.companySizes = companySizes.split(",") as JobFilters["companySizes"];

    const searchText = searchParams.get("searchText");
    if (searchText) filters.searchText = searchText;

    // Get filtered jobs
    const hasFilters = Object.keys(filters).length > 0;
    const jobs = hasFilters
      ? await filterJobs(userId, filters)
      : await getJobs(userId);

    // Sort by match score (highest first), then by posted date
    jobs.sort((a, b) => {
      const scoreA = a.matchScore || 0;
      const scoreB = b.matchScore || 0;
      if (scoreA !== scoreB) return scoreB - scoreA;

      // Secondary sort by date
      const dateA = a.postedDate ? new Date(a.postedDate).getTime() : 0;
      const dateB = b.postedDate ? new Date(b.postedDate).getTime() : 0;
      return dateB - dateA;
    });

    // Get stats
    const stats = await getJobStats(userId);

    // Pagination
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;
    const paginatedJobs = jobs.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      jobs: paginatedJobs,
      pagination: {
        page,
        limit,
        total: jobs.length,
        totalPages: Math.ceil(jobs.length / limit),
      },
      stats,
    });
  } catch (error) {
    console.error("List jobs error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to list jobs",
      },
      { status: 500 }
    );
  }
}
