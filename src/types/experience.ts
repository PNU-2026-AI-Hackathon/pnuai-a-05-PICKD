import type { ExperienceType } from "../constants/experience/experiencePresets";

export type { ExperienceType };

export type ExperienceStatus =
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
}

export interface ExperienceItem {
  id: number;
  type: ExperienceType;
  name: string;
  org?: string;
  period?: string;
  role?: string;
  competencies: string[];
  keywords: string[];
  status: ExperienceStatus;
  missing: string[];
  linkedExperienceIds: number[];
  fields: Record<string, string>;
  important?: boolean;
  pinned?: boolean;
  customTopFields?: CustomTopField[];
  hiddenFieldKeys?: string[];
  topFieldOrder?: string[];
  fieldLabels?: Record<string, string>;
}
