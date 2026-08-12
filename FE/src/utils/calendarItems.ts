import type { Application } from "../types/application";
import type { Todo } from "../types/todo";
import type { Schedule } from "../types/schedule";
import { getGoogleEventDate, parseLocalDateTime } from "./date";
import { getScheduleApplicationId, isTodoCalendarEvent } from "./calendarEvent";

export type CalendarItemType =
  | "deadline"
  | "apply"
  | "writtenTest"
  | "interview"
  | "announcement"
  | "application"
  | "personal"
  | "todo"
  | "default";

export type CalendarItem = {
  id: string;
  date: Date;
  title: string;
  type: CalendarItemType;
  source: "application" | "google" | "todo";
  companyId: string;
  companyName: string;
  jobTitle?: string;
  step: string;
  completed?: boolean;
  priority: number;
  raw?: unknown;
};

const normalize = (value: unknown) => String(value ?? "").trim();

export function isSameLocalDay(date1: Date, date2: Date) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

const startOfLocalDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getCalendarEventType = (event: any) => {
  const privateProps = event?.extendedProperties?.private ?? {};
  const pickdType = privateProps.pickdEventType ?? event?.pickdEventType;

  if (pickdType) return normalize(pickdType);

  const description = normalize(event?.description);
  const match = description.match(/pickd:eventType=([^\n]+)/i);

  if (match) return normalize(match[1]);
  return normalize(event?.type);
};

const getEventCategory = (event: Partial<Schedule> | any) => {
  const summary = normalize(event?.summary ?? event?.title);
  const category = normalize(event?.category);
  const description = normalize(event?.description);
  const text = `${summary} ${category} ${description}`;

  if (isTodoCalendarEvent(event)) return "todo";
  if (text.includes("지원마감") || text.includes("마감")) return "deadline";
  if (text.includes("서류") || text.includes("제출")) return "apply";
  if (text.includes("필기") || text.includes("NCS") || text.includes("코딩테스트")) return "writtenTest";
  if (text.includes("면접")) return "interview";
  if (category.includes("시험") || category.includes("모임")) return "personal";
  return "default";
};

const itemPriority = (type: CalendarItemType) => {
  if (type === "deadline") return 1;
  if (type === "writtenTest" || type === "interview") return 2;
  if (type === "apply" || type === "announcement" || type === "application") return 3;
  if (type === "personal" || type === "default") return 4;
  return 5;
};

const makeAppItem = (
  app: Application,
  type: CalendarItemType,
  step: string,
  dateValue?: string | Date | null,
) => {
  const date = parseLocalDateTime(dateValue);
  if (!date) return null;

  return {
    id: `app-${app.id}-${type}`,
    date,
    title: `[${step}] ${app.company} ${app.jobTitle}`.trim(),
    type,
    source: "application" as const,
    companyId: String(app.id),
    companyName: app.company,
    jobTitle: app.jobTitle,
    step,
    priority: itemPriority(type),
    raw: app,
  } satisfies CalendarItem;
};

const makeTodoItem = (todo: Todo, application?: Application) => {
  const date = parseLocalDateTime(todo.dueDateTime);
  if (!date) return null;

  const companyName =
    todo.company ?? todo.application?.company ?? application?.company ?? "";

  return {
    id: `todo-${todo.id}`,
    date,
    title: `[할 일] ${todo.title}`,
    type: "todo" as const,
    source: "todo" as const,
    companyId: String(todo.applicationId ?? todo.application?.id ?? application?.id ?? "none"),
    companyName,
    jobTitle: todo.jobTitle ?? todo.application?.jobTitle ?? application?.jobTitle,
    step: "할 일",
    completed: todo.completed,
    priority: itemPriority("todo"),
    raw: todo,
  } satisfies CalendarItem;
};

export const buildApplicationCalendarItems = (applications: Application[] = []) => {
  const items: CalendarItem[] = [];

  applications.forEach((app) => {
    const deadlineItem = makeAppItem(app, "deadline", "지원마감", app.deadlineDate);
    if (deadlineItem) items.push(deadlineItem);

    if (!app.manualRegistration) {
      const applyItem = makeAppItem(app, "apply", "서류제출", app.applyDate);
      if (applyItem) items.push(applyItem);

      const interviewItem = makeAppItem(app, "interview", "면접", app.interviewDate);
      if (interviewItem) items.push(interviewItem);
    }

    (app.todos ?? []).forEach((todo) => {
      const todoItem = makeTodoItem(todo, app);
      if (todoItem) items.push(todoItem);
    });
  });

  return items;
};

const shouldSkipGeneratedGoogleEvent = (event: any, applications: Application[]) => {
  const eventType = getCalendarEventType(event);
  const appId = getScheduleApplicationId(event);

  if (!appId || !["deadline", "apply", "interview"].includes(eventType)) {
    return false;
  }

  const app = applications.find((item) => String(item.id) === String(appId));
  if (!app) return false;

  if (eventType === "deadline") return Boolean(app.deadlineDate);
  if (eventType === "apply") return !app.manualRegistration && Boolean(app.applyDate);
  if (eventType === "interview") return !app.manualRegistration && Boolean(app.interviewDate);
  return false;
};

export const buildGoogleCalendarItems = (
  googleEvents: any[] = [],
  applications: Application[] = [],
) => {
  return googleEvents
    .filter((event) => !shouldSkipGeneratedGoogleEvent(event, applications))
    .map((event) => {
      const date = getGoogleEventDate(event);
      if (!date) return null;

      const type = getEventCategory(event) as CalendarItemType;
      const appId = getScheduleApplicationId(event);
      const app = applications.find((item) => String(item.id) === String(appId));
      const title = normalize(event?.summary ?? event?.title) || "일정";
      const companyName = app?.company ?? "";

      return {
        id: `google-${event.id ?? title}-${date.getTime()}`,
        date,
        title,
        type,
        source: "google" as const,
        companyId: app ? String(app.id) : "none",
        companyName,
        jobTitle: app?.jobTitle,
        step:
          type === "deadline"
            ? "지원마감"
            : type === "apply"
              ? "서류제출"
              : type === "writtenTest"
                ? "필기"
                : type === "interview"
                  ? "면접"
                  : type === "todo"
                    ? "할 일"
                    : "일정",
        priority: itemPriority(type),
        raw: event,
      } satisfies CalendarItem;
    })
    .filter(Boolean) as CalendarItem[];
};

export const buildTodoCalendarItems = (
  todos: Todo[] = [],
  applications: Application[] = [],
) => {
  return todos
    .map((todo) => {
      const app = applications.find(
        (item) => String(item.id) === String(todo.applicationId ?? todo.application?.id),
      );
      return makeTodoItem(todo, app);
    })
    .filter(Boolean) as CalendarItem[];
};

export const mergeCalendarItems = (...groups: CalendarItem[][]) => {
  const map = new Map<string, CalendarItem>();

  groups.flat().forEach((item) => {
    if (!item) return;
    const key = `${item.source}-${item.id}`;
    if (!map.has(key)) map.set(key, item);
  });

  return Array.from(map.values()).sort((a, b) => {
    const dayDiff = startOfLocalDay(a.date).getTime() - startOfLocalDay(b.date).getTime();
    if (dayDiff !== 0) return dayDiff;
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.date.getTime() - b.date.getTime();
  });
};

export const getDaysUntil = (date: Date, baseDate = new Date()) => {
  const target = startOfLocalDay(date);
  const base = startOfLocalDay(baseDate);
  return Math.ceil((target.getTime() - base.getTime()) / (1000 * 60 * 60 * 24));
};
