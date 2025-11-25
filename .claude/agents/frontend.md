# Frontend Subagent

## Purpose
Handle all UI implementation using shadcn/ui components for the JobSearchAutomation project.

## Invocation
```bash
claude --mcp-config .claude/utils/mcp-configs/shadcn.json --strict-mcp-config
```

## Scope
- Component creation and styling
- Page layouts
- shadcn/ui component installation and usage
- Tailwind CSS styling
- Next.js App Router pages

## Rules
1. **Always use shadcn MCP server** for component operations
2. **Before implementing**: Call the demo tool to see how components are used
3. **Installing components**: Use the MCP server, never write component files manually
4. **Apply components** wherever applicable during planning and implementation

## Context Primers
Load the frontend context primer before starting work:
```
/frontend
```

## Output
- Write code to `src/` directory
- Log session summary to `.claude/agents/context_bundles/`

## shadcn/ui Workflow
1. List available components: `shadcn_list_components`
2. Get component demo/code: `shadcn_get_component`
3. Install to project: `shadcn_add_component`
4. Implement using the installed component
