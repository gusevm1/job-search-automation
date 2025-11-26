import { EnhancedJobListing } from "@/types/jobs";
import { generateJobId } from "@/lib/data/jobs-store";

// ============================================
// Security: Content Sanitization
// ============================================

/**
 * Patterns that indicate potential prompt injection attempts
 * These patterns detect common LLM manipulation techniques
 */
const PROMPT_INJECTION_PATTERNS = [
  // Direct instruction patterns
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|context)/i,
  /disregard\s+(all\s+)?(previous|prior|above)/i,
  /forget\s+(everything|all|what)\s+(you|i)\s+(told|said|know)/i,
  /new\s+instructions?:/i,
  /system\s*prompt/i,
  /\bact\s+as\b/i,
  /\byou\s+are\s+now\b/i,
  /\bpretend\s+(to\s+be|you('re|are))\b/i,

  // Role manipulation
  /\b(assistant|ai|chatgpt|claude|gpt|llm)\s*(mode|role|persona)/i,
  /switch(ing)?\s+to\s+\w+\s+mode/i,
  /entering\s+\w+\s+mode/i,

  // Code execution attempts
  /```(bash|sh|python|javascript|js|eval|exec)/i,
  /\$\([^)]+\)/,  // Shell command substitution
  /`[^`]*`/,  // Backtick execution
  /<script\b/i,
  /javascript:/i,
  /on(click|load|error|mouse)/i,

  // Data exfiltration attempts
  /\b(api[_\s-]?key|secret|password|token|credential)/i,
  /process\.env/i,
  /\bfetch\s*\(/i,
  /\beval\s*\(/i,

  // Delimiter injection
  /###\s*(system|user|assistant)/i,
  /<\|(system|user|assistant|endof)/i,
  /\[INST\]/i,
  /\[\/INST\]/i,
];

/**
 * Maximum allowed lengths for scraped fields
 * Prevents DoS via excessive data
 */
const FIELD_LIMITS = {
  title: 200,
  company: 150,
  location: 100,
  description: 5000,
  requirements: 100,  // Per item
  technologies: 50,   // Per item
  applicationUrl: 500,
  maxArrayItems: 50,
};

/**
 * Sanitize a string field from scraped content
 * Removes potential prompt injections and normalizes content
 */
function sanitizeString(value: unknown, maxLength: number): string {
  if (value === null || value === undefined) return "";

  let str = String(value);

  // Remove null bytes and control characters (except newlines and tabs)
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Check for prompt injection patterns
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(str)) {
      console.warn(`[Security] Potential prompt injection detected and sanitized`);
      // Replace the suspicious content with a safe marker
      str = str.replace(pattern, "[FILTERED]");
    }
  }

  // Remove HTML tags
  str = str.replace(/<[^>]*>/g, "");

  // Normalize whitespace
  str = str.replace(/\s+/g, " ").trim();

  // Truncate to max length
  if (str.length > maxLength) {
    str = str.substring(0, maxLength) + "...";
  }

  return str;
}

/**
 * Sanitize and validate a URL
 * Only allows http/https protocols and known job board domains
 */
function sanitizeUrl(value: unknown): string | undefined {
  if (!value) return undefined;

  const urlStr = String(value).trim();

  // Must start with http:// or https://
  if (!urlStr.match(/^https?:\/\//i)) {
    return undefined;
  }

  try {
    const url = new URL(urlStr);

    // Block dangerous protocols
    if (!["http:", "https:"].includes(url.protocol)) {
      console.warn(`[Security] Blocked non-http URL: ${url.protocol}`);
      return undefined;
    }

    // Block localhost/internal URLs
    const hostname = url.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.endsWith(".local")
    ) {
      console.warn(`[Security] Blocked internal URL: ${hostname}`);
      return undefined;
    }

    // Return sanitized URL (limited length)
    return urlStr.substring(0, FIELD_LIMITS.applicationUrl);
  } catch {
    return undefined;
  }
}

/**
 * Sanitize an array of strings
 */
function sanitizeStringArray(
  value: unknown,
  maxItemLength: number,
  maxItems: number = FIELD_LIMITS.maxArrayItems
): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .slice(0, maxItems)
    .map((item) => sanitizeString(item, maxItemLength))
    .filter((item) => item.length > 0);
}

/**
 * Validate that extracted data looks like legitimate job data
 * Returns false if the data seems malicious or malformed
 */
function validateJobData(job: Record<string, unknown>): boolean {
  // Must have title and company
  if (!job.title || !job.company) return false;

  const title = String(job.title);
  const company = String(job.company);

  // Title should look like a job title (has letters, reasonable length)
  if (title.length < 3 || title.length > 200) return false;
  if (!/[a-zA-Z]{3,}/.test(title)) return false;

  // Company should have letters
  if (company.length < 2 || company.length > 150) return false;
  if (!/[a-zA-Z]{2,}/.test(company)) return false;

  // Check for excessive special characters (possible injection)
  const specialCharRatio = (str: string) => {
    const special = str.replace(/[a-zA-Z0-9\s.,'-]/g, "").length;
    return special / str.length;
  };

  if (specialCharRatio(title) > 0.3) return false;
  if (specialCharRatio(company) > 0.3) return false;

  return true;
}

// ============================================
// Firecrawl Scraper Class
// ============================================

/**
 * Firecrawl API client for job scraping
 */
class FirecrawlJobScraper {
  private apiKey: string;
  private baseUrl = "https://api.firecrawl.dev/v1";

  constructor() {
    this.apiKey = process.env.FIRECRAWL_API_KEY || "";
    if (!this.apiKey) {
      console.warn("FIRECRAWL_API_KEY not set - scraping will fail");
    }
  }

  /**
   * Scrape a URL and extract job listings using AI
   * Includes 30-second timeout to prevent hanging on slow responses
   */
  async scrapeJobs(
    url: string,
    sourceSite: string
  ): Promise<EnhancedJobListing[]> {
    if (!this.apiKey) {
      throw new Error("FIRECRAWL_API_KEY is not configured");
    }

    console.log(`[Scraper] Scraping ${sourceSite}: ${url}`);

    // Set up 30-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 30000); // 30 seconds

    try {
      const response = await fetch(`${this.baseUrl}/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          url,
          formats: ["extract"],
          extract: {
            prompt: this.getExtractionPrompt(),
            schema: this.getExtractionSchema(),
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Scraper] API error: ${response.status}`, errorText);
        throw new Error(`Firecrawl API error: ${response.status}`);
      }

      const result = await response.json();
      const extractedData = result.data?.extract;

      if (!extractedData || !extractedData.jobs) {
        console.log(`[Scraper] No jobs extracted from ${url}`);
        return [];
      }

      // Convert extracted data to EnhancedJobListing format
      const jobs = this.parseExtractedJobs(extractedData.jobs, sourceSite, url);
      console.log(`[Scraper] Found ${jobs.length} jobs from ${sourceSite}`);

      return jobs;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle timeout specifically
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`[Scraper] Request timed out after 30s for ${sourceSite}: ${url}`);
        throw new Error(`Scrape timed out after 30s for ${sourceSite}`);
      }

      console.error(`[Scraper] Error scraping ${url}:`, error);
      throw error;
    }
  }

  /**
   * Extraction prompt for job listings
   */
  private getExtractionPrompt(): string {
    return `Extract all job listings from this job board page. For each job, extract:
- Job title
- Company name
- Location (city, country, or "Remote")
- Employment type (full-time, part-time, contract, internship)
- Remote work option (remote, hybrid, on-site)
- Job description or summary
- Required skills/technologies mentioned
- Salary information if available
- Posted date if shown
- URL to apply or view full job details

Focus on tech/engineering jobs, especially those related to:
- Machine Learning / AI / Data Science
- Software Engineering
- LLMs / NLP / Computer Vision
- Cloud / DevOps

Return ALL jobs visible on the page, not just a sample.`;
  }

  /**
   * Schema for structured extraction
   */
  private getExtractionSchema(): Record<string, unknown> {
    return {
      type: "object",
      properties: {
        jobs: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "Job title" },
              company: { type: "string", description: "Company name" },
              location: { type: "string", description: "Job location" },
              employmentType: {
                type: "string",
                enum: ["full-time", "part-time", "contract", "internship"],
              },
              remote: {
                type: "string",
                enum: ["remote", "hybrid", "on-site"],
              },
              description: { type: "string", description: "Job description or summary" },
              requirements: {
                type: "array",
                items: { type: "string" },
                description: "Required skills or qualifications",
              },
              technologies: {
                type: "array",
                items: { type: "string" },
                description: "Technologies/skills mentioned",
              },
              salaryMin: { type: "number", description: "Minimum salary if shown" },
              salaryMax: { type: "number", description: "Maximum salary if shown" },
              salaryCurrency: { type: "string", description: "Salary currency" },
              postedDate: { type: "string", description: "When job was posted" },
              applicationUrl: { type: "string", description: "URL to apply or view job" },
              seniorityLevel: {
                type: "string",
                enum: ["entry", "junior", "mid", "senior", "lead", "principal", "director"],
              },
            },
            required: ["title", "company"],
          },
        },
        totalJobsOnPage: {
          type: "number",
          description: "Total number of jobs visible on this page",
        },
        hasMorePages: {
          type: "boolean",
          description: "Whether there are more pages of results",
        },
      },
      required: ["jobs"],
    };
  }

  /**
   * Parse extracted job data into EnhancedJobListing format
   * SECURITY: All fields are sanitized to prevent prompt injection and malicious content
   */
  private parseExtractedJobs(
    jobs: Array<Record<string, unknown>>,
    sourceSite: string,
    sourceUrl: string
  ): EnhancedJobListing[] {
    const now = new Date().toISOString();

    // Limit total number of jobs to prevent DoS
    const maxJobs = 100;
    const limitedJobs = jobs.slice(0, maxJobs);

    if (jobs.length > maxJobs) {
      console.warn(`[Security] Truncated jobs from ${jobs.length} to ${maxJobs}`);
    }

    return limitedJobs
      // Step 1: Validate job data structure
      .filter((job) => validateJobData(job))
      // Step 2: Sanitize and transform
      .map((job) => ({
        id: generateJobId(),
        // SANITIZE: All string fields go through sanitization
        title: sanitizeString(job.title, FIELD_LIMITS.title),
        company: sanitizeString(job.company, FIELD_LIMITS.company),
        location: job.location
          ? sanitizeString(job.location, FIELD_LIMITS.location)
          : undefined,
        description: job.description
          ? sanitizeString(job.description, FIELD_LIMITS.description)
          : undefined,
        // SANITIZE: Arrays with per-item limits
        requirements: sanitizeStringArray(
          job.requirements,
          FIELD_LIMITS.requirements
        ),
        techStack: sanitizeStringArray(
          job.technologies,
          FIELD_LIMITS.technologies
        ),
        employmentType: this.normalizeEmploymentType(job.employmentType),
        remote: this.normalizeRemote(job.remote),
        // VALIDATE: Salary numbers with bounds
        salary:
          job.salaryMin || job.salaryMax
            ? {
                min: this.sanitizeSalary(job.salaryMin),
                max: this.sanitizeSalary(job.salaryMax),
                currency: this.sanitizeCurrency(job.salaryCurrency),
                period: "yearly" as const,
              }
            : undefined,
        postedDate: job.postedDate
          ? sanitizeString(job.postedDate, 50)
          : undefined,
        // SANITIZE: URLs validated and sanitized
        applicationUrl: sanitizeUrl(job.applicationUrl),
        sourceUrl: sanitizeUrl(sourceUrl) || sourceUrl,
        sourceSite: sanitizeString(sourceSite, 50),
        scrapedAt: now,
        status: "new" as const,
        seniorityLevel: this.normalizeSeniority(job.seniorityLevel),
      }));
  }

  /**
   * Sanitize salary values - must be reasonable numbers
   */
  private sanitizeSalary(value: unknown): number | undefined {
    if (value === null || value === undefined) return undefined;
    const num = Number(value);
    // Salary must be positive and less than 10 million
    if (isNaN(num) || num < 0 || num > 10000000) return undefined;
    return Math.round(num);
  }

  /**
   * Sanitize currency code
   */
  private sanitizeCurrency(value: unknown): string {
    if (!value) return "CHF";
    const currency = String(value).toUpperCase().replace(/[^A-Z]/g, "");
    // Must be 3 letter currency code
    if (currency.length !== 3) return "CHF";
    return currency;
  }

  private normalizeEmploymentType(
    value: unknown
  ): "full-time" | "part-time" | "contract" | "freelance" | "internship" | undefined {
    if (!value) return undefined;
    const normalized = String(value).toLowerCase().replace(/\s+/g, "-");
    const valid = ["full-time", "part-time", "contract", "freelance", "internship"];
    return valid.includes(normalized)
      ? (normalized as "full-time" | "part-time" | "contract" | "freelance" | "internship")
      : "full-time";
  }

  private normalizeRemote(value: unknown): "remote" | "hybrid" | "on-site" | undefined {
    if (!value) return undefined;
    const normalized = String(value).toLowerCase();
    if (normalized.includes("remote")) return "remote";
    if (normalized.includes("hybrid")) return "hybrid";
    return "on-site";
  }

  private normalizeSeniority(
    value: unknown
  ): "entry" | "junior" | "mid" | "senior" | "lead" | "principal" | "director" | undefined {
    if (!value) return undefined;
    const normalized = String(value).toLowerCase();
    const valid = ["entry", "junior", "mid", "senior", "lead", "principal", "director"];
    return valid.includes(normalized)
      ? (normalized as "entry" | "junior" | "mid" | "senior" | "lead" | "principal" | "director")
      : undefined;
  }
}

