# CV Extraction Agent Context

> This file is automatically loaded when the CV extraction agent starts.
> Update this file after each extraction session.

## Current State

- **Last Extraction**: None yet
- **Active User ID**: Not set
- **Pending Validations**: None

## Supported Formats

| Format | Method | Notes |
|--------|--------|-------|
| PDF | @anthropic-ai/mcp-server-pdf | Text extraction, handles multi-page |
| DOCX | mammoth.js (planned) | Convert to HTML then parse |

## Template Library

Available LaTeX templates for CV generation:

| Template | Best For | Style |
|----------|----------|-------|
| Professional | General business roles | Clean, traditional |
| Academic | Research/academic positions | Detailed, publication-focused |
| Creative | Design/marketing roles | Modern, visual |
| Technical | Engineering/developer roles | Skills-focused, projects |
| Executive | Senior/C-level roles | Achievement-focused |

## Schema Reference

Profile data follows `UserProfile` schema from:
```
src/types/user-profile.ts
```

Key interfaces:
- `PersonalInfo` - Name, contact, links
- `WorkExperience` - Job history with achievements
- `Education` - Degrees and institutions
- `Skills` - Technical, soft, languages
- `JobPreferences` - Location, salary, remote
- `AdvancedPreferences` - Industry, company size, benefits

## Recent Sessions

<!-- Auto-updated by agent after each extraction -->

| Date | User ID | CV Type | Status | Notes |
|------|---------|---------|--------|-------|
| - | - | - | - | No sessions yet |

## Known Issues & Workarounds

1. **Scanned PDFs**: May need OCR preprocessing
2. **Multi-column layouts**: Extract left-to-right, top-to-bottom
3. **Graphics/icons**: Skills represented by icons cannot be extracted
4. **Non-standard date formats**: Normalize to YYYY-MM

## Environment

Required environment variables:
```
CV_UPLOAD_DIR=./src/lib/data/cvs
CV_MAX_SIZE_MB=10
```

## Next Actions

After extraction:
1. Validate against Zod schema
2. Present to user for review/correction
3. Save validated profile to JSON
4. Update this context file
