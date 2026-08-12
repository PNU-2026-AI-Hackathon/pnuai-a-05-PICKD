export const DETAILED_EXPERIENCE_TYPES = [
  "프로젝트",
  "대외활동",
  "인턴",
  "공모전",
  "봉사활동",
  "교환학생",
  "알바",
  "학부연구생",
] as const;

export const SPEC_EXPERIENCE_TYPES = [
  "어학",
  "자격증",
  "수상",
  "수강과목",
  "교육 이수",
] as const;

export const EXPERIENCE_TYPES = [
  ...DETAILED_EXPERIENCE_TYPES,
  ...SPEC_EXPERIENCE_TYPES,
] as const;

export type ExperienceType = (typeof EXPERIENCE_TYPES)[number];
export type FieldType = "text" | "textarea" | "date" | "file" | "link" | "tags";

export interface TopFieldPreset {
  key: string;
  label: string;
  placeholder?: string;
  type?: FieldType;
}

export interface ExperiencePreset {
  type: ExperienceType;
  group: "detailed" | "spec";
  titleLabel: string;
  description: string;
  topFields: TopFieldPreset[];
  writingGuide: string[];
  aiQuestions: string[];
  editorOpenByDefault: boolean;
}

const withPlaceholders = (fields: TopFieldPreset[]) =>
  fields.map((field) => ({
    type: "text" as const,
    placeholder: `${field.label} 입력`,
    ...field,
  }));

