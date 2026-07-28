import React from "react";
import { NavLink } from "react-router-dom";

interface NavPage {
  to: string;
  label: string;
  icon: string;
}

const PAGES: NavPage[] = [
  { to: "/agents", label: "Agents", icon: "ti-robot" },
  { to: "/workflows", label: "Workflows", icon: "ti-hierarchy" },
  { to: "/messages", label: "Messages", icon: "ti-messages" },
  { to: "/logs", label: "Logs", icon: "ti-list-details" },
  { to: "/config", label: "Config", icon: "ti-settings" },
];

export default function Nav() {
  return (
    <nav className="topnav">
      <div className="nav-logo">
        <span className="logo-icon">S</span>
        <span className="logo-text">Symphony</span>
      </div>
      <div className="nav-links">
        {PAGES.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            <i className={`ti ${icon}`} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
