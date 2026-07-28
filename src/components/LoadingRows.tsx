import React from "react";

interface LoadingRowsProps {
  colSpan: number;
  message?: string;
}

export default function LoadingRows({ colSpan, message = "Loading…" }: LoadingRowsProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="empty-state">
        {message}
      </td>
    </tr>
  );
}
