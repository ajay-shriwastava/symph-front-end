export function renderNav(activePage) {
  const pages = [
    { href: "agents.html", label: "Agents", icon: "ti-robot" },
    { href: "workflows.html", label: "Workflows", icon: "ti-hierarchy" },
    { href: "messages.html", label: "Messages", icon: "ti-messages" },
    { href: "logs.html", label: "Logs", icon: "ti-list-details" },
    { href: "memory.html", label: "Config", icon: "ti-settings" },
  ];

  const links = pages
    .map(({ href, label, icon }) => {
      const active = href === activePage ? "active" : "";
      return `<a href="${href}" class="nav-link ${active}"><i class="ti ${icon}"></i>${label}</a>`;
    })
    .join("");

  return `
    <nav class="topnav">
      <div class="nav-logo">
        <span class="logo-icon">S</span>
        <span class="logo-text">Symphony</span>
      </div>
      <div class="nav-links">${links}</div>
    </nav>`;
}

export function showToast(message, type = "success") {
  const existing = document.getElementById("symph-toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.id = "symph-toast";
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}