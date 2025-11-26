# JobSearchAutomation - Agentic Development Portfolio

## Executive Summary

Build a **portfolio demo** that showcases not just the app, but **how you build with AI agents**. This project teaches efficient Claude Code development patterns while creating a job search demo.

**Two Goals:**
1. **Portfolio Website** - Showcase LangChain, FastAPI, Next.js skills
2. **Development Mastery** - Learn optimal Claude Code workflows, parallel agents, git branching

**Strategy:**
- ✅ **Agent-First** - Create specialized Claude agents before coding
- ✅ **Parallel Development** - Multiple branches worked simultaneously
- ✅ **MCP Contexts** - Preloaded docs for each domain (LangChain, FastAPI, etc.)
- ✅ **Orchestrated Workflow** - Clear handoffs between agents
- ✅ **Local First** - FastAPI + SQLite, then Azure deployment

**Estimated Timeline:** 4-6 weeks (learning pace)

---

## 📊 Progress Tracker (Updated: 2025-11-26)

### Phase Overview

| Phase | Description | Status | Branch |
|-------|-------------|--------|--------|
| **0** | Agent Infrastructure & Git | ✅ **COMPLETE** | `feature/agents` |
| **1** | FastAPI Backend Setup | ✅ **COMPLETE** | `feature/agents` |
| **2** | LangChain CV Extraction | ✅ **COMPLETE** | `feature/agents` |
| **3** | LangChain Job Matching | 🔲 Pending | - |
| **4** | Frontend Integration | 🟡 **IN PROGRESS** | `main` |
| **5** | Azure Deployment | 🔲 Pending | - |

### Completed Tasks

#### Phase 0: Agent Infrastructure ✅
- [x] Git repository with branching strategy (main, develop, feature/agents)
- [x] FastAPI agent definition (`.claude/agents/fastapi-agent.md`)
- [x] FastAPI context patterns (`.claude/agents/fastapi-context.md`)
- [x] LangChain agent definition (`.claude/agents/langchain-agent.md`)
- [x] LangChain context patterns (`.claude/agents/langchain-context.md`)
- [x] `/fastapi` slash command (`.claude/commands/fastapi.md`)
- [x] `/langchain` slash command (`.claude/commands/langchain.md`)
- [x] FastAPI handoff document (`.claude/handoff/fastapi-handoff.md`)
- [x] LangChain handoff document (`.claude/handoff/langchain-handoff.md`)

#### Phase 1: FastAPI Backend ✅
- [x] Backend directory structure (`backend/`)
- [x] `main.py` with CORS configured for localhost:3000
- [x] Pydantic models: `profile.py` (~275 lines)
- [x] Pydantic models: `job.py` (~220 lines)
- [x] CV router with demo endpoints (`/api/cv/demo`)
- [x] Jobs router with demo endpoints (`/api/jobs/demo`)
- [x] Database setup (async SQLite with SQLAlchemy)
- [x] Requirements.txt with all dependencies
- [x] Server verified running on port 8000
- [x] Swagger UI accessible at `/docs`

#### Phase 2: LangChain CV Extraction ✅
- [x] `CVExtractionChain` class with LCEL composition
- [x] Pydantic output parser for Profile model
- [x] Async and sync extraction methods
- [x] Error handling and retry logic
- [x] Confidence scoring algorithm
- [x] Test script (`test_cv_extraction.py`)
- [x] Chain verified and production-ready

#### Phase 4: Frontend (Partial) 🟡
- [x] Landing page redesigned with hero section
- [x] "How it Works" section with 4-step workflow
- [x] Key Features section
- [x] Tech Stack badges
- [x] Demo disclaimer card
- [x] Navigation updated (Dashboard → Home)
- [ ] FastAPI client integration
- [ ] Interactive demo page

### Next Up

| Priority | Task | Agent |
|----------|------|-------|
| 1 | Create `job_matching.py` chain | LangChain |
| 2 | Integrate CV extraction with `/api/cv/parse` | FastAPI |
| 3 | Create FastAPI client for frontend | Frontend |
| 4 | Add database persistence | FastAPI |
| 5 | Docker setup | DevOps |

---

## Part 0: Agent Infrastructure & Git Strategy (FIRST)

### 0.1 Git Branching Strategy

