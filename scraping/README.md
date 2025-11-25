# Job Scraping Infrastructure

This module provides the infrastructure for scraping job listings from various job boards using Firecrawl.

## Setup

1. Ensure you have the Firecrawl API key set in `.env.local` at the project root:
   ```
   FIRECRAWL_API_KEY=your_api_key_here
   ```

2. Install dependencies:
   ```bash
   cd scraping
   npm install
   ```

3. Test the infrastructure:
   ```bash
   npm run scrape:test
   ```

## Usage

### Running Scrapers

```bash
# Run all enabled scrapers
npm run scrape

# Test connectivity only
npm run scrape:test
```

### Creating a New Scraper

1. Create a new file in `src/scrapers/` (use `example-scraper.ts` as a template)
2. Extend the `BaseScraper` class
3. Implement the required methods:
   - `buildSearchUrl(params)` - Build the search URL for the job site
   - `getExtractionPrompt()` - Define how to extract job data
   - `getExtractionSchema()` - Define the structure of extracted data
   - `parseJobs(data)` - Convert extracted data to `JobListing` objects
4. Add the scraper to `scraperRegistry` in `src/scrapers/index.ts`
5. Set `enabled: true` in the scraper's config

### Example Scraper

```typescript
import { BaseScraper } from "./base-scraper.js";
import type { ScraperConfig, SearchParams, JobListing } from "../types/index.js";

const config: ScraperConfig = {
  id: "my-job-site",
  name: "My Job Site",
  baseUrl: "https://myjobsite.com",
  enabled: true,
  rateLimit: 10,
};

export class MyJobSiteScraper extends BaseScraper {
  constructor(overrides?: Partial<ScraperConfig>) {
    super({ ...config, ...overrides });
  }

  protected buildSearchUrl(params: SearchParams): string {
    // Build site-specific URL
  }

  protected getExtractionPrompt(): string {
    // Define extraction prompt
  }

  protected getExtractionSchema(): Record<string, unknown> {
    // Define JSON schema
  }

  protected parseJobs(data: Record<string, unknown>): JobListing[] {
    // Parse extracted data
  }
}
```

## Project Structure

```
scraping/
├── src/
│   ├── config/          # Configuration loading
│   ├── scrapers/        # Job site scrapers
│   │   ├── base-scraper.ts    # Abstract base class
│   │   ├── example-scraper.ts # Template scraper
│   │   └── index.ts           # Scraper registry
│   ├── types/           # TypeScript types
│   │   ├── job.ts       # Job listing types
│   │   └── scraper.ts   # Scraper interfaces
│   ├── utils/           # Utilities
│   │   ├── firecrawl-client.ts # Firecrawl API client
│   │   └── output.ts          # Result saving
│   └── index.ts         # Main entry point
├── output/              # Scraped results (JSON)
├── package.json
└── tsconfig.json
```

## Types

### JobListing

```typescript
interface JobListing {
  id: string;
  title: string;
  company: string;
  location?: string;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
    period?: "hourly" | "daily" | "monthly" | "yearly";
  };
  description?: string;
  requirements?: string[];
  benefits?: string[];
  employmentType?: "full-time" | "part-time" | "contract" | "freelance" | "internship";
  remote?: "remote" | "hybrid" | "on-site";
  postedDate?: string;
  applicationUrl?: string;
  sourceUrl: string;
  sourceSite: string;
  scrapedAt: string;
}
```

## Agent Integration

This infrastructure is designed to work with Claude Code subagents via the Firecrawl MCP server.

### Orchestrating from Primary Agent

```bash
# The primary agent can spawn a scraper subagent with:
FIRECRAWL_API_KEY=... claude --mcp-config .claude/utils/mcp-configs/firecrawl.json --print "..."
```

See the main project's CLAUDE.md for agent architecture details.
