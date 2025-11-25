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
- framer-motion (animations)

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
│   ├── page.tsx             # Dashboard with hero and features
│   ├── profile/page.tsx     # Profile (placeholder)
│   ├── jobs/page.tsx        # Jobs (placeholder)
│   └── settings/page.tsx    # Settings (placeholder)
├── components/
│   ├── dashboard/
│   │   └── hero-section.tsx # Hero with animated stock image
│   ├── layout/
│   │   ├── app-shell.tsx    # Main shell with header + sheet sidebar
│   │   └── sidebar-nav.tsx  # Navigation links
│   ├── ui/                  # shadcn components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── sheet.tsx
│   │   └── navigation-menu.tsx
│   ├── theme-provider.tsx   # next-themes wrapper
│   └── theme-toggle.tsx     # Light/dark toggle
└── lib/
    └── utils.ts             # cn() utility
```

## Installed shadcn Components
- button
- card
- sheet
- navigation-menu

## Design Decisions
- Sheet/drawer sidebar (slides from left, hidden by default)
- Hamburger menu in sticky header
- Navigation: Dashboard, Profile, Jobs, Settings
- Theme toggle at bottom of sidebar

## Completed Features
- [x] Dashboard with animated hero section
- [x] Hero section with Unsplash stock image
- [x] Framer Motion animations with reduced-motion support
- [x] Features overview cards

## Pending Features
- [ ] Jobs listing with filters
- [ ] Profile/CV display
- [ ] Settings page
- [ ] CV upload functionality

## shadcn/ui Rules
1. Use MCP server to install components (don't write manually)
2. Call demo tool before implementing to see correct usage
3. Apply components wherever applicable

## Recent Changes
- Added animated hero section to dashboard with Unsplash stock image
- Implemented Framer Motion animations with accessibility support
- Created hero-section.tsx component with staggered entrance animations
- Added stat cards with hover effects and backdrop blur
- Redesigned dashboard page with features section
- Installed framer-motion and card component

## Animation Implementation
- **Library**: Framer Motion
- **Approach**: Staggered entrance animations with fade/slide effects
- **Features**:
  - Image fade-in with scale effect (1.1 to 1.0)
  - Sequential text animations (headline, subheadline, CTA buttons)
  - Stat cards with hover lift effect
  - Gradient overlays for text readability
  - Full accessibility with prefers-reduced-motion support
- **Stock Image**: https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d (person at laptop)
- **Design Pattern**: Full-width background image with dark gradient overlays, content overlaid with glass-morphism cards