export const EXPERIENCE_PRESETS: Record<ExperienceType, ExperiencePreset> = {
  프로젝트: {
    type: "프로젝트",
    group: "detailed",
    titleLabel: "프로젝트명",
    description:
      "프로젝트 개요 · 문제/배경 · 목표 · 나의 역할 · 실행 과정 · 협업 방식 · 결과 · 수치 성과 · 배운 점 · 직무 관련성",
    editorOpenByDefault: true,
    topFields: withPlaceholders([
      { key: "ptype", label: "유형", placeholder: "사이드 프로젝트, 팀 프로젝트 등" },
      { key: "org", label: "소속 / 팀", placeholder: "수업, 동아리, 창업팀, 개인 프로젝트 등" },
      { key: "period", label: "기간", placeholder: "2025.03 ~ 2025.08" },
      { key: "role", label: "나의 역할", placeholder: "PM, 기획, 개발, 디자인 등" },
    ]),
    writingGuide: [
      "프로젝트 개요",
      "문제/배경",
      "목표",
      "나의 역할",
      "실행 과정",
      "협업 방식",
      "결과",
      "수치 성과",
      "배운 점",
      "직무 관련성",
    ],
    aiQuestions: [
      "이 프로젝트는 어떤 문제를 풀려고 했나요?",
      "본인의 구체적인 역할은 무엇이었나요?",
      "어떤 행동을 했고 어떤 과정을 거쳤나요?",
      "결과를 수치로 표현할 수 있나요?",
      "지원하려는 직무와 어떻게 연결되나요?",
    ],
  },

  대외활동: {
    type: "대외활동",
    group: "detailed",
    titleLabel: "활동명",
    description:
      "활동 개요 · 참여 동기 · 나의 역할 · 주요 활동 · 어려움/도전 · 실행 과정 · 결과 · 배운 점 · 직무 관련성",
    editorOpenByDefault: true,
    topFields: withPlaceholders([
      { key: "atype", label: "유형", placeholder: "서포터즈, 운영진, 홍보단 등" },
      { key: "org", label: "주관기관 / 운영사", placeholder: "기업, 공공기관, 학교, 단체 등" },
      { key: "period", label: "기간", placeholder: "2025.03 ~ 2025.06" },
      { key: "role", label: "나의 역할", placeholder: "기획, 운영, 콘텐츠 제작 등" },
    ]),
    writingGuide: [
      "활동 개요",
      "참여 동기",
      "나의 역할",
      "주요 활동",
      "어려움/도전",
      "실행 과정",
      "결과",
      "배운 점",
      "직무 관련성",
    ],
    aiQuestions: [
      "이 활동에서 본인의 역할은 무엇이었나요?",
      "가장 주도적으로 한 일은 무엇인가요?",
      "어려움이나 갈등은 있었나요?",
      "이 활동의 결과나 성과는 무엇인가요?",
      "이 경험은 어떤 역량을 보여줄 수 있나요?",
    ],
  },

  인턴: {
    type: "인턴",
    group: "detailed",
    titleLabel: "인턴 경험명",
    description:
      "회사/부서 개요 · 주요 업무 · 프로젝트 경험 · 문제 상황 · 나의 역할 · 실행 과정 · 협업 · 결과 · 현장에서 배운 점 · 직무 관련성",
    editorOpenByDefault: true,
    topFields: withPlaceholders([
      { key: "company", label: "회사명", placeholder: "근무 회사명" },
      { key: "dept", label: "부서", placeholder: "소속 부서" },
      { key: "position", label: "직무 / 포지션", placeholder: "직무명 또는 포지션" },
      { key: "period", label: "근무 기간", placeholder: "2025.07 ~ 2025.08" },
      { key: "empType", label: "고용 형태", placeholder: "인턴, 계약직 등" },
      { key: "tasks", label: "담당 업무", placeholder: "수행한 주요 업무" },
    ]),
    writingGuide: [
      "회사/부서 개요",
      "주요 업무",
      "프로젝트 경험",
      "문제 상황",
      "나의 역할",
      "실행 과정",
      "협업",
      "결과",
      "현장에서 배운 점",
      "직무 관련성",
    ],
    aiQuestions: [
      "인턴 기간 동안 가장 주요했던 업무는 무엇이었나요?",
      "어떤 문제를 해결했거나 개선했나요?",
      "팀원들과 어떻게 협업했나요?",
      "결과를 수치로 표현할 수 있나요?",
      "현장에서 배운 점은 무엇인가요?",
    ],
  },

  공모전: {
    type: "공모전",
    group: "detailed",
    titleLabel: "공모전명",
    description:
      "공모 주제 · 문제 정의 · 아이디어 전개 · 나의 역할 · 실행 과정 · 차별화 포인트 · 결과/수상 · 배운 점 · 자소서 활용 포인트",
    editorOpenByDefault: true,
    topFields: withPlaceholders([
      { key: "host", label: "주관기관", placeholder: "주최/주관 기관" },
      { key: "period", label: "참가 기간", placeholder: "준비 및 제출 기간" },
      { key: "team", label: "팀 / 개인 여부", placeholder: "팀, 개인, 팀 규모 등" },
      { key: "role", label: "나의 역할", placeholder: "팀장, 기획, 분석, 발표 등" },
      { key: "awardYn", label: "수상 여부", placeholder: "수상/미수상, 수상명" },
      { key: "submit", label: "제출 파일", type: "file", placeholder: "제출 파일명 또는 링크" },
    ]),
    writingGuide: [
      "공모 주제",
      "문제 정의",
      "아이디어 전개",
      "나의 역할",
      "실행 과정",
      "차별화 포인트",
      "결과/수상",
      "배운 점",
      "자소서 활용 포인트",
    ],
    aiQuestions: [
      "공모 주제는 어떤 문제에 집중했나요?",
      "아이디어는 어떻게 발전시켰나요?",
      "팀 안에서 본인의 기여는 무엇이었나요?",
      "다른 팀과 어떤 점이 달랐나요?",
      "이 경험을 자소서에 어떻게 녹일 수 있을까요?",
    ],
  },

  봉사활동: {
    type: "봉사활동",
    group: "detailed",
    titleLabel: "활동명",
    description:
      "활동 개요 · 참여 동기 · 나의 역할 · 활동 과정 · 기억에 남는 순간 · 어려움/도전 · 배운 점 · 개인 가치관 · 직무 관련성",
    editorOpenByDefault: true,
    topFields: withPlaceholders([
      { key: "org", label: "기관 / 단체", placeholder: "봉사활동 기관 또는 단체" },
      { key: "period", label: "활동 기간", placeholder: "시작일 ~ 종료일" },
      { key: "location", label: "활동 지역", placeholder: "활동 지역" },
      { key: "role", label: "나의 역할", placeholder: "봉사자, 운영 보조 등" },
      { key: "hours", label: "활동 시간", placeholder: "총 활동 시간" },
    ]),
    writingGuide: [
      "활동 개요",
      "참여 동기",
      "나의 역할",
      "활동 과정",
      "기억에 남는 순간",
      "어려움/도전",
      "배운 점",
      "개인 가치관",
      "직무 관련성",
    ],
    aiQuestions: [
      "어떤 계기로 이 봉사활동에 참여했나요?",
      "본인의 구체적인 역할은 무엇이었나요?",
      "가장 의미 있었던 순간은 언제였나요?",
      "어려움은 없었나요?",
      "이 경험이 보여주는 가치관은 무엇인가요?",
    ],
  },

  교환학생: {
    type: "교환학생",
    group: "detailed",
    titleLabel: "교환학생 경험명",
    description:
      "참여 이유 · 수강 과목 및 학업 경험 · 문화 차이 경험 · 커뮤니케이션 경험 · 문제 해결 경험 · 협업 경험 · 성장 포인트 · 직무 관련성",
    editorOpenByDefault: true,
    topFields: withPlaceholders([
      { key: "country", label: "국가", placeholder: "파견 국가" },
      { key: "univ", label: "학교명", placeholder: "파견 학교명" },
      { key: "period", label: "기간", placeholder: "시작일 ~ 종료일" },
      { key: "major", label: "전공 / 수강 분야", placeholder: "수강 분야" },
      { key: "courses", label: "수강 과목", placeholder: "주요 수강 과목" },
      { key: "activity", label: "활동 유형", placeholder: "교환학생, 어학연수 등" },
    ]),
    writingGuide: [
      "참여 이유",
      "수강 과목 및 학업 경험",
      "문화 차이 경험",
      "커뮤니케이션 경험",
      "문제 해결 경험",
      "협업 경험",
      "성장 포인트",
      "직무 관련성",
    ],
    aiQuestions: [
      "이 교환학생 경험에서 가장 성장한 부분은 무엇인가요?",
      "문화/언어 차이는 어떻게 다뤘나요?",
      "지원 직무와 연결되는 수업/프로젝트가 있었나요?",
      "어떤 커뮤니케이션 경험을 강조할 수 있나요?",
    ],
  },

  알바: {
    type: "알바",
    group: "detailed",
    titleLabel: "아르바이트 경험명",
    description:
      "근무 배경 · 담당 업무 · 고객 응대 경험 · 문제 상황 · 해결 과정 · 협업 경험 · 책임감/성실성 · 배운 점 · 직무 관련성",
    editorOpenByDefault: true,
    topFields: withPlaceholders([
      { key: "company", label: "근무처명", placeholder: "근무처명" },
      { key: "bizType", label: "업종 / 매장 유형", placeholder: "카페, 편의점, 학원 등" },
      { key: "period", label: "근무 기간", placeholder: "시작일 ~ 종료일" },
      { key: "empType", label: "근무 형태", placeholder: "파트타임, 주말 등" },
      { key: "tasks", label: "담당 업무", placeholder: "담당 업무" },
      { key: "customer", label: "고객 응대 여부", placeholder: "고객 응대 내용" },
    ]),
    writingGuide: [
      "근무 배경",
      "담당 업무",
      "고객 응대 경험",
      "문제 상황",
      "해결 과정",
      "협업 경험",
      "책임감 / 성실성",
      "배운 점",
      "직무 관련성",
    ],
    aiQuestions: [
      "이 알바에서 가장 기억에 남는 경험은 무엇인가요?",
      "어떤 어려움이 있었고 어떻게 해결했나요?",
      "책임감이나 성실성을 보여줄 수 있는 사례가 있나요?",
      "이 경험이 지원 직무와 어떻게 연결되나요?",
    ],
  },

  학부연구생: {
    type: "학부연구생",
    group: "detailed",
    titleLabel: "연구 경험명",
    description:
      "연구 배경 및 목표 · 나의 역할 · 연구 방법 · 주요 과정 · 결과물/성과 · 어려움과 극복 · 배운 점 · 직무 관련성",
    editorOpenByDefault: true,
    topFields: withPlaceholders([
      { key: "lab", label: "연구실명", placeholder: "연구실명" },
      { key: "org", label: "소속 기관", placeholder: "학교/기관명" },
      { key: "period", label: "참여 기간", placeholder: "참여 기간" },
      { key: "topic", label: "연구 주제", placeholder: "연구 주제" },
      { key: "role", label: "담당 역할", placeholder: "담당 역할" },
      { key: "output", label: "주요 결과물", placeholder: "논문, 포스터, 보고서 등" },
    ]),
    writingGuide: [
      "연구 배경 및 목표",
      "나의 역할",
      "연구 방법",
      "주요 과정",
      "결과물 / 성과",
      "어려움과 극복",
      "배운 점",
      "직무 관련성",
    ],
    aiQuestions: [
      "이 연구에서 본인의 구체적인 역할은 무엇이었나요?",
      "가장 어려웠던 부분과 어떻게 극복했나요?",
      "연구 결과물이나 성과를 수치로 표현할 수 있나요?",
      "이 경험이 지원 직무와 어떻게 연결되나요?",
    ],
  },

  어학: {
    type: "어학",
    group: "spec",
    titleLabel: "시험명",
    description: "취득 배경 · 학습 과정 · 점수/등급 · 응시일 · 유효기간 · 직무 연결성",
    editorOpenByDefault: false,
    topFields: withPlaceholders([
      { key: "score", label: "점수 / 등급", placeholder: "900점, IH, AL 등" },
      { key: "testDate", label: "응시일", type: "date", placeholder: "응시일" },
      { key: "issuedAt", label: "취득일", type: "date", placeholder: "취득일" },
      { key: "expireAt", label: "유효기간", type: "date", placeholder: "유효기간" },
      { key: "issuer", label: "시행기관", placeholder: "시행기관" },
    ]),
    writingGuide: [],
    aiQuestions: [],
  },

  자격증: {
    type: "자격증",
    group: "spec",
    titleLabel: "자격증명",
    description: "취득 이유 · 학습 과정 · 어려움 · 직무 관련성 · 지원에 활용하는 방법",
    editorOpenByDefault: false,
    topFields: withPlaceholders([
      { key: "grade", label: "급수 / 등급", placeholder: "급수 또는 등급" },
      { key: "issuer", label: "발급기관", placeholder: "발급기관" },
      { key: "issuedAt", label: "취득일", type: "date", placeholder: "취득일" },
      { key: "expireAt", label: "유효기간", type: "date", placeholder: "유효기간" },
      { key: "certNo", label: "자격번호", placeholder: "자격번호" },
      { key: "certFile", label: "증빙서류", type: "file", placeholder: "증빙서류" },
    ]),
    writingGuide: ["취득 이유", "학습 과정", "어려움", "직무 관련성", "지원에 활용하는 방법"],
    aiQuestions: [],
  },

  수상: {
    type: "수상",
    group: "spec",
    titleLabel: "수상명",
    description: "수상 배경 · 평가 기준 · 나의 기여 · 차별화 포인트 · 결과 · 자소서 활용 포인트",
    editorOpenByDefault: true,
    topFields: withPlaceholders([
      { key: "level", label: "수상 등급", placeholder: "대상, 최우수상, 장려상 등" },
      { key: "host", label: "주관기관", placeholder: "주관기관" },
      { key: "awardedAt", label: "수상일", type: "date", placeholder: "수상일" },
      { key: "linkedExp", label: "관련 활동 / 프로젝트", placeholder: "관련 활동 또는 프로젝트" },
      { key: "team", label: "팀 / 개인 여부", placeholder: "팀, 개인, 팀 규모 등" },
    ]),
    writingGuide: ["수상 배경", "평가 기준", "나의 기여", "차별화 포인트", "결과", "자소서 활용 포인트"],
    aiQuestions: [
      "이 수상의 배경에는 어떤 활동이 있었나요?",
      "평가 기준에서 어떤 점이 강점이었나요?",
      "본인의 기여를 한 문장으로 정리하면요?",
    ],
  },

  수강과목: {
    type: "수강과목",
    group: "spec",
    titleLabel: "과목명",
    description: "배운 점 · 주요 과제 · 팀 프로젝트 · 직무 관련성 · 이 수업이 보여주는 역량",
    editorOpenByDefault: false,
    topFields: withPlaceholders([
      { key: "school", label: "학교 / 기관", placeholder: "학교 또는 기관" },
      { key: "semester", label: "수강 학기", placeholder: "2025-1, 2025-2 등" },
      { key: "credit", label: "학점", placeholder: "3학점, 2학점 등" },
      { key: "grade", label: "성적", placeholder: "A+, A0, P 등" },
      { key: "skill", label: "관련 역량", placeholder: "자료구조, 데이터 분석 등" },
    ]),
    writingGuide: ["배운 점", "주요 과제", "팀 프로젝트", "직무 관련성", "이 수업이 보여주는 역량"],
    aiQuestions: [],
  },

  "교육 이수": {
    type: "교육 이수",
    group: "spec",
    titleLabel: "교육명",
    description: "참여 이유 · 배운 점 · 프로젝트/실습 경험 · 직무 관련성 · 지원에 활용하는 방법",
    editorOpenByDefault: false,
    topFields: withPlaceholders([
      { key: "org", label: "운영기관", placeholder: "운영기관" },
      { key: "period", label: "교육 기간", placeholder: "교육 기간" },
      { key: "status", label: "수료 여부", placeholder: "수료, 진행 중, 미수료 등" },
      { key: "field", label: "교육 분야", placeholder: "교육 분야" },
      { key: "hours", label: "이수 시간", placeholder: "이수 시간" },
    ]),
    writingGuide: ["참여 이유", "배운 점", "프로젝트/실습 경험", "직무 관련성", "지원에 활용하는 방법"],
    aiQuestions: [],
  },
};

export const KEYWORD_OPTIONS = [
  "문제해결",
  "기획력",
  "소통",
  "실행력",
  "데이터 분석",
  "글로벌",
  "팀워크",
  "사용자조사",
  "리더십",
  "창업",
  "공익성",
];

export const EXTRA_FIELD_OPTIONS = [
  { key: "links", label: "관련 링크", type: "link" as const },
  { key: "portfolio", label: "포트폴리오 링크", type: "link" as const },
  { key: "official", label: "공식 링크", type: "link" as const },
  { key: "press", label: "관련 기사", type: "link" as const },
  { key: "evidence", label: "증빙 파일", type: "file" as const },
  { key: "teamSize", label: "팀 규모", type: "text" as const },
  { key: "stack", label: "사용 도구/기술", type: "text" as const },
  { key: "detail", label: "상세 메모", type: "textarea" as const },
  { key: "related", label: "관련 자료", type: "link" as const },
];
