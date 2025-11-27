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
  replaceJobs,
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
  scrapeJobup,
  scrapeJobscout24,
  filterFakeJobs,
} from "@/lib/services/job-scraper";

// ============================================
// Python Backend Integration
// ============================================

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";

/**
 * AI Match Result from Python backend
 */
interface AIMatchResult {
  job_id: string;
  score: number;
  reasoning: string;
  strengths: string[];
  gaps: string[];
  recommendation: string;
  skill_matches?: Array<{
    skill: string;
    matched: boolean;
    proficiency_required?: string;
    user_proficiency?: string;
    gap?: string;
  }>;
  education_match?: string;
  experience_match?: string;
}

/**
 * Convert camelCase object to snake_case for Python backend
 */
function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
    if (value && typeof value === "object" && !Array.isArray(value)) {
      result[snakeKey] = toSnakeCase(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[snakeKey] = value.map((item) =>
        typeof item === "object" && item !== null
          ? toSnakeCase(item as Record<string, unknown>)
          : item
      );
    } else {
      result[snakeKey] = value;
    }
  }
  return result;
}

/**
 * Convert job to format expected by Python backend
 */
function convertJobForPython(job: EnhancedJobListing): Record<string, unknown> {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location || "",
    description: job.description || "",
    requirements: job.requirements || [],
    salary_range: job.salary
      ? `${job.salary.min || ""}${job.salary.min && job.salary.max ? "-" : ""}${job.salary.max || ""} ${job.salary.currency || "CHF"}`
      : null,
    url: job.applicationUrl || job.sourceUrl,
    source_url: job.sourceUrl,
    posted_date: job.postedDate || null,
    source: job.sourceSite,
    employment_type: job.employmentType || "full-time",
    remote_type: job.remote || null,
    seniority_level: job.seniorityLevel || null,
    tech_stack: job.techStack || [],
    status: job.status,
    tags: job.techStack || [],
  };
}

/**
 * Convert profile to format expected by Python backend
 */
function convertProfileForPython(profile: UserProfile): Record<string, unknown> {
  return {
    personal_info: {
      first_name: profile.personalInfo.firstName,
      last_name: profile.personalInfo.lastName,
      email: profile.personalInfo.email,
      phone: profile.personalInfo.phone || null,
      location: {
        city: profile.personalInfo.location.city || null,
        state: profile.personalInfo.location.state || null,
        country: profile.personalInfo.location.country,
        postal_code: profile.personalInfo.location.postalCode || null,
        willing_to_relocate: profile.personalInfo.location.willingToRelocate || false,
        relocation_preferences: profile.personalInfo.location.relocationPreferences || null,
      },
      linkedin: profile.personalInfo.linkedIn || null,
      github: profile.personalInfo.github || null,
      portfolio: profile.personalInfo.portfolio || null,
      summary: profile.personalInfo.summary || null,
    },
    work_experience: profile.workExperience.map((exp) => ({
      id: exp.id,
      title: exp.title,
      company: exp.company,
      company_size: exp.companySize || null,
      industry: exp.industry || null,
      location: exp.location || null,
      remote: exp.remote || null,
      start_date: exp.startDate,
      end_date: exp.endDate || null,
      is_current: exp.isCurrent || false,
      responsibilities: exp.responsibilities || [],
      achievements: exp.achievements.map((a) => ({
        description: a.description,
        metric: a.metric || null,
      })),
      skills_used: exp.skillsUsed || [],
      employment_type: exp.employmentType || "full-time",
    })),
    education: profile.education.map((edu) => ({
      id: edu.id,
      institution: edu.institution,
      degree: edu.degree,
      field: edu.field,
      start_date: edu.startDate || null,
      graduation_date: edu.graduationDate || null,
      gpa: edu.gpa || null,
      gpa_scale: edu.gpaScale || null,
      honors: edu.honors || null,
      relevant_coursework: edu.relevantCoursework || null,
      activities: edu.activities || null,
    })),
    skills: {
      technical: profile.skills.technical.map((skill) => ({
        name: skill.name,
        category: skill.category,
        proficiency: skill.proficiency,
        years_of_experience: skill.yearsOfExperience || null,
        last_used: skill.lastUsed || null,
      })),
      soft: profile.skills.soft.map((skill) => ({
        name: skill.name,
        proficiency: skill.proficiency || null,
      })),
      languages: profile.skills.languages.map((lang) => ({
        language: lang.language,
        proficiency: lang.proficiency,
        certifications: lang.certifications || null,
      })),
    },
    certifications: profile.certifications?.map((cert) => ({
      id: cert.id,
      name: cert.name,
      issuer: cert.issuer,
      issue_date: cert.issueDate,
      expiration_date: cert.expirationDate || null,
      credential_id: cert.credentialId || null,
      credential_url: cert.credentialUrl || null,
    })) || null,
    projects: profile.projects?.map((proj) => ({
      id: proj.id,
      name: proj.name,
      description: proj.description,
      url: proj.url || null,
      repo_url: proj.repoUrl || null,
      start_date: proj.startDate || null,
      end_date: proj.endDate || null,
      technologies: proj.technologies || [],
      highlights: proj.highlights || [],
    })) || null,
  };
}

/**
 * Call Python backend for AI-powered job matching
 * Returns null if backend is unavailable
 */
