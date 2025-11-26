# Frontend Agent Context

> This file is automatically loaded when the frontend agent starts. Keep it updated with current project state.

## Project Overview
Jobflow - A Next.js application for automated job searching with CV parsing.

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
│   ├── layout.tsx           # Root layout with ThemeProvider + AppShell + icons
│   ├── page.tsx             # Home/landing page with workflow explanation
│   ├── profile/page.tsx     # Profile (placeholder)
│   ├── jobs/page.tsx        # Jobs (placeholder)
│   └── settings/page.tsx    # Settings (placeholder)
├── components/
│   ├── layout/
│   │   ├── app-shell.tsx    # Main shell with header + sheet sidebar
│   │   └── sidebar-nav.tsx  # Navigation links with logo
│   ├── ui/                  # shadcn components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── sheet.tsx
│   │   └── navigation-menu.tsx
│   ├── theme-provider.tsx   # next-themes wrapper
│   └── theme-toggle.tsx     # Light/dark toggle
└── lib/
    └── utils.ts             # cn() utility

public/
├── favicon.svg             # Browser tab icon (32x32)
├── logo.svg                # Inline logo usage (32x32)
├── icon-192.svg            # PWA icon (192x192)
├── icon-512.svg            # PWA icon (512x512)
├── apple-touch-icon.svg    # iOS home screen (180x180)
└── site.webmanifest        # PWA manifest
```

## Installed shadcn Components
- button
- card
- sheet
- navigation-menu

## Design Decisions
- Sheet/drawer sidebar (slides from left, hidden by default)
- Hamburger menu in sticky header
- Navigation: Home, Profile, Jobs, Settings
- Theme toggle at top of sidebar
- Logo displayed in sidebar header

## Completed Features
- [x] Home/landing page with workflow explanation
- [x] Hero section with Unsplash stock image and logo
- [x] Demo project disclaimer card
- [x] 4-step workflow cards (Upload CV, AI Processing, Smart Scraping, Match & Score)
- [x] Key features section
- [x] Tech stack badges
- [x] Framer Motion animations with reduced-motion support
- [x] Website icons (favicon, PWA icons, apple-touch-icon)

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
- **Redesigned home page as landing page**
  - Renamed "Dashboard" to "Home" in navigation
  - Added logo to hero section and sidebar
  - Added demo project disclaimer with API key requirements
  - Added 4-step workflow explanation (Upload CV -> AI Processing -> Smart Scraping -> Match & Score)
  - Added key features section (CV Analysis, Multi-Board Search, Intelligent Matching)
  - Added tech stack badges section
  - Removed separate hero-section.tsx component (merged into page.tsx)
- **Added website icons and PWA support**
  - Created favicon.svg, logo.svg (briefcase with upward arrow - job search theme)
  - Created icon-192.svg, icon-512.svg for PWA manifest
  - Created apple-touch-icon.svg for iOS
  - Added site.webmanifest with PWA configuration
  - Updated layout.tsx with icon metadata and viewport export
  - Icon design: Dark grey briefcase (#2a2a2a) with orange outline/arrow (#ea580c)

## Icon Design
- **Concept**: Briefcase with upward arrow (job search + career progression)
- **Colors**: Dark grey fill (#2a2a2a), orange outline/arrow (#ea580c)
- **Background**: Dark (#1a1a1a) for PWA icons
- **Sizes**: 32x32 (favicon/logo), 180x180 (apple), 192x192 & 512x512 (PWA)

## Animation Implementation
- **Library**: Framer Motion
- **Approach**: Staggered entrance animations with fade/slide effects
- **Features**:
  - Section-by-section staggered animations
  - Sequential fade + slide up for each section
  - Full accessibility with prefers-reduced-motion support
- **Stock Image**: https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d (person at laptop)
- **Design Pattern**: Full-width background image with dark gradient overlays

## Button Animations
- **Approach**: CSS-based (Tailwind utility classes)
- **Hover Effects**:
  - Subtle scale up (1.03x) with 150ms ease-out transition
  - Color transition to lighter shade (90% opacity)
  - Primary glow: 0_4px_12px with primary color at 15% opacity (25% in dark mode)
  - Outline variant: Enhanced shadow-md
  - Ghost variant: No glow (background color only)
  - Link variant: No scale (preserves underline alignment)
- **Active/Click Effects**:
  - Scale down to 0.97x
  - Quick 100ms transition for snappy feedback
- **Accessibility**:
  - Respects prefers-reduced-motion (disables scale transforms)
  - All animations disabled when motion-reduce is active
- **Applied To**: All button variants (default, destructive, outline, secondary, ghost, link)

## Header/App Shell
- App name: "Jobflow" (centered in header)
- Header height: h-16 (mobile), h-20 (desktop)
- Hamburger menu: h-14 w-14 button, h-9 w-9 icon
- Title animation: fadeInDown on page load
- Menu onboarding: heartbeat animation on first visit
- Theme toggle: moved to top of sidebar
- Logo: Displayed next to "Jobflow" text in sidebar

## Custom CSS Animations (globals.css)
- `animate-heartbeat` - Pulsing scale 1.0 -> 1.3 -> 1.0
- `animate-fade-in-down` - Fade + translate from -100% Y

## Build Verification (REQUIRED)
Always run before completing work:
```bash
npm run build
```
Fix any TypeScript or build errors before marking task complete.
