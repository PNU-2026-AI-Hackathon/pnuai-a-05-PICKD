import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Todo } from "../types/todo";
import {
  createTodo,
  toggleTodoApi,
  getTodos,
  deleteTodoApi,
} from "../api/todo";
import { getCalendarEvents } from "../api/calendar";
import { getGoogleEventDate, parseLocalDateTime } from "../utils/date";

import { useApplication } from "../context/ApplicationContext";

function isSameDay(date1: Date, date2: Date) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
function isTodoCalendarEvent(summary: string) {
  const normalized = summary.replace(/\s/g, "");
  return normalized.includes("[할일]") || normalized.includes("할일");
}

export const useSidePanelData = () => {
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const isAddingTodoRef = useRef(false);
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const { applications, loadData } = useApplication();

  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const fetchTodos = useCallback(async () => {
    try {
      const todoData = await getTodos();
      setTodos(todoData);
    } catch (error) {
      console.error("할 일 조회 실패:", error);
    }
  }, []);

  const fetchCalendarEvents = useCallback(async () => {
    try {
      const calendarData = await getCalendarEvents();
      setGoogleEvents(calendarData ?? []);
    } catch (error) {
      console.error("캘린더 가져오기 실패:", error);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      await fetchTodos();
      await fetchCalendarEvents();
    };

    fetchData();
  }, [fetchTodos, fetchCalendarEvents]);

  useEffect(() => {
    const handleTodoUpdated = async () => {
      await fetchTodos();
    };

    const handleGoogleCalendarUpdated = async () => {
      await fetchCalendarEvents();
    };

    window.addEventListener("todoUpdated", handleTodoUpdated);
    window.addEventListener(
      "googleCalendarUpdated",
      handleGoogleCalendarUpdated,
    );

    return () => {
      window.removeEventListener("todoUpdated", handleTodoUpdated);
      window.removeEventListener(
        "googleCalendarUpdated",
        handleGoogleCalendarUpdated,
      );
    };
  }, [fetchTodos, fetchCalendarEvents]);

  const combinedAnnouncements = useMemo(() => {
    const applicationAnnouncements = applications.map((app) => ({
      id: `db-${app.id}`,
      title: app.jobTitle,
      company: app.company,
      step: app.status,
      date: parseLocalDateTime(app.deadlineDate),
    }));

    const googleAnnouncements = googleEvents
      .filter((e) => {
        const summary = e.summary || "";
        return !isTodoCalendarEvent(summary);
      })
      .map((e) => {
        const summary = e.summary || "";
        let step = "일반 일정";

        if (summary.includes("면접")) {
          step = "면접전형";
        } else if (summary.includes("마감")) {
          step = "지원 마감";
        } else if (summary.includes("제출")) {
          step = "서류 제출";
        }

        const cleanTitle = summary.replace(/면접|마감|제출/g, "").trim();
        const words = cleanTitle.split(" ");
        const company = words[0] || "";
        const jobTitle = words.slice(1).join(" ") || cleanTitle;

        return {
          id: `google-${e.id}`,
          title: jobTitle,
          company,
          step,
          date: getGoogleEventDate(e),
        };
      });

    return [...applicationAnnouncements, ...googleAnnouncements];
  }, [applications, googleEvents]);

  const todaySchedules = useMemo(() => {
    return combinedAnnouncements
      .filter((item) => {
        if (!item.date) return false;
        return isSameDay(item.date, today);
      })
      .sort((a, b) => a.date!.getTime() - b.date!.getTime());
  }, [combinedAnnouncements, today]);

  const sortedList = useMemo(() => {
    return combinedAnnouncements
      .filter((item) => {
        const isValidStep =
          item.step?.includes("면접") || item.step?.includes("마감");

        return isValidStep && item.date && item.date >= today;
      })
      .sort((a, b) => a.date!.getTime() - b.date!.getTime());
  }, [combinedAnnouncements, today]);

  const todayTodos = useMemo(() => {
    return todos.filter((todo) => {
      if (!todo.dueDateTime) return false;

      const todoDate = getGoogleEventDate({ start: { dateTime: todo.dueDateTime } });

      if (!todoDate) return false;

      return isSameDay(todoDate, today);
    });
  }, [todos, today]);

  const handleAddTodo = async (newTodoData: {
    title: string;
    dueDateTime?: string;
    applicationId?: string | number;
    memo?: string;
  }) => {
    if (isAddingTodoRef.current) {
      return;
    }

    isAddingTodoRef.current = true;
    setIsAddingTodo(true);

    try {
      const selectedApplication = applications.find(
        (app) => String(app.id) === String(newTodoData.applicationId),
      );

      if (newTodoData.applicationId && !selectedApplication) {
        alert("연결된 공고를 찾을 수 없습니다.");
        return;
      }

      const createdTodo = await createTodo({
        title: newTodoData.title,
        dueDateTime: newTodoData.dueDateTime,
        memo: newTodoData.memo ?? "",
        applicationId: selectedApplication?.id,
        company: selectedApplication?.company,
        jobTitle: selectedApplication?.jobTitle,
      });

      const todoWithApplication = {
        ...createdTodo,
        dueDateTime: createdTodo.dueDateTime ?? newTodoData.dueDateTime,
        company: selectedApplication?.company,
        jobTitle: selectedApplication?.jobTitle,
        application: selectedApplication
          ? {
              id: selectedApplication.id,
              company: selectedApplication.company,
              jobTitle: selectedApplication.jobTitle,
            }
          : undefined,
      };

      setTodos((prev) => [todoWithApplication, ...prev]);

      void fetchTodos();
      void fetchCalendarEvents();
      void loadData();

      window.dispatchEvent(new Event("todoUpdated"));
      window.dispatchEvent(new Event("googleCalendarUpdated"));
    } catch (error) {
      console.error("할 일 생성 실패:", error);
      throw error;
    } finally {
      isAddingTodoRef.current = false;
      setIsAddingTodo(false);
    }
  };

  const toggleTodo = async (id: number) => {
    try {
      const targetTodo = todos.find((t) => t.id === id);
      if (!targetTodo) return;

      await toggleTodoApi(id);

      setTodos((prev) =>
        prev.map((todo) =>
          todo.id === id ? { ...todo, completed: !todo.completed } : todo,
        ),
      );

      window.dispatchEvent(new Event("todoUpdated"));

      if (!targetTodo.completed) {
        setTimeout(async () => {
          try {
            await deleteTodoApi(id);
            await fetchTodos();
            await fetchCalendarEvents();
            await loadData();

            window.dispatchEvent(new Event("todoUpdated"));
            window.dispatchEvent(new Event("googleCalendarUpdated"));
          } catch (error) {
            console.error("10초 뒤 자동 삭제 실패:", error);
          }
        }, 10000);
      }
    } catch (error) {
      console.error("할 일 상태 변경 실패:", error);
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      await deleteTodoApi(id);
      await fetchTodos();
      await fetchCalendarEvents();
      await loadData();

      window.dispatchEvent(new Event("todoUpdated"));
      window.dispatchEvent(new Event("googleCalendarUpdated"));
    } catch (error) {
      console.error("할 일 삭제 실패:", error);
    }
  };

  const calculateDDay = (targetDate: Date) => {
    const target = parseLocalDateTime(targetDate);
    if (!target) return "-";
    target.setHours(0, 0, 0, 0);

    const diff = Math.ceil(
      (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diff === 0) return "D-Day";
    if (diff > 0) return `D-${diff}`;
    return `D+${Math.abs(diff)}`;
  };

  return {
    todayTodos,
    today,
    sortedList,
    todaySchedules,
    handleAddTodo,
    toggleTodo,
    deleteTodo,
    calculateDDay,
    isAddingTodo,
  };
};