```
main
├── develop                    # Integration branch
│   ├── feature/agents         # Phase 0: Agent setup (YOU START HERE)
│   ├── feature/fastapi-base   # Phase 1: FastAPI skeleton
│   ├── feature/langchain-cv   # Phase 2: CV extraction chain
│   ├── feature/langchain-jobs # Phase 3: Job matching chain
│   ├── feature/frontend-demo  # Phase 4: Demo UI
│   └── feature/azure-deploy   # Phase 5: Deployment
```

**Parallel Work Strategy:**
- `feature/fastapi-base` and `feature/langchain-cv` can run in parallel
- `feature/langchain-jobs` depends on `feature/langchain-cv` (shared models)
- `feature/frontend-demo` can start once FastAPI has basic endpoints

**Branch Workflow:**
```bash
# Create develop branch from main
git checkout -b develop

# Create feature branches from develop
git checkout -b feature/agents develop
# ... work on agents ...
git checkout develop && git merge feature/agents

# Start parallel branches
git checkout -b feature/fastapi-base develop
# In another terminal/session:
git checkout -b feature/langchain-cv develop
```

---

### 0.2 Claude Folder Organization

**Your existing structure (to build on):**
```
.claude/
├── agents/
│   ├── cv-extraction.md           # ✅ Exists
│   ├── cv-extraction-context.md   # ✅ Exists
│   ├── frontend.md                # ✅ Exists
│   ├── frontend-context.md        # ✅ Exists
│   ├── scraper.md                 # ✅ Exists
│   └── context_bundles/           # ✅ Exists
├── commands/
│   ├── frontend.md                # ✅ Exists
│   ├── scrape.md                  # ✅ Exists
│   ├── shadCN.md                  # ✅ Exists
│   ├── workflow.md                # ✅ Exists
│   └── agents.md                  # ✅ Exists
├── handoff/
│   └── jobs-system-handoff.md     # ✅ Exists
├── utils/mcp-configs/
│   ├── firecrawl.json             # ✅ Exists
│   ├── shadcn.json                # ✅ Exists
│   └── cv-extraction.json         # ✅ Exists
└── output-styles/
    └── default.md                 # ✅ Exists
```

**NEW files to add:**
```
.claude/
├── agents/
│   ├── fastapi-agent.md           # NEW: Python backend agent
│   ├── fastapi-context.md         # NEW: FastAPI patterns
│   ├── langchain-agent.md         # NEW: LangChain chains agent
│   ├── langchain-context.md       # NEW: LangChain patterns
│   ├── azure-agent.md             # NEW: Deployment agent
│   └── orchestrator-agent.md      # NEW: Coordination agent
├── commands/
│   ├── fastapi.md                 # NEW: /fastapi command
│   ├── langchain.md               # NEW: /langchain command
│   ├── azure.md                   # NEW: /azure command
│   └── status.md                  # NEW: /status command
├── handoff/
│   ├── fastapi-handoff.md         # NEW: Backend progress
│   ├── langchain-handoff.md       # NEW: AI chains progress
│   └── azure-handoff.md           # NEW: Deployment progress
└── utils/mcp-configs/
    └── langchain.json             # NEW: If LangChain MCP exists
```

---

### 0.3 Specialized Agents

#### Agent 1: FastAPI Agent (`fastapi-agent.md`)
```markdown
# FastAPI Development Agent

You are a FastAPI expert. Your role is to build the Python backend.

## Your Expertise
- FastAPI route design and best practices
- Pydantic models for request/response validation
- Async Python patterns
- SQLite with SQLAlchemy
- CORS configuration for frontend integration

## Key Files You Own
- backend/main.py
- backend/app/routers/*.py
- backend/app/models/*.py
- backend/app/db/*.py

## Before Starting
Read: .claude/contexts/fastapi-docs.md
Check: .claude/handoff/fastapi-handoff.md for current state

## When Done
Update: .claude/handoff/fastapi-handoff.md with your progress
```

#### Agent 2: LangChain Agent (`langchain-agent.md`)
```markdown
# LangChain Development Agent

You are a LangChain expert. Your role is to build AI chains.

## Your Expertise
- LangChain chains and LCEL (LangChain Expression Language)
- Pydantic output parsers for structured responses
- Anthropic Claude integration
- Prompt engineering for extraction and matching

## Key Files You Own
- backend/app/chains/*.py
- Any LangChain-related code

## Before Starting
Read: .claude/contexts/langchain-docs.md
Check: .claude/handoff/langchain-handoff.md for current state

## When Done
Update: .claude/handoff/langchain-handoff.md with your progress
```

