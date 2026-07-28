import {
  PAGE_SIZE,
  AGENT_DROPDOWN_LIMIT,
  TOAST_DURATION_MS,
  AUTH_TOKEN_KEY,
  MODEL_OPTIONS,
  CHANNELS,
  CHANNEL_LABELS,
} from "./config.ts";

describe("config constants", () => {
  it("PAGE_SIZE is a positive number", () => {
    expect(PAGE_SIZE).toBeGreaterThan(0);
  });

  it("AGENT_DROPDOWN_LIMIT is larger than PAGE_SIZE", () => {
    expect(AGENT_DROPDOWN_LIMIT).toBeGreaterThan(PAGE_SIZE);
  });

  it("TOAST_DURATION_MS is a reasonable duration", () => {
    expect(TOAST_DURATION_MS).toBeGreaterThanOrEqual(1000);
    expect(TOAST_DURATION_MS).toBeLessThanOrEqual(10000);
  });

  it("AUTH_TOKEN_KEY is a non-empty string", () => {
    expect(AUTH_TOKEN_KEY.length).toBeGreaterThan(0);
  });

  it("MODEL_OPTIONS contains at least one model", () => {
    expect(MODEL_OPTIONS.length).toBeGreaterThan(0);
  });

  it("every CHANNEL has a label", () => {
    for (const ch of CHANNELS) {
      expect(CHANNEL_LABELS[ch]).toBeDefined();
    }
  });
});
