# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

JobSearchAutomation - Job search website with CV parsing and automated job scraping.

## Architecture

- **Primary agent**: Runs without MCP servers (clean context)
- **Subagents**: Load specific MCPs via `--mcp-config` flag

## Subagents

| Agent | Config | Purpose |
|-------|--------|---------|
| Frontend | `.claude/utils/mcp-configs/shadcn.json` | UI with shadcn/ui |
| Scraper | `.claude/utils/mcp-configs/firecrawl.json` | Job scraping |

## Context Primers

Use slash commands to load context before work:
- `/frontend` - Frontend development context
- `/scrape` - Web scraping context
- `/shadCN` - shadcn/ui usage rules

## Session Logs

Context bundles are written to `.claude/agents/context_bundles/`
