# symph-front-end

Frontend for Symphony — an Agentic AI Orchestration Platform.

React 19 + TypeScript SPA, built with Vite and served by nginx in Docker.

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
npm run build    # bundle with Vite
npm run preview  # preview the production build
npm run lint     # run ESLint
npm run format   # run Prettier
```

Shut down with `q + Enter` or `Ctrl+C`.

### Environment Variables

Copy `.env.example` to `.env` and adjust as needed:

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_BASE` | `""` (empty) | Backend API base URL. Both HTTP API calls and WebSocket connections are derived from this. |

**Docker / production:** leave `VITE_API_BASE` empty — nginx proxies `/api/` and `/ws/` to the backend on the same origin.

**Local dev without Docker:**

```bash
echo 'VITE_API_BASE=http://localhost:8000' > .env
npm run dev
```

The WebSocket URL is derived automatically (`http` → `ws`, `https` → `wss`). When `VITE_API_BASE` is empty, WebSocket falls back to the current page origin.

> **API proxy in local dev:** `vite.config.js` also proxies `/api` requests to `http://localhost:8000`, so local dev works without setting `VITE_API_BASE` too. The env var is mainly useful when you need to point at a different backend (e.g. staging).

---

## Source Layout

```
src/
  main.tsx                ← React entry point
  App.tsx                 ← BrowserRouter + route definitions
  components/             ← Nav.tsx, Pagination.tsx
  context/                ← ToastContext.tsx
  pages/                  ← Agents, AgentConfig, Logs, Messages, Workflows, NotFound
  js/                     ← api.ts (API client, TypeScript interfaces, WS_BASE)
  utils/                  ← truncate.ts (shared helpers)
  css/                    ← symphony.css (app theme)
public/                   ← static files served as-is (favicon, icons sprite)
index.html                ← entry point, loads src/main.tsx
.env.example              ← documents VITE_API_BASE env var
Dockerfile                ← multi-stage build: node (vite build) → nginx:alpine
nginx.conf                ← nginx config: serves dist/, proxies /api/ and /ws/ to backend
```

---

## Pages

| Route | Component | Purpose |
|-------|-----------|---------|
| `/agents` | `Agents.tsx` | Create, edit, delete agents with expandable detail rows |
| `/workflows` | `Workflows.tsx` | Visual workflow builder, run history, templates |
| `/messages` | `Messages.tsx` | View messages by session or agent; Agent Handoffs tab |
| `/logs` | `Logs.tsx` | View logs filtered by level, agent, or workflow |
| `/config` | `AgentConfig.tsx` | Per-agent config: memory, schedules, skills, interaction rules, guardrails |
| `*` | `NotFound.tsx` | 404 catch-all with link back to agents |

---

## Key Modules

| File | Purpose |
|------|---------|
| `src/js/api.ts` | Typed fetch-based API client for all FastAPI endpoints; exports model interfaces and `WS_BASE` |
| `src/utils/truncate.ts` | Shared string truncation helper |
| `src/context/ToastContext.tsx` | Toast notification system via React Context |
| `src/components/Nav.tsx` | Top navigation bar with active route highlighting |
| `src/components/Pagination.tsx` | Reusable pagination controls |
| `src/css/symphony.css` | App-wide theme — CSS custom properties, layout, components |

---

## Workflow Builder

The workflows page includes a full visual drag-and-drop workflow builder:

- **Node types**: Start, Agent, Condition, Tool, End
- **Edges**: drag from output port to input port to connect nodes
- **Condition nodes**: configurable true/false labels with branching edges
- **Feedback loops**: supported up to `max_loops` iterations (default 20, configurable per workflow)
- **Run panel**: live WebSocket event stream showing node progress in real time
- **Run history**: collapsible table of past runs with status badges and timestamps
- **Templates**: one-click instantiation of pre-built workflows (Data Ingestion Pipeline, SRE Job Summary)
