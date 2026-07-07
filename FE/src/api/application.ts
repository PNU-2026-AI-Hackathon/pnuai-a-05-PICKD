import { apiRequest } from "./http";
import type { Application } from "../types/application";
import { toBackendLocalDateTime } from "../utils/date";

export type ApplicationPayload = Omit<
  Partial<Application>,
  "applyDate" | "interviewDate" | "deadlineDate"
> & {
  applyDate?: string | Date | null;
  interviewDate?: string | Date | null;
  deadlineDate?: string | Date | null;
  noticeId?: number | null;
  category?:
    | "FULL_TIME"
    | "INTERN"
    | "EXPERIENTIAL_INTERN"
    | "CONTRACT"
    | "FREELANCER"
    | string
    | null;
  jobCategory?:
    | "FULL_TIME"
    | "INTERN"
    | "EXPERIENTIAL_INTERN"
    | "CONTRACT"
    | "FREELANCER"
    | string
    | null;
  employmentType?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
};

const normalizeNullableDateTime = (value: unknown) => {
  const normalized = toBackendLocalDateTime(
    value as string | Date | null | undefined,
  );
  return normalized || null;
};

const JOB_CATEGORY_TO_BACKEND: Record<string, string> = {
  정규직: "FULL_TIME",
  계약직: "CONTRACT",
  인턴: "INTERN",
  체험형인턴: "EXPERIENTIAL_INTERN",
  "체험형 인턴": "EXPERIENTIAL_INTERN",
  프리랜서: "FREELANCER",

  FULL_TIME: "FULL_TIME",
  CONTRACT: "CONTRACT",
  INTERN: "INTERN",
  EXPERIENTIAL_INTERN: "EXPERIENTIAL_INTERN",
  FREELANCER: "FREELANCER",
};

const toBackendJobCategory = (value?: string | null) => {
  if (!value) return undefined;
  return JOB_CATEGORY_TO_BACKEND[value] ?? value;
};

export function toApplicationRequest(data: ApplicationPayload) {
  const status = data.status ?? "작성 중";

  return {
    noticeId: data.noticeId ?? null,
    company: data.company ?? "",
    jobTitle: data.jobTitle ?? "",
    position: data.position ?? "",
    industry: data.industry ?? "",
    category: toBackendJobCategory(
      data.jobCategory ?? data.category ?? data.employmentType,
    ),
    jobCategory: toBackendJobCategory(
      data.jobCategory ?? data.category ?? data.employmentType,
    ),
    startedAt: data.startedAt ?? undefined,
    endedAt: data.endedAt ?? undefined,
    status,
    finalResult: status === "최종 결과" ? (data.finalResult ?? null) : null,
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
