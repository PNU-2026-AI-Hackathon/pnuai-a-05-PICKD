import { apiRequest } from "./http";
import type { Application } from "../types/application";
import { toBackendLocalDateTime } from "../utils/date";

export type ApplicationPayload = Omit<Partial<Application>, "applyDate" | "interviewDate" | "deadlineDate"> & {
  applyDate?: string | Date | null;
  interviewDate?: string | Date | null;
  deadlineDate?: string | Date | null;
  noticeId?: number | null;
  category?: "FULL_TIME" | "INTERN" | "EXPERIENTIAL_INTERN" | "CONTRACT" | "FREELANCER";
  startedAt?: string | null;
  endedAt?: string | null;
};

const normalizeNullableDateTime = (value: unknown) => {
  const normalized = toBackendLocalDateTime(value as string | Date | null | undefined);
  return normalized || null;
};

export function toApplicationRequest(data: ApplicationPayload) {
  return {
    noticeId: data.noticeId ?? null,
    company: data.company ?? "",
    jobTitle: data.jobTitle ?? "",
    position: data.position ?? "",
    industry: data.industry ?? "",
    category: data.category ?? "FULL_TIME",
    startedAt: data.startedAt ?? undefined,
    endedAt: data.endedAt ?? undefined,
    status: data.status ?? "작성중",
    finalResult: data.status === "전형완료" ? (data.finalResult ?? null) : null,
    memo: data.memo ?? "",
    applyDate: normalizeNullableDateTime(data.applyDate),
    interviewDate: normalizeNullableDateTime(data.interviewDate),
    deadlineDate: normalizeNullableDateTime(data.deadlineDate),
    important: Boolean(data.important),
  };
}

export async function getApplications() {
  return apiRequest<Application[]>("/api/application", {
    method: "GET",
    skipJsonContentType: true,
  });
}

export async function createApplication(data: ApplicationPayload) {
  await apiRequest<void>("/api/application", {
    method: "POST",
    body: JSON.stringify(toApplicationRequest(data)),
  });

  window.dispatchEvent(new Event("applicationUpdated"));
  window.dispatchEvent(new Event("googleCalendarUpdated"));
}

export async function updateApplication(id: number, data: ApplicationPayload) {
  await apiRequest<void>(`/api/application/${id}`, {
    method: "PUT",
    body: JSON.stringify(toApplicationRequest(data)),
  });

  window.dispatchEvent(new Event("applicationUpdated"));
  window.dispatchEvent(new Event("googleCalendarUpdated"));
}

export async function deleteApplication(id: number) {
  await apiRequest<void>(`/api/application/${id}`, {
    method: "DELETE",
    skipJsonContentType: true,
  });

  window.dispatchEvent(new Event("applicationUpdated"));
  window.dispatchEvent(new Event("googleCalendarUpdated"));
}
