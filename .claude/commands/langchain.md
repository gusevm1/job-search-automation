# LangChain Agent Command

Invoke the LangChain agent for AI chain development.

## Setup Instructions

Before working on any task:

1. **Read your agent definition:**
   Read `.claude/agents/langchain-agent.md` to understand your role and responsibilities.

2. **Read your context patterns:**
   Read `.claude/agents/langchain-context.md` for LangChain patterns and conventions.

3. **Check current state:**
   Read `.claude/handoff/langchain-handoff.md` to understand what has been implemented.

4. **Review existing code:**
   - Read `backend/app/chains/` for existing chain implementations
   - Read `backend/app/models/` for Pydantic models used in chains

## After Completing Your Task

1. **Update handoff document:**
   Update `.claude/handoff/langchain-handoff.md` with:
   - What you implemented
   - Current status of each chain
   - Any blockers or issues
   - Next steps for future work

2. **Test your chains:**
   ```python
   cd backend
   source venv/bin/activate
   python test_cv_extraction.py
   ```

## Key Files
- `backend/app/chains/cv_extraction.py` - CV parsing chain
- `backend/app/chains/job_matching.py` - Job matching chain
- `backend/app/models/profile.py` - Profile model
- `backend/app/models/job.py` - Job/Match models
