import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useEffect, useState } from "react";

function getEventDate(e: any): Date | null {
  if (!e.start) return null;

  if (e.start.dateTime?.value) {
    return new Date(Number(e.start.dateTime.value));
  }

  if (typeof e.start.dateTime === "string") {
    return new Date(e.start.dateTime);
  }

  if (e.start.date) {
    return new Date(e.start.date);
  }
  return null;
}

type EventType = "interview" | "apply" | "deadline" | "default";

function getType(summary: string): EventType {
  if (summary.includes("면접")) return "interview";
  if (summary.includes("제출")) return "apply";
  if (summary.includes("마감")) return "deadline";
  return "default";
}

function isSameDay(d1: Date, d2: Date) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function getThisWeekEvents(events: any[]) {
  const now = new Date();

  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return events.filter((e) => {
    const d = getEventDate(e);
    return d && d >= start && d < end;
  });
}

export default function CalendarBox({
  defaultEvents,
  setWeeklyEvents,
  setSelectedDate,
  setSelectedEvents,
}: {
  defaultEvents: any[];
  setDefaultEvents: (events: any[]) => void;
  setWeeklyEvents: (events: any[]) => void;
  setSelectedDate: (date: Date | null) => void;
  setSelectedEvents: (events: any[]) => void;
}) {
  const [date, setDate] = useState(new Date());

  const allEvents = [...defaultEvents].filter(Boolean);

  const weeklyEvents = getThisWeekEvents(allEvents).sort((a, b) => {
    const da = getEventDate(a);
    const db = getEventDate(b);
    if (!da || !db) return 0;
    return da.getTime() - db.getTime();
  });

  useEffect(() => {
    setWeeklyEvents(weeklyEvents);
  }, [defaultEvents]);

  const mergedEvents = [
    ...defaultEvents
      .map((e) => {
        console.log(e.summary);
        const d = getEventDate(e);
        if (!d) return null;

        return {
          id: e.id,
          date: d,
          type: getType(e.summary || ""),
          company: "",
          jobTitle: e.summary,
          category:
            getType(e.summary || "") === "interview"
              ? "면접"
              : getType(e.summary || "") === "deadline"
                ? "마감"
                : getType(e.summary || "") === "apply"
                  ? "제출"
                  : "일반",
        };
      })
      .filter((e) => e !== null),
  ];

  useEffect(() => {
    const selectedDayEvents = allEvents.filter((e) => {
      const d = getEventDate(e);
      return d && isSameDay(d, date);
    });

    setSelectedEvents(selectedDayEvents);
  }, [date, defaultEvents]);

  return (
    <div className="bg-white rounded-2xl p-2 border border-[#E2E8F0] shadow-[0px_1px_3px_0px_#00000040]">
      <Calendar
        className="w-full border-none bg-transparent"
        prev2Label={null}
        next2Label={null}
        calendarType="gregory"
        showNeighboringMonth={false}
        formatDay={(_, date) => date.getDate().toString()}
        onChange={(value) => {
          setDate(value as Date);
          setSelectedDate(value as Date);
        }}
        value={date}
        tileContent={({ date }) => {
          const hasInterview = mergedEvents.some(
            (e) => e.type === "interview" && isSameDay(e.date, date),
          );
          const hasApply = mergedEvents.some(
            (e) => e.type === "apply" && isSameDay(e.date, date),
          );
          const hasDeadline = mergedEvents.some(
            (e) => e.type === "deadline" && isSameDay(e.date, date),
          );
          const hasDefault = mergedEvents.some(
            (e) => e.type === "default" && isSameDay(e.date, date),
          );

          return (
            <div className="flex justify-center">
              {hasInterview && (
                <div className="w-1.5 h-1.5 min-w-[6px] min-h-[6px] bg-[#C082F6] rounded-full" />
              )}
              {hasApply && (
                <div className="w-1.5 h-1.5 min-w-[6px] min-h-[6px] bg-[#79AF86] rounded-full" />
              )}
              {hasDeadline && (
                <div className="w-1.5 h-1.5 min-w-[6px] min-h-[6px] bg-[#E77975] rounded-full" />
              )}
              {hasDefault && (
                <div className="w-1.5 h-1.5 min-w-[6px] min-h-[6px] bg-gray-400 rounded-full" />
              )}
            </div>
          );
        }}
      />
    </div>
  );
}
