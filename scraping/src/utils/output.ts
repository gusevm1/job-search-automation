import { writeFile, mkdir } from "fs/promises";
import { resolve, join } from "path";
import type { ScrapeResult } from "../types/index.js";
import { appConfig } from "../config/index.js";

/**
 * Save scrape results to a JSON file
 */
export async function saveResults(
  results: ScrapeResult,
  filename?: string
): Promise<string> {
  const outputDir = appConfig.output.directory;

  // Ensure output directory exists
  await mkdir(outputDir, { recursive: true });

  // Generate filename with timestamp if not provided
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const finalFilename = filename || `${results.site}-${timestamp}.json`;
  const filepath = join(outputDir, finalFilename);

  // Write results
  await writeFile(filepath, JSON.stringify(results, null, 2), "utf-8");

  return filepath;
}

/**
 * Save multiple scrape results
 */
export async function saveAllResults(
  results: ScrapeResult[]
): Promise<string[]> {
  const paths: string[] = [];
  for (const result of results) {
    const path = await saveResults(result);
    paths.push(path);
  }
  return paths;
}

/**
 * Format job count summary
 */
export function formatSummary(results: ScrapeResult[]): string {
  const totalJobs = results.reduce((sum, r) => sum + r.jobs.length, 0);
  const successfulSites = results.filter((r) => r.success).length;
  const failedSites = results.filter((r) => !r.success).length;

  return `
Scraping Summary
================
Total Jobs Found: ${totalJobs}
Successful Sites: ${successfulSites}
Failed Sites: ${failedSites}

By Site:
${results.map((r) => `  - ${r.site}: ${r.jobs.length} jobs ${r.success ? "✓" : "✗"}`).join("\n")}
`.trim();
}
