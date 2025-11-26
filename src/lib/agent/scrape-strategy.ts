import { UserProfile } from "@/types/user-profile";
import {
  ScrapePlan,
  ScrapeTask,
  SearchQuery,
  EnhancedJobListing,
  ProfileAnalysis,
} from "@/types/jobs";
import { analyzeProfile, JOB_BOARDS, JobBoardInfo } from "./profile-analyzer";
import { scoreJobsAgainstProfile } from "./job-matching";
import {
  generatePlanId,
  addJobs,
  saveScrapePlan,
  getCurrentScrapePlan,
  addScrapeHistoryEntry,
} from "@/lib/data/jobs-store";
import {
  scrapeSwissDevJobs,
  scrapeJobsCh,
  scrapeLinkedIn,
  scrapeDatacareer,
  scrapeIndeedCH,
  scrapeGlassdoor,
  scrapeICTjobs,
  filterFakeJobs,
} from "@/lib/services/job-scraper";

// ============================================
// Scrape Strategy Engine
// ============================================
export class ScrapeStrategyEngine {
  private profile: UserProfile;
  private analysis: ProfileAnalysis;

  constructor(profile: UserProfile) {
    this.profile = profile;
    this.analysis = analyzeProfile(profile);
  }

  /**
   * Create a scrape plan based on profile analysis
   */
  createPlan(mode: "full" | "quick" = "full"): ScrapePlan {
    const tasks = this.generateTasks(mode);

    return {
      id: generatePlanId(),
      userId: this.profile.id,
      mode,
      status: "pending",
      createdAt: new Date().toISOString(),
      tasks,
      totalJobsFound: 0,
      newJobsAdded: 0,
      duplicatesSkipped: 0,
    };
  }

  /**
   * Generate scrape tasks from profile analysis
   */
  private generateTasks(mode: "full" | "quick"): ScrapeTask[] {
    const tasks: ScrapeTask[] = [];
    const boardPriorities = this.analysis.boardPriorities;

    // Sort boards by priority
    const sortedBoards = [...boardPriorities].sort(
      (a, b) => b.priority - a.priority
    );

    // In quick mode, only use top 2 boards
    const boardsToUse = mode === "quick" ? sortedBoards.slice(0, 2) : sortedBoards;

    // For each board, create tasks for top queries
    for (const boardPriority of boardsToUse) {
      const board = JOB_BOARDS.find((b) => b.id === boardPriority.boardId);
      if (!board) continue;

      // Get queries for this board (limit based on mode)
      const queriesPerBoard = mode === "quick" ? 3 : 8;
      const queries = this.selectQueriesForBoard(board, queriesPerBoard);

      for (const query of queries) {
        tasks.push({
          id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          board: board.id,
          query,
          status: "pending",
          jobsFound: 0,
        });
      }
    }

    return tasks;
  }

  /**
   * Select appropriate queries for a specific board
   */
  private selectQueriesForBoard(
    board: JobBoardInfo,
    limit: number
  ): SearchQuery[] {
    const queries = this.analysis.queries;
    const selected: SearchQuery[] = [];

    // Prioritize different query categories based on board type
    if (board.specialization === "tech") {
      // Tech boards: prioritize skill-based and agentic queries
      const categories = ["agentic", "primary_skill", "title", "combination"];
      for (const cat of categories) {
        const matching = queries.filter((q) => q.category === cat);
        for (const q of matching) {
          if (selected.length >= limit) break;
          if (!selected.some((s) => s.query === q.query)) {
            selected.push({
              ...q,
              location: board.regions.includes("CH") ? q.location : undefined,
            });
          }
        }
      }
    } else {
      // General boards: mix of titles and skills
      const categories = ["title", "agentic", "primary_skill", "combination"];
      for (const cat of categories) {
        const matching = queries.filter((q) => q.category === cat);
        for (const q of matching) {
          if (selected.length >= limit) break;
          if (!selected.some((s) => s.query === q.query)) {
            selected.push(q);
          }
        }
      }
    }

    // Fill remaining slots with any queries
    if (selected.length < limit) {
      for (const q of queries) {
        if (selected.length >= limit) break;
        if (!selected.some((s) => s.query === q.query)) {
          selected.push(q);
        }
      }
    }

    return selected.slice(0, limit);
  }

  /**
   * Get the analysis results
   */
  getAnalysis(): ProfileAnalysis {
    return this.analysis;
  }
}

// ============================================
// Plan Executor - Uses Firecrawl for real scraping
// ============================================

/**
 * Concurrency limiter for parallel task execution
 * Runs tasks with a maximum number of concurrent executions
 */
async function runWithConcurrencyLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
  onTaskComplete?: (result: T, index: number) => void
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let currentIndex = 0;
  let completedCount = 0;

  async function runNext(): Promise<void> {
    const index = currentIndex++;
    if (index >= tasks.length) return;

    try {
      const result = await tasks[index]();
      results[index] = result;
      onTaskComplete?.(result, index);
    } catch (error) {
      // Task failed, result stays undefined
      console.error(`[Concurrency] Task ${index} failed:`, error);
    }

    completedCount++;
    await runNext();
  }

  // Start `limit` workers in parallel
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => runNext());
  await Promise.all(workers);

  return results;
}

/**
 * Scrape jobs from a specific board using real Firecrawl scrapers
 */
