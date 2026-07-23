import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import EventPopup from "./EventPopup";
import WeeklyCalendar from "./WeeklyCalendar";
import "./MainCalendar.css";
import { ChevronRightIcon } from "../../../assets/index";
import { type Application } from "../../../types/application";
import { useMainCalendar, isSameDay } from "../../../hooks/useMainCalendar";

interface MainCalendarProps {
  applications: Application[];
  onCalendarRefetch?: (refetchFn: () => void) => void;
  selectedDate?: Date;
  onSelectedDateChange?: (date: Date) => void;
}

type ViewMode = "month" | "week";

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekLabel(date: Date): string {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const year = weekStart.getFullYear();
  const startMonth = weekStart.getMonth() + 1;
  const endMonth = weekEnd.getMonth() + 1;

  if (startMonth === endMonth) return `${year}년 ${startMonth}월`;
  return `${year}년 ${startMonth}월 – ${endMonth}월`;
}

const MainCalendar = ({
  applications = [],
  onCalendarRefetch,
  selectedDate,
  onSelectedDateChange,
}: MainCalendarProps) => {
  const {
    date,
    selectedCompanyId,
    popup,
    popupRef,
    filteredEvents,
    getEventColor,
    isUrgentDay,
    handleCompanyChange,
    handleDateChange,
    setPopup,
    loadEvents,
  } = useMainCalendar(applications, { selectedDate, onSelectedDateChange });

  const [viewMode, setViewMode] = useState<ViewMode>("month");

  useEffect(() => {
    if (onCalendarRefetch) {
      onCalendarRefetch(loadEvents);
    }
  }, [loadEvents, onCalendarRefetch]);

  const goToPrevWeek = () => {
    const d = new Date(getWeekStart(date));
    d.setDate(d.getDate() - 7);
    handleDateChange(d);
  };

  const goToNextWeek = () => {
    const d = new Date(getWeekStart(date));
    d.setDate(d.getDate() + 7);
    handleDateChange(d);
  };

  return (
    <div className="main-calendar-container relative">
      {viewMode === "month" ? (
        <>
          {/* 월간: react-calendar 가 자체 네비 렌더 → 토글만 우측 상단 절대배치 */}
          <div className="view-mode-toggle">
            <button className="view-mode-btn active" onClick={() => setViewMode("month")}>월간</button>
            <button className="view-mode-btn" onClick={() => setViewMode("week")}>주간</button>
          </div>

          <div className="calendar-filter-dropdown">
            <div className="relative inline-block w-40">
              <select
                value={selectedCompanyId}
                onChange={(e) => handleCompanyChange(e.target.value)}
                className="w-full bg-[#F8FAFC] text-sm text-gray-700 pl-4 pr-8 py-2 rounded-[0.5rem] border border-gray-200/70 appearance-none focus:outline-none cursor-pointer font-medium"
              >
                <option value="all">전체보기</option>
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>{app.company}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <ChevronRightIcon size={12} className="rotate-90" />
              </div>
            </div>
          </div>

          <Calendar
            className="w-full border-none"
            calendarType="gregory"
            prev2Label={null}
            next2Label={null}
            prevLabel={<ChevronRightIcon size={14} className="rotate-180" />}
            nextLabel={<ChevronRightIcon size={14} />}
            showNeighboringMonth={true}
            formatDay={(_, date) => date.getDate().toString()}
            value={date}
            onChange={(val) => handleDateChange(val as Date)}
            tileContent={({ date, view }) => {
              if (view !== "month") return null;
              const dayEvents = filteredEvents.filter((ev) => isSameDay(ev.date, date));
              const visibleEvents = dayEvents.slice(0, 2);
              const urgent = isUrgentDay(date);
              const hiddenCount = dayEvents.length - 2;
              return (
                <div className="relative flex flex-col gap-1 mt-1 w-full overflow-hidden px-1">
                  {urgent && <span className="absolute right-1 top-0 h-1.5 w-1.5 rounded-full bg-red-500" />}
                  {visibleEvents.map((ev, i) => (
                    <div key={i} className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium ${getEventColor(ev.type)}`}>
                      {ev.title}
                    </div>
                  ))}
                  {hiddenCount > 0 && (
                    <button
                      className="text-[10px] text-[#94A3B8] text-center font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        setPopup({ date, events: dayEvents, x: rect.left, y: rect.bottom + 8 });
                      }}
                    >
                      +{hiddenCount} more
                    </button>
                  )}
                </div>
              );
            }}
          />
          {popup && <EventPopup popup={popup} popupRef={popupRef} />}
        </>
      ) : (
        <>
          {/* 주간: 상단 바 — 네비(좌) + 토글(우) */}
          <div className="weekly-topbar">
            <div className="weekly-topbar-left">
              <button onClick={goToPrevWeek} className="weekly-nav-btn">
                <ChevronRightIcon size={14} className="rotate-180" />
              </button>
              <span className="weekly-nav-label">{formatWeekLabel(date)}</span>
              <button onClick={goToNextWeek} className="weekly-nav-btn">
                <ChevronRightIcon size={14} />
              </button>
            </div>

            <div className="view-mode-toggle" style={{ position: "static" }}>
              <button className="view-mode-btn" onClick={() => setViewMode("month")}>월간</button>
              <button className="view-mode-btn active" onClick={() => setViewMode("week")}>주간</button>
            </div>
          </div>

          {/* 필터 드롭다운 — 별도 행 */}
          <div className="weekly-filter-row">
            <div className="relative inline-block w-40">
              <select
                value={selectedCompanyId}
                onChange={(e) => handleCompanyChange(e.target.value)}
                className="w-full bg-[#F8FAFC] text-sm text-gray-700 pl-4 pr-8 py-2 rounded-[0.5rem] border border-gray-200/70 appearance-none focus:outline-none cursor-pointer font-medium"
              >
                <option value="all">전체 보기</option>
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>{app.company}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <ChevronRightIcon size={12} className="rotate-90" />
              </div>
            </div>
          </div>

          <WeeklyCalendar
            date={date}
            filteredEvents={filteredEvents}
            getEventColor={getEventColor}
            onDateChange={handleDateChange}
          />
        </>
      )}
    </div>
  );
};

export default MainCalendar;
