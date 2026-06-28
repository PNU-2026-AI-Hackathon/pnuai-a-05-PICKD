export const createTodo = async (data: {
  title: string;
  dueDateTime?: string;
  memo?: string;
  applicationId?: number;
  company?: string;
  jobTitle?: string;
}) => {
  const res = await fetch("/api/todo", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("할 일 생성 실패");
  }

  const newTodo = await res.json();

  window.dispatchEvent(new Event("googleCalendarUpdated"));
  window.dispatchEvent(new Event("todoUpdated"));

  return newTodo;
};

export const toggleTodoApi = async (todoId: number) => {
  const response = await fetch(`/api/todo/${todoId}`, {
    method: "PUT",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("할 일 상태 변경 실패");
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export const deleteTodoApi = async (id: number) => {
  const res = await fetch(`/api/todo/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("할 일 삭제 실패");
  }

  window.dispatchEvent(new Event("googleCalendarUpdated"));
  window.dispatchEvent(new Event("todoUpdated"));
};

export const getTodos = async () => {
  const res = await fetch("/api/todo", {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("할 일 조회 실패");
  }

  return res.json();
};
