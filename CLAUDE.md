# CLAUDE.md - Project Instructions

## Project Overview

Personal portfolio and blog website for Earl St Sauver. Features an interactive Mapbox map experience, project showcases, and a markdown-based blog system. Built with a W.E.B. Du Bois-inspired design aesthetic.

## Quick Start

```bash
npm install
npm run dev      # Starts dev server on localhost:8080
npm run build    # Production build
npm run lint     # Run ESLint
```

## Tech Stack

- **Framework**: React 18 + TypeScript (loose mode)
- **Build**: Vite 5.4 with SWC
- **Styling**: Tailwind CSS with Du Bois design system
- **Components**: shadcn-ui (Radix UI primitives)
- **Routing**: React Router DOM v6
- **Maps**: Mapbox GL
- **Content**: Markdown with YAML frontmatter

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn-ui primitives
│   ├── blog/           # Blog-specific components
│   ├── AmsterdamMap.tsx # Interactive map
│   └── Navigation.tsx   # Main navigation with dialogs
├── pages/              # Route page components
├── content/blog/       # Markdown blog posts
├── lib/                # Utilities (blog.ts, utils.ts)
├── hooks/              # Custom React hooks
└── styles/             # CSS and Mapbox styles
```

## Code Conventions

- **TypeScript**: Loose mode (noImplicitAny: false). Path aliases use `@/` for `src/`
- **Components**: Functional with hooks, PascalCase filenames
- **Styling**: Tailwind utility classes, use `cn()` from `@/lib/utils` for conditional classes
- **State**: URL-based for dialogs, React Query for async data

## Design System (Du Bois)

Sharp corners, 2px black borders, bold color blocks. Key classes:
- `dubois-panel` - Bordered panel with offset shadow
- `glass-panel` - Semi-transparent overlay

Primary colors: Carmine (#C41E3A), Gold (#DAA520), Prussian Blue (#1E3A5F)

See `BRAND_GUIDELINES.md` for full design documentation.

## Adding Blog Posts

Create a new `.md` file in `src/content/blog/` with YAML frontmatter:

```markdown
---
title: "Post Title"
date: "YYYY-MM-DD"
excerpt: "Brief description"
author: "Author Name"
tags: ["tag1", "tag2"]
---

Post content in markdown...
```

Then import and add to the posts array in `src/lib/blog.ts`.

## Key Files

- `src/App.tsx` - Root component with routing
- `src/components/Navigation.tsx` - Main nav, controls dialogs via URL
- `src/lib/blog.ts` - Blog post parsing and loading
- `tailwind.config.ts` - Du Bois color palette and fonts
- `public/_redirects` - Cloudflare SPA routing config

## Deployment

Deployed to Cloudflare Pages. Build output goes to `dist/` directory.
