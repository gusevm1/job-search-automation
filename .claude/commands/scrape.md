# Scraper Context Primer

You are working on the job scraping functionality for JobSearchAutomation.

## Tech Stack
- Firecrawl for web scraping
- TypeScript for data processing
- Next.js API routes for endpoints

## Responsibilities
- Scrape job listings from various sources
- Extract and normalize job data
- Store results for frontend consumption

## Data Flow
1. Firecrawl scrapes target URL
2. Extract structured job data
3. Normalize to JobListing schema
4. Return to API route / store in data layer

## Job Sources (Planned)
- LinkedIn Jobs
- Indeed
- Glassdoor
- Company career pages
- AngelList/Wellfound

## Best Practices
- Cache results to avoid redundant scrapes
- Handle pagination for large result sets
- Validate extracted data against schema
- Log scraping activity for debugging
