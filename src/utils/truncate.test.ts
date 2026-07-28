import { truncate } from "./truncate.ts";

describe("truncate", () => {
  it("returns empty string for null", () => {
    expect(truncate(null, 10)).toBe("");
  });

  it("returns empty string for empty string", () => {
    expect(truncate("", 10)).toBe("");
  });

  it("returns string unchanged when shorter than limit", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("returns string unchanged when exactly at limit", () => {
    expect(truncate("hello", 5)).toBe("hello");
  });

  it("truncates and adds ellipsis when longer than limit", () => {
    expect(truncate("hello world", 5)).toBe("hello…");
  });
});
