import { apiRequest } from "./http";
import {
  EXPERIENCE_PRESETS,
  type ExperienceType,
} from "../constants/experience/experiencePresets";
import type { ExperienceItem, ExperienceStatus } from "../types/experience";

export type BackendExperienceType =
  | "PROJECT"
  | "ACTIVITY"
  | "INTERN"
  | "CONTEST"
  | "VOLUNTEER"
  | "EXCHANGE"
  | "LANGUAGE"
  | "LICENSE"
  | "AWARD"
  | "COURSE"
  | "EDUCATION"
  | "ALBA"
  | "RESEARCH";

export type BackendExperienceGroup = "NARRATIVE" | "SPEC";
export type BackendExperienceStatus = "IN_PROGRESS" | "COMPLETED";

export interface BackendExperienceFile {
  id: string;
  originalFilename: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  source: string;
}

export interface BackendExperienceLink {
  id?: string;
  title: string;
  url: string;
  materialType?: string;
  documentPosition?: number;
}

export interface BackendExperienceResponse {
  id: string;
  userId: number;
  title: string;
  experienceType: BackendExperienceType | string | null;
  experienceGroup: BackendExperienceGroup | string | null;
  status: BackendExperienceStatus | string | null;
  documentContent?: string | null;
  attributes?: Record<string, unknown> | null;
  keywords?: string[] | null;
  important?: boolean | null;
  pin?: boolean | null;
  files?: BackendExperienceFile[] | null;
  links?: BackendExperienceLink[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ExperienceTempResponse {
  id: number;
  userId: number;
  experienceName: string;
  experienceGroup: BackendExperienceGroup | string | null;
  experienceType: BackendExperienceType | string | null;
  createdAt: string;
}

export interface ExperienceSnapshot {
  title: string;
  experienceType: BackendExperienceType | string | null;
  experienceGroup: BackendExperienceGroup | string | null;
  status: BackendExperienceStatus | string | null;
  documentContent?: string | null;
  attributes?: Record<string, unknown> | null;
  keywords?: string[] | null;
  important?: boolean | null;
  pin?: boolean | null;
}

export type DuplicateItemSource = "EXISTING" | "EXTRACTED";

export interface DuplicateItemResponse {
  itemId: string;
  source: DuplicateItemSource;
  similarity?: number | null;
  experience: ExperienceSnapshot;
}

export interface DuplicateGroupResponse {
  groupId: string;
  items: DuplicateItemResponse[];
}

export interface ExperienceStep2Response {
  savedExperiences: BackendExperienceResponse[];
  duplicateBatchId: string | null;
  duplicateGroups: DuplicateGroupResponse[];
}

export interface ExperiencePendingBatch {
  duplicateBatchId: string;
  createdAt: string;
  duplicateGroups: DuplicateGroupResponse[];
}

export interface ExperiencePendingBatchesResponse {
  batches: ExperiencePendingBatch[];
}

export interface ExperienceStep3Request {
  duplicateBatchId: string;
  groups: Array<{
    groupId: string;
    selectedItemIds: string[];
  }>;
}

export interface ExperienceStep3Response {
  selectedExperiences: BackendExperienceResponse[];
  deletedExperienceIds: string[];
}

const TYPE_TO_BACKEND: Record<ExperienceType, BackendExperienceType> = {
  프로젝트: "PROJECT",
  대외활동: "ACTIVITY",
  인턴: "INTERN",
  공모전: "CONTEST",
  봉사활동: "VOLUNTEER",
  교환학생: "EXCHANGE",
  알바: "ALBA",
  학부연구생: "RESEARCH",
  어학: "LANGUAGE",
  자격증: "LICENSE",
  수상: "AWARD",
  수강과목: "COURSE",
  "교육 이수": "EDUCATION",
};

const TYPE_FROM_BACKEND: Record<string, ExperienceType> = {
  PROJECT: "프로젝트",
  ACTIVITY: "대외활동",
  INTERN: "인턴",
  CONTEST: "공모전",
  VOLUNTEER: "봉사활동",
  EXCHANGE: "교환학생",
  ALBA: "알바",
  RESEARCH: "학부연구생",
  LANGUAGE: "어학",
  LICENSE: "자격증",
  AWARD: "수상",
  COURSE: "수강과목",
  EDUCATION: "교육 이수",
};

const STATUS_TO_BACKEND: Record<string, BackendExperienceStatus> = {
  작성중: "IN_PROGRESS",
  "보완 필요": "IN_PROGRESS",
  "확인 필요": "IN_PROGRESS",
  "정보 부족": "IN_PROGRESS",
  "AI 질문 필요": "IN_PROGRESS",
  "병합 필요": "IN_PROGRESS",
  완료: "COMPLETED",
  "정리 완료": "COMPLETED",
};

const ATTRIBUTE_KEY_TO_FRONTEND: Record<string, string> = {
  organization: "org",
  department: "dept",
  task: "tasks",
  work_type: "workType",
  workplace_name: "workplace",
  lab_name: "lab",
  project_name: "projectName",
  activity_name: "activityName",
  competition_name: "competitionName",
  certificate_name: "certificateName",
  exam_name: "examName",
  award_name: "awardName",
  course_name: "courseName",
  education_name: "educationName",
  acquisition_date: "issuedAt",
  award_date: "awardedAt",
  exam_date: "testDate",
  expiration_date: "expirationDate",
};

const FRONTEND_KEY_TO_ATTRIBUTE: Record<string, string> = Object.fromEntries(
  Object.entries(ATTRIBUTE_KEY_TO_FRONTEND).map(([backendKey, frontendKey]) => [
    frontendKey,
    backendKey,
  ]),
);

const ATTRIBUTE_LABELS: Record<string, string> = {
  projectName: "프로젝트명",
  activityName: "활동명",
  competitionName: "공모전명",
  workplace: "근무처명",
  lab: "연구실명",
  org: "기관/소속",
  dept: "부서",
  tasks: "담당 업무",
  workType: "업무 유형",
  achievements: "주요 성과",
  key_experience: "주요 경험",
  research_topic: "연구 주제",
  deliverables: "주요 결과물",
  location: "국가/도시",
  major: "전공/분야",
  examName: "시험명",
  score: "점수/등급",
  testDate: "응시일",
  expirationDate: "유효기간",
  certificateName: "자격증명",
  issuedAt: "취득일",
  awardName: "수상명",
  awardedAt: "수상일",
  award_grade: "수상 구분",
  courseName: "과목명",
  semester: "이수 학기",
  credit: "학점",
  grade: "성적",
  educationName: "교육명",
  completion_status: "수료 여부",
  period: "기간",
  role: "나의 역할",
};

export function toBackendExperienceType(
  type: ExperienceType | string | null | undefined,
): BackendExperienceType {
  if (!type) return "PROJECT";
  if (type in TYPE_FROM_BACKEND) return type as BackendExperienceType;
  return TYPE_TO_BACKEND[type as ExperienceType] ?? "PROJECT";
}

export function fromBackendExperienceType(
  type: string | null | undefined,
): ExperienceType {
  if (!type) return "프로젝트";
  return TYPE_FROM_BACKEND[type] ?? "프로젝트";
}

export function toBackendExperienceGroup(
  type: ExperienceType,
): BackendExperienceGroup {
  return EXPERIENCE_PRESETS[type]?.group === "spec" ? "SPEC" : "NARRATIVE";
}

export function fromBackendExperienceGroup(group: string | null | undefined) {
  return group === "SPEC" ? "스펙·증빙형" : "상세 서술형";
}

export function toBackendExperienceStatus(
  status: ExperienceStatus | string | null | undefined,
): BackendExperienceStatus {
  return STATUS_TO_BACKEND[status ?? ""] ?? "IN_PROGRESS";
}

export function fromBackendExperienceStatus(
  status: string | null | undefined,
): ExperienceStatus {
  return status === "COMPLETED" ? "정리 완료" : "작성중";
}

function toStringRecord(attributes?: Record<string, unknown> | null) {
  const result: Record<string, string> = {};

  Object.entries(attributes ?? {}).forEach(([rawKey, rawValue]) => {
    if (rawValue == null) return;
    const key = ATTRIBUTE_KEY_TO_FRONTEND[rawKey] ?? rawKey;
    result[key] = Array.isArray(rawValue)
      ? rawValue.join(", ")
      : typeof rawValue === "object"
        ? JSON.stringify(rawValue)
        : String(rawValue);
  });

  return result;
}

function formatUpdatedAt(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}.${month}.${day}`;
}

function makeCustomFields(
  type: ExperienceType,
  fields: Record<string, string>,
) {
  const presetKeys = new Set(
    EXPERIENCE_PRESETS[type]?.topFields.map((field) => field.key) ?? [],
  );

  return Object.keys(fields)
    .filter((key) => key !== "__body" && !presetKeys.has(key))
    .map((key) => ({
      key,
      label: ATTRIBUTE_LABELS[key] ?? key,
      placeholder: `${ATTRIBUTE_LABELS[key] ?? key} 입력`,
    }));
}

export function fromBackendExperience(
  data: BackendExperienceResponse,
  meta?: Partial<ExperienceItem>,
): ExperienceItem {
  const type = fromBackendExperienceType(data.experienceType);
  const fields = toStringRecord(data.attributes);
  const body = data.documentContent ?? "";
  if (body) fields.__body = body;

  return {
    id: data.id,
    type,
    name: data.title || "제목 없는 경험",
    org: fields.org || fields.company || fields.host || fields.issuer || "",
    period:
      fields.period ||
      fields.testDate ||
      fields.issuedAt ||
      fields.awardedAt ||
      "",
    role: fields.role || "",
    competencies: [],
    keywords: data.keywords ?? [],
    status: fromBackendExperienceStatus(data.status),
    missing: [],
    linkedExperienceIds: [],
    fields,
    important: Boolean(data.important ?? meta?.important ?? false),
    pin: Boolean(data.pin ?? meta?.pin ?? false),
    customTopFields: meta?.customTopFields ?? makeCustomFields(type, fields),
    hiddenFieldKeys: meta?.hiddenFieldKeys ?? [],
    topFieldOrder: meta?.topFieldOrder,
    fieldLabels: meta?.fieldLabels ?? {},
    documentExpanded: meta?.documentExpanded,
    updatedAt: formatUpdatedAt(data.updatedAt ?? data.createdAt),
    hasMergeCandidate: meta?.hasMergeCandidate ?? false,
    hasUnansweredAiQuestion: meta?.hasUnansweredAiQuestion ?? false,
  };
}

export function fromSnapshotExperience(
  itemId: string,
  snapshot: ExperienceSnapshot,
): ExperienceItem {
  return fromBackendExperience({
    id: itemId,
    userId: 0,
    title: snapshot.title,
    experienceType: snapshot.experienceType,
    experienceGroup: snapshot.experienceGroup,
    status: snapshot.status,
    documentContent: snapshot.documentContent,
    attributes: snapshot.attributes,
    keywords: snapshot.keywords,
    important: snapshot.important,
    pin: snapshot.pin,
    files: [],
    links: [],
  });
}

export function toExperienceRequest(item: Partial<ExperienceItem>) {
  const type = item.type ?? "프로젝트";
  const attributes: Record<string, string> = {};

  Object.entries(item.fields ?? {}).forEach(([key, value]) => {
    if (key === "__body") return;
    if (value == null || String(value).trim() === "") return;
    attributes[FRONTEND_KEY_TO_ATTRIBUTE[key] ?? key] = String(value);
  });

  if (item.org && !attributes.organization && !attributes.org) {
    attributes.organization = item.org;
  }
  if (item.period && !attributes.period) attributes.period = item.period;
  if (item.role && !attributes.role) attributes.role = item.role;

  return {
    title: item.name?.trim() || "새 경험",
    experienceType: toBackendExperienceType(type),
    experienceGroup: toBackendExperienceGroup(type),
    status: toBackendExperienceStatus(item.status),
    documentContent: item.fields?.__body ?? "",
    attributes,
    keywords: item.keywords ?? [],
    important: Boolean(item.important),
    pin: Boolean(item.pin),
    links: [],
    forceCreate: true,
  };
}

export async function getExperiences(params?: {
  type?: ExperienceType;
  group?: BackendExperienceGroup;
}) {
  const searchParams = new URLSearchParams();
  if (params?.type)
    searchParams.set("type", toBackendExperienceType(params.type));
  if (params?.group) searchParams.set("group", params.group);

  const query = searchParams.toString();
  const result = await apiRequest<BackendExperienceResponse[]>(
    `/api/experiences${query ? `?${query}` : ""}`,
    { method: "GET", skipJsonContentType: true },
  );

  return result.map((item) => fromBackendExperience(item));
}

export async function getExperience(id: string | number) {
  const result = await apiRequest<BackendExperienceResponse>(
    `/api/experiences/${id}`,
    { method: "GET", skipJsonContentType: true },
  );

  return fromBackendExperience(result);
}

export async function createExperience(data: Partial<ExperienceItem>) {
  const response = await apiRequest<{ id: string }>("/api/experiences", {
    method: "POST",
    body: JSON.stringify(toExperienceRequest(data)),
  });

  window.dispatchEvent(new Event("experienceUpdated"));
  return response.id;
}

export async function updateExperience(
  id: string | number,
  data: Partial<ExperienceItem>,
) {
  const result = await apiRequest<BackendExperienceResponse>(
    `/api/experiences/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(toExperienceRequest(data)),
    },
  );

  window.dispatchEvent(new Event("experienceUpdated"));
  return fromBackendExperience(result);
}

