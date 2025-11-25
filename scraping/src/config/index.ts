import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from root .env.local
config({ path: resolve(process.cwd(), "../.env.local") });

/**
 * Application configuration loaded from environment
 */
export const appConfig = {
  firecrawl: {
    apiKey: process.env.FIRECRAWL_API_KEY || "",
    baseUrl: "https://api.firecrawl.dev/v1",
  },
  output: {
    directory: resolve(process.cwd(), "output"),
    format: "json" as const,
  },
  scraping: {
    defaultRateLimit: 10, // requests per minute
    defaultTimeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
  },
} as const;

/**
 * Validate required configuration
 */
export function validateConfig(): void {
  if (!appConfig.firecrawl.apiKey) {
    throw new Error(
      "FIRECRAWL_API_KEY is required. Please set it in .env.local"
    );
  }
}