#### Agent 3: Frontend Agent (`frontend-agent.md`)
```markdown
# Frontend Development Agent

You are a Next.js/React expert. Your role is to build the demo UI.

## Your Expertise
- Next.js 16 App Router
- React Server Components
- Tailwind CSS + shadcn/ui
- Fetching data from FastAPI backend

## Key Files You Own
- src/app/**/*.tsx
- src/components/**/*.tsx
- src/lib/api/*.ts

## Before Starting
Read: Existing CLAUDE.md for project context
Check: .claude/handoff/frontend-handoff.md for current state

## When Done
Update: .claude/handoff/frontend-handoff.md with your progress
```

#### Agent 4: Orchestrator Agent (`orchestrator-agent.md`)
```markdown
# Orchestrator Agent

You coordinate work across all agents and branches.

## Your Role
- Track progress across feature branches
- Identify blockers and dependencies
- Coordinate merges to develop
- Maintain handoff documents

## Commands
- /status - Show progress across all branches
- /sync - Merge completed features to develop
- /plan - Update project plan based on current state

## Key Files
- .claude/plans/*.md
- .claude/handoff/*.md
- CLAUDE.md
```

---

### 0.4 Slash Commands

#### `/fastapi` Command (`.claude/commands/fastapi.md`)
```markdown
Invoke the FastAPI agent for backend development.

1. Read .claude/agents/fastapi-agent.md for your role
2. Read .claude/contexts/fastapi-docs.md for patterns
3. Check .claude/handoff/fastapi-handoff.md for current state
4. Work on the task provided
5. Update handoff document when done
```

#### `/langchain` Command (`.claude/commands/langchain.md`)
```markdown
Invoke the LangChain agent for AI chain development.

1. Read .claude/agents/langchain-agent.md for your role
2. Read .claude/contexts/langchain-docs.md for patterns
3. Check .claude/handoff/langchain-handoff.md for current state
4. Work on the task provided
5. Update handoff document when done
```

#### `/status` Command (`.claude/commands/status.md`)
```markdown
Show project status across all workstreams.

Check and report:
1. Git branch status (which branches exist, last commit)
2. Handoff documents (.claude/handoff/*.md)
3. Current blockers or dependencies
4. Next recommended actions
```

---

### 0.5 Context Documents

#### FastAPI Context (`.claude/contexts/fastapi-docs.md`)
```markdown
# FastAPI Patterns for This Project

## Project Structure
backend/
├── main.py              # App entry, CORS, routers
├── app/
│   ├── models/          # Pydantic schemas
│   ├── routers/         # API endpoints
│   ├── chains/          # LangChain integrations
│   └── db/              # Database operations

## Key Patterns

### Router Pattern
```python
from fastapi import APIRouter, HTTPException
router = APIRouter()

@router.post("/endpoint", response_model=ResponseModel)
async def endpoint(request: RequestModel):
    # Implementation
    return ResponseModel(...)
```

### Pydantic Model Pattern
```python
from pydantic import BaseModel, Field
from typing import Optional

class MyModel(BaseModel):
    required_field: str = Field(..., description="Required")
    optional_field: Optional[str] = Field(None, description="Optional")

    model_config = {"json_schema_extra": {"example": {...}}}
```

## CORS Setup
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
```

#### LangChain Context (`.claude/contexts/langchain-docs.md`)
```markdown
# LangChain Patterns for This Project

## LCEL (LangChain Expression Language)
```python
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser

# Build chain with pipe operator
chain = prompt | model | parser
result = await chain.ainvoke({"input": "..."})
```

## Pydantic Output Parser
```python
from pydantic import BaseModel
from langchain_core.output_parsers import PydanticOutputParser

class ExtractedData(BaseModel):
    field1: str
    field2: int

parser = PydanticOutputParser(pydantic_object=ExtractedData)
format_instructions = parser.get_format_instructions()
```

## Anthropic Integration
```python
from langchain_anthropic import ChatAnthropic

model = ChatAnthropic(
    model="claude-3-5-haiku-20241022",
    temperature=0,
    api_key=os.getenv("ANTHROPIC_API_KEY"),
)
```

## Error Handling
```python
from langchain_core.exceptions import OutputParserException

