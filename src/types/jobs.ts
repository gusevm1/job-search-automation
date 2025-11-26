import { z } from "zod";

// ============================================
// Base Job Listing (from scraping module)
// ============================================
export const JobListingSchema = z.object({
  id: z.string().describe("Unique identifier for the job"),
  title: z.string().describe("Job title"),
  company: z.string().describe("Company name"),
  location: z.string().optional().describe("Job location"),
  salary: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      currency: z.string().optional(),
      period: z.enum(["hourly", "daily", "monthly", "yearly"]).optional(),
    })
    .optional()
    .describe("Salary information if available"),
  description: z.string().optional().describe("Job description"),
  requirements: z.array(z.string()).optional().describe("Job requirements"),
  benefits: z.array(z.string()).optional().describe("Job benefits"),
  employmentType: z
    .enum(["full-time", "part-time", "contract", "freelance", "internship"])
    .optional()
    .describe("Type of employment"),
  remote: z
    .enum(["remote", "hybrid", "on-site"])
    .optional()
    .describe("Remote work policy"),
  postedDate: z.string().optional().describe("When the job was posted"),
  applicationUrl: z.string().url().optional().describe("URL to apply"),
  sourceUrl: z.string().url().describe("URL where the job was found"),
  sourceSite: z.string().describe("Name of the job board/site"),
  scrapedAt: z.string().datetime().describe("When the job was scraped"),
  rawData: z.unknown().optional().describe("Raw data from the scrape"),
});

export type JobListing = z.infer<typeof JobListingSchema>;

// ============================================
// Enhanced Job with User Status
// ============================================
export const JobStatusSchema = z.enum([
  "new",
  "viewed",
  "saved",
  "applied",
  "hidden",
  "rejected",
]);

export type JobStatus = z.infer<typeof JobStatusSchema>;

export const EnhancedJobListingSchema = JobListingSchema.extend({
  // User interaction status
  status: JobStatusSchema.default("new"),
  viewedAt: z.string().datetime().optional(),
  savedAt: z.string().datetime().optional(),
  appliedAt: z.string().datetime().optional(),
  hiddenAt: z.string().datetime().optional(),

  // User notes
  notes: z.string().optional(),

  // Match score (0-100)
  matchScore: z.number().min(0).max(100).optional(),

  // Extracted/inferred data
  seniorityLevel: z
    .enum(["entry", "junior", "mid", "senior", "lead", "principal", "director"])
    .optional(),
  techStack: z.array(z.string()).optional(),
  industry: z.string().optional(),
  companySize: z
    .enum(["startup", "small", "medium", "large", "enterprise"])
    .optional(),
});

export type EnhancedJobListing = z.infer<typeof EnhancedJobListingSchema>;

// ============================================
// Search Query Generation
// ============================================
export const SearchQuerySchema = z.object({
  query: z.string(),
  location: z.string().optional(),
  remote: z.boolean().optional(),
  priority: z.number().min(1).max(10).default(5),
  category: z.string().optional(), // e.g., "primary_skill", "title", "technology"
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;

// ============================================
// Scrape Task & Plan
// ============================================
export const ScrapeTaskStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
  "skipped",
]);

export type ScrapeTaskStatus = z.infer<typeof ScrapeTaskStatusSchema>;

export const ScrapeTaskSchema = z.object({
  id: z.string(),
  board: z.string(), // e.g., "jobs.ch", "swissdevjobs", "linkedin", "indeed"
  query: SearchQuerySchema,
  status: ScrapeTaskStatusSchema.default("pending"),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  jobsFound: z.number().default(0),
  error: z.string().optional(),
});

export type ScrapeTask = z.infer<typeof ScrapeTaskSchema>;

export const ScrapePlanStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
]);

export type ScrapePlanStatus = z.infer<typeof ScrapePlanStatusSchema>;

