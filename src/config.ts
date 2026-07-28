// ── Pagination ───────────────────────────────────────────────────────────────
export const PAGE_SIZE = 20;
export const AGENT_DROPDOWN_LIMIT = 200;

// ── Toast ────────────────────────────────────────────────────────────────────
export const TOAST_DURATION_MS = 3000;

// ── Auth ─────────────────────────────────────────────────────────────────────
export const AUTH_TOKEN_KEY = "symphony_token";
export const DEV_TOKEN = "dev-token";

// ── Models ───────────────────────────────────────────────────────────────────
export const MODEL_OPTIONS = [
  "claude-sonnet-4-6",
  "claude-opus-4-6",
  "claude-haiku-4-5-20251001",
  "gpt-4o",
  "gpt-4o-mini",
  "gemini-1.5-pro",
];

// ── Channels ─────────────────────────────────────────────────────────────────
export const CHANNELS = ["whatsapp", "slack", "telegram", "email"];
export const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  slack: "Slack",
  telegram: "Telegram",
  email: "Email",
};
