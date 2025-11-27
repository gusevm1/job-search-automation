# Scraper Improvements Handoff - November 27, 2025

## Session Summary

Fixed job scraper timeouts and improved the scraping loading UI with better progress indication.

## Problems Fixed

### 1. Scraper Timeouts
**Issue**: Glassdoor, Indeed, Datacareer, and other scrapers were timing out and returning 0 jobs.

**Root Cause**: Firecrawl's `extract` mode (AI extraction) was timing out on complex pages, even though the sites were accessible.

**Solution**: Implemented a hybrid scraping approach with a fallback method.

### 2. Loading UI Progress
**Issue**: During AI matching phase, progress bar jumped from 70% to 100% with no intermediate updates.

**Solution**: Added simulated progress animation during AI matching.

## Technical Changes

### New Scraping Method: `scrapeJobsWithFallback()`

Location: `src/lib/services/job-scraper.ts:362-428`

```typescript
async scrapeJobsWithFallback(url: string, sourceSite: string): Promise<EnhancedJobListing[]> {
  // Step 1: Fetch markdown from Firecrawl (fast, reliable)
  const response = await fetch(`${this.baseUrl}/scrape`, {
    body: JSON.stringify({
      url,
      formats: ["markdown"],  // Not "extract"
      waitFor: 3000,
    }),
  });

  // Step 2: Parse with Claude Haiku (fast, cheap)
  const jobs = await this.parseMarkdownWithClaude(markdown, sourceSite, url);
  return jobs;
}
```

**Why this works better**:
- Markdown fetch is fast (~1-5s)
- Claude Haiku parsing is fast (~5-15s)
- Total: ~10-20s vs 60-90s timeout with extract mode

### Scraper Status After Fix

| Scraper | Method | Status | Jobs | Time |
|---------|--------|--------|------|------|
| SwissDevJobs | Firecrawl Extract | OK | 15 | 55s |
| Jobs.ch | Firecrawl Extract | OK | 3 | 37s |
| Indeed CH | **Fallback (Claude)** | OK | 15 | 15s |
| Datacareer.ch | Firecrawl Extract | OK | 50 | 158s |
| Glassdoor | Firecrawl Extract | OK | 10 | 35s |
| Jobup.ch | **Fallback (Claude)** | OK | 6 | 12s |
| Jobscout24.ch | **Fallback (Claude)** | OK | 26 | 22s |
| ICTjobs.ch | Disabled | Skip | 0 | - |

**Total: 125 jobs from 7 scrapers**

### New Scrapers Added

1. **Jobup.ch** (`scrapeJobup`)
   - URL: `https://www.jobup.ch/en/jobs/?term=X`
   - Uses fallback method

2. **Jobscout24.ch** (`scrapeJobscout24`)
   - URL: `https://www.jobscout24.ch/en/jobs/?q=X`
   - Uses fallback method

### URL Fixes

| Scraper | Old URL | New URL |
|---------|---------|---------|
| Datacareer | `/categories/AI/` | `/jobs/?q=X` |
| Glassdoor | Complex SRCH pattern | Simplified with `?keyword=X` |
| Indeed | `www.indeed.ch` | `ch.indeed.com` |

### Loading Overlay Improvements

Location: `src/components/jobs/scrape-loading-overlay.tsx`

1. **Scroll Indicator**
   - Added "Scroll for more" hint when >4 tasks
   - Gradient fade at bottom of task list

2. **Auto-Scroll**
   - Task list scrolls to show running task
   - Uses `scrollIntoView({ behavior: "smooth", block: "center" })`

3. **Pulse Animation**
   - Replaced `animate-spin` on Globe with custom `animate-pulse-scale`
   - Smooth 1.5s scale animation (1.0 -> 1.15 -> 1.0)

4. **Simulated AI Matching Progress**
   ```typescript
   // Asymptotic progress that slows as it approaches 90%
   const interval = setInterval(() => {
     setSimulatedMatchProgress((prev) => {
       const remaining = 90 - prev;
       const increment = remaining * 0.08;
       return Math.min(prev + increment, 89);
     });
   }, 500);
   ```

5. **Dynamic Status Messages**
   - 0-30%: "Reading job descriptions..."
   - 30-60%: "Matching skills & requirements..."
   - 60-85%: "Calculating compatibility scores..."
   - 85-100%: "Finalizing rankings..."

## Files Modified

```
src/lib/services/job-scraper.ts      # Fallback method, new scrapers, URL fixes
src/lib/agent/scrape-strategy.ts     # Added new scraper imports/cases
src/lib/agent/profile-analyzer.ts    # Added Jobup, Jobscout24 to JOB_BOARDS
src/components/jobs/scrape-loading-overlay.tsx  # UI improvements
```

## Test Scripts

```bash
# Test single scraper
npx tsx scripts/test-single-scraper.ts indeed "Developer"
npx tsx scripts/test-single-scraper.ts glassdoor "Machine Learning"

# Test all scrapers
npx tsx scripts/test-all-scrapers.ts
```

## Configuration

### Timeout Settings
- Firecrawl extract mode: 90s
- Fallback markdown fetch: 45s
- Claude parsing: No explicit timeout

### Pagination
- Target: 50 jobs per query
- Max pages: 3
- Stops early if no new unique jobs

## Known Limitations

1. **ICTjobs.ch** - Disabled, requires JS form interaction
2. **LinkedIn** - Requires Firecrawl Enterprise
3. **Jobup.ch** - Returns fewer jobs (page shows 1 expanded job detail)
4. **Rate limiting** - SwissDevJobs sometimes 502s on page 2+

## Environment Variables

```
FIRECRAWL_API_KEY=fc-...       # For scraping
ANTHROPIC_API_KEY=sk-ant-...   # For fallback parsing
```
