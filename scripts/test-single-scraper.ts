/**
 * Test a single scraper
 * Run with: npx tsx scripts/test-single-scraper.ts [scraper] [query]
 * Example: npx tsx scripts/test-single-scraper.ts jobsch "Software Engineer"
 */

import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

import {
  scrapeSwissDevJobs,
  scrapeJobsCh,
  scrapeIndeedCH,
  scrapeDatacareer,
  scrapeGlassdoor,
  scrapeICTjobs,
  scrapeJobup,
  scrapeJobscout24,
} from "../src/lib/services/job-scraper";

const scrapers: Record<string, (q: string, l?: string) => Promise<unknown[]>> = {
  swissdevjobs: scrapeSwissDevJobs,
  jobsch: scrapeJobsCh,
  indeed: scrapeIndeedCH,
  datacareer: scrapeDatacareer,
  glassdoor: scrapeGlassdoor,
  ictjobs: scrapeICTjobs,
  jobup: scrapeJobup,
  jobscout24: scrapeJobscout24,
};

async function main() {
  const args = process.argv.slice(2);
  const scraperName = args[0]?.toLowerCase() || "jobsch";
  const query = args[1] || "Software Engineer";

  console.log(`Testing ${scraperName} with query: "${query}"`);
  console.log("=".repeat(50));

  const scraper = scrapers[scraperName];
  if (!scraper) {
    console.error(`Unknown scraper: ${scraperName}`);
    console.log(`Available: ${Object.keys(scrapers).join(", ")}`);
    process.exit(1);
  }

  const startTime = Date.now();
  try {
    const jobs = await scraper(query, "Switzerland");
    const duration = (Date.now() - startTime) / 1000;

    console.log(`\nFound ${jobs.length} jobs in ${duration.toFixed(1)}s`);
    console.log("-".repeat(50));

    // Show all jobs
    (jobs as Array<{ title?: string; company?: string }>).forEach((job, i) => {
      console.log(`${i + 1}. ${job.title || "Unknown"} at ${job.company || "Unknown"}`);
    });
  } catch (error) {
    console.error("Scraper failed:", error);
    process.exit(1);
  }
}

main();
