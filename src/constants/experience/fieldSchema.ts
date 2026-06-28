import type { ExperienceType } from "./experiencePresets";

type FieldSchemaItem = {
  key: string;
  label: string;
};

const DETAILED_BASE_FIELDS: FieldSchemaItem[] = [
  { key: "overview", label: "개요" },
  { key: "background", label: "시작 배경" },
  { key: "goal", label: "목표" },
  { key: "problem", label: "문제 상황" },
  { key: "myRole", label: "나의 역할" },
  { key: "execution", label: "실행 과정" },
  { key: "collab", label: "협업 방식" },
  { key: "result", label: "결과 / 성과" },
  { key: "metric", label: "수치 성과" },
  { key: "learned", label: "배운 점" },
  { key: "resumePoint", label: "자소서 활용 포인트" },
  { key: "interviewPoint", label: "면접 활용 포인트" },
];

const makeDetailedFields = (overviewLabel: string) =>
  DETAILED_BASE_FIELDS.map((field) => ({
    ...field,
    label: field.key === "overview" ? overviewLabel : field.label,
  }));

export const FIELD_SCHEMA: Record<ExperienceType, FieldSchemaItem[]> = {
  프로젝트: makeDetailedFields("프로젝트 개요"),

  대외활동: makeDetailedFields("활동 개요"),

  "인턴/직무경험": makeDetailedFields("인턴/직무경험 개요"),

  공모전: [
    { key: "overview", label: "공모전 개요" },
    { key: "idea", label: "아이디어 도출 과정" },
    { key: "planning", label: "기획 과정" },
    { key: "myRole", label: "나의 역할" },
    { key: "execution", label: "준비 / 실행 과정" },
    { key: "submission", label: "제출물 / 결과물" },
    { key: "result", label: "수상 결과 / 성과" },
    { key: "learned", label: "배운 점" },
    { key: "resumePoint", label: "자소서 활용 포인트" },
    { key: "interviewPoint", label: "면접 활용 포인트" },
  ],

  봉사활동: [
    { key: "overview", label: "봉사활동 개요" },
    { key: "motivation", label: "참여 동기" },
    { key: "target", label: "활동 대상" },
    { key: "activity", label: "활동 내용" },
    { key: "myRole", label: "나의 역할" },
    { key: "contribution", label: "기여 경험" },
    { key: "value", label: "가치관 / 느낀 점" },
    { key: "resumePoint", label: "자소서 활용 포인트" },
    { key: "interviewPoint", label: "면접 활용 포인트" },
  ],

  교환학생: [
    { key: "overview", label: "교환학생 개요" },
    { key: "reason", label: "파견 이유" },
    { key: "study", label: "학업 경험" },
    { key: "culture", label: "문화 적응 경험" },
    { key: "growth", label: "성장 경험" },
    { key: "globalPoint", label: "글로벌 역량 포인트" },
    { key: "resumePoint", label: "자소서 활용 포인트" },
    { key: "interviewPoint", label: "면접 활용 포인트" },
  ],

  어학: [
    { key: "detail", label: "상세 정보" },
    { key: "reason", label: "취득 배경" },
    { key: "studyProcess", label: "학습 과정" },
    { key: "jobFit", label: "직무 연결성" },
  ],

  자격증: [
    { key: "detail", label: "상세 정보" },
    { key: "reason", label: "취득 배경" },
    { key: "studyProcess", label: "학습 과정" },
    { key: "jobFit", label: "직무 연결성" },
  ],

  수상: [
    { key: "detail", label: "상세 정보" },
    { key: "awardBackground", label: "수상 배경" },
    { key: "contribution", label: "기여 내용" },
    { key: "meaning", label: "수상의 의미" },
    { key: "resumePoint", label: "자소서 활용 포인트" },
  ],

  수강과목: [
    { key: "detail", label: "상세 정보" },
    { key: "learned", label: "배운 내용" },
    { key: "project", label: "과제 / 프로젝트" },
    { key: "jobFit", label: "직무 연관성" },
  ],

  "교육 이수": [
    { key: "detail", label: "상세 정보" },
    { key: "content", label: "교육 내용" },
    { key: "project", label: "실습 / 프로젝트" },
    { key: "learned", label: "배운 점" },
    { key: "jobFit", label: "직무 연결성" },
  ],
};