// ============================================
// Job Board Scrapers
// ============================================

/**
 * SwissDevJobs.ch scraper
 */
export async function scrapeSwissDevJobs(
  query: string,
  location?: string
): Promise<EnhancedJobListing[]> {
  const scraper = new FirecrawlJobScraper();

  // Build search URL - SwissDevJobs uses /jobs?search= format
  const params = new URLSearchParams();
  if (query) params.set("search", query);
  const url = `https://swissdevjobs.ch/jobs?${params.toString()}`;

  try {
    return await scraper.scrapeJobs(url, "SwissDevJobs");
  } catch (error) {
    console.error("[SwissDevJobs] Scrape failed:", error);
    return [];
  }
}

/**
 * Jobs.ch scraper
 */
export async function scrapeJobsCh(
  query: string,
  location?: string
): Promise<EnhancedJobListing[]> {
  const scraper = new FirecrawlJobScraper();

  // Build search URL for jobs.ch
  const params = new URLSearchParams();
  if (query) params.set("term", query);
  if (location) params.set("location", location);
  const url = `https://www.jobs.ch/en/vacancies/?${params.toString()}`;

  try {
    return await scraper.scrapeJobs(url, "Jobs.ch");
  } catch (error) {
    console.error("[Jobs.ch] Scrape failed:", error);
    return [];
  }
}

