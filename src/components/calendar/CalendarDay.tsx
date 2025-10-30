"use client";

import { CalendarDay as CalendarDayType, CalendarEvent } from "@/lib/calendar";

interface CalendarDayProps {
  day: CalendarDayType;
}

export default function CalendarDay({ day }: CalendarDayProps) {
  
  const getEventColor = (event: CalendarEvent) => {
    if (event.type === 'reminder') {
      return 'var(--brand)'; // Blue for reminders
    }

    if (event.isCompleted) {
      return 'var(--ok)'; // Green for completed
    }

    // Task priority colors
    switch (event.priority) {
      case 'high':
        return 'var(--danger)'; // Red for high priority
      case 'medium':
        return 'var(--warn)'; // Orange for medium
      case 'low':
      default:
        return 'var(--text-2)'; // Gray for low
    }
  };

  const getEventIcon = (event: CalendarEvent) => {
    // Simple visual indicators
    return <div style={{ width: '6px', height: '6px', borderRadius: '50%' }} />;
  };

  const getEventCountText = (events: CalendarEvent[]) => {
    const completedCount = events.filter(e => e.isCompleted).length;
    const totalCount = events.length;

    if (completedCount === totalCount) {
      return `${totalCount} ✓`;
    }
    return `${totalCount}`;
  };

  return (
    <div
      style={{
        minHeight: '80px',
        padding: '4px',
        border: '1px solid var(--border)',
        borderRadius: '4px',
        backgroundColor: day.isToday
          ? 'var(--brand-50)'
          : day.isCurrentMonth
            ? 'var(--bg)'
            : 'var(--bg-2)',
        color: day.isCurrentMonth ? 'var(--text)' : 'var(--text-2)',
        position: 'relative',
        transition: 'background-color 0.2s'
      }}
    >
      {/* Day number */}
      <div
        style={{
          fontSize: '12px',
          fontWeight: day.isToday ? '600' : 'normal',
          color: day.isToday ? 'var(--brand)' : 'inherit',
          marginBottom: '2px'
        }}
      >
        {day.date.getDate()}
      </div>

      {/* Events */}
      {day.events.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1px',
            alignItems: 'center',
            justifyContent: 'flex-start',
            flex: 1
          }}
        >
          {/* Show up to 3 event indicators */}
          {day.events.slice(0, 3).map((event, index) => (
            <div
              key={event.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                fontSize: '10px',
                width: '100%',
                overflow: 'hidden'
              }}
              title={`${event.type === 'task' ? 'Task' : 'Reminder'}: ${event.title}`}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: getEventColor(event),
                  flexShrink: 0
                }}
              />
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '9px',
                  opacity: event.isCompleted ? 0.6 : 1
                }}
              >
                {event.title.length > 12
                  ? event.title.substring(0, 12) + '...'
                  : event.title}
              </span>
            </div>
          ))}

          {/* Show count if more than 3 events */}
          {day.events.length > 3 && (
            <div
              style={{
                fontSize: '9px',
                color: 'var(--text-2)',
                textAlign: 'center',
                width: '100%'
              }}
            >
              +{day.events.length - 3} more
            </div>
          )}

          {/* Event count indicator */}
          {day.events.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                backgroundColor: getEventColor(day.events[0]),
                color: 'white',
                fontSize: '9px',
                fontWeight: '500',
                padding: '1px 4px',
                borderRadius: '10px',
                minWidth: '16px',
                textAlign: 'center'
              }}
            >
              {getEventCountText(day.events)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}