try:
    result = await chain.ainvoke(input_data)
except OutputParserException as e:
    # Handle malformed LLM output
    logger.error(f"Parse error: {e}")
```
```

---

### 0.6 Handoff Documents

#### FastAPI Handoff (`.claude/handoff/fastapi-handoff.md`)
```markdown
# FastAPI Development Handoff

## Current State
- [ ] Project structure created
- [ ] main.py with CORS configured
- [ ] Pydantic models defined
- [ ] CV router implemented
- [ ] Jobs router implemented
- [ ] Database setup complete

## Last Updated
Date: [DATE]
By: [AGENT]

## Current Branch
`feature/fastapi-base`

## Blockers
- None

## Next Steps
1. [Next task]

## Notes for Next Agent
[Any context needed]
```

---

### 0.7 Parallel Development Workflow

**How to work in parallel with Claude Code:**

```bash
# Terminal 1: FastAPI development
cd /path/to/project
git checkout feature/fastapi-base
claude  # Start Claude Code
> /fastapi Create the basic FastAPI structure

# Terminal 2: LangChain development (separate session)
cd /path/to/project
git checkout feature/langchain-cv
claude  # Start another Claude Code instance
> /langchain Create the CV extraction chain

# Terminal 3: Orchestration
cd /path/to/project
git checkout develop
claude
> /status  # Check progress across branches
```

**Sync workflow:**
```bash
# When a feature is complete
git checkout develop
git merge feature/fastapi-base
git push

# Update other branches with latest develop
git checkout feature/langchain-cv
git merge develop
```

---

## Part 1: Technology Stack

### What You'll Showcase

| Technology | Purpose | Why It's Impressive |
|------------|---------|---------------------|
| **LangChain** | AI/LLM orchestration | Industry-standard for AI apps |
| **FastAPI** | Python backend | Preferred in ML/AI companies |
| **Next.js 16** | React frontend | Modern full-stack skills |
| **Claude API** | LLM integration | Cutting-edge AI |
| **Pydantic** | Data validation | Type-safe Python |

### What is FastAPI?

FastAPI is a modern Python web framework, extremely popular in ML/AI:
- **Automatic API docs** (Swagger UI at `/docs`)
- **Type hints** with Pydantic validation
- **Async support** for high performance
- **Easy integration** with ML libraries (PyTorch, scikit-learn, etc.)

### What is LangChain?

LangChain orchestrates LLM applications:
- **Chains** - Compose multiple LLM calls into pipelines
- **Structured Outputs** - Type-safe responses with Pydantic schemas
- **Memory** - Conversation context management
- **Tools** - Let LLMs call functions/APIs

---

## Part 2: Architecture

### Current State
```
Next.js App (localhost:3000)
├── CV Upload → Claude API → Profile JSON
├── Job Scraping → Firecrawl API → JSON files
└── Job Matching → Rule-based algorithm
```

### Target Architecture (Portfolio Demo)
```
┌─────────────────────────────────────────────────────────────┐
│                    PORTFOLIO DEMO                           │
├─────────────────────────────────────────────────────────────┤
│  Next.js Frontend (localhost:3000)                         │
│    ├── Landing page with your preloaded CV                 │
│    ├── Interactive demo of job search workflow             │
│    ├── Visualization of AI matching process                │
│    └── "How it works" explanations                         │
│                         │                                   │
│                         ▼                                   │
│  FastAPI Backend (localhost:8000)                          │
│    ├── /api/cv/parse - LangChain CV extraction             │
│    ├── /api/jobs/match - Semantic job matching             │
│    ├── /api/jobs/search - AI-powered job search            │
│    └── /docs - Auto-generated Swagger UI                   │
│                         │                                   │
│                         ▼                                   │
│  LangChain Pipelines                                       │
│    ├── CV Extraction Chain (structured outputs)            │
│    ├── Job Matching Chain (semantic similarity)            │
│    └── Search Query Chain (intent understanding)           │
│                         │                                   │
│                         ▼                                   │
│  Local Storage                                             │
│    ├── SQLite database (profiles, jobs, matches)           │
│    ├── JSON files (cached results)                         │
│    └── Your CV (preloaded demo data)                       │
└─────────────────────────────────────────────────────────────┘
```

### Why FastAPI + Next.js?

