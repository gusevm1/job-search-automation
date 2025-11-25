import type {
  JobScraper,
  ScraperConfig,
  SearchParams,
  ScrapeResult,
  JobListing,
} from "../types/index.js";
import {
  FirecrawlClient,
  getFirecrawlClient,
  type FirecrawlExtractResult,
} from "../utils/firecrawl-client.js";

/**
 * Abstract base class for job scrapers using Firecrawl
 */
export abstract class BaseScraper implements JobScraper {
  readonly config: ScraperConfig;
  protected client: FirecrawlClient;

  constructor(config: ScraperConfig, client?: FirecrawlClient) {
    this.config = config;
    this.client = client || getFirecrawlClient();
  }

  /**
   * Build the search URL for the job site
   * Override this in subclasses to construct site-specific URLs
   */
  protected abstract buildSearchUrl(params: SearchParams): string;

  /**
   * Get the extraction prompt for the job site
   * Override this to customize how jobs are extracted
   */
  protected abstract getExtractionPrompt(): string;

  /**
   * Get the extraction schema for structured data
   * Override this to define site-specific schemas
   */
  protected abstract getExtractionSchema(): Record<string, unknown>;

  /**
   * Parse extracted data into JobListing objects
   * Override this to handle site-specific data formats
   */
  protected abstract parseJobs(data: Record<string, unknown>): JobListing[];

  /**
   * Scrape jobs from the configured site
   */
  async scrape(params: SearchParams): Promise<ScrapeResult> {
    const url = this.buildSearchUrl(params);
    const scrapedAt = new Date().toISOString();

    try {
      const result = await this.client.extract({
        url,
        prompt: this.getExtractionPrompt(),
        schema: this.getExtractionSchema(),
      });

      if (!result.success || !result.data) {
        return {
          success: false,
          site: this.config.name,
          url,
          scrapedAt,
          jobs: [],
          errors: [result.error || "Unknown extraction error"],
        };
      }

      const jobs = this.parseJobs(result.data);

      return {
        success: true,
        site: this.config.name,
        url,
        scrapedAt,
        jobs,
      };
    } catch (error) {
      return {
        success: false,
        site: this.config.name,
        url,
        scrapedAt,
        jobs: [],
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Test the scraper connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.client.scrape({
        url: this.config.baseUrl,
        formats: ["markdown"],
      });
      return result.success;
    } catch {
      return false;
    }
  }
}
