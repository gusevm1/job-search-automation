# CV Extraction Subagent

## Purpose

Parse user CVs (PDF/DOCX), extract structured profile data, and generate tailored LaTeX resumes via Overleaf integration.

## Invocation

### As Task subagent (within session)
Use Task tool with detailed prompt. Include instruction to read context first.

### Standalone (separate terminal)
```bash
claude --mcp-config .claude/utils/mcp-configs/cv-extraction.json
```

## Required First Step

**Always read `.claude/agents/cv-extraction-context.md` before starting work.**

This file contains:
- Current user profile state
- Parsed CV data cache
- LaTeX template configurations
- Recent extraction sessions

## Scope

- PDF/DOCX CV parsing and text extraction
- Structured data extraction into UserProfile schema
- Skills extraction with proficiency levels
- Work experience parsing with achievements
- User preference mapping and validation
- LaTeX CV generation via Overleaf

## Tools Available

| Tool | Purpose |
|------|---------|
| `read_pdf` | Extract text, images, and metadata from PDFs |
| `filesystem` | Access uploaded CV files from storage |

## Extraction Prompt Template

Use this prompt when parsing CV content:

```
Extract structured profile data from this CV content. Identify and structure:

1. **Personal Information**:
   - Full name (firstName, lastName)
   - Email address
   - Phone number
   - Location (city, state, country)
   - LinkedIn URL
   - GitHub URL
   - Portfolio URL
   - Professional summary

2. **Work Experience** (for each position):
   - Job title
   - Company name
   - Company industry (if identifiable)
   - Location
   - Remote/hybrid/on-site (if mentioned)
   - Start date (YYYY-MM format)
   - End date (YYYY-MM format, or null if current)
   - Key responsibilities (as array of bullet points)
   - Achievements with metrics (e.g., "Increased revenue by 25%")
   - Technologies/skills used

3. **Education** (for each entry):
   - Degree type (bachelor, master, doctorate, etc.)
   - Field of study
   - Institution name
   - Graduation date
   - GPA (if listed)
   - Honors/awards
   - Relevant coursework

4. **Skills**:
   - Technical skills with categories:
     - language (programming languages)
     - framework (React, Django, etc.)
     - database (PostgreSQL, MongoDB, etc.)
     - cloud (AWS, GCP, Azure)
     - devops (Docker, K8s, CI/CD)
     - tool (Git, Jira, Figma, etc.)
   - Estimate proficiency: beginner, intermediate, advanced, expert
   - Soft skills
   - Languages with proficiency level

5. **Certifications** (if any):
   - Name
   - Issuer
   - Issue date
   - Credential ID/URL

6. **Projects** (if any):
   - Name
   - Description
   - Technologies used
   - URL/repo link
   - Key highlights

Return as JSON matching the ExtractedProfile schema from src/types/user-profile.ts
```

## Output Schema

The extracted data must conform to the `ExtractedProfile` schema:

```typescript
{
  personalInfo: {
    firstName: string,
    lastName: string,
    email: string,
    phone?: string,
    location: { city?, state?, country },
    linkedIn?: string,
    github?: string,
    portfolio?: string,
    summary?: string
  },
  workExperience: [{
    id: string,
    title: string,
    company: string,
    industry?: string,
    location?: string,
    remote?: "remote" | "hybrid" | "on-site",
    startDate: string,
    endDate: string | null,
    isCurrent: boolean,
    responsibilities: string[],
    achievements: [{ description: string, metric?: string }],
    skillsUsed: string[],
    employmentType: "full-time" | "part-time" | "contract" | "freelance" | "internship"
  }],
  education: [{
    id: string,
    institution: string,
    degree: "bachelor" | "master" | "doctorate" | etc.,
    field: string,
    graduationDate?: string,
    gpa?: number,
    honors?: string
  }],
  skills: {
    technical: [{ name, category, proficiency, yearsOfExperience? }],
    soft: [{ name, proficiency? }],
    languages: [{ language, proficiency }]
  },
  certifications?: [...],
  projects?: [...]
}
```

## Rules

1. **Context First**: Always read `cv-extraction-context.md` before starting work
2. **Use PDF MCP**: Use the PDF MCP server for document extraction
3. **Schema Validation**: Validate extracted data against Zod schemas
4. **Multi-page Handling**: Process all pages of the document
5. **Preserve Formatting**: Note section headers to understand CV structure
6. **Confidence Scores**: If uncertain about extracted data, note confidence level
7. **Update Context**: Update `cv-extraction-context.md` after completing work

## Error Handling

- If PDF is scanned/image-based, note that OCR may be needed
- If CV format is unusual (multi-column, graphics-heavy), extract what's possible
- If required fields are missing, leave them undefined rather than guessing

## Data Storage

Extracted profiles are stored in:
```
src/lib/data/profiles/{userId}.json
```

Uploaded CVs are stored in:
```
src/lib/data/cvs/{userId}/original/
```

## Integration Points

- **Profile Page**: Extracted data feeds into `/profile` page forms
- **Job Matching**: Skills and preferences used for job match scoring
- **CV Generation**: Profile data used to generate tailored LaTeX CVs
