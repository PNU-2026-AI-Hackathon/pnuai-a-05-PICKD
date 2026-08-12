import type { Application } from "../types/application";
import type { Schedule } from "../types/schedule";
import { getGoogleEventDate } from "./date";

const normalize = (value: unknown) => String(value ?? "").trim();

export const isTodoCalendarEvent = (event: Partial<Schedule> | any) => {
  const summary = normalize(event?.summary).replace(/\s/g, "");
  const category = normalize(event?.category).replace(/\s/g, "");

  return (
    event?.type === "todo" ||
    summary.includes("[할일]") ||
    summary.includes("할일") ||
    category.includes("할일")
  );
};

export const getScheduleApplicationId = (event: any) => {
  const directValue =
    event?.applicationId ??
    event?.application?.id ??
    event?.extendedProperties?.private?.applicationId ??
    event?.extendedProperties?.shared?.applicationId ??
    event?.privateProperties?.applicationId;

  if (directValue != null && normalize(directValue)) {
    return normalize(directValue);
  }

  const searchableText = `${normalize(event?.description)} ${normalize(
    event?.summary,
  )}`;

  const markerMatch = searchableText.match(
    /(?:pickd:applicationId=|applicationId[:=]|application_id[:=])\s*(\d+)/i,
  );

  return markerMatch?.[1];
};

export const isScheduleForApplication = (
  event: any,
  application?: Pick<Application, "id" | "company" | "jobTitle"> | null,
) => {
  if (!event || !application || isTodoCalendarEvent(event)) return false;

  const eventApplicationId = getScheduleApplicationId(event);
  if (eventApplicationId) {
    return eventApplicationId === String(application.id);
  }

  const summary = normalize(event.summary);
  const company = normalize(application.company);
  const jobTitle = normalize(application.jobTitle);

  if (!company) return false;

  return summary.includes(company) && (!jobTitle || summary.includes(jobTitle));
};

export const getSchedulesForApplication = (
  events: any[] = [],
  application?: Pick<Application, "id" | "company" | "jobTitle"> | null,
) => {
  return events
    .filter((event) => isScheduleForApplication(event, application))
    .sort((a, b) => {
      const aDate = getGoogleEventDate(a)?.getTime() ?? 0;
      const bDate = getGoogleEventDate(b)?.getTime() ?? 0;
      return aDate - bDate;
    });
};

export const buildApplicationScheduleDescription = (
  memo?: string,
  application?: Pick<Application, "id" | "company" | "jobTitle"> | null,
) => {
  const lines = [normalize(memo)];

  if (application?.id != null) {
    lines.push(`pickd:applicationId=${application.id}`);
    lines.push(`pickd:company=${normalize(application.company)}`);
    lines.push(`pickd:jobTitle=${normalize(application.jobTitle)}`);
  }

  return lines.filter(Boolean).join("\n");
};
