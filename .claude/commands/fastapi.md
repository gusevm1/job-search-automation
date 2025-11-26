# FastAPI Agent Command

Invoke the FastAPI agent for backend development.

## Setup Instructions

Before working on any task:

1. **Read your agent definition:**
   Read `.claude/agents/fastapi-agent.md` to understand your role and responsibilities.

2. **Read your context patterns:**
   Read `.claude/agents/fastapi-context.md` for FastAPI patterns and conventions.

3. **Check current state:**
   Read `.claude/handoff/fastapi-handoff.md` to understand what has been implemented.

4. **Review existing code:**
   Explore `backend/` directory to understand the current implementation.

## After Completing Your Task

1. **Update handoff document:**
   Update `.claude/handoff/fastapi-handoff.md` with:
   - What you implemented
   - Current status of each component
   - Any blockers or issues
   - Next steps for future work

2. **Test your changes:**
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn main:app --reload --port 8000
   ```
   Then test via http://localhost:8000/docs

## Key Files
- `backend/main.py` - FastAPI app
- `backend/app/models/` - Pydantic schemas
- `backend/app/routers/` - API endpoints
- `backend/app/db/` - Database layer
