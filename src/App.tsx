import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext.tsx";
import Nav from "./components/Nav.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";

const Agents = lazy(() => import("./pages/Agents.tsx"));
const Workflows = lazy(() => import("./pages/Workflows.tsx"));
const Messages = lazy(() => import("./pages/Messages.tsx"));
const Logs = lazy(() => import("./pages/Logs.tsx"));
const AgentConfig = lazy(() => import("./pages/AgentConfig.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

function PageLoader() {
  return (
    <main className="page">
      <div className="empty-state">Loading…</div>
    </main>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Nav />
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Navigate to="/agents" replace />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/workflows" element={<Workflows />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/config" element={<AgentConfig />} />
              <Route path="/config/agents/:agentId" element={<AgentConfig />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </ToastProvider>
  );
}
