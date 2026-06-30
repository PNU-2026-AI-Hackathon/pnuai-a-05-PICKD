import { apiRequest } from "./http";
import type { Todo } from "../types/todo";
import { toBackendLocalDateTime } from "../utils/date";

export type TodoPayload = {
  title: string;
  dueDateTime?: string | null;
  memo?: string;
  applicationId?: number | string | null;
  company?: string;
  jobTitle?: string;
};

const toTodoRequest = (data: TodoPayload) => ({
  title: data.title,
  dueDateTime: toBackendLocalDateTime(data.dueDateTime) || null,
  memo: data.memo ?? "",
  applicationId:
    data.applicationId === "" || data.applicationId == null
      ? null
      : Number(data.applicationId),
  company: data.company ?? undefined,
  jobTitle: data.jobTitle ?? undefined,
});

export const getTodos = async () => {
  return apiRequest<Todo[]>("/api/todo", {
    method: "GET",
    skipJsonContentType: true,
  });
};

export const getTodosByApplication = async (applicationId: number) => {
  return apiRequest<Todo[]>(`/api/todo/application/${applicationId}`, {
    method: "GET",
    skipJsonContentType: true,
  });
};

export const createTodo = async (data: TodoPayload) => {
  const newTodo = await apiRequest<Todo>("/api/todo", {
    method: "POST",
    body: JSON.stringify(toTodoRequest(data)),
  });

  window.dispatchEvent(new Event("todoUpdated"));
  window.dispatchEvent(new Event("googleCalendarUpdated"));

  return newTodo;
};

export const updateTodoApi = async (todoId: number, data: TodoPayload) => {
  const updatedTodo = await apiRequest<Todo>(`/api/todo/${todoId}`, {
    method: "PATCH",
    body: JSON.stringify(toTodoRequest(data)),
  });

  window.dispatchEvent(new Event("todoUpdated"));
  window.dispatchEvent(new Event("googleCalendarUpdated"));

  return updatedTodo;
};

export const toggleTodoApi = async (todoId: number) => {
  await apiRequest<void>(`/api/todo/${todoId}/toggle`, {
    method: "PUT",
    skipJsonContentType: true,
  });

  window.dispatchEvent(new Event("todoUpdated"));
  window.dispatchEvent(new Event("googleCalendarUpdated"));
};

export const deleteTodoApi = async (id: number) => {
  await apiRequest<void>(`/api/todo/${id}`, {
    method: "DELETE",
    skipJsonContentType: true,
  });

  window.dispatchEvent(new Event("todoUpdated"));
  window.dispatchEvent(new Event("googleCalendarUpdated"));
};
