import { ChevronRight } from "lucide-react";
import type { CalendarItem } from "../../../utils/calendarItems";

interface ScheduleSectionProps {
  weeklyEvents: CalendarItem[];
  selectedEvents: CalendarItem[];
  onClick: () => void;
  selectedDate: Date | null;
}

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const getTimeLabel = (item: CalendarItem) => {
  const { date } = item;
  if (date.getHours() === 0 && date.getMinutes() === 0) return "종일";

  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export default function ScheduleSection({
  weeklyEvents,
  selectedEvents,
  onClick,
  selectedDate,
}: ScheduleSectionProps) {
  const today = new Date();
  const isToday = selectedDate ? isSameDay(selectedDate, today) : true;
  const displayEvents = (selectedDate ? selectedEvents : weeklyEvents).slice(
    0,
    5,
  );

  return (
    <section>
      <div className="mb-2 flex items-center gap-1">
        <button
          type="button"
          onClick={onClick}
          className="group flex flex-1 items-center gap-1 text-left text-[12px] font-medium uppercase tracking-wide text-[#71809A] hover:text-[#28303D]"
        >
          {isToday
            ? "오늘의 일정"
            : `${selectedDate!.getMonth() + 1}/${selectedDate!.getDate()} 일정`}
          <ChevronRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
        </button>
      </div>

      {displayEvents.length === 0 ? (
        <p className="px-2 py-1 text-[11px] text-[#79859A]">
          {isToday ? "오늘 일정이 없어요" : "선택한 날짜의 일정이 없어요"}
        </p>
      ) : (
        <ul className="space-y-0.5">
          {displayEvents.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-white"
            >
              <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-[#2563EB]/60" />
              <span className="min-w-0 flex-1 truncate leading-snug text-[#28303D]">
                {item.title}
              </span>
              <span className="shrink-0 text-[10px] tabular-nums text-[#79859A]">
                {getTimeLabel(item)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
