# Scraper Context & Patterns

## Current Scraping Flow

```
1. User clicks "Find Jobs" on /jobs page
                    |
2. Frontend calls POST /api/jobs/scrape/stream (SSE)
                    |
3. ScrapeStrategyEngine.createPlan() generates tasks
                    |
4. executePlan() runs scrapers in parallel (2 concurrent)
                    |
5. Each scraper uses either:
   - Firecrawl extract mode (AI extraction)
   - Fallback mode (markdown + Claude Haiku)
                    |
6. Jobs are sanitized, fake jobs filtered
                    |
7. Jobs matched with Python AI backend (or TS fallback)
                    |
8. Jobs saved to src/lib/data/jobs/user_{id}/jobs.json
                    |
9. SSE sends progress events, UI updates
                    |
10. On complete, jobs page reloads with new jobs
```

## Scraper Status (as of Nov 27, 2025)

| Scraper | Method | Status | Typical Jobs | Notes |
|---------|--------|--------|--------------|-------|
| SwissDevJobs | Firecrawl Extract | OK | 15 | Best for tech roles |
| Jobs.ch | Firecrawl Extract | OK | 3-6 | General Swiss jobs |
| Indeed CH | Fallback (Claude) | OK | 10-15 | Large job aggregator |
| Datacareer.ch | Firecrawl Extract | OK | 20-50 | Data/AI focused |
| Glassdoor | Firecrawl Extract | OK | 10 | Company reviews + jobs |
| Jobup.ch | Fallback (Claude) | OK | 5-10 | Major Swiss portal |
| Jobscout24.ch | Fallback (Claude) | OK | 20-30 | General Swiss jobs |
| ICTjobs.ch | Disabled | Skip | 0 | Requires JS interaction |
| LinkedIn | Disabled | Skip | 0 | Requires Enterprise |

## Two Scraping Methods

### Method 1: Firecrawl Extract (Primary)
Uses Firecrawl's AI extraction for structured data.

```typescript
const response = await fetch(`${this.baseUrl}/scrape`, {
  body: JSON.stringify({
    url,
    formats: ["extract"],
    extract: {
      prompt: this.getExtractionPrompt(),
      schema: this.getExtractionSchema(),
    },
  }),
});
```

**Pros**: Structured output, handles complex pages
**Cons**: Can timeout on heavy JS sites (60-90s)

### Method 2: Fallback (Markdown + Claude)
Fetches markdown, parses with Claude Haiku.

```typescript
async scrapeJobsWithFallback(url: string, sourceSite: string) {
  // Step 1: Get markdown (fast)
  const response = await fetch(`${this.baseUrl}/scrape`, {
    body: JSON.stringify({
      url,
      formats: ["markdown"],
      waitFor: 3000,
    }),
  });

  // Step 2: Parse with Claude Haiku (fast, cheap)
  const jobs = await this.parseMarkdownWithClaude(markdown, sourceSite, url);
  return jobs;
}
```

**Pros**: Fast (10-20s), reliable
**Cons**: Less structured, may miss some fields

## Adding a New Scraper

### Step 1: Create scraper function in `job-scraper.ts`

```typescript
export async function scrapeNewBoard(
  query: string,
  location?: string
): Promise<EnhancedJobListing[]> {
  const scraper = new FirecrawlJobScraper();

  const params = new URLSearchParams();
  if (query) params.set("q", query);

  const url = `https://newboard.com/jobs?${params.toString()}`;

  try {
    // Use extract for well-structured sites
    return await scraper.scrapeJobsWithPagination(url, "NewBoard", {
      type: "param",
      paramName: "page",
      startValue: 1,
      increment: 1,
    });

    // OR use fallback for JS-heavy sites
    // return await scraper.scrapeJobsWithFallback(url, "NewBoard");
  } catch (error) {
    console.error("[NewBoard] Scrape failed:", error);
    return [];
  }
}
```

### Step 2: Add to switch in `scrape-strategy.ts`

```typescript
case "newboard":
case "newboard.ch":
  return scrapeNewBoard(queryStr, location);
```

### Step 3: Add to `JOB_BOARDS` in `profile-analyzer.ts`

```typescript
{
  id: "newboard",
  name: "NewBoard.ch",
  baseUrl: "https://www.newboard.ch",
  regions: ["CH"],
  specialization: "tech", // or "general"
  rateLimit: 5,
  buildSearchUrl: (query, location) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    return `https://www.newboard.ch/jobs?${params.toString()}`;
  },
},
```

### Step 4: Add display name in `scrape-loading-overlay.tsx`

```typescript
const BOARD_DISPLAY_NAMES: Record<string, string> = {
  // ...existing
  newboard: "NewBoard.ch",
  "newboard.ch": "NewBoard.ch",
};
```

### Step 5: Export from `job-scraper.ts`

Add to imports in `scrape-strategy.ts`:
```typescript
import { ..., scrapeNewBoard } from "@/lib/services/job-scraper";
```

## Disabling a Scraper

Make the function return empty array:
```typescript
export async function scrapeLinkedIn(): Promise<EnhancedJobListing[]> {
  console.log("[LinkedIn] Disabled - requires Enterprise");
  return [];
}
```

## Pagination Patterns

| Board | Param | Start | Increment | Example |
|-------|-------|-------|-----------|---------|
| SwissDevJobs | `page` | 1 | 1 | `?page=1`, `?page=2` |
| Jobs.ch | `page` | 1 | 1 | `?page=1` |
| Indeed | `start` | 0 | 10 | `?start=0`, `?start=10` |
| Datacareer | `page` | 1 | 1 | `?page=1` |
| Glassdoor | none | - | - | Single page only |

## SSE Event Types

```typescript
// Plan created
send("plan_created", { plan });

// Plan ready to execute
send("plan_ready", { plan });

// Task progress
send("progress", { plan });

// Matching started
send("matching_started", { totalJobs, matchedJobs: 0, useAI: true });

// Matching progress
send("matching_progress", { totalJobs, matchedJobs, useAI });

// Complete
send("complete", { totalJobs, newJobs });

// Error
send("error", { message });
```

## Testing

```bash
# Test single scraper
npx tsx scripts/test-single-scraper.ts indeed "Developer"
npx tsx scripts/test-single-scraper.ts glassdoor "Machine Learning"
npx tsx scripts/test-single-scraper.ts datacareer "Python"

# Test all scrapers
npx tsx scripts/test-all-scrapers.ts

# Available scrapers:
# swissdevjobs, jobsch, indeed, datacareer, glassdoor, jobup, jobscout24
```

## Configuration

### Timeouts
- Firecrawl extract: 90 seconds
- Fallback markdown fetch: 45 seconds
- Concurrent scrapers: 2

### Limits
- Target jobs per query: 50
- Max pages per query: 3
- Field limits: title (200), company (200), description (5000)

## Security

Implemented in `job-scraper.ts`:
- Prompt injection filtering
- Field length limits
- URL validation
- Fake job detection (spam patterns, too-good-to-be-true salaries)
- Request timeouts

## Environment Variables

```
FIRECRAWL_API_KEY=fc-...       # Required for scraping
ANTHROPIC_API_KEY=sk-ant-...   # Required for fallback parsing
```

## Common Issues

1. **Timeout errors**: Site may be blocking or slow
   - Try fallback method
   - Increase timeout

2. **Empty results**: Job board structure may have changed
   - Check URL format
   - Test with browser first

3. **Rate limiting**: Too many requests
   - Reduce concurrent scrapers
   - Add delays between pages

4. **502 errors on pagination**: Site rate limiting
   - Reduce MAX_PAGES_PER_QUERY
   - Add delay between page requests
