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
 * Target jobs per query - we'll scrape multiple pages to reach this
 */
const TARGET_JOBS_PER_QUERY = 50;

/**
 * Maximum pages to scrape per query (to avoid excessive API calls)
 */
const MAX_PAGES_PER_QUERY = 3;

/**
 * Firecrawl API client for job scraping
 */
class FirecrawlJobScraper {
  private apiKey: string;
  private anthropicKey: string;
  private baseUrl = "https://api.firecrawl.dev/v1";

  constructor() {
    this.apiKey = process.env.FIRECRAWL_API_KEY || "";
    this.anthropicKey = process.env.ANTHROPIC_API_KEY || "";
    if (!this.apiKey) {
      console.warn("FIRECRAWL_API_KEY not set - scraping will fail");
    }
  }

  /**
   * Scrape multiple pages to reach target job count
   * @param baseUrl - Base search URL
   * @param sourceSite - Name of the job board
   * @param paginationConfig - How to paginate for this board
   */
  async scrapeJobsWithPagination(
    baseUrl: string,
    sourceSite: string,
    paginationConfig: {
      type: "param" | "none";
      paramName?: string;
      startValue?: number;
      increment?: number;
    } = { type: "none" }
  ): Promise<EnhancedJobListing[]> {
    const allJobs: EnhancedJobListing[] = [];
    const seenIds = new Set<string>();

    for (let page = 0; page < MAX_PAGES_PER_QUERY; page++) {
      // Build URL for this page
      let pageUrl = baseUrl;
      if (paginationConfig.type === "param" && paginationConfig.paramName) {
        const startValue = (paginationConfig.startValue || 0) + page * (paginationConfig.increment || 10);
        const separator = baseUrl.includes("?") ? "&" : "?";
        pageUrl = `${baseUrl}${separator}${paginationConfig.paramName}=${startValue}`;
      }

      try {
        const jobs = await this.scrapeJobs(pageUrl, sourceSite);
        const previousCount = allJobs.length;

        // Deduplicate by title+company combo (IDs are generated fresh each time)
        for (const job of jobs) {
          const jobKey = `${job.title}-${job.company}`.toLowerCase().trim();
          if (!seenIds.has(jobKey)) {
            seenIds.add(jobKey);
            allJobs.push(job);
          }
        }

        const newJobsAdded = allJobs.length - previousCount;
        console.log(`[${sourceSite}] Page ${page + 1}: ${jobs.length} scraped, ${newJobsAdded} new (total unique: ${allJobs.length})`);

        // Stop if we've reached target
        if (allJobs.length >= TARGET_JOBS_PER_QUERY) {
          console.log(`[${sourceSite}] Reached target of ${TARGET_JOBS_PER_QUERY} jobs`);
          break;
        }

        // Stop if no jobs found or all jobs were duplicates
        if (jobs.length === 0 || newJobsAdded === 0) {
          console.log(`[${sourceSite}] No new unique jobs found, stopping pagination`);
          break;
        }

        // Don't paginate if board doesn't support it
        if (paginationConfig.type === "none") {
          break;
        }
      } catch (error) {
        console.error(`[${sourceSite}] Page ${page + 1} failed:`, error);
        // Continue with jobs we have so far
        break;
      }
    }

    return allJobs.slice(0, TARGET_JOBS_PER_QUERY);
  }

