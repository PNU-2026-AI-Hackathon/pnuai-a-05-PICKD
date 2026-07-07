import { type CalendarEvent, type EventType } from "../../../hooks/useMainCalendar";

interface WeeklyCalendarProps {
  date: Date;
  filteredEvents: CalendarEvent[];
  getEventColor: (type: EventType) => string;
  onDateChange: (date: Date) => void;
}

function isSameDay(d1: Date, d2: Date) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
}

function getDotColor(date: Date, events: CalendarEvent[]): string | null {
  const types = events.filter((ev) => isSameDay(ev.date, date)).map((ev) => ev.type);
  if (types.includes("deadline")) return "#EF4444";
  if (types.includes("interview")) return "#C082F6";
  if (types.includes("apply")) return "#10B981";
  if (types.includes("todo")) return "#3B82F6";
  if (types.length > 0) return "#94A3B8";
  return null;
}

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

const WeeklyCalendar = ({
  date,
  filteredEvents,
  getEventColor,
  onDateChange,
}: WeeklyCalendarProps) => {
  const weekStart = getWeekStart(date);
  const weekDays = getWeekDays(weekStart);
  const today = new Date();

  return (
    <div className="weekly-grid">
      {/* Weekday header */}
      <div className="weekly-header-row">
        {weekDays.map((_, i) => {
          const isSunday = i === 0;
          const isSaturday = i === 6;
          return (
            <div key={i} className="weekly-header-cell">
              <span
                className="weekly-weekday-label"
                style={{
                  color: isSunday ? "#F87171" : isSaturday ? "#60A5FA" : "#9CA3AF",
                }}
              >
                {WEEKDAY_LABELS[i]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Day columns */}
      <div className="weekly-columns">
        {weekDays.map((day, i) => {
          const dayEvents = filteredEvents.filter((ev) => isSameDay(ev.date, day));
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, date);
          const isSunday = i === 0;
          const isSaturday = i === 6;
          const dotColor = getDotColor(day, filteredEvents);

          return (
            <div
              key={i}
              className={`weekly-day-col${isSelected ? " weekly-day-col--selected" : ""}`}
              onClick={() => onDateChange(day)}
            >
              {/* Date number row */}
              <div className="weekly-date-header">
                <div
                  className={`weekly-date-number${isToday ? " weekly-date-number--today" : ""}`}
                  style={
                    !isToday
                      ? {
                          color: isSunday
                            ? "#F87171"
                            : isSaturday
                            ? "#60A5FA"
                            : "#111827",
                        }
                      : undefined
                  }
                >
                  {day.getDate()}
                </div>
                {dotColor && !isToday && (
                  <span className="weekly-dot" style={{ backgroundColor: dotColor }} />
                )}
              </div>

              {/* Events */}
              <div className="weekly-events">
                {dayEvents.map((ev, j) => (
                  <div
                    key={j}
                    className={`weekly-event-badge ${getEventColor(ev.type)}`}
                  >
                    {ev.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyCalendar;
