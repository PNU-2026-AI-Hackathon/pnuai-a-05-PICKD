import { apiRequest } from "./http";
import type { Schedule } from "../types/schedule";

export type CalendarEventPayload = {
  summary: string;
  location?: string;
  description?: string;
  category?: string;
  applicationId?: number | string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end?: {
    dateTime: string;
    timeZone?: string;
  };
};

const KOREA_TIME_ZONE = "Asia/Seoul";

const toGoogleDateTime = (value?: string) => {
  if (!value) return "";

  const trimmed = value.trim();

  // 이미 timezone이 있으면 그대로 사용
  if (/[zZ]$/.test(trimmed) || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // 2026-07-03T10:00
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00+09:00`;
  }

  // 2026-07-03T10:00:00
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}+09:00`;
  }

  // 2026-07-03
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T09:00:00+09:00`;
  }

  return trimmed;
};

const getDefaultEndDateTime = (startDateTime: string) => {
  const start = new Date(startDateTime);

  if (Number.isNaN(start.getTime())) {
    return startDateTime;
  }

  start.setHours(start.getHours() + 1);

  const yyyy = start.getFullYear();
  const mm = String(start.getMonth() + 1).padStart(2, "0");
  const dd = String(start.getDate()).padStart(2, "0");
  const hh = String(start.getHours()).padStart(2, "0");
  const min = String(start.getMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}T${hh}:${min}:00+09:00`;
};

const buildDescription = (data: CalendarEventPayload) => {
  const lines = [
    data.description,
    data.category ? `category:${data.category}` : "",
    data.applicationId ? `pickd:applicationId=${data.applicationId}` : "",
  ].filter(Boolean);

  return lines.join("\n");
};

const toCalendarEventRequest = (data: CalendarEventPayload) => {
  const startDateTime = toGoogleDateTime(data.start.dateTime);
  const endDateTime =
    toGoogleDateTime(data.end?.dateTime) ||
    getDefaultEndDateTime(startDateTime);

  return {
    summary: data.summary,
    location: data.location ?? "",
    description: buildDescription(data),
    start: {
      dateTime: startDateTime,
      timeZone: data.start.timeZone ?? KOREA_TIME_ZONE,
    },
    end: {
      dateTime: endDateTime,
      timeZone: data.end?.timeZone ?? data.start.timeZone ?? KOREA_TIME_ZONE,
    },
  };
};

export async function getCalendarEvents(params?: {
  timeMin?: string;
  timeMax?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.timeMin) searchParams.set("timeMin", params.timeMin);
  if (params?.timeMax) searchParams.set("timeMax", params.timeMax);

  const query = searchParams.toString();

  try {
    return await apiRequest<Schedule[]>(
      `/api/calendar/events${query ? `?${query}` : ""}`,
      {
        method: "GET",
        skipJsonContentType: true,
      },
    );
  } catch (error) {
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

export async function updateEvent(id: string, data: CalendarEventPayload) {
  const updatedEvent = await apiRequest<Schedule>(
    `/api/calendar/events/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(toCalendarEventRequest(data)),
    },
  );

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
  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
  );
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
  );

  return getCalendarEvents({
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
  });
}