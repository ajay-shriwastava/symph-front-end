import { render, screen } from "@testing-library/react";
import Pagination from "./Pagination.tsx";

describe("Pagination", () => {
  it("shows correct range text", () => {
    render(
      <Pagination skip={0} limit={20} total={55} onPrev={() => {}} onNext={() => {}} />,
    );
    expect(screen.getByText("Showing 1–20 of 55")).toBeInTheDocument();
  });

  it("shows 0–0 when total is 0", () => {
    render(
      <Pagination skip={0} limit={20} total={0} onPrev={() => {}} onNext={() => {}} />,
    );
    expect(screen.getByText("Showing 0–0 of 0")).toBeInTheDocument();
  });

  it("disables Previous on first page", () => {
    render(
      <Pagination skip={0} limit={20} total={55} onPrev={() => {}} onNext={() => {}} />,
    );
    expect(screen.getByText("Previous")).toBeDisabled();
    expect(screen.getByText("Next")).toBeEnabled();
  });

  it("disables Next on last page", () => {
    render(
      <Pagination skip={40} limit={20} total={55} onPrev={() => {}} onNext={() => {}} />,
    );
    expect(screen.getByText("Previous")).toBeEnabled();
    expect(screen.getByText("Next")).toBeDisabled();
  });
});
