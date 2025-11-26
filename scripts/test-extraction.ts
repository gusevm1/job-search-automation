/**
 * Test script for CV extraction pipeline
 * Run with: ANTHROPIC_API_KEY=your-key npx tsx scripts/test-extraction.ts
 * Or add ANTHROPIC_API_KEY to .env.local
 */

import { config } from "dotenv";
import { extractPDFText, extractProfileFromText } from "../src/lib/services/cv-extraction";
import path from "path";

// Load env vars from .env.local
config({ path: path.resolve(__dirname, "../.env.local") });

async function main() {
  const cvPath = path.resolve(__dirname, "../src/app/profile/MaximCV_MatStyle.pdf");

  console.log("Testing CV extraction pipeline...\n");
  console.log(`CV Path: ${cvPath}\n`);

  try {
    // Step 1: Extract text from PDF
    console.log("Step 1: Extracting text from PDF...");
    const text = await extractPDFText(cvPath);
    console.log(`Extracted ${text.length} characters of text\n`);
    console.log("First 500 chars of extracted text:");
    console.log("-".repeat(50));
    console.log(text.slice(0, 500));
    console.log("-".repeat(50));
    console.log("\n");

    // Step 2: Use Claude to parse the text
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log("\n⚠️  ANTHROPIC_API_KEY not set. Skipping Claude parsing step.");
      console.log("   To test full pipeline, add ANTHROPIC_API_KEY to .env.local");
      console.log("   Or run: ANTHROPIC_API_KEY=your-key npx tsx scripts/test-extraction.ts");
      console.log("\n✅ PDF extraction test passed!");
      return;
    }

    console.log("Step 2: Parsing with Claude...");
    const profile = await extractProfileFromText(text);

    console.log("\nExtracted Profile:");
    console.log("=".repeat(50));
    console.log(JSON.stringify(profile, null, 2));

    console.log("\n✅ Extraction completed successfully!");
  } catch (error) {
    console.error("❌ Extraction failed:", error);
    process.exit(1);
  }
}

main();