1. **Separation of concerns** - Python for AI/ML, TypeScript for UI
2. **Industry standard** - This is how ML companies build products
3. **Portfolio value** - Shows you can work across the stack
4. **Swagger docs** - Interviewers can test your API at `/docs`

---

## Part 3: Implementation Plan

### Phase 1: FastAPI Backend Setup (Week 1)

#### 1.1 Create Python Backend Directory

```bash
# Create backend directory alongside Next.js app
mkdir -p backend
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn langchain langchain-anthropic pydantic sqlalchemy aiosqlite python-multipart
```

#### 1.2 Project Structure

```
backend/
├── main.py                 # FastAPI app entry point
├── requirements.txt        # Python dependencies
├── .env                    # API keys (ANTHROPIC_API_KEY)
├── app/
│   ├── __init__.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── profile.py      # Pydantic models for CV/Profile
│   │   └── job.py          # Pydantic models for Jobs
│   ├── chains/
│   │   ├── __init__.py
│   │   ├── cv_extraction.py    # LangChain CV parser
│   │   └── job_matching.py     # LangChain job matcher
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── cv.py           # /api/cv/* endpoints
│   │   └── jobs.py         # /api/jobs/* endpoints
│   └── db/
│       ├── __init__.py
│       ├── database.py     # SQLite connection
│       └── crud.py         # Database operations
└── data/
    ├── demo_cv.pdf         # Your preloaded CV
    ├── demo_profile.json   # Extracted profile data
    └── jobs.db             # SQLite database
```

#### 1.3 Create FastAPI Main App

Create `backend/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import cv, jobs

app = FastAPI(
    title="JobSearch AI API",
    description="LangChain-powered job search and CV analysis",
    version="1.0.0",
)

# Allow Next.js frontend to call API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cv.router, prefix="/api/cv", tags=["CV"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["Jobs"])

@app.get("/")
async def root():
    return {"message": "JobSearch AI API", "docs": "/docs"}
```

#### 1.4 Create Pydantic Models

Create `backend/app/models/profile.py`:
```python
from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum

class Proficiency(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"
    expert = "expert"

class TechnicalSkill(BaseModel):
    name: str
    category: str
    proficiency: Proficiency
    years_of_experience: Optional[float] = None

class WorkExperience(BaseModel):
    title: str
    company: str
    location: Optional[str] = None
    start_date: str
    end_date: Optional[str] = None
    is_current: bool = False
    responsibilities: list[str] = []
    achievements: list[str] = []
    skills_used: list[str] = []

class Education(BaseModel):
    institution: str
    degree: str
    field: str
    graduation_date: Optional[str] = None
    gpa: Optional[float] = None

class Profile(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    summary: Optional[str] = None
    work_experience: list[WorkExperience] = []
    education: list[Education] = []
    technical_skills: list[TechnicalSkill] = []
    soft_skills: list[str] = []
```

---

### Phase 2: LangChain CV Extraction (Week 2)

#### 2.1 Create CV Extraction Chain

Create `backend/app/chains/cv_extraction.py`:
```python
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from app.models.profile import Profile
import os

class CVExtractionChain:
    def __init__(self):
        self.model = ChatAnthropic(
            model="claude-3-5-haiku-20241022",
            api_key=os.getenv("ANTHROPIC_API_KEY"),
            temperature=0,
        )

        self.parser = PydanticOutputParser(pydantic_object=Profile)

        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert CV parser. Extract structured profile data from the CV text.

{format_instructions}

Be thorough and extract all available information. If a field is not found, omit it."""),
            ("human", "Parse this CV:\n\n{cv_text}")
        ])

        self.chain = self.prompt | self.model | self.parser

    async def extract(self, cv_text: str) -> Profile:
        """Extract structured profile from CV text."""
        result = await self.chain.ainvoke({
            "cv_text": cv_text,
            "format_instructions": self.parser.get_format_instructions()
        })
        return result

    def extract_sync(self, cv_text: str) -> Profile:
        """Synchronous version for simpler use cases."""
        result = self.chain.invoke({
            "cv_text": cv_text,
            "format_instructions": self.parser.get_format_instructions()
        })
        return result
```

#### 2.2 Create CV Router