/**
 * LinkedIn Jobs scraper (public listings only)
 * NOTE: LinkedIn is not supported by Firecrawl standard API - requires enterprise
 */
export async function scrapeLinkedIn(
  query: string,
  location?: string
): Promise<EnhancedJobListing[]> {
  // LinkedIn scraping is not supported by Firecrawl free/standard tier
  // Would need enterprise access or alternative approach
  console.log("[LinkedIn] Skipped - LinkedIn scraping requires Firecrawl Enterprise");
  return [];
}

/**
 * Generic scraper for any job board URL
 */
export async function scrapeJobBoard(
  url: string,
  sourceName: string
): Promise<EnhancedJobListing[]> {
  const scraper = new FirecrawlJobScraper();

  try {
    return await scraper.scrapeJobs(url, sourceName);
  } catch (error) {
    console.error(`[${sourceName}] Scrape failed:`, error);
    return [];
  }
}

// ============================================
// Additional Job Board Scrapers
// ============================================

/**
 * Datacareer.ch scraper - specialized for Data/AI roles
 */
export async function scrapeDatacareer(
  query: string,
  location?: string
): Promise<EnhancedJobListing[]> {
  const scraper = new FirecrawlJobScraper();

  // Datacareer.ch URL structure for AI jobs
  const categoryMap: Record<string, string> = {
    "machine learning": "ML",
    "ai": "AI",
    "data science": "DS",
    "data engineer": "DE",
    "python": "AI",
    "llm": "AI",
  };

  const category = categoryMap[query.toLowerCase()] || "AI";
  const url = `https://www.datacareer.ch/categories/${category}/`;

  try {
    return await scraper.scrapeJobs(url, "Datacareer.ch");
  } catch (error) {
    console.error("[Datacareer.ch] Scrape failed:", error);
    return [];
  }
}

