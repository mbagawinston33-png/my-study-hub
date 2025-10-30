"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarHeaderProps {
  currentDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

export default function CalendarHeader({
  currentDate,
  onPreviousMonth,
  onNextMonth
}: CalendarHeaderProps) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = monthNames[month];

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--bg)'
      }}
    >
      <button
        onClick={onPreviousMonth}
        className="btn ghost"
        style={{
          padding: '6px 8px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
        title="Previous month"
      >
        <ChevronLeft size={16} />
        Previous
      </button>

      <div
        style={{
          fontSize: '18px',
          fontWeight: '600',
          color: 'var(--text)',
          textAlign: 'center'
        }}
      >
        {monthName} {year}
      </div>

      <button
        onClick={onNextMonth}
        className="btn ghost"
        style={{
          padding: '6px 8px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
        title="Next month"
      >
        Next
        <ChevronRight size={16} />
      </button>
    </div>
  );
}