Create `backend/app/routers/cv.py`:
```python
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.chains.cv_extraction import CVExtractionChain
from app.models.profile import Profile
import PyPDF2
import io

router = APIRouter()
chain = CVExtractionChain()

@router.post("/parse", response_model=Profile)
async def parse_cv(file: UploadFile = File(...)):
    """Parse uploaded CV and extract structured profile data."""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(400, "Only PDF files supported")

    # Extract text from PDF
    content = await file.read()
    pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
    cv_text = "\n".join(page.extract_text() for page in pdf_reader.pages)

    # Use LangChain to extract profile
    profile = await chain.extract(cv_text)
    return profile

@router.get("/demo", response_model=Profile)
async def get_demo_profile():
    """Return preloaded demo profile (your CV)."""
    import json
    with open("data/demo_profile.json") as f:
        return Profile(**json.load(f))
```

---

### Phase 3: LangChain Job Matching (Week 3)

#### 3.1 Create Job Matching Chain

Create `backend/app/chains/job_matching.py`:
```python
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel
from app.models.profile import Profile
from app.models.job import Job
import os
import json

class MatchResult(BaseModel):
    score: int  # 0-100
    reasoning: str
    strengths: list[str]
    gaps: list[str]
    recommendation: str

class JobMatchingChain:
    def __init__(self):
        self.model = ChatAnthropic(
            model="claude-3-5-haiku-20241022",
            api_key=os.getenv("ANTHROPIC_API_KEY"),
            temperature=0,
        )

        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert job matching AI. Analyze how well a candidate matches a job.

Return a JSON object with:
- score: 0-100 match percentage
- reasoning: 2-3 sentence explanation
- strengths: list of 2-3 candidate strengths for this role
- gaps: list of any skill gaps or concerns
- recommendation: "strong match", "good match", "potential match", or "weak match"

Be honest but encouraging. Focus on transferable skills."""),
            ("human", """CANDIDATE PROFILE:
Name: {name}
Skills: {skills}
Experience: {experience}
Education: {education}

JOB POSTING:
Title: {job_title}
Company: {company}
Requirements: {requirements}
Description: {description}

Analyze the match and return JSON:""")
        ])

    async def match(self, profile: Profile, job: Job) -> MatchResult:
        """Calculate semantic match between profile and job."""
        response = await self.model.ainvoke(
            self.prompt.format_messages(
                name=f"{profile.first_name} {profile.last_name}",
                skills=", ".join(s.name for s in profile.technical_skills),
                experience="; ".join(f"{e.title} at {e.company}" for e in profile.work_experience),
                education="; ".join(f"{e.degree} in {e.field} from {e.institution}" for e in profile.education),
                job_title=job.title,
                company=job.company,
                requirements=", ".join(job.requirements or []),
                description=job.description or "Not provided"
            )
        )

        # Parse JSON response
        result_json = json.loads(response.content)
        return MatchResult(**result_json)
```

#### 3.2 Create Jobs Router

Create `backend/app/routers/jobs.py`:
```python
from fastapi import APIRouter, HTTPException
from app.chains.job_matching import JobMatchingChain, MatchResult
from app.models.profile import Profile
from app.models.job import Job
from typing import Optional

router = APIRouter()
matching_chain = JobMatchingChain()

@router.post("/match", response_model=MatchResult)
async def match_job(profile: Profile, job: Job):
    """Calculate AI-powered match score between profile and job."""
    return await matching_chain.match(profile, job)

@router.post("/match-batch")
async def match_jobs_batch(profile: Profile, jobs: list[Job]):
    """Match profile against multiple jobs."""
    results = []
    for job in jobs:
        match = await matching_chain.match(profile, job)
        results.append({
            "job_id": job.id,
            "job_title": job.title,
            "company": job.company,
            **match.model_dump()
        })
    return sorted(results, key=lambda x: x["score"], reverse=True)

@router.get("/demo")
async def get_demo_jobs():
    """Return sample jobs for demo."""
    import json
    with open("data/demo_jobs.json") as f:
        return json.load(f)
```

---

### Phase 4: Frontend Integration (Week 4)

#### 4.1 Update Next.js to Call FastAPI

Create `src/lib/api/fastapi-client.ts`:
```typescript
const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000";

export async function parseCV(file: File): Promise<Profile> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${FASTAPI_URL}/api/cv/parse`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error("CV parsing failed");
  return response.json();
}

