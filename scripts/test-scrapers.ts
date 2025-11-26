/**
 * Test script for real job scrapers
 * Run with: npx tsx scripts/test-scrapers.ts
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// Log if API key is set
console.log(
  "FIRECRAWL_API_KEY:",
  process.env.FIRECRAWL_API_KEY ? "✓ Set" : "✗ Not set"
);

interface JobResult {
  source: string;
  title: string;
  company: string;
  location?: string;
}

async function testScrapers() {
  // Dynamic import to ensure env vars are loaded
  const {
    scrapeSwissDevJobs,
    scrapeJobsCh,
    scrapeDatacareer,
    scrapeIndeedCH,
    scrapeGlassdoor,
    scrapeICTjobs,
    filterFakeJobs,
  } = await import("../src/lib/services/job-scraper");

  console.log("\n=== Testing Job Scrapers ===\n");

  const allJobs: JobResult[] = [];
  const scraperResults: Record<string, number> = {};

  // Helper function
  const testScraper = async (
    name: string,
    scraperFn: () => Promise<Array<{ title: string; company: string; location?: string }>>
  ) => {
    console.log(`Testing ${name}...`);
    try {
      const jobs = await scraperFn();
      scraperResults[name] = jobs.length;
      console.log(`   ✓ Found ${jobs.length} jobs`);
      jobs.forEach((job) => {
        allJobs.push({
          source: name,
          title: job.title,
          company: job.company,
          location: job.location,
        });
      });
      if (jobs.length > 0) {
        console.log(`   Sample: ${jobs[0].title} @ ${jobs[0].company}`);
      }
    } catch (error) {
      scraperResults[name] = 0;
      console.error(`   ✗ Failed:`, error instanceof Error ? error.message : error);
    }
    // Rate limiting
    await new Promise((r) => setTimeout(r, 1500));
  };

  // Test all scrapers
  await testScraper("SwissDevJobs", () => scrapeSwissDevJobs("Machine Learning"));
  await testScraper("Jobs.ch", () => scrapeJobsCh("AI Engineer", "Zurich"));
  await testScraper("Datacareer.ch", () => scrapeDatacareer("AI"));
  await testScraper("Indeed CH", () => scrapeIndeedCH("Python Developer", "Switzerland"));
  await testScraper("Glassdoor", () => scrapeGlassdoor("Software Engineer"));
  await testScraper("ICTjobs.ch", () => scrapeICTjobs("Python"));

  // Test fake job filter
  console.log("\n=== Testing Fake Job Filter ===\n");
  const typedJobs = allJobs.map((j, i) => ({
    id: `test_${i}`,
    title: j.title,
    company: j.company,
    location: j.location,
    sourceSite: j.source,
    sourceUrl: "",
    scrapedAt: new Date().toISOString(),
    status: "new" as const,
  }));

  const { valid, removed } = filterFakeJobs(typedJobs);
  console.log(`Valid jobs: ${valid.length}`);
  console.log(`Removed as fake/spam: ${removed.length}`);

  // Summary
  console.log("\n=== Summary ===\n");
  console.log("Jobs by source:");
  Object.entries(scraperResults)
    .sort(([, a], [, b]) => b - a)
    .forEach(([source, count]) => {
      console.log(`  ${source}: ${count} jobs`);
    });

  console.log(`\nTotal raw jobs: ${allJobs.length}`);
  console.log(`Total valid jobs: ${valid.length}`);

  if (allJobs.length > 0) {
    console.log("\nTop 10 jobs:");
    allJobs.slice(0, 10).forEach((job, i) => {
      console.log(`  ${i + 1}. [${job.source}] ${job.title} @ ${job.company}`);
    });
  }

  console.log("\n=== Tests Complete ===\n");
}

testScrapers().catch(console.error);