async function scrapeJobsFromBoard(
  board: string,
  query: SearchQuery
): Promise<EnhancedJobListing[]> {
  const queryStr = query.query;
  const location = query.location;

  switch (board.toLowerCase()) {
    case "swissdevjobs":
      return scrapeSwissDevJobs(queryStr, location);
    case "jobs.ch":
    case "jobsch":
      return scrapeJobsCh(queryStr, location);
    case "linkedin":
      return scrapeLinkedIn(queryStr, location);
    case "datacareer":
    case "datacareer.ch":
      return scrapeDatacareer(queryStr, location);
    case "indeed":
    case "indeed.ch":
      return scrapeIndeedCH(queryStr, location);
    case "glassdoor":
      return scrapeGlassdoor(queryStr, location);
    case "ictjobs":
    case "ictjobs.ch":
      return scrapeICTjobs(queryStr, location);
    default:
      console.warn(`[Scraper] Unknown board: ${board}, skipping`);
      return [];
  }
}

/**
 * Execute a scrape plan using real Firecrawl scrapers
 * Uses parallel execution with 2 concurrent scrapers for better performance
 */
export async function executePlan(
  userId: string,
  plan: ScrapePlan,
  profile: UserProfile,
  onProgress?: (plan: ScrapePlan) => void
): Promise<ScrapePlan> {
  const startTime = Date.now();
  plan.status = "running";
  plan.startedAt = new Date().toISOString();
  await saveScrapePlan(userId, plan);
  onProgress?.(plan);

  let allJobs: EnhancedJobListing[] = [];
  let totalJobsFound = 0;

  // Create task functions for parallel execution
  const taskFunctions = plan.tasks.map((task) => async () => {
    task.status = "running";
    task.startedAt = new Date().toISOString();
    onProgress?.(plan);

    try {
      // Use real Firecrawl scrapers
      const jobs = await scrapeJobsFromBoard(task.board, task.query);

      task.jobsFound = jobs.length;
      task.status = "completed";
      task.completedAt = new Date().toISOString();

      return { jobs, task };
    } catch (error) {
      task.status = "failed";
      task.error = error instanceof Error ? error.message : "Unknown error";
      task.completedAt = new Date().toISOString();
      console.error(`[${task.board}] Task failed:`, task.error);

      return { jobs: [] as EnhancedJobListing[], task };
    }
  });

  // Execute tasks with 2 concurrent scrapers
  const CONCURRENCY_LIMIT = 2;
  await runWithConcurrencyLimit(
    taskFunctions,
    CONCURRENCY_LIMIT,
    (result) => {
      if (result) {
        allJobs = allJobs.concat(result.jobs);
        totalJobsFound += result.jobs.length;
      }
      onProgress?.(plan);
    }
  );

  // Filter out fake/spam job postings
  const { valid: validJobs, removed: fakeJobs } = filterFakeJobs(allJobs);
  console.log(`[Scraper] Filtered ${fakeJobs.length} suspected fake jobs`);

  // Score valid jobs against profile
  const scores = scoreJobsAgainstProfile(profile, validJobs);
  const scoreMap = new Map(scores.map((s) => [s.jobId, s.overallScore]));

  // Apply scores to jobs
  for (const job of validJobs) {
    job.matchScore = scoreMap.get(job.id);
  }

  // Sort by match score
  validJobs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  // Add to store (with deduplication)
  const { added, duplicates } = await addJobs(userId, validJobs);

  // Update plan
  plan.status = "completed";
  plan.completedAt = new Date().toISOString();
  plan.totalJobsFound = totalJobsFound;
  plan.newJobsAdded = added;
  plan.duplicatesSkipped = duplicates;

  await saveScrapePlan(userId, plan);

  // Add to history
  await addScrapeHistoryEntry(userId, {
    id: `history_${Date.now()}`,
    planId: plan.id,
    completedAt: plan.completedAt,
    mode: plan.mode,
    boardsScraped: [...new Set(plan.tasks.map((t) => t.board))],
    totalJobsFound,
    newJobsAdded: added,
    duration: Date.now() - startTime,
    triggeredBy: "manual",
  });

  onProgress?.(plan);
  return plan;
}

/**
 * Create and optionally execute a scrape plan
 */
export async function createAndExecutePlan(
  profile: UserProfile,
  mode: "full" | "quick" = "full",
  execute = false,
  onProgress?: (plan: ScrapePlan) => void
): Promise<ScrapePlan> {
  const engine = new ScrapeStrategyEngine(profile);
  const plan = engine.createPlan(mode);

  await saveScrapePlan(profile.id, plan);
  onProgress?.(plan);

  if (execute) {
    return executePlan(profile.id, plan, profile, onProgress);
  }

  return plan;
}

/**
 * Get scrape status for a user
 */
export async function getScrapeStatus(
  userId: string
): Promise<ScrapePlan | null> {
  return getCurrentScrapePlan(userId);
}

/**
 * Create a scrape plan without executing it
 * Useful for SSE streaming where plan creation and execution are separate
 */
export function createPlan(
  profile: UserProfile,
  mode: "full" | "quick" = "full"
): ScrapePlan {
  const engine = new ScrapeStrategyEngine(profile);
  return engine.createPlan(mode);
}

/**
 * Execute a scrape plan with progress callbacks
 * Separated from plan creation for SSE streaming support
 */
export async function executePlanWithProgress(
  plan: ScrapePlan,
  profile: UserProfile,
  onProgress?: (plan: ScrapePlan) => void
): Promise<ScrapePlan> {
  return executePlan(profile.id, plan, profile, onProgress);
}
