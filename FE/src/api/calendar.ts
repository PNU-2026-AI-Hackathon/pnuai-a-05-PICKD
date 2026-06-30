import { apiRequest } from "./http";
import type { Schedule } from "../types/schedule";
import { toBackendLocalDateTime } from "../utils/date";

export type CalendarEventPayload = {
  summary: string;
  location?: string;
  description?: string;
  category?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end?: {
    dateTime: string;
    timeZone?: string;
  };
};

const toCalendarEventRequest = (data: CalendarEventPayload) => {
  const startDateTime = toBackendLocalDateTime(data.start.dateTime) || data.start.dateTime;
  const endDateTime =
    toBackendLocalDateTime(data.end?.dateTime) ||
    toBackendLocalDateTime(data.start.dateTime) ||
    data.start.dateTime;

  return {
    summary: data.summary,
    location: data.location ?? "",
    description: data.description ?? (data.category ? `category:${data.category}` : ""),
    start: {
      dateTime: startDateTime,
      timeZone: data.start.timeZone ?? "Asia/Seoul",
    },
    end: {
      dateTime: endDateTime,
      timeZone: data.end?.timeZone ?? data.start.timeZone ?? "Asia/Seoul",
    },
  };
};

export async function getCalendarEvents(params?: { timeMin?: string; timeMax?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.timeMin) searchParams.set("timeMin", params.timeMin);
  if (params?.timeMax) searchParams.set("timeMax", params.timeMax);

  const query = searchParams.toString();

  try {
    return await apiRequest<Schedule[]>(`/api/calendar/events${query ? `?${query}` : ""}`, {
      method: "GET",
      skipJsonContentType: true,
    });
  } catch (error) {
    // CalendarRestController가 막혀 있거나 아직 구버전만 살아있는 경우 CalendarViewController로 fallback
    return apiRequest<Schedule[]>("/api/calendar", {
      method: "GET",
      skipJsonContentType: true,
    });
  }
}

export async function getCalendarViewEvents() {
  return apiRequest<Schedule[]>("/api/calendar", {
    method: "GET",
    skipJsonContentType: true,
  });
}

export async function createEvent(data: CalendarEventPayload) {
  const createdEvent = await apiRequest<Schedule>("/api/calendar/events", {
    method: "POST",
    body: JSON.stringify(toCalendarEventRequest(data)),
  });

  window.dispatchEvent(new Event("googleCalendarUpdated"));

  return createdEvent;
}

export async function createCalendarViewEvent(data: CalendarEventPayload) {
  const createdEvent = await apiRequest<Schedule>("/api/calendar", {
    method: "POST",
    body: JSON.stringify(toCalendarEventRequest(data)),
  });

  window.dispatchEvent(new Event("googleCalendarUpdated"));

  return createdEvent;
}

export async function updateEvent(id: string, data: CalendarEventPayload) {
  const updatedEvent = await apiRequest<Schedule>(`/api/calendar/events/${id}`, {
    method: "PUT",
    body: JSON.stringify(toCalendarEventRequest(data)),
  });

  window.dispatchEvent(new Event("googleCalendarUpdated"));

  return updatedEvent;
}

export async function deleteEvent(id: string) {
  await apiRequest<void>(`/api/calendar/events/${id}`, {
    method: "DELETE",
    skipJsonContentType: true,
  });

  window.dispatchEvent(new Event("googleCalendarUpdated"));
}

export async function getTodayEvents() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  return getCalendarEvents({
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
  });
}
