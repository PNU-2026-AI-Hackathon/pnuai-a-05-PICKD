import type { DocumentItem } from "../types/document";
import {
  deleteApplication,
  getApplications,
  updateApplication as updateApplicationApi,
} from "../api/application";
import { type Application } from "../types/application";
import { createTodo, toggleTodoApi, deleteTodoApi } from "../api/todo";
import { addDocument as addDocumentApi } from "../api/document";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type ApplicationUpdater =
  | ((prev: Application) => Application)
  | Partial<Application>;

type ContextType = {
  applications: Application[];
  updateApplication: (
    id: number,
    updater: ApplicationUpdater,
  ) => Promise<void>;
  deleteApplications: (ids: number[]) => Promise<void>;
  loadData: () => Promise<void>;
  addTodo: (data: {
    title: string;
    dueDateTime?: string;
    memo?: string;
    applicationId?: number | string;
  }) => Promise<void>;
  addDocument: (applicationId: number, document: Partial<DocumentItem>) => Promise<void>;
  toggleTodo: (todoId: number) => Promise<void>;
  removeTodo: (todoId: number) => Promise<void>;
};

const AppContext = createContext<ContextType | null>(null);

const attachNestedRelations = (applications: Application[]) => {
  return applications.map((application) => ({
    ...application,
    todos: (application.todos ?? []).map((todo) => ({
      ...todo,
      applicationId: todo.applicationId ?? application.id,
      company: todo.company ?? application.company,
      jobTitle: todo.jobTitle ?? application.jobTitle,
      application: todo.application ?? {
        id: application.id,
        company: application.company,
        jobTitle: application.jobTitle,
      },
    })),
    documents: (application.documents ?? []).map((document) => ({
      ...document,
      applicationId: document.applicationId ?? application.id,
      company: document.company ?? application.company,
      application: document.application ?? {
        id: application.id,
        company: application.company,
        jobTitle: application.jobTitle,
        applyDate: application.applyDate,
        deadlineDate: application.deadlineDate,
      },
    })),
  }));
};

export function ApplicationProvider({ children }: any) {
  const [applications, setApplications] = useState<Application[]>([]);

  const loadData = useCallback(async () => {
    try {
      const data = await getApplications();
      setApplications(attachNestedRelations(data ?? []));
    } catch (error) {
      console.error("지원 공고 조회 실패:", error);
      setApplications([]);
    }
  }, []);

  const addTodo = async (data: {
    title: string;
    dueDateTime?: string;
    memo?: string;
    applicationId?: number | string;
  }) => {
    await createTodo(data);
    await loadData();
  };

  const toggleTodo = async (todoId: number) => {
    const targetTodo = applications
      .flatMap((app) => app.todos || [])
      .find((todo) => todo.id === todoId);

    await toggleTodoApi(todoId);

    setApplications((prev) =>
      prev.map((app) => ({
        ...app,
        todos: (app.todos ?? []).map((todo) =>
          todo.id === todoId ? { ...todo, completed: !todo.completed } : todo,
        ),
      })),
    );

    if (targetTodo && !targetTodo.completed) {
      setTimeout(async () => {
        try {
          await deleteTodoApi(todoId);
          await loadData();
        } catch (error) {
          console.error("완료된 할 일 자동 삭제 실패:", error);
        }
      }, 10000);
    }
  };

  const removeTodo = async (todoId: number) => {
    await deleteTodoApi(todoId);
    await loadData();
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handleRefresh = () => {
      void loadData();
    };

    window.addEventListener("applicationUpdated", handleRefresh);
    window.addEventListener("documentUpdated", handleRefresh);

    return () => {
      window.removeEventListener("applicationUpdated", handleRefresh);
      window.removeEventListener("documentUpdated", handleRefresh);
    };
  }, [loadData]);

  const deleteApplicationsHandler = async (ids: number[]) => {
    await Promise.all(ids.map((id) => deleteApplication(id)));
    await loadData();
  };

  const updateApplication = async (
    id: number,
    updater: ApplicationUpdater,
  ) => {
    const current = applications.find((app) => app.id === id);
    if (!current) return;

    const nextApplication =
      typeof updater === "function"
        ? updater(current)
        : {
            ...current,
            ...updater,
          };

    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, ...nextApplication } : app)),
    );

    try {
      await updateApplicationApi(id, nextApplication);
      await loadData();
    } catch (error) {
      await loadData();
      throw error;
    }
  };

  const addDocument = async (
    applicationId: number,
    document: Partial<DocumentItem>,
  ) => {
    await addDocumentApi(applicationId, document);
    await loadData();
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
