# Scraper Session Handoff - November 27, 2025 (Updated)

## Session 2: Major Scraper Fixes

### Problem Identified
The original scrapers were timing out because Firecrawl's `extract` mode (AI extraction) was taking too long on some sites, even though the sites themselves were accessible.

### Root Cause Analysis
1. Firecrawl's `extract` mode uses AI to parse HTML and can timeout on complex pages
2. Some URLs were incorrect (Glassdoor's complex SRCH pattern)
3. Indeed was using wrong domain (`www.indeed.ch` vs `ch.indeed.com`)
4. Datacareer category URLs were unreliable

### Solution: Hybrid Scraping Approach
Created a fallback method that:
1. Fetches page markdown (fast, reliable)
2. Parses with Claude Haiku (fast, cheap AI)

**New method:** `scrapeJobsWithFallback()` in `job-scraper.ts`

### Final Test Results (All Working)

| Scraper | Status | Jobs | Method | Time |
|---------|--------|------|--------|------|
| SwissDevJobs | **OK** | 15 | Firecrawl Extract | 55.8s |
| Jobs.ch | **OK** | 3 | Firecrawl Extract | 37.0s |
| Indeed CH | **OK** | 15 | Fallback (Claude) | 15.4s |
| Datacareer.ch | **OK** | 50 | Firecrawl Extract | 158.5s |
| Glassdoor | **OK** | 10 | Firecrawl Extract | 35.3s |
| ICTjobs.ch | **SKIP** | 0 | Requires JS | 0s |
| Jobup.ch | **OK** | 6 | Fallback (Claude) | 11.6s |
| Jobscout24.ch | **OK** | 26 | Fallback (Claude) | 22.0s |

**Total: 125 jobs from 7 working scrapers**

### Key Changes Made

1. **job-scraper.ts**
   - Added `scrapeJobsWithFallback()` - markdown + Claude parsing
   - Increased timeout to 90s
   - Fixed Datacareer URL (now uses `/jobs/` not `/categories/`)
   - Fixed Glassdoor URL (simplified format)
   - Indeed now uses fallback method
   - Added Jobup.ch scraper
   - Added Jobscout24.ch scraper

2. **scrape-strategy.ts**
   - Added imports for new scrapers
   - Added switch cases for jobup and jobscout24

3. **profile-analyzer.ts**
   - Added Jobup.ch and Jobscout24.ch to JOB_BOARDS array

### Scraper Configuration Summary

| Scraper | Method | URL Format |
|---------|--------|------------|
| SwissDevJobs | Firecrawl Extract | `/jobs?search=X&page=N` |
| Jobs.ch | Firecrawl Extract | `/en/vacancies/?term=X&page=N` |
| Datacareer.ch | Firecrawl Extract | `/jobs/?q=X&page=N` |
| Glassdoor | Firecrawl Extract | `/Job/switzerland-jobs-SRCH_IL.0,11_IN226_KO12,X.htm?keyword=Y` |
| Indeed CH | Fallback (Claude) | `/jobs?q=X&l=Switzerland` |
| Jobup.ch | Fallback (Claude) | `/en/jobs/?term=X` |
| Jobscout24.ch | Fallback (Claude) | `/en/jobs/?q=X` |

### Test Commands

```bash
# Test single scraper
npx tsx scripts/test-single-scraper.ts [scraper] [query]
# Examples:
npx tsx scripts/test-single-scraper.ts indeed "Developer"
npx tsx scripts/test-single-scraper.ts datacareer "Machine Learning"

# Test all scrapers
npx tsx scripts/test-all-scrapers.ts
```

### Why Fallback Works Better for Some Sites

- **Indeed CH**: Large JS-heavy pages cause Firecrawl extract to timeout
- **Jobup.ch**: Dynamic content needs JS rendering
- **Jobscout24.ch**: Complex page structure, Claude parses better

The fallback method is actually faster (~10-20s vs 60-90s) because:
1. Markdown fetch is quick (~1-5s)
2. Claude Haiku parsing is fast (~5-15s)

### Files Modified This Session

```
src/lib/services/job-scraper.ts     # Main scraper with fallback
src/lib/agent/scrape-strategy.ts    # Added new scrapers
src/lib/agent/profile-analyzer.ts   # Added new job boards
scripts/test-single-scraper.ts      # Updated with new scrapers
scripts/test-all-scrapers.ts        # NEW - comprehensive test
```

### Remaining Limitations

1. **ICTjobs.ch** - Disabled, requires JS form interaction
2. **LinkedIn** - Requires Firecrawl Enterprise
3. **Jobup.ch** - Returns fewer jobs (page shows 1 job detail expanded)
4. **Rate limiting** - SwissDevJobs sometimes 502s on page 2+