/**
 * Indeed Switzerland scraper
 */
export async function scrapeIndeedCH(
  query: string,
  location?: string
): Promise<EnhancedJobListing[]> {
  const scraper = new FirecrawlJobScraper();

  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (location) params.set("l", location);
  else params.set("l", "Switzerland");

  const url = `https://ch.indeed.com/jobs?${params.toString()}`;

  try {
    return await scraper.scrapeJobs(url, "Indeed CH");
  } catch (error) {
    console.error("[Indeed CH] Scrape failed:", error);
    return [];
  }
}

/**
 * Glassdoor Switzerland scraper
 */
export async function scrapeGlassdoor(
  query: string,
  location?: string
): Promise<EnhancedJobListing[]> {
  const scraper = new FirecrawlJobScraper();

  // Glassdoor uses URL-encoded search
  const searchQuery = encodeURIComponent(query);
  const url = `https://www.glassdoor.com/Job/switzerland-${searchQuery.toLowerCase().replace(/%20/g, "-")}-jobs-SRCH_IL.0,11_IN226_KO12,${12 + query.length}.htm`;

  try {
    return await scraper.scrapeJobs(url, "Glassdoor");
  } catch (error) {
    console.error("[Glassdoor] Scrape failed:", error);
    return [];
  }
}

/**
 * ICTjobs.ch scraper - IT/Telecom focused
 */