  /**
   * Scrape a single URL and extract job listings using AI
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

    // Set up 90-second timeout (AI extraction can be slow for large pages)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 90000); // 90 seconds

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
        console.error(`[Scraper] Request timed out after 90s for ${sourceSite}: ${url}`);
        throw new Error(`Scrape timed out after 90s for ${sourceSite}`);
      }

      console.error(`[Scraper] Error scraping ${url}:`, error);
      throw error;
    }
  }

  /**
   * Fallback scraper using markdown + local Claude parsing
   * Use this for sites where Firecrawl extract times out
   */
  async scrapeJobsWithFallback(
    url: string,
    sourceSite: string
  ): Promise<EnhancedJobListing[]> {
    if (!this.apiKey) {
      throw new Error("FIRECRAWL_API_KEY is not configured");
    }

    console.log(`[Scraper] Scraping ${sourceSite} with fallback: ${url}`);

    // Step 1: Get markdown from Firecrawl (fast, reliable)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch(`${this.baseUrl}/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          url,
          formats: ["markdown"],
          waitFor: 3000, // Wait for JS to render
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Scraper] Markdown fetch error: ${response.status}`, errorText);
        throw new Error(`Firecrawl API error: ${response.status}`);
      }

      const result = await response.json();
      const markdown = result.data?.markdown;

      if (!markdown || markdown.length < 100) {
        console.log(`[Scraper] No content from ${url}`);
        return [];
      }

      // Step 2: Parse with Claude
      if (!this.anthropicKey) {
        console.error("[Scraper] ANTHROPIC_API_KEY not set for fallback parsing");
        return [];
      }

      const jobs = await this.parseMarkdownWithClaude(markdown, sourceSite, url);
      console.log(`[Scraper] Fallback found ${jobs.length} jobs from ${sourceSite}`);

      return jobs;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        console.error(`[Scraper] Fallback timed out for ${sourceSite}`);
      }
      throw error;
    }
  }

  /**
   * Parse markdown content with Claude to extract jobs
   */
  private async parseMarkdownWithClaude(
    markdown: string,
    sourceSite: string,
    sourceUrl: string
  ): Promise<EnhancedJobListing[]> {
    // Truncate to avoid token limits
    const truncatedMarkdown = markdown.slice(0, 20000);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: `Extract ALL job listings from this job board page. Look for patterns like:
- Job titles (linked text or headers)
- Company names
- Locations
- Any bullet points or list items that represent jobs

This is from ${sourceSite}. Return ONLY valid JSON array with no explanation.

For each job extract:
- title (required)
- company (required, or "Unknown" if not found)
- location (optional)

Return format: [{"title":"...", "company":"...", "location":"..."}]

IMPORTANT: Extract ALL jobs visible, not just the first one. Look for list items, links, and repeated patterns.
If no jobs found, return: []

Content:
${truncatedMarkdown}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error(`[Scraper] Claude parsing error: ${response.status}`);
      return [];
    }

    const result = await response.json();
    const content = result.content?.[0]?.text || "[]";

    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log("[Scraper] No JSON found in Claude response");
      return [];
    }

    try {
      const jobs = JSON.parse(jsonMatch[0]);
      const now = new Date().toISOString();

      return jobs
        .filter((job: Record<string, unknown>) => job.title && job.company)
        .slice(0, 50)
        .map((job: Record<string, unknown>) => ({
          id: generateJobId(),
          title: sanitizeString(job.title, FIELD_LIMITS.title),
          company: sanitizeString(job.company, FIELD_LIMITS.company),
          location: job.location
            ? sanitizeString(job.location, FIELD_LIMITS.location)
            : undefined,
          description: job.description
            ? sanitizeString(job.description, FIELD_LIMITS.description)
            : undefined,
          sourceUrl: sourceUrl,
          sourceSite: sourceSite,
          scrapedAt: now,
          status: "new" as const,
        }));
    } catch (e) {
      console.error("[Scraper] Failed to parse Claude JSON:", e);
      return [];
    }
  }

  /**
   * Extraction prompt for job listings
   * Keep this concise for faster extraction
   */
  private getExtractionPrompt(): string {
    return `Extract ALL job listings from this page. For each job, get:
- title (required)
- company (required)
- location
- description (brief summary)
- technologies/skills mentioned
- salary if shown
- application URL

Extract every job visible, up to 50 jobs maximum.`;
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
 * Supports pagination via page parameter
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
    // SwissDevJobs uses page=X parameter (1-indexed)
    return await scraper.scrapeJobsWithPagination(url, "SwissDevJobs", {
      type: "param",
      paramName: "page",
      startValue: 1,
      increment: 1,
    });
  } catch (error) {
    console.error("[SwissDevJobs] Scrape failed:", error);
    return [];
  }
}

/**
 * Jobs.ch scraper
 * Supports pagination via page parameter
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
    // Jobs.ch uses page=X parameter (1-indexed)
    return await scraper.scrapeJobsWithPagination(url, "Jobs.ch", {
      type: "param",
      paramName: "page",
      startValue: 1,
      increment: 1,
    });
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
 * Uses the main jobs page with search query for better results
 */
