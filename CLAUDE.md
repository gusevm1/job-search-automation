# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**JobSearchAutomation** - A Next.js application that:
1. Parses CVs (PDF) using Claude AI to extract structured profile data
2. Scrapes job boards using Firecrawl API based on user profile
3. Matches and scores jobs against user skills/preferences (AI-powered)
4. Displays job listings with filtering and status tracking

## Tech Stack

- **Framework**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **UI**: shadcn/ui components
- **AI**: Anthropic Claude API (CV extraction, fallback job parsing), Firecrawl API (job scraping)
- **Backend**: FastAPI (Python) for AI job matching
- **Storage**: JSON files in `src/lib/data/`
- **Real-time**: Server-Sent Events (SSE) for scrape progress

## Key Directories

```
src/
├── app/                    # Next.js pages
│   ├── jobs/page.tsx       # Job listings UI with SSE progress
│   ├── profile/page.tsx    # Profile/CV upload
│   └── api/
│       ├── jobs/
│       │   ├── list/route.ts      # List jobs with pagination
│       │   ├── scrape/route.ts    # Trigger scrape (legacy)
│       │   └── scrape/stream/route.ts  # SSE streaming endpoint
│       └── profile/               # Profile API routes
├── components/
│   └── jobs/
│       ├── job-card.tsx           # Individual job display
│       ├── jobs-filters.tsx       # Filter controls
│       ├── scrape-loading-overlay.tsx  # Real-time progress overlay
│       └── scrape-progress.tsx    # Progress component
├── lib/
│   ├── agent/
│   │   ├── job-matching.ts        # TypeScript scoring (fallback)
│   │   ├── profile-analyzer.ts    # Profile analysis & query generation
│   │   └── scrape-strategy.ts     # Parallel scraping orchestration
│   ├── data/
│   │   ├── jobs-store.ts          # Job persistence
│   │   └── profile-store.ts       # Profile persistence
│   └── services/
│       ├── cv-extraction.ts       # Claude-based CV parsing
│       └── job-scraper.ts         # Firecrawl scrapers (90s timeout)
├── types/
│   ├── jobs.ts                    # Job listing schemas
│   └── user-profile.ts            # Profile schemas
└── scripts/
    ├── test-single-scraper.ts     # Test individual scraper
    └── test-all-scrapers.ts       # Test all scrapers
```

## Job Scraping System

### Working Scrapers (7 total, ~125 jobs)

| Scraper | Method | Status | Notes |
|---------|--------|--------|-------|
| SwissDevJobs | Firecrawl Extract | OK | Best for tech roles |
| Jobs.ch | Firecrawl Extract | OK | General Swiss jobs |
| Indeed CH | Fallback (Claude) | OK | Large aggregator |
| Datacareer.ch | Firecrawl Extract | OK | Data/AI focused |
| Glassdoor | Firecrawl Extract | OK | Company reviews |
| Jobup.ch | Fallback (Claude) | OK | Major Swiss portal |
| Jobscout24.ch | Fallback (Claude) | OK | General Swiss |

### Disabled Scrapers
- **ICTjobs.ch** - Requires JS form interaction
- **LinkedIn** - Requires Firecrawl Enterprise

### Two Scraping Methods

1. **Firecrawl Extract** (primary) - AI extraction, structured output
2. **Fallback** (markdown + Claude Haiku) - Fast, reliable for JS-heavy sites

### Test Commands

```bash
# Test single scraper
npx tsx scripts/test-single-scraper.ts indeed "Developer"
npx tsx scripts/test-single-scraper.ts datacareer "Machine Learning"

# Test all scrapers
npx tsx scripts/test-all-scrapers.ts
```

## Environment Variables

```
ANTHROPIC_API_KEY=        # For CV extraction & fallback parsing
FIRECRAWL_API_KEY=        # For job scraping
PYTHON_BACKEND_URL=       # Optional: FastAPI backend (default: http://localhost:8000)
```

## Commands

```bash
npm run dev               # Start Next.js dev server (port 3000)
npm run build             # Build for production

# Backend (optional)
cd backend && uvicorn main:app --reload  # Start FastAPI (port 8000)
```

## Current Features

### Job Scraping
- **Sources**: 7 Swiss job boards (see table above)
- **Parallel execution**: 2 concurrent scrapers
- **Timeout**: 90 seconds per request
- **Pagination**: Up to 3 pages, target 50 jobs per query
- **Security**: Prompt injection filtering, fake job detection

### Profile System
- CV upload (PDF) with Claude AI extraction
- Structured profile with skills, experience, education
- AI-generated search keywords

### Job Matching
- AI-powered matching via Python backend (preferred)
- TypeScript fallback scoring algorithm
- Skills matching with synonyms (34 groups)

### Loading Overlay
- Real-time progress during scraping
- Auto-scroll to running tasks
- Simulated progress during AI matching phase
- Dynamic status messages

## Security Notes

The job scraper includes protection against:
- Prompt injection in scraped content
- Malicious URLs (validated, internal URLs blocked)
- DoS via excessive data (field limits, job count limits)
- Request timeouts (90s max)
- Fake job detection (spam patterns)

## shadcn/ui Components

When working with shadcn components:
- Use the MCP server to access shadcn tooling
- During planning: use the MCP server and apply components where applicable
- During implementation: call the demo tool first to see usage
- Install components via the MCP server rather than writing manually

## Recent Updates (Nov 27, 2025)

### Scraper Fixes
- Fixed Glassdoor, Indeed, Datacareer timeouts with hybrid approach
- Added fallback method (markdown + Claude Haiku)
- Added Jobup.ch and Jobscout24.ch scrapers
- Fixed URL formats for multiple job boards

### UI Improvements
- Added scroll indicator to task list
- Auto-scroll to running tasks
- Pulse animation instead of spinning globe
- Simulated progress during AI matching

## Pending Tasks

1. **Add job details modal/page** - Click job to see full description
2. **Add application tracking** - Track applied status, notes, follow-ups
3. **Schedule automatic scraping** - Cron job or scheduled task
