#!/usr/bin/env tsx

import { validateConfig } from "./config/index.js";
import { getEnabledScrapers, createScraper, type ScraperType } from "./scrapers/index.js";
import { saveResults, formatSummary } from "./utils/output.js";
import { getFirecrawlClient } from "./utils/firecrawl-client.js";
import type { SearchParams, ScrapeResult } from "./types/index.js";

/**
 * Main scraping orchestrator
 */
async function main() {
  const args = process.argv.slice(2);
  const isTest = args.includes("--test");

  console.log("🔍 Job Scraping Infrastructure\n");

  // Validate configuration
  try {
    validateConfig();
    console.log("✓ Configuration validated");
  } catch (error) {
    console.error("✗ Configuration error:", error);
    process.exit(1);
  }

  // Test mode - just verify connectivity
  if (isTest) {
    console.log("\n📡 Testing Firecrawl connectivity...");
    const client = getFirecrawlClient();
    const connected = await client.testConnection();

    if (connected) {
      console.log("✓ Firecrawl API connection successful");
      console.log("\n✅ Infrastructure is ready!");
      console.log("\nNext steps:");
      console.log("  1. Add job site scrapers to src/scrapers/");
      console.log("  2. Enable scrapers by setting enabled: true in their config");
      console.log("  3. Run: npm run scrape");
    } else {
      console.error("✗ Failed to connect to Firecrawl API");
      process.exit(1);
    }
    return;
  }

  // Get enabled scrapers
  const scrapers = getEnabledScrapers();

  if (scrapers.length === 0) {
    console.log("\n⚠️  No scrapers are enabled.");
    console.log("\nTo get started:");
    console.log("  1. Create a scraper in src/scrapers/ (use example-scraper.ts as template)");
    console.log("  2. Add it to the scraperRegistry in src/scrapers/index.ts");
    console.log("  3. Set enabled: true in the scraper config");
    console.log("\nOr run: npm run scrape:test to verify the infrastructure");
    return;
  }

  // Default search parameters
  const searchParams: SearchParams = {
    maxResults: 50,
  };

  console.log(`\n🚀 Starting scrape with ${scrapers.length} scraper(s)...\n`);

  // Run all scrapers
  const results: ScrapeResult[] = [];

  for (const scraper of scrapers) {
    console.log(`  → Scraping ${scraper.config.name}...`);
    try {
      const result = await scraper.scrape(searchParams);
      results.push(result);

      if (result.success) {
        console.log(`    ✓ Found ${result.jobs.length} jobs`);
      } else {
        console.log(`    ✗ Failed: ${result.errors?.join(", ")}`);
      }
    } catch (error) {
      console.log(`    ✗ Error: ${error}`);
    }
  }

  // Save results
  console.log("\n💾 Saving results...");
  for (const result of results) {
    if (result.jobs.length > 0) {
      const path = await saveResults(result);
      console.log(`  → Saved to ${path}`);
    }
  }

  // Print summary
  console.log("\n" + formatSummary(results));
}

// Run
main().catch(console.error);
