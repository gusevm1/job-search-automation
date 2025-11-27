/**
 * Test all scrapers to verify functionality
 */

import * as dotenv from "dotenv";
import * as path from "path";
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

interface ScraperResult {
  name: string;
  jobCount: number;
  duration: number;
  status: "success" | "failed" | "skipped";
  sampleJobs: string[];
}

const scrapers = [
  { name: "SwissDevJobs", fn: scrapeSwissDevJobs },
  { name: "Jobs.ch", fn: scrapeJobsCh },
  { name: "Indeed CH", fn: scrapeIndeedCH },
  { name: "Datacareer.ch", fn: scrapeDatacareer },
  { name: "Glassdoor", fn: scrapeGlassdoor },
  { name: "ICTjobs.ch", fn: scrapeICTjobs },
  { name: "Jobup.ch", fn: scrapeJobup },
  { name: "Jobscout24.ch", fn: scrapeJobscout24 },
];

async function testAllScrapers() {
  const query = "Software Engineer";
  console.log(`Testing all scrapers with query: "${query}"`);
  console.log("=".repeat(70));

  const results: ScraperResult[] = [];

  for (const { name, fn } of scrapers) {
    console.log(`\nTesting ${name}...`);
    const startTime = Date.now();

    try {
      const jobs = await fn(query);
      const duration = (Date.now() - startTime) / 1000;

      const result: ScraperResult = {
        name,
        jobCount: jobs.length,
        duration,
        status: jobs.length > 0 ? "success" : "skipped",
        sampleJobs: jobs.slice(0, 3).map(
          (j) => `${(j as { title?: string }).title || "Unknown"} @ ${(j as { company?: string }).company || "Unknown"}`
        ),
      };

      results.push(result);
      console.log(`  Found ${jobs.length} jobs in ${duration.toFixed(1)}s`);

      if (jobs.length > 0) {
        console.log(`  Sample: ${result.sampleJobs[0]}`);
      }
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      results.push({
        name,
        jobCount: 0,
        duration,
        status: "failed",
        sampleJobs: [],
      });
      console.log(`  FAILED: ${error instanceof Error ? error.message : error}`);
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(70));
  console.log("SUMMARY");
  console.log("=".repeat(70));
  console.log(`${"Scraper".padEnd(20)} ${"Status".padEnd(12)} ${"Jobs".padEnd(8)} Time`);
  console.log("-".repeat(70));

  let totalJobs = 0;
  for (const result of results) {
    const statusIcon =
      result.status === "success" ? "[OK]" :
      result.status === "skipped" ? "[SKIP]" : "[FAIL]";

    console.log(
      `${result.name.padEnd(20)} ${statusIcon.padEnd(12)} ${String(result.jobCount).padEnd(8)} ${result.duration.toFixed(1)}s`
    );
    totalJobs += result.jobCount;
  }

  console.log("-".repeat(70));
  console.log(`Total: ${totalJobs} jobs from ${results.filter(r => r.status === "success").length} scrapers`);
}

testAllScrapers().catch(console.error);
