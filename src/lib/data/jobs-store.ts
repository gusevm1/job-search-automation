import { promises as fs } from "fs";
import path from "path";
import {
  EnhancedJobListing,
  EnhancedJobListingSchema,
  ScrapePlan,
  ScrapePlanSchema,
  ScrapeHistoryEntry,
  ScrapeHistoryEntrySchema,
  JobMatchResult,
  JobMatchResultSchema,
  JobFilters,
} from "@/types/jobs";
import { z } from "zod";

const DATA_DIR = path.join(process.cwd(), "src/lib/data");
const JOBS_DIR = path.join(DATA_DIR, "jobs");

/**
 * Get user's jobs directory
 */
function getUserJobsDir(userId: string): string {
  return path.join(JOBS_DIR, userId);
}

/**
 * Ensure user's jobs directory exists
 */
async function ensureUserJobsDir(userId: string): Promise<string> {
  const dir = getUserJobsDir(userId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

// ============================================
// Jobs CRUD
// ============================================

/**
 * Get all jobs for a user
 */
export async function getJobs(userId: string): Promise<EnhancedJobListing[]> {
  try {
    const filepath = path.join(getUserJobsDir(userId), "jobs.json");
    const data = await fs.readFile(filepath, "utf-8");
    const parsed = JSON.parse(data);
    return z.array(EnhancedJobListingSchema).parse(parsed);
  } catch {
    return [];
  }
}

/**
 * Get a single job by ID
 */
export async function getJob(
  userId: string,
  jobId: string
): Promise<EnhancedJobListing | null> {
  const jobs = await getJobs(userId);
  return jobs.find((j) => j.id === jobId) || null;
}

/**
 * Save all jobs for a user
 */
export async function saveJobs(
  userId: string,
  jobs: EnhancedJobListing[]
): Promise<void> {
  await ensureUserJobsDir(userId);
  const filepath = path.join(getUserJobsDir(userId), "jobs.json");
  const validated = z.array(EnhancedJobListingSchema).parse(jobs);
  await fs.writeFile(filepath, JSON.stringify(validated, null, 2), "utf-8");
}

/**
 * Add new jobs (with deduplication)
 * Returns: { added: number, duplicates: number }
 */
export async function addJobs(
  userId: string,
  newJobs: EnhancedJobListing[]
): Promise<{ added: number; duplicates: number }> {
  const existingJobs = await getJobs(userId);
  const existingKeys = new Set(
    existingJobs.map((j) => createJobKey(j))
  );

  let added = 0;
  let duplicates = 0;

  for (const job of newJobs) {
    const key = createJobKey(job);
    if (existingKeys.has(key)) {
      duplicates++;
    } else {
      existingJobs.push(job);
      existingKeys.add(key);
      added++;
    }
  }

  if (added > 0) {
    await saveJobs(userId, existingJobs);
  }

  return { added, duplicates };
}

/**
 * Create a deduplication key for a job
 * Uses company + title + location (normalized)
 */
function createJobKey(job: EnhancedJobListing): string {
  const normalize = (s: string | undefined) =>
    (s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .trim();

  return `${normalize(job.company)}:${normalize(job.title)}:${normalize(job.location)}`;
}

/**
 * Update a job's status
 */
export async function updateJobStatus(
  userId: string,
  jobId: string,
  status: EnhancedJobListing["status"],
  notes?: string
): Promise<EnhancedJobListing | null> {
  const jobs = await getJobs(userId);
  const jobIndex = jobs.findIndex((j) => j.id === jobId);

  if (jobIndex === -1) return null;

  const now = new Date().toISOString();
  jobs[jobIndex].status = status;

  // Update timestamp based on status
  switch (status) {
    case "viewed":
      jobs[jobIndex].viewedAt = now;
      break;
    case "saved":
      jobs[jobIndex].savedAt = now;
      break;
    case "applied":
      jobs[jobIndex].appliedAt = now;
      break;
    case "hidden":
      jobs[jobIndex].hiddenAt = now;
      break;
  }

  if (notes !== undefined) {
    jobs[jobIndex].notes = notes;
  }

  await saveJobs(userId, jobs);
  return jobs[jobIndex];
}

/**
 * Filter jobs based on criteria
 */
export async function filterJobs(
  userId: string,
  filters: JobFilters
): Promise<EnhancedJobListing[]> {
  let jobs = await getJobs(userId);

  // Apply filters
  if (filters.minScore !== undefined) {
    jobs = jobs.filter((j) => (j.matchScore || 0) >= filters.minScore!);
  }

  if (filters.sources && filters.sources.length > 0) {
    jobs = jobs.filter((j) => filters.sources!.includes(j.sourceSite));
  }

  if (filters.statuses && filters.statuses.length > 0) {
    jobs = jobs.filter((j) => filters.statuses!.includes(j.status));
  }

  if (filters.remoteOnly) {
    jobs = jobs.filter((j) => j.remote === "remote");
  }

  if (filters.locations && filters.locations.length > 0) {
    jobs = jobs.filter((j) =>
      filters.locations!.some(
        (loc) =>
          j.location?.toLowerCase().includes(loc.toLowerCase())
      )
    );
  }

  if (filters.salaryMin !== undefined) {
    jobs = jobs.filter(
      (j) => j.salary?.min !== undefined && j.salary.min >= filters.salaryMin!
    );
  }

  if (filters.seniorityLevels && filters.seniorityLevels.length > 0) {
    jobs = jobs.filter(
      (j) =>
        j.seniorityLevel && filters.seniorityLevels!.includes(j.seniorityLevel)
    );
  }

  if (filters.companySizes && filters.companySizes.length > 0) {
    jobs = jobs.filter(
      (j) => j.companySize && filters.companySizes!.includes(j.companySize)
    );
  }

  if (filters.datePosted && filters.datePosted !== "any") {
    const now = Date.now();
    const cutoffs: Record<string, number> = {
      today: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    };
    const cutoff = cutoffs[filters.datePosted];
    if (cutoff) {
      jobs = jobs.filter((j) => {
        if (!j.postedDate) return true; // Include if no date
        const posted = new Date(j.postedDate).getTime();
        return now - posted <= cutoff;
      });
    }
  }

  if (filters.searchText) {
    const search = filters.searchText.toLowerCase();
    jobs = jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(search) ||
        j.company.toLowerCase().includes(search) ||
        j.description?.toLowerCase().includes(search)
    );
  }

  return jobs;
}

// ============================================
// Match Scores
// ============================================

/**
 * Get match scores for a user
 */
export async function getMatchScores(
  userId: string
): Promise<JobMatchResult[]> {
  try {
    const filepath = path.join(getUserJobsDir(userId), "scores.json");
    const data = await fs.readFile(filepath, "utf-8");
    const parsed = JSON.parse(data);
    return z.array(JobMatchResultSchema).parse(parsed);
  } catch {
    return [];
  }
}

/**
 * Save match scores
 */
export async function saveMatchScores(
  userId: string,
  scores: JobMatchResult[]
): Promise<void> {
  await ensureUserJobsDir(userId);
  const filepath = path.join(getUserJobsDir(userId), "scores.json");
  const validated = z.array(JobMatchResultSchema).parse(scores);
  await fs.writeFile(filepath, JSON.stringify(validated, null, 2), "utf-8");
}

/**
 * Update jobs with match scores
 */
export async function applyMatchScoresToJobs(
  userId: string,
  scores: JobMatchResult[]
): Promise<void> {
  const jobs = await getJobs(userId);
  const scoreMap = new Map(scores.map((s) => [s.jobId, s.overallScore]));

  for (const job of jobs) {
    if (scoreMap.has(job.id)) {
      job.matchScore = scoreMap.get(job.id);
    }
  }

  await saveJobs(userId, jobs);
}

// ============================================
// Scrape Plans
// ============================================

/**
 * Get the current/latest scrape plan
 */
export async function getCurrentScrapePlan(
  userId: string
): Promise<ScrapePlan | null> {
  try {
    const filepath = path.join(getUserJobsDir(userId), "current-plan.json");
    const data = await fs.readFile(filepath, "utf-8");
    const parsed = JSON.parse(data);
    return ScrapePlanSchema.parse(parsed);
  } catch {
    return null;
  }
}

/**
 * Save scrape plan
 */
export async function saveScrapePlan(
  userId: string,
  plan: ScrapePlan
): Promise<void> {
  await ensureUserJobsDir(userId);
  const filepath = path.join(getUserJobsDir(userId), "current-plan.json");
  const validated = ScrapePlanSchema.parse(plan);
  await fs.writeFile(filepath, JSON.stringify(validated, null, 2), "utf-8");
}

/**
 * Delete scrape plan
 */
export async function deleteScrapePlan(userId: string): Promise<void> {
  try {
    const filepath = path.join(getUserJobsDir(userId), "current-plan.json");
    await fs.unlink(filepath);
  } catch {
    // Plan doesn't exist, that's fine
  }
}

// ============================================
// Scrape History
// ============================================

/**
 * Get scrape history
 */
export async function getScrapeHistory(
  userId: string,
  limit = 10
): Promise<ScrapeHistoryEntry[]> {
  try {
    const filepath = path.join(getUserJobsDir(userId), "history.json");
    const data = await fs.readFile(filepath, "utf-8");
    const parsed = JSON.parse(data);
    const validated = z.array(ScrapeHistoryEntrySchema).parse(parsed);
    return validated.slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Add entry to scrape history
 */
export async function addScrapeHistoryEntry(
  userId: string,
  entry: ScrapeHistoryEntry
): Promise<void> {
  await ensureUserJobsDir(userId);
  const history = await getScrapeHistory(userId, 100);

  // Add new entry at beginning
  history.unshift(ScrapeHistoryEntrySchema.parse(entry));

  // Keep only last 100 entries
  const trimmed = history.slice(0, 100);

  const filepath = path.join(getUserJobsDir(userId), "history.json");
  await fs.writeFile(filepath, JSON.stringify(trimmed, null, 2), "utf-8");
}

// ============================================
// Stats
// ============================================

export interface JobStats {
  total: number;
  new: number;
  saved: number;
  applied: number;
  hidden: number;
  viewed: number;
  averageScore: number;
  bySource: Record<string, number>;
  lastScrapedAt: string | null;
}

/**
 * Get job statistics for a user
 */
export async function getJobStats(userId: string): Promise<JobStats> {
  const jobs = await getJobs(userId);
  const history = await getScrapeHistory(userId, 1);

  const stats: JobStats = {
    total: jobs.length,
    new: 0,
    saved: 0,
    applied: 0,
    hidden: 0,
    viewed: 0,
    averageScore: 0,
    bySource: {},
    lastScrapedAt: history[0]?.completedAt || null,
  };

  let scoreSum = 0;
  let scoreCount = 0;

  for (const job of jobs) {
    // Count by status
    switch (job.status) {
      case "new":
        stats.new++;
        break;
      case "saved":
        stats.saved++;
        break;
      case "applied":
        stats.applied++;
        break;
      case "hidden":
        stats.hidden++;
        break;
      case "viewed":
        stats.viewed++;
        break;
    }

    // Count by source
    stats.bySource[job.sourceSite] = (stats.bySource[job.sourceSite] || 0) + 1;

    // Average score
    if (job.matchScore !== undefined) {
      scoreSum += job.matchScore;
      scoreCount++;
    }
  }

  stats.averageScore = scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 0;

  return stats;
}

/**
 * Generate a unique job ID
 */
export function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a unique plan ID
 */
export function generatePlanId(): string {
  return `plan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
