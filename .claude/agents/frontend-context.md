# Frontend Agent Context

> This file is automatically loaded when the frontend agent starts. Keep it updated with current project state.

## Project Overview
Job Search Automation - A Next.js application for automated job searching with CV parsing.

## Tech Stack
- Next.js 16 (App Router, src/app/)
- TypeScript
- Tailwind CSS 4
- shadcn/ui components
- next-themes for dark/light mode

## Theme
- Name: Darkmatter (from tweakcn)
- Primary: Orange/amber (oklch 0.7214 0.1337 49.9802)
- Secondary: Teal/cyan
- Fonts: Geist Mono (sans), JetBrains Mono (mono)
- Default: Dark mode

## Current File Structure
```
src/
├── app/
│   ├── globals.css          # Theme variables
│   ├── layout.tsx           # Root layout with ThemeProvider + AppShell
│   ├── page.tsx             # Dashboard (placeholder)
│   ├── profile/page.tsx     # Profile (placeholder)
│   ├── jobs/page.tsx        # Jobs (placeholder)
│   └── settings/page.tsx    # Settings (placeholder)
├── components/
│   ├── layout/
│   │   ├── app-shell.tsx    # Main shell with header + sheet sidebar
│   │   └── sidebar-nav.tsx  # Navigation links
│   ├── ui/                  # shadcn components
│   │   ├── button.tsx
│   │   ├── sheet.tsx
│   │   └── navigation-menu.tsx
│   ├── theme-provider.tsx   # next-themes wrapper
│   └── theme-toggle.tsx     # Light/dark toggle
└── lib/
    └── utils.ts             # cn() utility
```

## Installed shadcn Components
- button
- sheet
- navigation-menu

## Design Decisions
- Sheet/drawer sidebar (slides from left, hidden by default)
- Hamburger menu in sticky header
- Navigation: Dashboard, Profile, Jobs, Settings
- Theme toggle at bottom of sidebar

## Pending Features
- [ ] Dashboard with stat cards
- [ ] Jobs listing with filters
- [ ] Profile/CV display
- [ ] Settings page

## shadcn/ui Rules
1. Use MCP server to install components (don't write manually)
2. Call demo tool before implementing to see correct usage
3. Apply components wherever applicable

## Recent Changes
- Initial setup with Next.js 16 + shadcn/ui
- Darkmatter theme applied
- App shell with drawer sidebar implemented
- Navigation and theme toggle working
