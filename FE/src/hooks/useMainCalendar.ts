import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { type Application } from "../types/application";
import { getCalendarEvents } from "../api/calendar";
import { getTodos } from "../api/todo";
import {
  buildApplicationCalendarItems,
  buildGoogleCalendarItems,
  buildTodoCalendarItems,
  getDaysUntil,
  isSameLocalDay,
  mergeCalendarItems,
  type CalendarItem,
  type CalendarItemType,
} from "../utils/calendarItems";

export const isSameDay = isSameLocalDay;
export type EventType = CalendarItemType;
export type CalendarEvent = CalendarItem;

export type PopupState = {
  date: Date;
  events: CalendarEvent[];
  x: number;
  y: number;
};

export const useMainCalendar = (
  applications: Application[],
  options?: {
    selectedDate?: Date;
    onSelectedDateChange?: (date: Date) => void;
  },
) => {
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [todos, setTodos] = useState<any[]>([]);
  const [date, setDate] = useState(options?.selectedDate ?? new Date());
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all");
  const [popup, setPopup] = useState<PopupState | null>(null);

  const popupRef = useRef<HTMLDivElement>(null);

  const loadEvents = useCallback(async () => {
    try {
      const [calendarData, todoData] = await Promise.all([
        getCalendarEvents(),
        getTodos().catch(() => []),
      ]);
      setGoogleEvents(calendarData ?? []);
      setTodos(todoData ?? []);
    } catch (err) {
      console.error("캘린더 가져오기 실패", err);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (options?.selectedDate && !isSameLocalDay(options.selectedDate, date)) {
      setDate(options.selectedDate);
    }
  }, [options?.selectedDate]);

  useEffect(() => {
    const handleCalendarUpdated = () => {
      loadEvents();
    };

    window.addEventListener("googleCalendarUpdated", handleCalendarUpdated);
    window.addEventListener("todoUpdated", handleCalendarUpdated);
    window.addEventListener("applicationUpdated", handleCalendarUpdated);

    return () => {
      window.removeEventListener(
        "googleCalendarUpdated",
        handleCalendarUpdated,
      );
      window.removeEventListener("todoUpdated", handleCalendarUpdated);
      window.removeEventListener("applicationUpdated", handleCalendarUpdated);
    };
  }, [loadEvents]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setPopup(null);
      }
    };

    if (popup) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [popup]);

  const allEvents = useMemo(() => {
    return mergeCalendarItems(
      buildApplicationCalendarItems(applications),
      buildGoogleCalendarItems(googleEvents, applications),
      buildTodoCalendarItems(todos, applications),
    );
  }, [applications, googleEvents, todos]);

  const filteredEvents = useMemo(() => {
    if (selectedCompanyId === "all") return allEvents;
    return allEvents.filter((ev) => ev.companyId === selectedCompanyId);
  }, [allEvents, selectedCompanyId]);

  const getEventColor = (type: EventType) => {
    if (type === "interview") return "bg-[#F9F2FF] text-[#C082F6]";
    if (type === "deadline") return "bg-[#E77975]/10 text-[#EF4444]";
    if (type === "apply") return "bg-[#79AF86]/10 text-[#10B981]";
    if (type === "writtenTest") return "bg-amber-50 text-amber-600";
    if (type === "todo") return "bg-[#BFDBFE]/10 text-[#3B82F6]";
    if (type === "personal") return "bg-gray-100 text-gray-600";
    return "bg-blue-50 text-blue-600";
  };

  const isUrgentDay = (targetDate: Date) => {
    return filteredEvents.some((event) => {
      if (event.type !== "deadline") return false;
      if (!isSameLocalDay(event.date, targetDate)) return false;
      const days = getDaysUntil(event.date);
      return days >= 0 && days <= 3;
    });
  };

  const handleCompanyChange = (id: string) => {
    setSelectedCompanyId(id);
    setPopup(null);
  };

  const handleDateChange = (val: Date) => {
    setDate(val);
    options?.onSelectedDateChange?.(val);
    setPopup(null);
  };

  return {
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
  };
};
