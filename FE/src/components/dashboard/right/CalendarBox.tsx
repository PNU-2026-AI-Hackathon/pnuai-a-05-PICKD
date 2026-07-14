import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { HelpCircle, X } from "lucide-react";
import type { Application } from "../../../types/application";
import type { Todo } from "../../../types/todo";
import { getGoogleEventDate } from "../../../utils/date";
import {
  buildApplicationCalendarItems,
  buildGoogleCalendarItems,
  buildTodoCalendarItems,
  isSameLocalDay,
  mergeCalendarItems,
  type CalendarItem,
  type CalendarItemType,
} from "../../../utils/calendarItems";

const DAY_POPOVER_WIDTH = 326;
const VIEWPORT_PADDING = 10;

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

  return events.filter((event) => {
    const date = getGoogleEventDate(event);
    return date && date >= start && date < end;
  });
}

const ITEM_TYPE_META: Record<
  CalendarItemType,
  { dot: string; badge: string; label: string }
> = {
  deadline: {
    dot: "bg-[#D24545]",
    badge: "bg-[#FEF2F2] text-[#D24545]",
    label: "마감",
  },
  apply: {
    dot: "bg-[#6D5CE7]",
    badge: "bg-[#F1EEFF] text-[#6655D9]",
    label: "문서",
  },
  announcement: {
    dot: "bg-[#6D5CE7]",
    badge: "bg-[#F1EEFF] text-[#6655D9]",
    label: "문서",
  },
  application: {
    dot: "bg-[#6D5CE7]",
    badge: "bg-[#F1EEFF] text-[#6655D9]",
    label: "문서",
  },
  writtenTest: {
    dot: "bg-[#159C9C]",
    badge: "bg-[#EAF8F8] text-[#138787]",
    label: "필기",
  },
  interview: {
    dot: "bg-[#C5860E]",
    badge: "bg-[#FFF6E6] text-[#B87300]",
    label: "면접",
  },
  todo: {
    dot: "bg-[#2563EB]",
    badge: "bg-[#EFF6FF] text-[#2563EB]",
    label: "할 일",
  },
  personal: {
    dot: "bg-[#15926A]",
    badge: "bg-[#ECFDF5] text-[#15805D]",
    label: "일정",
  },
  default: {
    dot: "bg-[#15926A]",
    badge: "bg-[#ECFDF5] text-[#15805D]",
    label: "일정",
  },
};

function getEventDotClass(event: CalendarItem) {
  return ITEM_TYPE_META[event.type]?.dot ?? ITEM_TYPE_META.default.dot;
}

function getDisplayTitle(item: CalendarItem) {
  const raw = item.raw as any;

  if (item.source === "todo") {
    return String(raw?.title ?? item.title).replace(/^\[할 일\]\s*/, "");
  }

  if (item.source === "application") {
    return item.jobTitle || item.title.replace(/^\[[^\]]+\]\s*/, "");
  }

  return String(raw?.summary ?? raw?.title ?? item.title);
}

function getDisplayMeta(item: CalendarItem) {
  if (item.companyName) return item.companyName;
  if (item.source === "todo") return "할 일";
  if (item.source === "application") return item.step;
  return "개인 일정";
}