export async function scrapeICTjobs(
  query: string,
  location?: string
): Promise<EnhancedJobListing[]> {
  const scraper = new FirecrawlJobScraper();

  const params = new URLSearchParams();
  if (query) params.set("q", query);
  const url = `https://www.ictjobs.ch/en/jobs?${params.toString()}`;

  try {
    return await scraper.scrapeJobs(url, "ICTjobs.ch");
  } catch (error) {
    console.error("[ICTjobs.ch] Scrape failed:", error);
    return [];
  }
}

// ============================================
// Fake Job Detection
// ============================================

/**
 * Patterns and indicators of fake/spam job postings
 */
const FAKE_JOB_INDICATORS = {
  // Suspicious phrases in title
  suspiciousTitles: [
    /work from home.*\$\d+/i,
    /earn.*\$\d+.*per (hour|day|week)/i,
    /immediate (start|hire|opening)/i,
    /no experience (needed|required|necessary)/i,
    /make money (fast|quick|now)/i,
    /hiring.*immediately/i,
    /urgent.*hiring/i,
  ],

  // Suspicious company patterns
  suspiciousCompanies: [
    /^hiring$/i,
    /^now hiring$/i,
    /^job$/i,
    /^employment$/i,
    /confidential/i,
    /^company$/i,
    /^employer$/i,
  ],

  // Suspicious description patterns
  suspiciousDescriptions: [
    /send.*resume.*email/i,
    /wire transfer/i,
    /western union/i,
    /pay.*upfront/i,
    /training fee/i,
    /registration fee/i,
    /\$\d{4,}.*per week/i,
    /unlimited earning/i,
    /be your own boss/i,
    /work.*anywhere/i,
    /no interview/i,
    /guaranteed.*income/i,
    /easy money/i,
    /mlm|multi.?level|network marketing/i,
  ],

  // Placeholder/generic content
  placeholderPatterns: [
    /lorem ipsum/i,
    /job description here/i,
    /company name/i,
    /\[.*\]/,  // Bracketed placeholders
    /xxx|tbd|tba/i,
  ],
};

