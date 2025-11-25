# Frontend Context Primer

You are working on the frontend of JobSearchAutomation, a Next.js application with shadcn/ui components.

## Tech Stack
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components

## Project Structure
```
src/
├── app/           # Next.js App Router
├── components/
│   ├── ui/        # shadcn components (auto-installed)
│   ├── profile/   # CV/profile components
│   └── jobs/      # Job listing components
├── lib/           # Utilities
└── types/         # TypeScript definitions
```

## shadcn/ui Usage Rules
1. Use the MCP server to list, demo, and install components
2. Call the demo tool BEFORE implementing to see correct usage
3. Install components via MCP, don't write them manually
4. Apply shadcn components wherever they fit

## Design Guidelines
- Clean, professional aesthetic
- Responsive design (mobile-first)
- Accessible (WCAG 2.1 AA)
- Dark mode support via shadcn theming
