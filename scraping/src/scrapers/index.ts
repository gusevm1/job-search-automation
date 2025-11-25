export * from "./base-scraper.js";
export * from "./example-scraper.js";

// Registry of available scrapers
// Add new scrapers here as they are implemented
import { ExampleScraper } from "./example-scraper.js";
import type { JobScraper, ScraperConfig } from "../types/index.js";

/**
 * Available scraper types
 */
export const scraperRegistry = {
  example: ExampleScraper,
  // Add more scrapers here:
  // linkedin: LinkedInScraper,
  // indeed: IndeedScraper,
  // glassdoor: GlassdoorScraper,
} as const;

export type ScraperType = keyof typeof scraperRegistry;

/**
 * Create a scraper instance by type
 */
export function createScraper(
  type: ScraperType,
  config?: Partial<ScraperConfig>
): JobScraper {
  const ScraperClass = scraperRegistry[type];
  if (!ScraperClass) {
    throw new Error(`Unknown scraper type: ${type}`);
  }
  return new ScraperClass(config);
}

/**
 * Get all enabled scrapers
 */
export function getEnabledScrapers(): JobScraper[] {
  return Object.entries(scraperRegistry)
    .map(([type, ScraperClass]) => new ScraperClass())
    .filter((scraper) => scraper.config.enabled);
}
