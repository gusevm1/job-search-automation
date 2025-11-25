# Frontend Subagent

## Purpose
Handle all UI implementation using shadcn/ui components for the JobSearchAutomation project.

## Invocation

### As Task subagent (within session)
Use Task tool with detailed prompt. Include instruction to read context first.

### Standalone (separate terminal)
```bash
claude --mcp-config .claude/utils/mcp-configs/shadcn.json
```

## Required First Step
**Always read `.claude/agents/frontend-context.md` before starting work.**

This file contains:
- Current project state and file structure
- Installed shadcn components
- Design decisions and theme info
- Recent changes for context

## Scope
- Component creation and styling
- Page layouts (src/app/)
- shadcn/ui component installation and usage
- Tailwind CSS styling
- Accessibility (WCAG 2.1 AA)

## Rules
1. Read frontend-context.md first
2. Use shadcn MCP server for component operations
3. Call demo tool before implementing
4. Install components via MCP, never write manually
5. Use lucide-react icons, no emojis
6. Update frontend-context.md after completing work

## Output
- Write code to `src/` directory
- Update `.claude/agents/frontend-context.md` with changes
