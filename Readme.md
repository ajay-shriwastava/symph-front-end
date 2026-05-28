# symph-front-end

Frontend for Symphony — Yuno's Agentic AI Orchestration Platform.

Vanilla HTML + CSS + JavaScript, served by Vite.

## Dev Commands

```bash
npm install      # first time only
npm run dev      # start Vite dev server at http://localhost:5173/
npm run build    # type-check (tsc) then bundle
npm run preview  # preview production build
```

Shut down with `q + Enter` or `Ctrl+C`.

## Source Layout

```
src/
  html/      ← application pages
  css/       ← stylesheets
  js/        ← JavaScript and TypeScript modules
  assets/    ← images and SVGs imported by JS
public/      ← static files served as-is (favicon, icons sprite)
index.html   ← entry point, redirects to src/html/agents.html
```

## Pages

| URL | File | Purpose |
|---|---|---|
| `/src/html/agents.html` | `src/html/agents.html` | Create, edit, delete agents |
| `/src/html/workflows.html` | `src/html/workflows.html` | Create, edit, delete workflows |
| `/src/html/messages.html` | `src/html/messages.html` | View and filter messages by session or agent |
| `/src/html/logs.html` | `src/html/logs.html` | View logs filtered by level, agent, or workflow |
| `/src/html/memory.html` | `src/html/memory.html` | Manage key/value memory per agent |

## Key Modules

| File | Purpose |
|---|---|
| `src/js/api.js` | Fetch-based API client for all FastAPI endpoints |
| `src/js/nav.js` | Renders the top navigation bar and toast notifications |
| `src/css/symphony.css` | App-wide theme — CSS custom properties, layout, components |

## Backend

Pages call the FastAPI backend at `http://127.0.0.1:8000`. The API base URL is set in `src/js/api.js`.

All requests include an `Authorization: Bearer <token>` header (token stored in `localStorage` under `symphony_token`; defaults to `dev-token` in development).
