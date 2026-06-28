import type { DocumentItem } from "../types/document";
import { deleteApplication } from "../api/application";
import { type Application } from "../types/application";
import { createTodo, toggleTodoApi, deleteTodoApi } from "../api/todo";
import { createContext, useContext, useState, useEffect } from "react";

type ContextType = {
  applications: Application[];
  updateApplication: (
    id: number,
    updater: (prev: Application) => Application,
  ) => void;
  deleteApplications: (ids: number[]) => Promise<void>;
  loadData: () => Promise<void>;
  addTodo: (data: {
    title: string;
    dueDateTime?: string;
    memo?: string;
    applicationId?: number;
  }) => Promise<void>;

  addDocument: (applicationId: number, title: DocumentItem) => void;

  toggleTodo: (todoId: number) => Promise<void>;
  removeTodo: (todoId: number) => Promise<void>;
};

const AppContext = createContext<ContextType | null>(null);

export function ApplicationProvider({ children }: any) {
  const [applications, setApplications] = useState<Application[]>([]);

  const addTodo = async (data: {
    title: string;
    dueDate?: string;
    dueTime?: string;
    memo?: string;
    applicationId?: number;
  }) => {
    await createTodo(data);
    await loadData();
  };

  const toggleTodo = async (todoId: number) => {
    const targetTodo = applications
      .flatMap((app) => app.todos || [])
      .find((todo) => todo.id === todoId);
    if (!targetTodo) return;

    await toggleTodoApi(todoId);

    if (!targetTodo.completed) {
      setTimeout(async () => {
        await deleteTodoApi(todoId);
        await loadData();
      }, 10000);
    }

    await loadData();
  };

  const removeTodo = async (todoId: number) => {
    await deleteTodoApi(todoId);
    await loadData();
  };

  const loadData = async () => {
    const res = await fetch("/api/application", {
      credentials: "include",
    });
    const data = await res.json();
    setApplications(data);
  };
  useEffect(() => {
    loadData();
  }, []);

  const deleteApplicationsHandler = async (ids: number[]) => {
    await Promise.all(ids.map((id) => deleteApplication(id)));
    await loadData();
  };

  const updateApplication = (
    id: number,
    updater: (prev: Application) => Application,
  ) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? updater(app) : app)),
    );
  };

  const addDocument = (applicationId: number, document: DocumentItem) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== applicationId) return app;
        return {
          ...app,
          documents: [...(app.documents || []), document],
        };
      }),
    );
  };

  return (
    <AppContext.Provider
      value={{
        applications,
        updateApplication,
        deleteApplications: deleteApplicationsHandler,
        loadData,
        addTodo,
        addDocument,
        toggleTodo,
        removeTodo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApplication() {
  return useContext(AppContext)!;
}
