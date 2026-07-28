import { render, screen } from "@testing-library/react";
import LoadingRows from "./LoadingRows.tsx";

describe("LoadingRows", () => {
  it("renders default loading message", () => {
    render(
      <table>
        <tbody>
          <LoadingRows colSpan={3} />
        </tbody>
      </table>,
    );
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("renders custom message", () => {
    render(
      <table>
        <tbody>
          <LoadingRows colSpan={5} message="Fetching data…" />
        </tbody>
      </table>,
    );
    expect(screen.getByText("Fetching data…")).toBeInTheDocument();
  });

  it("sets correct colspan", () => {
    render(
      <table>
        <tbody>
          <LoadingRows colSpan={4} />
        </tbody>
      </table>,
    );
    const td = screen.getByText("Loading…");
    expect(td).toHaveAttribute("colspan", "4");
  });
});
