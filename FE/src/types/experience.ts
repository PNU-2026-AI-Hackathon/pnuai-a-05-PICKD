import type {
  ExperienceType,
  FieldType,
} from "../constants/experience/experiencePresets";

export type { ExperienceType, FieldType };

export type ExperienceStatus =
  | "작성중"
  | "완료"
  | "정리 완료"
  | "보완 필요"
  | "확인 필요"
  | "정보 부족"
  | "AI 질문 필요"
  | "병합 필요";

export interface CustomTopField {
  key: string;
  label: string;
  placeholder?: string;
  type?: FieldType;
}

export type ExperienceId = string | number;

export interface ExperienceItem {
  id: ExperienceId;
  type: ExperienceType;
  name: string;
  org?: string;
  period?: string;
  role?: string;
  competencies: string[];
  keywords: string[];
  status: ExperienceStatus;
  missing: string[];
  linkedExperienceIds: ExperienceId[];
  fields: Record<string, string>;
  important?: boolean;
  pin?: boolean;
  customTopFields?: CustomTopField[];
  hiddenFieldKeys?: string[];
  topFieldOrder?: string[];
  fieldLabels?: Record<string, string>;
  documentExpanded?: boolean;
  updatedAt?: string;
  hasMergeCandidate?: boolean;
  hasUnansweredAiQuestion?: boolean;
}
