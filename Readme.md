# symph-front-end

Frontend for Symphony — an Agentic AI Orchestration Platform.

Vanilla HTML + CSS + JavaScript, served by Vite in development and nginx in Docker.

---

## Quick Start — Docker

The frontend is built and served automatically as part of the Docker Compose stack in `symph-back-end`:

```bash
cd ../symph-back-end
docker compose up --build
```

Frontend available at: **http://localhost**

---

## Local Dev

```bash
npm install      # first time only
npm run dev      # start Vite dev server at http://localhost:5173/
npm run build    # type-check (tsc) then bundle
npm run preview  # preview the production build
```

Shut down with `q + Enter` or `Ctrl+C`.

> **API URL in local dev:** `src/js/api.js` sets `BASE_URL = ""` (relative), so the browser sends API calls to the same host. When running locally without Docker, point directly to the backend by temporarily setting `BASE_URL = "http://localhost:8000"` in `api.js`. In Docker, nginx handles the proxy transparently.

---

## Source Layout

```
src/
  html/      ← application pages
  css/       ← stylesheets
  js/        ← JavaScript and TypeScript modules
  assets/    ← images and SVGs imported by JS
public/      ← static files served as-is (favicon, icons sprite)
index.html   ← entry point, redirects to src/html/agents.html
Dockerfile   ← multi-stage build: node (tsc + vite build) → nginx:alpine
nginx.conf   ← nginx config: serves dist/, proxies /api/ and /ws/ to backend
```

---

## Pages

| URL | File | Purpose |
|---|---|---|
| `/src/html/agents.html` | `src/html/agents.html` | Create, edit, delete agents |
| `/src/html/workflows.html` | `src/html/workflows.html` | Visual workflow builder, run history, templates |
| `/src/html/messages.html` | `src/html/messages.html` | View messages by session or agent; Agent Handoffs tab |
| `/src/html/logs.html` | `src/html/logs.html` | View logs filtered by level, agent, or workflow |
| `/src/html/memory.html` | `src/html/memory.html` | Agent Configuration: memory, schedules, skills, interaction rules, guardrails, channels |

---

## Key Modules

| File | Purpose |
|---|---|
| `src/js/api.js` | Fetch-based API client for all FastAPI endpoints |
| `src/js/nav.js` | Renders the top navigation bar and toast notifications |
| `src/css/symphony.css` | App-wide theme — CSS custom properties, layout, components |

---

## Workflow Builder

The workflows page includes a full visual drag-and-drop workflow builder:

- **Node types**: Start, Agent, Condition, End
- **Edges**: drag from output port to input port to connect nodes
- **Condition nodes**: configurable true/false labels with branching edges
- **Feedback loops**: supported up to `max_loops` iterations (default 20, configurable per workflow)
- **Run panel**: live WebSocket event stream showing node progress in real time
- **Run history**: collapsible table of past runs with status badges and timestamps
- **Templates**: one-click instantiation of pre-built workflows (Data Ingestion Pipeline, SRE Job Summary)
