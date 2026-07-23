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

  if (application.manualRegistration) {
    return {
      label: "지원마감일",
      date:
        application.deadlineDate ??
        findPickdScheduleDate(application, ["지원마감", "마감"]) ??
        null,
    };
  }

  if (application.status === "서류전형") {
    return {
      label: "서류제출마감",
      date:
        application.applyDate ??
        findPickdScheduleDate(application, ["서류", "제출"]) ??
        application.deadlineDate ??
        null,
    };
  }

  if (application.status === "필기전형") {
    return {
      label: "필기일",
      date:
        findPickdScheduleDate(application, ["필기", "NCS", "코딩테스트"]) ??
        application.applyDate ??
        application.deadlineDate ??
        null,
    };
  }

  if (application.status === "면접전형") {
    return {
      label: "면접일",
      date:
        application.interviewDate ??
        findPickdScheduleDate(application, ["면접"]) ??
        application.deadlineDate ??
        null,
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
