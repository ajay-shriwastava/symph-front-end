import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="page">
      <div className="not-found">
        <h1 className="not-found-code">404</h1>
        <p className="not-found-message">The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn btn-primary">
          Back to Agents
        </Link>
      </div>
    </main>
  );
}