export async function deleteExperience(id: string | number) {
  await apiRequest<void>(`/api/experiences/${id}`, {
    method: "DELETE",
    skipJsonContentType: true,
  });

  window.dispatchEvent(new Event("experienceUpdated"));
}

export async function extractExperienceStep1(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<ExperienceTempResponse[]>(
    "/api/experiences/extract/step1",
    {
      method: "POST",
      body: formData,
      skipJsonContentType: true,
    },
  );
}

export async function extractExperienceStep2(selectedTempIds: number[]) {
  return apiRequest<ExperienceStep2Response>(
    "/api/v2/experiences/extract/step2",
    {
      method: "POST",
      body: JSON.stringify({ selectedTempIds }),
    },
  );
}

export async function confirmExperienceStep3(payload: ExperienceStep3Request) {
  return apiRequest<ExperienceStep3Response>(
    "/api/v2/experiences/extract/step3",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function getPendingDuplicateBatches() {
  return apiRequest<ExperiencePendingBatchesResponse>(
    "/api/v2/experiences/extract/duplicates/pending",
    { method: "GET", skipJsonContentType: true },
  );
}

export function getExistingItemIdsFromPendingBatches(
  batches: ExperiencePendingBatch[],
) {
  const ids = new Set<string>();

  batches.forEach((batch) => {
    batch.duplicateGroups.forEach((group) => {
      group.items.forEach((item) => {
        if (item.source === "EXISTING") ids.add(item.itemId);
      });
    });
  });

  return ids;
}