export const ScrapePlanSchema = z.object({
  id: z.string(),
  userId: z.string(),
  mode: z.enum(["full", "quick"]).default("full"),
  status: ScrapePlanStatusSchema.default("pending"),
  createdAt: z.string().datetime(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  tasks: z.array(ScrapeTaskSchema),
  totalJobsFound: z.number().default(0),
  newJobsAdded: z.number().default(0),
  duplicatesSkipped: z.number().default(0),
});

export type ScrapePlan = z.infer<typeof ScrapePlanSchema>;

// ============================================
// Job Filters
// ============================================
export const JobFiltersSchema = z.object({
  // Score filter
  minScore: z.number().min(0).max(100).optional(),

  // Source filters
  sources: z.array(z.string()).optional(),

  // Status filters
  statuses: z.array(JobStatusSchema).optional(),

  // Location/remote
  remoteOnly: z.boolean().optional(),
  locations: z.array(z.string()).optional(),

  // Salary
  salaryMin: z.number().optional(),
  salaryCurrency: z.string().optional(),

  // Date
  datePosted: z.enum(["any", "today", "week", "month"]).optional(),

  // Seniority
  seniorityLevels: z
    .array(
      z.enum([
        "entry",
        "junior",
        "mid",
        "senior",
        "lead",
        "principal",
        "director",
      ])
    )
    .optional(),

  // Company size preference
  companySizes: z
    .array(z.enum(["startup", "small", "medium", "large", "enterprise"]))
    .optional(),

  // Search text
  searchText: z.string().optional(),
});

export type JobFilters = z.infer<typeof JobFiltersSchema>;

// ============================================
// Match Score Breakdown
// ============================================
export const MatchScoreBreakdownSchema = z.object({
  skillsMatch: z.number().min(0).max(100),
  locationMatch: z.number().min(0).max(100),
  salaryMatch: z.number().min(0).max(100),
  seniorityMatch: z.number().min(0).max(100),
  employmentTypeMatch: z.number().min(0).max(100),
  companySizeMatch: z.number().min(0).max(100),
  remoteMatch: z.number().min(0).max(100),
  educationMatch: z.number().min(0).max(100).optional(), // Degree requirements match
  experienceMatch: z.number().min(0).max(100).optional(), // Years of experience match
});

export type MatchScoreBreakdown = z.infer<typeof MatchScoreBreakdownSchema>;

export const JobMatchResultSchema = z.object({
  jobId: z.string(),
  overallScore: z.number().min(0).max(100),
  breakdown: MatchScoreBreakdownSchema,
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  highlights: z.array(z.string()), // Positive matches
  concerns: z.array(z.string()), // Potential issues
});

export type JobMatchResult = z.infer<typeof JobMatchResultSchema>;

// ============================================
// Board Configuration
// ============================================
export const JobBoardConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  baseUrl: z.string().url(),
  enabled: z.boolean().default(true),
  priority: z.number().min(1).max(10).default(5),
  rateLimit: z.number().default(5), // requests per minute
  supportsRemote: z.boolean().default(false),
  regions: z.array(z.string()), // e.g., ["CH", "EU", "Global"]
  specialization: z.string().optional(), // e.g., "tech", "general"
});

export type JobBoardConfig = z.infer<typeof JobBoardConfigSchema>;

// ============================================
// Scrape History Entry
// ============================================
export const ScrapeHistoryEntrySchema = z.object({
  id: z.string(),
  planId: z.string(),
  completedAt: z.string().datetime(),
  mode: z.enum(["full", "quick"]),
  boardsScraped: z.array(z.string()),
  totalJobsFound: z.number(),
  newJobsAdded: z.number(),
  duration: z.number(), // milliseconds
  triggeredBy: z.enum(["manual", "scheduled"]),
});

export type ScrapeHistoryEntry = z.infer<typeof ScrapeHistoryEntrySchema>;

// ============================================
// Profile Analysis Result (for query generation)
// ============================================
export const ProfileAnalysisSchema = z.object({
  // Generated search queries
  queries: z.array(SearchQuerySchema),

  // Board priorities for this profile
  boardPriorities: z.array(
    z.object({
      boardId: z.string(),
      priority: z.number(),
      reason: z.string(),
    })
  ),

  // Key skills extracted (ordered by relevance)
  topSkills: z.array(z.string()),

  // Target job titles
  targetTitles: z.array(z.string()),

  // Location preferences
  locations: z.array(z.string()),

  // Preferred company characteristics
  companyPreferences: z.object({
    sizes: z.array(z.string()),
    industries: z.array(z.string()),
  }),
});

export type ProfileAnalysis = z.infer<typeof ProfileAnalysisSchema>;
