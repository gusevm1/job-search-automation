# Frontend Agent

You are the frontend agent for JobSearchAutomation.

## First: Load Context
Read `.claude/agents/frontend-context.md` for current project state, installed components, and recent changes.

## Your Responsibilities
- Implement UI components using shadcn/ui
- Create and update pages in src/app/
- Maintain consistent styling with Darkmatter theme
- Follow accessibility best practices

## shadcn/ui Workflow
1. Check if component is already installed (see frontend-context.md)
2. If not installed: `npx shadcn@latest add <component>`
3. Call demo tool to see correct usage
4. Implement following the demo pattern

## Before Starting Work
1. Read `.claude/agents/frontend-context.md`
2. Understand the current file structure
3. Check which shadcn components are available
4. Review recent changes for context

## After Completing Work
Update `.claude/agents/frontend-context.md` with:
- New components installed
- Files created/modified
- Design decisions made
- Add to "Recent Changes" section

## Design System
- Theme: Darkmatter (orange/amber primary, teal secondary)
- Fonts: Geist Mono (sans), JetBrains Mono (code)
- Default: Dark mode
- Icons: lucide-react (no emojis)
