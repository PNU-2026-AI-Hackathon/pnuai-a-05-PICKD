import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Todo } from "../types/todo";
import {
  createTodo,
  toggleTodoApi,
  getTodos,
  deleteTodoApi,
} from "../api/todo";
import { getCalendarEvents } from "../api/calendar";
import { parseLocalDateTime } from "../utils/date";
import { useApplication } from "../context/ApplicationContext";
import {
  buildApplicationCalendarItems,
  buildGoogleCalendarItems,
  buildTodoCalendarItems,
  getDaysUntil,
  isSameLocalDay,
  mergeCalendarItems,
} from "../utils/calendarItems";

const startOfLocalDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const useSidePanelData = (selectedDate?: Date) => {
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const isAddingTodoRef = useRef(false);
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const { applications, loadData } = useApplication();

  const selectedDay = useMemo(
    () => startOfLocalDay(selectedDate ?? new Date()),
    [selectedDate],
  );
  const realToday = useMemo(() => startOfLocalDay(new Date()), []);

  const fetchTodos = useCallback(async () => {
    try {
      const todoData = await getTodos();
      setTodos(todoData ?? []);
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
    const handleRefresh = async () => {
      await fetchTodos();
      await fetchCalendarEvents();
    };

    window.addEventListener("todoUpdated", handleRefresh);
    window.addEventListener("googleCalendarUpdated", handleRefresh);
    window.addEventListener("applicationUpdated", handleRefresh);

    return () => {
      window.removeEventListener("todoUpdated", handleRefresh);
      window.removeEventListener("googleCalendarUpdated", handleRefresh);
      window.removeEventListener("applicationUpdated", handleRefresh);
    };
  }, [fetchTodos, fetchCalendarEvents]);

  const calendarItems = useMemo(() => {
    return mergeCalendarItems(
      buildApplicationCalendarItems(applications),
      buildGoogleCalendarItems(googleEvents, applications),
      buildTodoCalendarItems(todos, applications),
    );
  }, [applications, googleEvents, todos]);

  const selectedDaySchedules = useMemo(() => {
    return calendarItems.filter(
      (item) => item.type !== "todo" && isSameLocalDay(item.date, selectedDay),
    );
  }, [calendarItems, selectedDay]);

  const sortedList = useMemo(() => {
    const twoWeeksLater = new Date(realToday);
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);

    return calendarItems.filter((item) => {
      if (item.type !== "deadline") return false;
      return item.date >= realToday && item.date <= twoWeeksLater;
    });
  }, [calendarItems, realToday]);

  const selectedDayTodos = useMemo(() => {
    return todos.filter((todo) => {
      if (!todo.dueDateTime) return false;
      if (todo.completed) {
        const todoDate = parseLocalDateTime(todo.dueDateTime);
        return todoDate ? isSameLocalDay(todoDate, selectedDay) : false;
      }

      const todoDate = parseLocalDateTime(todo.dueDateTime);
      if (!todoDate) return false;

      const todoDay = startOfLocalDay(todoDate);
      return (
        isSameLocalDay(todoDay, selectedDay) ||
        (selectedDay >= realToday && todoDay < selectedDay)
      );
    });
  }, [todos, selectedDay, realToday]);

  const handleAddTodo = async (newTodoData: {
    title: string;
    dueDateTime?: string;
    applicationId?: string | number;
    memo?: string;
  }) => {
    if (isAddingTodoRef.current) return;

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
    const diff = getDaysUntil(targetDate, realToday);
    if (diff === 0) return "D-Day";
    if (diff > 0) return `D-${diff}`;
    return `D+${Math.abs(diff)}`;
  };

  return {
    selectedDayTodos,
    selectedDay,
    sortedList,
    selectedDaySchedules,
    handleAddTodo,
    toggleTodo,
    deleteTodo,
    calculateDDay,
    isAddingTodo,
  };
};
