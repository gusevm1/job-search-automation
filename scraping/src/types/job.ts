import { z } from "zod";

/**
 * Schema for a scraped job listing
 */
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

/**
 * Schema for scrape results
 */
export const ScrapeResultSchema = z.object({
  success: z.boolean(),
  site: z.string(),
  url: z.string().url(),
  scrapedAt: z.string().datetime(),
  jobs: z.array(JobListingSchema),
  errors: z.array(z.string()).optional(),
  metadata: z
    .object({
      totalPages: z.number().optional(),
      currentPage: z.number().optional(),
      hasMore: z.boolean().optional(),
    })
    .optional(),
});

export type ScrapeResult = z.infer<typeof ScrapeResultSchema>;
