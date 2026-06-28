import { useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import EventPopup from "./EventPopup";
import "./MainCalendar.css";
import { ChevronRightIcon } from "../../../assets/index";
import { type Application } from "../../../types/application";
import { useMainCalendar, isSameDay } from "../../../hooks/useMainCalendar";

interface MainCalendarProps {
  applications: Application[];
  onCalendarRefetch?: (refetchFn: () => void) => void;
}

const MainCalendar = ({ applications = [], onCalendarRefetch }: MainCalendarProps) => {
  const {
    date,
    selectedCompanyId,
    popup,
    popupRef,
    filteredEvents,
    getEventColor,
    handleCompanyChange,
    handleDateChange,
    setPopup,
    loadEvents,
  } = useMainCalendar(applications);

  useEffect(() => {
    if (onCalendarRefetch) {
      onCalendarRefetch(loadEvents);
    }
  }, [loadEvents, onCalendarRefetch]);

  return (
    <div className="main-calendar-container relative">
      <div className="calendar-filter-dropdown">
        <div className="relative inline-block w-40">
          <select
            value={selectedCompanyId}
            onChange={(e) => handleCompanyChange(e.target.value)}
            className="w-full bg-[#F8FAFC] text-sm text-gray-700 pl-4 pr-8 py-2 rounded-[0.5rem] border border-gray-200/70 appearance-none focus:outline-none cursor-pointer font-medium"
          >
            <option value="all">전체보기</option>
            {applications.map((app) => (
              <option key={app.id} value={app.id}>
                {app.company}
              </option>
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
          const hiddenCount = dayEvents.length - 2;

          return (
            <div className="flex flex-col gap-1 mt-1 w-full overflow-hidden px-1">
              {visibleEvents.map((ev, i) => (
                <div
                  key={i}
                  className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium ${getEventColor(ev.type)}`}
                >
                  {ev.title}
                </div>
              ))}

              {hiddenCount > 0 && (
                <button
                  className="text-[10px] text-[#94A3B8] text-center font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    setPopup({
                      date,
                      events: dayEvents,
                      x: rect.left,
                      y: rect.bottom + 8,
                    });
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
    </div>
  );
};

export default MainCalendar;