# Job Search Automation - Handoff Context

## Quick Start Prompt

Copy this to start a new Claude instance:

---

I'm continuing work on a Job Search Automation app. Please read `CLAUDE.md` for full context.

**Current State:**
- Job scraping system is implemented with 6 sources (SwissDevJobs, Jobs.ch, Datacareer.ch, ICTjobs.ch, Indeed CH, Glassdoor)
- Security hardening complete (prompt injection filtering, sanitization, rate limiting)
- Profile system working - user profile exists at `src/lib/data/profiles/user_1764155617676_wz2by8t.json`
- UI for /jobs page implemented with stats, filters, job cards

**Key Files to Review:**
- `src/lib/services/job-scraper.ts` - Scrapers + security
- `src/lib/agent/scrape-strategy.ts` - Orchestration
- `src/app/jobs/page.tsx` - Jobs UI
- `src/components/jobs/job-card.tsx` - Job display component

**Next Steps (pick what's needed):**
1. Test the full scraping flow via UI (run `npm run dev`, go to /jobs, click "Find Jobs")
2. Improve job matching algorithm (`src/lib/agent/job-matching.ts`)
3. Add job details modal/page for expanded view
4. Add application tracking features
5. Schedule automatic daily scraping

**Important Notes:**
- User profile already exists - no need to re-upload CV
- Firecrawl API key is in `.env.local`
- All scraped content is sanitized against prompt injection
- LinkedIn scraping disabled (requires Firecrawl Enterprise)

---

## Architecture Summary

```
User Profile (JSON) → Profile Analyzer → Search Queries
                                              ↓
                                     Scrape Strategy Engine
                                              ↓
                           ┌─────────────────┼─────────────────┐
                           ↓                 ↓                 ↓
                    SwissDevJobs         Jobs.ch          Datacareer.ch
                           ↓                 ↓                 ↓
                           └─────────────────┼─────────────────┘
                                              ↓
                                    Content Sanitizer (Security)
                                              ↓
                                    Fake Job Filter
                                              ↓
                                    Job Matching Engine (Scoring)
                                              ↓
                                    Jobs Store (JSON) → UI
```

## File Quick Reference

| File | Purpose |
|------|---------|
| `src/lib/services/job-scraper.ts` | Firecrawl scrapers, sanitization, fake detection |
| `src/lib/agent/scrape-strategy.ts` | Plan creation, orchestration, calls scrapers |
| `src/lib/agent/profile-analyzer.ts` | Generates search queries from profile |
| `src/lib/agent/job-matching.ts` | Scores jobs against profile |
| `src/app/jobs/page.tsx` | Main jobs listing page |
| `src/app/api/jobs/scrape/route.ts` | Scrape API endpoint (rate limited) |

## Test Commands

```bash
# Test scrapers directly
npx tsx scripts/test-scrapers.ts

# Run dev server
npm run dev

# Build
npm run build
```
