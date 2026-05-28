# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Frontend for **Symphony** — an Agentic AI Orchestration Platform. Currently a vanilla Vite + TypeScript scaffold (no framework).

## Commands

```bash
npm run dev       # Start dev server with HMR
npm run build     # Type-check (tsc) then bundle (vite build)
npm run preview   # Preview production build locally
```

There is no test runner configured yet.

## Architecture

- **Entry**: `index.html` redirects to `src/html/agents.html`
- **Pages**: HTML files live in `src/html/` — each page is self-contained with an inline `<script type="module">`
- **Scripts**: JS and TS modules live in `src/js/` — `api.js` (API client), `nav.js` (nav + toast), `main.ts` (Vite scaffold), `counter.ts`
- **Styles**: `src/css/symphony.css` (app theme), `src/css/style.css` (Vite scaffold styles)
- **Assets**: Static files in `public/` (SVG sprite at `public/icons.svg`); imported assets in `src/assets/`

### `src/` layout
```
src/
  html/      ← agents.html, workflows.html, messages.html, logs.html, memory.html
  css/       ← symphony.css, style.css
  js/        ← api.js, nav.js, main.ts, counter.ts
  assets/    ← hero.png, typescript.svg, vite.svg
```

## TypeScript Config

- `moduleResolution: "bundler"` — import paths can include `.ts` extensions
- `noEmit: true` — Vite handles bundling; `tsc` is type-check only
- Strict unused variable/parameter checks enabled (`noUnusedLocals`, `noUnusedParameters`)
- `erasableSyntaxOnly: true` — no decorators or other non-erasable TypeScript syntax