export async function matchJob(profile: Profile, job: Job): Promise<MatchResult> {
  const response = await fetch(`${FASTAPI_URL}/api/jobs/match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile, job }),
  });

  if (!response.ok) throw new Error("Job matching failed");
  return response.json();
}

export async function getDemoProfile(): Promise<Profile> {
  const response = await fetch(`${FASTAPI_URL}/api/cv/demo`);
  return response.json();
}
```

#### 4.2 Create Demo Landing Page

Update `src/app/page.tsx` to showcase the demo:
- Display your preloaded CV/Profile
- Show "How it works" section
- Interactive job matching demo
- Link to Swagger docs (`/docs`)

---

### Phase 5: Polish & Azure Deployment (Week 5-6)

#### 5.1 Add Demo Data
- Preload your CV as `demo_cv.pdf`
- Extract and save as `demo_profile.json`
- Add sample job listings `demo_jobs.json`

#### 5.2 Dockerize Both Services

Create `docker-compose.yml`:
```yaml
version: "3.8"
services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_FASTAPI_URL=http://backend:8000
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    volumes:
      - ./backend/data:/app/data
```

#### 5.3 Azure Deployment (Final Phase)
- Deploy FastAPI to Azure Container Apps
- Deploy Next.js to Azure Static Web Apps or Container Apps
- Use Azure Key Vault for secrets
- Set up custom domain

## Part 4: Files to Create/Modify

### New Files (Backend)
| File | Purpose |
|------|---------|
| `backend/main.py` | FastAPI entry point |
| `backend/requirements.txt` | Python dependencies |
| `backend/app/models/profile.py` | Pydantic profile schema |
| `backend/app/models/job.py` | Pydantic job schema |
| `backend/app/chains/cv_extraction.py` | LangChain CV parser |
| `backend/app/chains/job_matching.py` | LangChain job matcher |
| `backend/app/routers/cv.py` | CV API endpoints |
| `backend/app/routers/jobs.py` | Jobs API endpoints |
| `backend/data/demo_profile.json` | Your preloaded profile |
| `backend/data/demo_jobs.json` | Sample job listings |

### New Files (Frontend)
| File | Purpose |
|------|---------|
| `src/lib/api/fastapi-client.ts` | FastAPI client functions |
| `src/app/demo/page.tsx` | Interactive demo page |

### Modified Files
| File | Changes |
|------|---------|
| `src/app/page.tsx` | Add portfolio landing page |
| `.env.local` | Add `NEXT_PUBLIC_FASTAPI_URL` |

---

## Part 5: Learning Resources

### FastAPI
- [FastAPI Official Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [FastAPI + Pydantic Models](https://fastapi.tiangolo.com/tutorial/body/)
- [FastAPI CORS](https://fastapi.tiangolo.com/tutorial/cors/)

### LangChain (Python)
- [LangChain Python Docs](https://python.langchain.com/docs/)
- [LangChain + Anthropic](https://python.langchain.com/docs/integrations/chat/anthropic)
- [Structured Output with Pydantic](https://python.langchain.com/docs/modules/model_io/output_parsers/types/pydantic)
- [LangChain Chains Guide](https://python.langchain.com/docs/modules/chains/)

### Running Locally
```bash
# Terminal 1: FastAPI backend
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
# Access Swagger UI at http://localhost:8000/docs

# Terminal 2: Next.js frontend
npm run dev
# Access app at http://localhost:3000
```

---

## Part 6: Development Cost

### During Development (Local)
| Service | Cost |
|---------|------|
| Anthropic API | ~$0.25/1000 CV parses (Haiku) |
| Firecrawl API | Existing subscription |
| **Total** | **~$5-10/month** |

### After Azure Deployment
| Service | Cost |
|---------|------|
| First 30 days | **FREE** ($200 credit) |
| Months 2-12 | **~Free tier** |
| After 12 months | **$50-95/month** |

---

## Summary: What You'll Build

A **portfolio-worthy demo** showcasing:

1. **LangChain** - AI orchestration with chains and structured outputs
2. **FastAPI** - Professional Python API with Swagger docs
3. **Next.js** - Modern React frontend
4. **Claude API** - LLM integration for CV parsing and job matching
5. **Your CV** - Live demo data for interviewers to explore

**Demo Flow:**
1. Visitor lands on your portfolio site
2. Sees your preloaded CV/profile
3. Can trigger AI job matching in real-time
4. Can explore the API at `/docs`
5. All LangChain chains are visible and documented