/**
 * Calculate a spam/fake probability score for a job listing
 * Returns a score from 0-100 (higher = more likely fake)
 */
export function calculateFakeScore(job: EnhancedJobListing): number {
  let score = 0;
  const flags: string[] = [];

  // Check title
  for (const pattern of FAKE_JOB_INDICATORS.suspiciousTitles) {
    if (pattern.test(job.title)) {
      score += 25;
      flags.push(`Suspicious title pattern: ${pattern}`);
    }
  }

  // Check company
  if (!job.company || job.company.length < 2) {
    score += 30;
    flags.push("Missing or very short company name");
  }
  for (const pattern of FAKE_JOB_INDICATORS.suspiciousCompanies) {
    if (pattern.test(job.company)) {
      score += 35;
      flags.push(`Suspicious company name: ${job.company}`);
    }
  }

  // Check description
  if (job.description) {
    for (const pattern of FAKE_JOB_INDICATORS.suspiciousDescriptions) {
      if (pattern.test(job.description)) {
        score += 20;
        flags.push(`Suspicious description content`);
      }
    }

    // Too short description
    if (job.description.length < 50) {
      score += 15;
      flags.push("Very short description");
    }

    // Check for placeholders
    for (const pattern of FAKE_JOB_INDICATORS.placeholderPatterns) {
      if (pattern.test(job.description)) {
        score += 25;
        flags.push("Contains placeholder text");
      }
    }
  } else {
    score += 20;
    flags.push("Missing description");
  }

  // Missing location
  if (!job.location) {
    score += 10;
    flags.push("Missing location");
  }

  // Unrealistic salary (if provided)
  if (job.salary?.max && job.salary.max > 500000) {
    score += 20;
    flags.push("Unrealistically high salary");
  }

  // Missing application URL
  if (!job.applicationUrl) {
    score += 10;
    flags.push("Missing application URL");
  }

  // Log flags for debugging
  if (flags.length > 0 && score > 30) {
    console.log(`[FakeDetector] Job "${job.title}" @ ${job.company} - Score: ${score}, Flags:`, flags);
  }

  return Math.min(100, score);
}

/**
 * Filter out likely fake job postings
 * @param jobs - Array of job listings to filter
 * @param threshold - Fake score threshold (default 50)
 * @returns Filtered array with fake jobs removed
 */
export function filterFakeJobs(
  jobs: EnhancedJobListing[],
  threshold = 50
): { valid: EnhancedJobListing[]; removed: EnhancedJobListing[] } {
  const valid: EnhancedJobListing[] = [];
  const removed: EnhancedJobListing[] = [];

  for (const job of jobs) {
    const fakeScore = calculateFakeScore(job);
    if (fakeScore < threshold) {
      valid.push(job);
    } else {
      removed.push({ ...job, fakeScore } as EnhancedJobListing & { fakeScore: number });
      console.log(`[FakeDetector] Removed: "${job.title}" @ ${job.company} (score: ${fakeScore})`);
    }
  }

  console.log(`[FakeDetector] Kept ${valid.length} jobs, removed ${removed.length} suspected fake listings`);
  return { valid, removed };
}

// Export the scraper class for direct use
export { FirecrawlJobScraper };
