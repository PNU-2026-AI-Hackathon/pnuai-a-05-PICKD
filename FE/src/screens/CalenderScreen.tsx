import { useCallback, useEffect, useRef, useState } from "react";
import MainCalendar from "../components/dashboard/calender/MainCalender";
import SideDetailPanel from "../components/dashboard/calender/SideDetail/SideDetailPanel";
import { useApplication } from "../context/ApplicationContext";

const MIN_SIDEBAR_WIDTH = 360;
const MAX_SIDEBAR_WIDTH = 720;
const DEFAULT_SIDEBAR_WIDTH = 480;
const SIDEBAR_WIDTH_STORAGE_KEY = "calendarSidebarWidth";

const getStoredSidebarWidth = () => {
  const stored = Number(localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY));
  if (stored >= MIN_SIDEBAR_WIDTH && stored <= MAX_SIDEBAR_WIDTH) return stored;
  return DEFAULT_SIDEBAR_WIDTH;
};

const CalendarScreen = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const { applications, loadData } = useApplication();
  const [sidebarWidth, setSidebarWidth] = useState(getStoredSidebarWidth);
  const [isResizing, setIsResizing] = useState(false);
  const latestWidthRef = useRef(sidebarWidth);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleResizeStart = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setIsResizing(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const nextWidth = Math.min(
        MAX_SIDEBAR_WIDTH,
        Math.max(MIN_SIDEBAR_WIDTH, window.innerWidth - moveEvent.clientX),
      );
      latestWidthRef.current = nextWidth;
      setSidebarWidth(nextWidth);
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      setIsResizing(false);
      localStorage.setItem(
        SIDEBAR_WIDTH_STORAGE_KEY,
        String(latestWidthRef.current),
      );
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, []);

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] overflow-hidden">
      <div className="flex-1 overflow-auto">
        <MainCalendar
          applications={applications}
          selectedDate={selectedDate}
          onSelectedDateChange={setSelectedDate}
        />
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="사이드바 너비 조절"
        onMouseDown={handleResizeStart}
        className={`w-1 shrink-0 cursor-col-resize transition-colors ${
          isResizing ? "bg-blue-400" : "bg-transparent hover:bg-blue-200"
        }`}
      />

      <div
        style={{ width: sidebarWidth }}
        className="shrink-0 h-full border-l border-gray-200 bg-[#F8FAFC] flex flex-col overflow-hidden"
      >
        <SideDetailPanel
          applications={applications}
          selectedDate={selectedDate}
        />
      </div>
    </div>
  );
};

export default CalendarScreen;
