# Development Workflow

## Branch Strategy

### Creating a Feature Branch
Before implementing a new feature:
```bash
git checkout -b feature/<feature-name>
```

Examples:
- `feature/dashboard-cards`
- `feature/jobs-listing`
- `feature/profile-page`
- `feature/cv-parser`

### Branch Naming
- `feature/<name>` - New features
- `fix/<name>` - Bug fixes
- `refactor/<name>` - Code refactoring
- `docs/<name>` - Documentation updates

### Workflow
1. Create feature branch from main
2. Implement feature (use subagents as needed)
3. Update context files (frontend-context.md, etc.)
4. Commit changes
5. Push and create PR
6. Merge to main after review

## Subagent Workflow

### Before delegating to frontend agent:
1. Create feature branch
2. Define clear task scope
3. Include instruction to read frontend-context.md

### After frontend agent completes:
1. Verify changes work
2. Ensure frontend-context.md was updated
3. Commit and push

## Context Management

### Files to keep updated:
- `.claude/agents/frontend-context.md` - Frontend state
- `CLAUDE.md` - Project overview (keep minimal)

### After each feature:
Update the relevant context file with:
- New files created
- Components installed
- Design decisions
- Any gotchas or notes
