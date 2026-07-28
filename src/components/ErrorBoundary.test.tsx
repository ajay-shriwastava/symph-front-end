import { render, screen } from "@testing-library/react";
import ErrorBoundary from "./ErrorBoundary.tsx";

function ThrowingChild() {
  throw new Error("test explosion");
}

function GoodChild() {
  return <div>all good</div>;
}

describe("ErrorBoundary", () => {
  // Suppress React's console.error for the expected error
  const originalError = console.error;
  beforeAll(() => {
    console.error = (...args: unknown[]) => {
      if (typeof args[0] === "string" && args[0].includes("test explosion")) return;
      originalError.call(console, ...args);
    };
  });
  afterAll(() => {
    console.error = originalError;
  });

  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>,
    );
    expect(screen.getByText("all good")).toBeInTheDocument();
  });

  it("renders fallback UI when child throws", () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("test explosion")).toBeInTheDocument();
    expect(screen.getByText("Back to Agents")).toBeInTheDocument();
  });
});