function formatPopoverDate(date: Date) {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}.${String(date.getDate()).padStart(2, "0")}`;
}

export default function CalendarBox({
  defaultEvents,
  applications,
  todos,
  setWeeklyEvents,
  setSelectedDate,
  setSelectedEvents,
  onOpenCalendar,
}: {
  defaultEvents: any[];
  applications: Application[];
  todos: Todo[];
  setDefaultEvents?: (events: any[]) => void;
  setWeeklyEvents: (events: any[]) => void;
  setSelectedDate: (date: Date | null) => void;
  setSelectedEvents: (events: any[]) => void;
  onOpenCalendar?: () => void;
}) {
  const [date, setDate] = useState(new Date());
  const [showLegend, setShowLegend] = useState(false);
  const [dayPopover, setDayPopover] = useState<{
    date: Date;
    items: CalendarItem[];
    top: number;
    left: number;
  } | null>(null);
  const dayPopoverRef = useRef<HTMLDivElement | null>(null);

  const allEvents = useMemo(
    () => [...(defaultEvents ?? [])].filter(Boolean),
    [defaultEvents],
  );

  const calendarMarkerItems = useMemo(
    () =>
      mergeCalendarItems(
        buildApplicationCalendarItems(applications ?? []),
        buildGoogleCalendarItems(allEvents, applications ?? []),
        buildTodoCalendarItems(todos ?? [], applications ?? []),
      ),
    [allEvents, applications, todos],
  );

  const weeklyEvents = useMemo(
    () =>
      getThisWeekEvents(allEvents).sort((a, b) => {
        const aDate = getGoogleEventDate(a)?.getTime() ?? 0;
        const bDate = getGoogleEventDate(b)?.getTime() ?? 0;
        return aDate - bDate;
      }),
    [allEvents],
  );

  useEffect(() => {
    setWeeklyEvents(weeklyEvents);
  }, [setWeeklyEvents, weeklyEvents]);

  useEffect(() => {
    const selectedDayEvents = allEvents.filter((event) => {
      const eventDate = getGoogleEventDate(event);
      return eventDate && isSameDay(eventDate, date);
    });

    setSelectedEvents(selectedDayEvents);
  }, [allEvents, date, setSelectedEvents]);

  useEffect(() => {
    if (!dayPopover) return;

    const handleOutside = (event: MouseEvent) => {
      if (dayPopoverRef.current?.contains(event.target as Node)) return;
      setDayPopover(null);
    };

    const handleViewportChange = () => setDayPopover(null);

    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [dayPopover]);

  const selectDate = (nextDate: Date) => {
    setDate(nextDate);
    setSelectedDate(nextDate);
  };

  const openDayPopover = (
    nextDate: Date,
    event: ReactMouseEvent<HTMLButtonElement>,
  ) => {
    selectDate(nextDate);

    const items = calendarMarkerItems.filter((item) =>
      isSameLocalDay(item.date, nextDate),
    );
    const rect = event.currentTarget.getBoundingClientRect();
    const expectedHeight = Math.min(330, 58 + Math.max(items.length, 1) * 58);
    const belowTop = rect.bottom + 8;
    const openAbove = belowTop + expectedHeight > window.innerHeight - 8;
    const top = openAbove
      ? Math.max(VIEWPORT_PADDING, rect.top - expectedHeight - 8)
      : belowTop;
    const centeredLeft = rect.left + rect.width / 2 - DAY_POPOVER_WIDTH / 2;
    const left = Math.min(
      Math.max(VIEWPORT_PADDING, centeredLeft),
      window.innerWidth - DAY_POPOVER_WIDTH - VIEWPORT_PADDING,
    );

    setDayPopover({ date: nextDate, items, top, left });
  };

  return (
    <>
      <div className="right-panel-calendar relative rounded-xl border border-[#DDE3EC] bg-white">
        <div className="absolute right-3 top-2.5 z-10 flex items-center gap-1">
          <div className="relative">
            <button
              type="button"
              aria-label="캘린더 범례"
              onClick={() => setShowLegend((prev) => !prev)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-[#71809A] hover:bg-[#EFF2F6] hover:text-[#28303D]"
            >
              <HelpCircle className="h-4 w-4" />
            </button>

            {showLegend && (
              <div className="absolute right-0 top-8 z-30 w-40 rounded-lg border border-[#E3E8EF] bg-white p-2.5 text-[11px] text-[#66738A] shadow-[0_12px_28px_-8px_rgba(15,23,42,0.24)]">
                <LegendDot className="bg-[#D24545]" label="공고 마감" />
                <LegendDot className="bg-[#C5860E]" label="면접 일정" />
                <LegendDot className="bg-[#6D5CE7]" label="문서·제출" />
                <LegendDot className="bg-[#159C9C]" label="필기 일정" />
                <LegendDot className="bg-[#2563EB]" label="할 일" />
                <LegendDot className="bg-[#15926A]" label="개인 일정" />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              const today = new Date();
              selectDate(today);
              setDayPopover(null);
            }}
            className="rounded-md px-2 py-1 text-[12px] text-[#71809A] hover:bg-[#EFF2F6] hover:text-[#28303D]"
          >
            오늘
          </button>
        </div>

        <div className="overflow-hidden rounded-xl">
          <Calendar
            className="w-full border-none bg-transparent"
            prev2Label={null}
            next2Label={null}
            calendarType="gregory"
            showNeighboringMonth={false}
            formatDay={(_, calendarDate) => calendarDate.getDate().toString()}
            navigationLabel={({ date: cursorDate }) => (
              <span
                className="hover:text-[#2563EB]"
                onDoubleClick={() => onOpenCalendar?.()}
              >
                {cursorDate.getFullYear()}.
                {String(cursorDate.getMonth() + 1).padStart(2, "0")}
              </span>
            )}
            onChange={(value) => selectDate(value as Date)}
            onClickDay={openDayPopover}
            value={date}
            tileContent={({ date: tileDate }) => {
              const events = calendarMarkerItems.filter((event) =>
                isSameLocalDay(event.date, tileDate),
              );

              if (events.length === 0) return null;

              return (
                <div className="mt-1 flex min-h-[7px] flex-wrap justify-center gap-1">
                  {events.slice(0, 4).map((event, index) => (
                    <span
                      key={`${event.id}-${index}`}
                      className={`h-1.5 w-1.5 rounded-full ${getEventDotClass(
                        event,
                      )}`}
                    />
                  ))}
                  {events.length > 4 && (
                    <span className="text-[9px] leading-[6px] text-[#8A96A9]">
                      +{events.length - 4}
                    </span>
                  )}
                </div>
              );
            }}
          />
        </div>
      </div>

      {dayPopover &&
        createPortal(
          <div
            ref={dayPopoverRef}
            role="dialog"
            aria-label={`${formatPopoverDate(dayPopover.date)} 일정과 할 일`}
            className="fixed z-[10020] max-h-[330px] overflow-hidden rounded-xl border border-[#DDE3EC] bg-white shadow-[0_20px_45px_-14px_rgba(15,23,42,0.35)]"
            style={{
              top: dayPopover.top,
              left: dayPopover.left,
              width: DAY_POPOVER_WIDTH,
            }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#EEF1F5] px-3.5 py-3">
              <h3 className="text-[14px] font-semibold tabular-nums text-[#202938]">
                {formatPopoverDate(dayPopover.date)}
              </h3>
              <button
                type="button"
                onClick={() => setDayPopover(null)}
                className="flex h-6 w-6 items-center justify-center rounded-md text-[#8A96A9] hover:bg-[#EFF2F6] hover:text-[#28303D]"
                aria-label="선택 날짜 목록 닫기"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {dayPopover.items.length === 0 ? (
              <p className="px-4 py-7 text-center text-[12px] text-[#8A96A9]">
                이 날짜에 등록된 일정이나 할 일이 없어요.
              </p>
            ) : (
              <ul className="max-h-[272px] overflow-y-auto p-2">
                {dayPopover.items.map((item) => {
                  const meta = ITEM_TYPE_META[item.type] ?? ITEM_TYPE_META.default;

                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => onOpenCalendar?.()}
                        className="flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-[#F6F8FB]"
                      >
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${meta.dot}`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium text-[#28303D]">
                            {getDisplayTitle(item)}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] text-[#79859A]">
                            {getDisplayMeta(item)}
                          </span>
                        </span>
                        <span
                          className={`shrink-0 rounded-md px-1.5 py-1 text-[10px] font-medium ${meta.badge}`}
                        >
                          {meta.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className={`h-1.5 w-1.5 rounded-full ${className}`} />
      <span>{label}</span>
    </div>
  );
}
