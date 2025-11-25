# Scraper Subagent

## Purpose
Handle web scraping for job listings using Firecrawl.

## Invocation
```bash
claude --mcp-config .claude/utils/mcp-configs/firecrawl.json --strict-mcp-config
```

## Scope
- Scraping job boards and career pages
- Extracting structured job data
- Processing and normalizing job listings
- Handling pagination and rate limiting

## Rules
1. **Always use Firecrawl MCP server** for web scraping
2. **Respect rate limits** and robots.txt
3. **Structure data** consistently across sources
4. **Handle errors** gracefully with retries

## Context Primers
Load the scrape context primer before starting work:
```
/scrape
```

## Output
- Write scraped data to `data/` or API routes
- Log session summary to `.claude/agents/context_bundles/`

## Data Schema
```typescript
interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'remote' | 'hybrid' | 'onsite';
  salary?: {
    min?: number;
    max?: number;
    currency: string;
  };
  description: string;
  requirements: string[];
  url: string;
  postedAt: string;
  scrapedAt: string;
  source: string;
}
```
