# Available Agents

## Frontend Agent
**Purpose**: UI implementation with shadcn/ui components
**Invoke standalone**: `claude --mcp-config .claude/utils/mcp-configs/shadcn.json`
**Context primer**: `/frontend`

## Scraper Agent
**Purpose**: Web scraping for job listings with Firecrawl
**Invoke standalone**: `claude --mcp-config .claude/utils/mcp-configs/firecrawl.json`
**Context primer**: `/scrape`

## Usage

### Within this session
Use the Task tool to delegate work to subagents. The primary agent orchestrates, subagents implement.

### Standalone invocation
Run a new Claude instance with specific MCP servers:
```bash
# Frontend work with shadcn
claude --mcp-config .claude/utils/mcp-configs/shadcn.json

# Scraping work with firecrawl
claude --mcp-config .claude/utils/mcp-configs/firecrawl.json
```

## Context Primers
Load context before work:
- `/frontend` - Frontend development guidelines
- `/scrape` - Web scraping guidelines
- `/shadCN` - shadcn/ui usage rules
