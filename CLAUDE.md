# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Frontend for **Symphony** — an Agentic AI Orchestration Platform. React 19 SPA with TypeScript, built with Vite.

## Commands

```bash
npm run dev       # Start dev server with HMR
npm run build     # Bundle with Vite (includes TS transpilation)
npm run preview   # Preview production build locally
```

There is no test runner configured yet.

## Architecture

- **Entry**: `index.html` → `src/main.tsx` → `src/App.tsx`
- **Routing**: React Router v7 with client-side routing
- **State**: React Context (ToastContext) + local component state
- **API**: Centralized fetch client at `src/js/api.ts` with typed interfaces for all models
- **Styles**: `src/css/symphony.css` — CSS custom properties design system
- **Assets**: Static files in `public/` (favicon, icons sprite)

### `src/` layout
```
src/
  main.tsx                ← React entry point
  App.tsx                 ← BrowserRouter + route definitions
  components/             ← Nav.tsx, Pagination.tsx
  context/                ← ToastContext.tsx
  pages/                  ← Agents.tsx, AgentConfig.tsx, Logs.tsx, Messages.tsx, Workflows.tsx
  js/                     ← api.ts (API client + all TypeScript interfaces)
  css/                    ← symphony.css (app theme)
```

### Routes
| Path | Page | Purpose |
|------|------|---------|
| `/agents` | Agents | CRUD agents with expandable detail rows |
| `/workflows` | Workflows | Visual DAG builder, run execution via WebSocket, templates |
| `/messages` | Messages | Message history + agent handoffs tab |
| `/logs` | Logs | Filterable log viewer |
| `/config` | AgentConfig | Per-agent config: memory, schedules, skills, interaction rules, guardrails |

### API Layer (`src/js/api.ts`)
All backend communication goes through `apiFetch<T>()` — a generic typed wrapper that handles auth headers, error extraction, and JSON parsing. Every endpoint function returns a properly typed `Promise<T>`. Model interfaces (`Agent`, `Workflow`, `GraphNode`, `Message`, `LogEntry`, etc.) are exported from this file.

## TypeScript Config

- `moduleResolution: "bundler"` — import paths can include `.ts`/`.tsx` extensions
- `noEmit: true` — Vite handles bundling; `tsc` is type-check only
- Strict unused variable/parameter checks enabled (`noUnusedLocals`, `noUnusedParameters`)
- `verbatimModuleSyntax: true` — use `import type` for type-only imports
- `erasableSyntaxOnly: true` — no decorators or other non-erasable TypeScript syntax
