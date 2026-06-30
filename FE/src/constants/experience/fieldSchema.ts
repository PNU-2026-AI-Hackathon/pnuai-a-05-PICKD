import type { ExperienceType } from "./experiencePresets";

type FieldSchemaItem = {
  key: string;
  label: string;
};

const commonNarrativeFields: FieldSchemaItem[] = [
  { key: "overview", label: "개요" },
  { key: "motivation", label: "참여 동기 / 배경" },
  { key: "problem", label: "문제 상황" },
  { key: "myRole", label: "나의 역할" },
  { key: "execution", label: "실행 과정" },
  { key: "collab", label: "협업 방식" },
  { key: "result", label: "결과 / 성과" },
  { key: "learned", label: "배운 점" },
  { key: "resumePoint", label: "자소서 활용 포인트" },
  { key: "interviewPoint", label: "면접 활용 포인트" },
];

export const FIELD_SCHEMA: Record<ExperienceType, FieldSchemaItem[]> = {
  프로젝트: [
    { key: "overview", label: "프로젝트 개요" },
    { key: "background", label: "문제/배경" },
    { key: "goal", label: "목표" },
    { key: "myRole", label: "나의 역할" },
    { key: "execution", label: "실행 과정" },
    { key: "collab", label: "협업 방식" },
    { key: "result", label: "결과" },
    { key: "metric", label: "수치 성과" },
    { key: "learned", label: "배운 점" },
    { key: "jobFit", label: "직무 관련성" },
  ],
  대외활동: commonNarrativeFields,
  인턴: commonNarrativeFields,
  공모전: [
    { key: "topic", label: "공모 주제" },
    { key: "problem", label: "문제 정의" },
    { key: "idea", label: "아이디어 전개" },
    { key: "myRole", label: "나의 역할" },
    { key: "execution", label: "실행 과정" },
    { key: "difference", label: "차별화 포인트" },
    { key: "result", label: "결과 / 수상" },
    { key: "learned", label: "배운 점" },
    { key: "resumePoint", label: "자소서 활용 포인트" },
  ],
  봉사활동: commonNarrativeFields,
  교환학생: [
    { key: "reason", label: "참여 이유" },
    { key: "study", label: "수강 과목 및 학업 경험" },
    { key: "culture", label: "문화 차이 경험" },
    { key: "communication", label: "커뮤니케이션 경험" },
    { key: "problem", label: "문제 해결 경험" },
    { key: "collab", label: "협업 경험" },
    { key: "growth", label: "성장 포인트" },
    { key: "jobFit", label: "직무 관련성" },
  ],
  알바: commonNarrativeFields,
  학부연구생: commonNarrativeFields,
  어학: [
    { key: "reason", label: "취득 배경" },
    { key: "studyProcess", label: "학습 과정" },
    { key: "jobFit", label: "직무 연결성" },
  ],
  자격증: [
    { key: "reason", label: "취득 이유" },
    { key: "studyProcess", label: "학습 과정" },
    { key: "difficulty", label: "어려움" },
    { key: "jobFit", label: "직무 관련성" },
  ],
  수상: [
    { key: "background", label: "수상 배경" },
    { key: "criteria", label: "평가 기준" },
    { key: "contribution", label: "나의 기여" },
    { key: "difference", label: "차별화 포인트" },
    { key: "result", label: "결과" },
    { key: "resumePoint", label: "자소서 활용 포인트" },
  ],
  수강과목: [
    { key: "learned", label: "배운 점" },
    { key: "assignment", label: "주요 과제" },
    { key: "teamProject", label: "팀 프로젝트" },
    { key: "jobFit", label: "직무 관련성" },
    { key: "competency", label: "이 수업이 보여주는 역량" },
  ],
  "교육 이수": [
    { key: "reason", label: "참여 이유" },
    { key: "learned", label: "배운 점" },
    { key: "project", label: "프로젝트 / 실습 경험" },
    { key: "jobFit", label: "직무 관련성" },
    { key: "usage", label: "지원에 활용하는 방법" },
  ],
};
