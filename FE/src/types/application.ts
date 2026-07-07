import type { Todo } from "./todo";
import type { DocumentItem } from "./document";

export const APPLICATION_STATUSES = [
  "작성 중",
  "결과 대기",
  "필기 전형",
  "면접 전형",
  "최종 결과",
] as const;

export const APPLICATION_FINAL_RESULTS = ["합격", "불합격", "포기"] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export type ApplicationFinalResult =
  | (typeof APPLICATION_FINAL_RESULTS)[number]
  | null;

export type Application = {
  id: number;
  noticeId?: number | null;
  company: string;
  jobTitle: string;
  position: string;
  industry: string;
  applyDate?: string;
  interviewDate?: string;
  deadlineDate?: string;
  applyEventId?: string | null;
  interviewEventId?: string | null;
  deadlineEventId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  status: ApplicationStatus;
  nextStep?: string;
  dday?: string | number;
  recentUpdated?: string;
  employmentType?: string;
  employType?: string;
  careerType?: string;
  jobType?: string;
  finalResult?: ApplicationFinalResult;
  sourceUrl?: string;
  url?: string;
  submitted?: boolean;
  checklistInComplete?: boolean;
  important?: boolean;
  documents?: DocumentItem[];
  memo?: string;
  todos?: Todo[];
};

export const COLUMN_OPTIONS = [
  { key: "position", label: "직무", default: true },
  { key: "employmentType", label: "고용형태", default: true },
  { key: "status", label: "현재 상태", default: true },
  { key: "deadlineDate", label: "마감일", default: true },
  { key: "dday", label: "D-day", default: true },
  { key: "checklistInComplete", label: "일정/할 일", default: true },
  { key: "industry", label: "산업", default: false },
  { key: "recentUpdated", label: "최근 수정일", default: true },
  { key: "createdAt", label: "등록일", default: true },
];

export const DEFAULT_COLUMNS = COLUMN_OPTIONS.filter(
  (column) => column.default,
).map((column) => column.key);

export type RegistrationTab = "URL" | "PDF" | "IMAGE" | "MANUAL";
