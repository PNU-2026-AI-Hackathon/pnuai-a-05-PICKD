import type { Application } from "../types/application";
import { getGoogleEventDate } from "./date";

export const PICKD_SCHEDULE_PREFIX = "[PICKD]";

const trimText = (value: unknown) => String(value ?? "").trim();

export const getScheduleTitle = (event: any) => {
  return trimText(event?.summary ?? event?.title);
};

export const isPickdSchedule = (event: any) => {
  return getScheduleTitle(event).startsWith(PICKD_SCHEDULE_PREFIX);
};

export const getPickdSchedules = (events: any[] = []) => {
  return events.filter(isPickdSchedule);
};

const getScheduleDate = (event: any) => {
  if (!event) return null;

  return (
    getGoogleEventDate(event) ??
    event.date ??
    event.deadlineDate ??
    event.startDateTime ??
    event.start?.dateTime ??
    event.start ??
    null
  );
};

const findPickdScheduleDate = (application: any, keywords: string[]) => {
  const events = getPickdSchedules(
    application?.calendarEvents ??
      application?.schedules ??
      application?.events ??
      [],
  );

  const found = events.find((event) => {
    const title = getScheduleTitle(event);
    return keywords.some((keyword) => title.includes(keyword));
  });

  return getScheduleDate(found);
};

export function getCurrentDeadlineInfo(
  application?: Partial<Application> | null,
) {
  if (!application) {
    return {
      label: "마감일",
      date: null,
    };
  }

  return {
    label: "지원마감일",
    date:
      application.deadlineDate ??
      findPickdScheduleDate(application, ["지원마감", "마감"]) ??
      null,
  };
}