import type { ExperienceItem } from "../../types/experience";

export const MOCK_EXPERIENCES: ExperienceItem[] = [
  {
    id: 1,
    type: "프로젝트",
    name: "경식이 AI 전화 서비스",
    org: "사이드 프로젝트",
    period: "2025.03 ~ 2025.08",
    role: "PM / 기획",
    importance: "높음",
    competencies: ["문제해결", "기획력"],
    keywords: ["문제해결", "사용자조사"],
    status: "정리 완료",
    missing: [],
    pinned: true,
    linkedExperienceIds: [],
    fields: {
      overview: "고령층 여가 문제 해결 AI 전화 서비스",
      problem: "고령층의 사회적 고립 문제",
      myRole: "PM 및 사용자 인터뷰 진행",
      result: "베타 만족도 4.5/5",
    },
  },

  {
    id: 2,
    type: "자격증",
    name: "컴퓨터활용능력 1급",
    org: "대한상공회의소",
    period: "2025.02",
    competencies: [],
    keywords: ["데이터 분석"],
    status: "정리 완료",
    missing: [],
    pinned: false,
    linkedExperienceIds: [],
    fields: {
      score: "1급",
      issuer: "대한상공회의소",
    },
  },
];