async function matchJobsWithAI(
  profile: UserProfile,
  jobs: EnhancedJobListing[]
): Promise<AIMatchResult[] | null> {
  if (jobs.length === 0) return [];

  try {
    console.log(`[AI Matching] Calling Python backend for ${jobs.length} jobs...`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout for AI matching

    const response = await fetch(`${PYTHON_BACKEND_URL}/api/jobs/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile: convertProfileForPython(profile),
        jobs: jobs.map(convertJobForPython),
        min_score: 0, // Get all scores
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AI Matching] Backend error: ${response.status}`, errorText);
      return null;
    }

    const result = await response.json();
    console.log(`[AI Matching] Received ${result.matches?.length || 0} match results`);

    return result.matches || [];
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[AI Matching] Request timed out after 2 minutes");
    } else {
      console.error("[AI Matching] Failed to call Python backend:", error);
    }
    return null;
  }
}

/**
 * Apply AI match results to jobs
 */
function applyAIMatchResults(
  jobs: EnhancedJobListing[],
  aiResults: AIMatchResult[]
): EnhancedJobListing[] {
  const resultMap = new Map(aiResults.map((r) => [r.job_id, r]));

  for (const job of jobs) {
    const aiResult = resultMap.get(job.id);
    if (aiResult) {
      job.matchScore = aiResult.score;
      job.matchReasoning = aiResult.reasoning;
      job.matchStrengths = aiResult.strengths;
      job.matchGaps = aiResult.gaps;
      job.matchRecommendation = aiResult.recommendation as EnhancedJobListing["matchRecommendation"];
    }
  }

  return jobs;
}

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
    case "jobup":
    case "jobup.ch":
      return scrapeJobup(queryStr, location);
    case "jobscout24":
    case "jobscout24.ch":
      return scrapeJobscout24(queryStr, location);
    default:
      console.warn(`[Scraper] Unknown board: ${board}, skipping`);
      return [];
  }
}

/**
 * Matching progress event for SSE
 */
export interface MatchingProgress {
  phase: "matching_started" | "matching_progress" | "matching_complete";
  totalJobs: number;
  matchedJobs: number;
  useAI: boolean;
}

/**
 * Execute a scrape plan using real Firecrawl scrapers
 * Uses parallel execution with 2 concurrent scrapers for better performance
 * Integrates with Python AI matching backend
 */
export async function executePlan(
  userId: string,
  plan: ScrapePlan,
  profile: UserProfile,
  onProgress?: (plan: ScrapePlan) => void,
  onMatchingProgress?: (progress: MatchingProgress) => void
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

  // ============================================
  // AI Matching Phase
  // ============================================
  onMatchingProgress?.({
    phase: "matching_started",
    totalJobs: validJobs.length,
    matchedJobs: 0,
    useAI: true,
  });

  // Try AI matching first, fall back to TypeScript if unavailable
  console.log(`[Matching] Starting AI matching for ${validJobs.length} jobs...`);
  const aiResults = await matchJobsWithAI(profile, validJobs);

  let useAI = false;
  if (aiResults && aiResults.length > 0) {
    // AI matching succeeded - apply results
    useAI = true;
    console.log(`[Matching] AI matching succeeded with ${aiResults.length} results`);
    applyAIMatchResults(validJobs, aiResults);

    onMatchingProgress?.({
      phase: "matching_progress",
      totalJobs: validJobs.length,
      matchedJobs: aiResults.length,
      useAI: true,
    });
  } else {
    // Fall back to TypeScript matching
    console.log("[Matching] AI matching unavailable, using TypeScript fallback");
    const scores = scoreJobsAgainstProfile(profile, validJobs);
    const scoreMap = new Map(scores.map((s) => [s.jobId, s.overallScore]));

    // Apply scores to jobs
    for (const job of validJobs) {
      job.matchScore = scoreMap.get(job.id);
    }

    onMatchingProgress?.({
      phase: "matching_progress",
      totalJobs: validJobs.length,
      matchedJobs: validJobs.length,
      useAI: false,
    });
  }

  onMatchingProgress?.({
    phase: "matching_complete",
    totalJobs: validJobs.length,
    matchedJobs: validJobs.length,
    useAI,
  });

  // Sort by match score
  validJobs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  // Replace all jobs for this user (fresh results)
  const savedCount = await replaceJobs(userId, validJobs);

  // Update plan
  plan.status = "completed";
  plan.completedAt = new Date().toISOString();
  plan.totalJobsFound = totalJobsFound;
  plan.newJobsAdded = savedCount;
  plan.duplicatesSkipped = 0; // No deduplication in replace mode

  await saveScrapePlan(userId, plan);

  // Add to history
  await addScrapeHistoryEntry(userId, {
    id: `history_${Date.now()}`,
    planId: plan.id,
    completedAt: plan.completedAt,
    mode: plan.mode,
    boardsScraped: [...new Set(plan.tasks.map((t) => t.board))],
    totalJobsFound,
    newJobsAdded: savedCount,
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
  onProgress?: (plan: ScrapePlan) => void,
  onMatchingProgress?: (progress: MatchingProgress) => void
): Promise<ScrapePlan> {
  return executePlan(profile.id, plan, profile, onProgress, onMatchingProgress);
}
