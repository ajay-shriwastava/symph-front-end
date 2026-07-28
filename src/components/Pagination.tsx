import React from "react";

interface PaginationProps {
  skip: number;
  limit: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

export default function Pagination({ skip, limit, total, onPrev, onNext }: PaginationProps) {
  const from = total === 0 ? 0 : skip + 1;
  const to = Math.min(skip + limit, total);
  return (
    <div className="pagination">
      <span className="pagination-info">
        Showing {from}–{to} of {total}
      </span>
      <div className="pagination-controls">
        <button className="btn btn-secondary btn-sm" disabled={skip === 0} onClick={onPrev}>
          Previous
        </button>
        <button
          className="btn btn-secondary btn-sm"
          disabled={skip + limit >= total}
          onClick={onNext}
        >
          Next
        </button>
      </div>
    </div>
  );
}