export async function scrapeDatacareer(
  query: string,
  location?: string
): Promise<EnhancedJobListing[]> {
  const scraper = new FirecrawlJobScraper();

  // Use the main jobs page - it shows all jobs and can be filtered
  // The categories URL was unreliable, main jobs page works better
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (location) params.set("location", location);

  const url = params.toString()
    ? `https://www.datacareer.ch/jobs/?${params.toString()}`
    : "https://www.datacareer.ch/jobs/";

  try {
    // Datacareer uses page=X parameter (1-indexed)
    return await scraper.scrapeJobsWithPagination(url, "Datacareer.ch", {
      type: "param",
      paramName: "page",
      startValue: 1,
      increment: 1,
    });
  } catch (error) {
    console.error("[Datacareer.ch] Scrape failed:", error);
    return [];
  }
}

/**
 * Indeed Switzerland scraper
 * Uses fallback method (markdown + Claude) because Firecrawl extract times out
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
    // Indeed times out with Firecrawl extract, use fallback method
    return await scraper.scrapeJobsWithFallback(url, "Indeed CH");
  } catch (error) {
    console.error("[Indeed CH] Scrape failed:", error);
    return [];
  }
}

/**
 * Glassdoor Switzerland scraper
 * Uses simplified URL format that works reliably
 * Note: Glassdoor pagination is complex, using single page
 */
export async function scrapeGlassdoor(
  query: string,
  location?: string
): Promise<EnhancedJobListing[]> {
  const scraper = new FirecrawlJobScraper();

  // Use simpler Glassdoor URL format - the complex SRCH pattern was unreliable
  // This format works well and shows Switzerland jobs
  const searchQuery = encodeURIComponent(query).replace(/%20/g, "+");
  const url = `https://www.glassdoor.com/Job/switzerland-jobs-SRCH_IL.0,11_IN226_KO12,${11 + searchQuery.length}.htm?keyword=${searchQuery}`;

  try {
    // Glassdoor has complex pagination - scrape first page only but extract all visible
    return await scraper.scrapeJobsWithPagination(url, "Glassdoor", {
      type: "none", // Glassdoor pagination URLs are complex
    });
  } catch (error) {
    console.error("[Glassdoor] Scrape failed:", error);
    return [];
  }
}

/**
 * ICTjobs.ch scraper - IT/Telecom focused
 * NOTE: Disabled - ICTjobs uses a search form that doesn't expose job listings
 * in static HTML. The site requires JS interaction to display results.
 */
export async function scrapeICTjobs(
  query: string,
  location?: string
): Promise<EnhancedJobListing[]> {
  console.log("[ICTjobs.ch] Skipped - site requires JS interaction for search");
  return [];
}

/**
 * Jobup.ch scraper - Major Swiss job portal
 * Uses fallback method for better reliability
 */
export async function scrapeJobup(
  query: string,
  location?: string
): Promise<EnhancedJobListing[]> {
  const scraper = new FirecrawlJobScraper();

  const params = new URLSearchParams();
  if (query) params.set("term", query);

  const url = `https://www.jobup.ch/en/jobs/?${params.toString()}`;

  try {
    // Jobup has dynamic content, use fallback
    return await scraper.scrapeJobsWithFallback(url, "Jobup.ch");
  } catch (error) {
    console.error("[Jobup.ch] Scrape failed:", error);
    return [];
  }
}

/**
 * Jobscout24.ch scraper - Popular Swiss job board
 * Uses query parameter format
 */
export async function scrapeJobscout24(
  query: string,
  location?: string
): Promise<EnhancedJobListing[]> {
  const scraper = new FirecrawlJobScraper();

  // Use query param format which works better
  const params = new URLSearchParams();
  if (query) params.set("q", query);

  const url = `https://www.jobscout24.ch/en/jobs/?${params.toString()}`;

  try {
    // Use fallback for more reliable extraction
    return await scraper.scrapeJobsWithFallback(url, "Jobscout24.ch");
  } catch (error) {
    console.error("[Jobscout24.ch] Scrape failed:", error);
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
