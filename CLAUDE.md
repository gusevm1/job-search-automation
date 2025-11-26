# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**JobSearchAutomation** - A Next.js application that:
1. Parses CVs (PDF) using Claude AI to extract structured profile data
2. Scrapes job boards using Firecrawl API based on user profile
3. Matches and scores jobs against user skills/preferences
4. Displays job listings with filtering and status tracking

## Tech Stack

- **Framework**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **UI**: shadcn/ui components
- **AI**: Anthropic Claude API (CV extraction), Firecrawl API (job scraping)
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
│   │   ├── job-matching.ts        # Scoring algorithm (education/experience weighted)
│   │   ├── profile-analyzer.ts    # Profile analysis & query generation
│   │   └── scrape-strategy.ts     # Parallel scraping with 2 concurrent
│   ├── data/
│   │   ├── jobs-store.ts          # Job persistence
│   │   └── profile-store.ts       # Profile persistence
│   └── services/
│       ├── cv-extraction.ts       # Claude-based CV parsing
│       └── job-scraper.ts         # Firecrawl scrapers (30s timeout)
└── types/
    ├── jobs.ts                    # Job listing schemas
    └── user-profile.ts            # Profile schemas
```

## Recent Implementations (This Session)

### 1. Real-Time Progress with SSE
- **New endpoint**: `/api/jobs/scrape/stream` - SSE streaming for real-time updates
- **Frontend**: Uses `EventSource` to receive progress events
- **Events**: `plan_created`, `plan_ready`, `progress`, `complete`, `error`

### 2. Parallel Scraping
- **Concurrency**: 2 scrapers run in parallel (configurable in `scrape-strategy.ts`)
- **Performance**: Full scrape reduced from 5-7 min to ~2-3 min
- **Implementation**: `runWithConcurrencyLimit()` utility function

### 3. Request Timeouts
- **30-second timeout** on all Firecrawl API requests
- **AbortController** used for clean cancellation
- **Error handling**: Clear timeout messages displayed in UI

### 4. Job Matching Algorithm Improvements
- Added `educationMatch` (8%) and `experienceMatch` (7%) scoring
- Expanded skill synonyms (34 groups for ML/AI, cloud, web)
- Prestigious university detection (ETH, Stanford, MIT, etc.)

### 5. Pagination
- Jobs list paginated (20 per page)
- "Load More" button to fetch additional pages
- Stats show total count, filtered results paginated

## Current Features

### Job Scraping
- **Sources**: SwissDevJobs, Jobs.ch, Datacareer.ch, ICTjobs.ch, Indeed CH, Glassdoor
- **Parallel execution**: 2 concurrent scrapers
- **Timeout**: 30 seconds per request
- **Security**: Prompt injection filtering, content sanitization, rate limiting
- **Fake Detection**: Filters spam/scam job postings automatically

### Profile System
- CV upload (PDF) with Claude AI extraction
- Structured profile with skills, experience, education, preferences
- Profile stored in: `src/lib/data/profiles/user_{id}.json`

### User Profile
Current test user: **Maxim Gusev** (`user_1764155617676_wz2by8t`)
- ETH Zurich MSc Computer Science (GPA 5.54/6)
- Skills: Python, PyTorch, ML/AI, Transformers
- Looking for: ML/AI Engineer roles in Switzerland

## Environment Variables

```
ANTHROPIC_API_KEY=        # For CV extraction
FIRECRAWL_API_KEY=        # For job scraping
```

## Commands

```bash
npm run dev               # Start dev server (runs on port 3000)
npm run build             # Build for production
npx tsx scripts/test-scrapers.ts  # Test job scrapers
```

## Security Notes

The job scraper includes protection against:
- Prompt injection in scraped content (filtered patterns)
- Malicious URLs (validated, internal URLs blocked)
- DoS via excessive data (field limits, job count limits)
- API abuse (rate limiting: 5 scrapes/min/user)
- Request timeout (30s max per Firecrawl request)

## shadcn/ui Components

When working with shadcn components:
- Use the MCP server to access shadcn tooling
- During planning: use the MCP server and apply components where applicable
- During implementation: call the demo tool first to see usage, then implement correctly
- Install components via the MCP server rather than writing component files manually

## Pending Tasks

From the original roadmap, these are still pending:
1. **Add job details modal/page** - Click job to see full description
2. **Add application tracking features** - Track applied status, notes, follow-ups
3. **Schedule automatic daily scraping** - Cron job or scheduled task
