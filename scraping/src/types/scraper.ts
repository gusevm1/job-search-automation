import type { ScrapeResult } from "./job.js";

/**
 * Configuration for a job site scraper
 */
export interface ScraperConfig {
  /** Unique identifier for the scraper */
  id: string;
  /** Human-readable name */
  name: string;
  /** Base URL of the job site */
  baseUrl: string;
  /** Whether this scraper is enabled */
  enabled: boolean;
  /** Rate limiting - requests per minute */
  rateLimit?: number;
  /** Custom headers for requests */
  headers?: Record<string, string>;
}

/**
 * Search parameters for job scraping
 */
export interface SearchParams {
  /** Job title or keywords to search */
  query?: string;
  /** Location to search in */
  location?: string;
  /** Filter by remote work options */
  remote?: "remote" | "hybrid" | "on-site" | "any";
  /** Filter by employment type */
  employmentType?: "full-time" | "part-time" | "contract" | "any";
  /** Maximum number of results to fetch */
  maxResults?: number;
  /** Page number for pagination */
  page?: number;
}

/**
 * Base interface for all job scrapers
 */
export interface JobScraper {
  /** Scraper configuration */
  readonly config: ScraperConfig;

  /**
   * Scrape jobs from the configured site
   * @param params Search parameters
   * @returns Scrape results with job listings
   */
  scrape(params: SearchParams): Promise<ScrapeResult>;

  /**
   * Test the scraper connection
   * @returns true if the scraper can connect to the site
   */
  testConnection(): Promise<boolean>;
}

/**
 * Factory function type for creating scrapers
 */
export type ScraperFactory = (config: Partial<ScraperConfig>) => JobScraper;
