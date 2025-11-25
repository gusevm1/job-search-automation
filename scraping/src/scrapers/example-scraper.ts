import { BaseScraper } from "./base-scraper.js";
import type {
  ScraperConfig,
  SearchParams,
  JobListing,
} from "../types/index.js";

/**
 * Example scraper configuration
 * This is a template - replace with actual job site scrapers
 */
const defaultConfig: ScraperConfig = {
  id: "example",
  name: "Example Job Site",
  baseUrl: "https://example-jobs.com",
  enabled: false, // Disabled by default - this is just a template
  rateLimit: 10,
};

/**
 * Example job scraper implementation
 * Use this as a template for creating new job site scrapers
 */
export class ExampleScraper extends BaseScraper {
  constructor(config?: Partial<ScraperConfig>) {
    super({ ...defaultConfig, ...config });
  }

  protected buildSearchUrl(params: SearchParams): string {
    const url = new URL("/jobs", this.config.baseUrl);

    if (params.query) {
      url.searchParams.set("q", params.query);
    }
    if (params.location) {
      url.searchParams.set("location", params.location);
    }
    if (params.remote && params.remote !== "any") {
      url.searchParams.set("remote", params.remote);
    }
    if (params.page) {
      url.searchParams.set("page", String(params.page));
    }

    return url.toString();
  }

  protected getExtractionPrompt(): string {
    return `
Extract all job listings from this page. For each job, extract:
- Job title
- Company name
- Location
- Salary (if available)
- Job description summary
- Requirements
- Employment type (full-time, part-time, contract, etc.)
- Remote work policy
- Application URL
- Posted date

Return the data in a structured format.
`.trim();
  }

  protected getExtractionSchema(): Record<string, unknown> {
    return {
      type: "object",
      properties: {
        jobs: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              company: { type: "string" },
              location: { type: "string" },
              salary: {
                type: "object",
                properties: {
                  min: { type: "number" },
                  max: { type: "number" },
                  currency: { type: "string" },
                },
              },
              description: { type: "string" },
              requirements: { type: "array", items: { type: "string" } },
              employmentType: { type: "string" },
              remote: { type: "string" },
              applicationUrl: { type: "string" },
              postedDate: { type: "string" },
            },
            required: ["title", "company"],
          },
        },
      },
      required: ["jobs"],
    };
  }

  protected parseJobs(data: Record<string, unknown>): JobListing[] {
    const jobs = (data.jobs as Record<string, unknown>[]) || [];
    const now = new Date().toISOString();

    return jobs.map((job, index) => ({
      id: `${this.config.id}-${Date.now()}-${index}`,
      title: String(job.title || "Unknown"),
      company: String(job.company || "Unknown"),
      location: job.location ? String(job.location) : undefined,
      salary: job.salary as JobListing["salary"],
      description: job.description ? String(job.description) : undefined,
      requirements: Array.isArray(job.requirements)
        ? job.requirements.map(String)
        : undefined,
      employmentType: this.parseEmploymentType(job.employmentType),
      remote: this.parseRemoteType(job.remote),
      postedDate: job.postedDate ? String(job.postedDate) : undefined,
      applicationUrl: job.applicationUrl ? String(job.applicationUrl) : undefined,
      sourceUrl: this.config.baseUrl,
      sourceSite: this.config.name,
      scrapedAt: now,
      rawData: job,
    }));
  }

  private parseEmploymentType(
    value: unknown
  ): JobListing["employmentType"] | undefined {
    if (!value) return undefined;
    const str = String(value).toLowerCase();
    if (str.includes("full")) return "full-time";
    if (str.includes("part")) return "part-time";
    if (str.includes("contract")) return "contract";
    if (str.includes("freelance")) return "freelance";
    if (str.includes("intern")) return "internship";
    return undefined;
  }

  private parseRemoteType(value: unknown): JobListing["remote"] | undefined {
    if (!value) return undefined;
    const str = String(value).toLowerCase();
    if (str.includes("remote") && !str.includes("hybrid")) return "remote";
    if (str.includes("hybrid")) return "hybrid";
    if (str.includes("on-site") || str.includes("onsite")) return "on-site";
    return undefined;
  }
}
