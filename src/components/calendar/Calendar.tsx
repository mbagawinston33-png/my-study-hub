"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import CalendarHeader from "./CalendarHeader";
import CalendarDay from "./CalendarDay";
import { getCalendarData, CalendarDay as CalendarDayType } from "@/lib/calendar";
import { RefreshCw } from "lucide-react";

interface CalendarProps {
  userId: string;
}

export default function Calendar({ userId }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDayType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadCalendarData = async (date: Date) => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const data = await getCalendarData(userId, date);
      setCalendarDays(data);
    } catch (error) {
// Set empty calendar days on error
      const { getCalendarDays } = await import('@/lib/calendar');
      setCalendarDays(getCalendarDays(date));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarData(currentDate);
  }, [userId, currentDate]);

  const handlePreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <CalendarHeader
        currentDate={currentDate}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
      />

      {isLoading ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            color: 'var(--text-2)',
            flex: 1
          }}
        >
          <RefreshCw size={24} className="animate-spin" style={{ marginBottom: '12px' }} />
          <div>Loading calendar...</div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Weekday headers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '1px',
              backgroundColor: 'var(--border)',
              padding: '8px 0'
            }}
          >
            {weekdayLabels.map((day, index) => (
              <div
                key={day}
                style={{
                  textAlign: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: index === 0 || index === 6 ? 'var(--text-2)' : 'var(--text)',
                  backgroundColor: 'var(--bg)',
                  padding: '4px'
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '1px',
              backgroundColor: 'var(--border)',
              padding: '8px',
              flex: 1
            }}
          >
            {calendarDays.map((day, index) => (
              <CalendarDay key={`${day.date.toISOString()}-${index}`} day={day} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}