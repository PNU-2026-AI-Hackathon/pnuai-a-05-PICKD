export const DETAILED_EXPERIENCE_TYPES = [
  "프로젝트",
  "대외활동",
  "인턴/직무경험",
  "공모전",
  "봉사활동",
  "교환학생",
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

export interface TopFieldPreset {
  key: string;
  label: string;
  placeholder?: string;
}

export interface ExperiencePreset {
  type: ExperienceType;
  group: "detailed" | "spec";
  titleLabel: string;
  description: string;
  topFields: TopFieldPreset[];
}

export const EXPERIENCE_PRESETS: Record<ExperienceType, ExperiencePreset> = {
  프로젝트: {
    type: "프로젝트",
    group: "detailed",
    titleLabel: "프로젝트명",
    description:
      "프로젝트 개요 · 문제/배경 · 목표 · 나의 역할 · 실행 과정 · 협업 방식 · 결과 · 수치 성과 · 배운 점 · 직무 관련성",
    topFields: [
      {
        key: "period",
        label: "진행 기간",
        placeholder: "시작일 ~ 종료일",
      },
      {
        key: "role",
        label: "역할",
        placeholder: "기획, PM, 디자인, 개발, 마케팅 등",
      },
      {
        key: "org",
        label: "소속 / 팀",
        placeholder: "수업, 동아리, 창업팀, 개인 프로젝트 등",
      },
    ],
  },

  대외활동: {
    type: "대외활동",
    group: "detailed",
    titleLabel: "대외활동명",
    description:
      "참여 이유 · 활동 내용 · 나의 역할 · 협업 경험 · 문제 해결 경험 · 성과 · 배운 점 · 직무 관련성",
    topFields: [
      {
        key: "org",
        label: "주관기관",
        placeholder: "기업, 공공기관, 학교, 단체 등",
      },
      {
        key: "period",
        label: "활동 기간",
        placeholder: "시작일 ~ 종료일",
      },
      {
        key: "role",
        label: "역할",
        placeholder: "서포터즈, 운영진, 기획단, 홍보단 등",
      },
      {
        key: "result",
        label: "주요 성과",
        placeholder: "수료, 우수활동, 수상, 콘텐츠 성과 등",
      },
    ],
  },

  "인턴/직무경험": {
    type: "인턴/직무경험",
    group: "detailed",
    titleLabel: "경험명",
    description:
      "회사/기관 소개 · 담당 업무 · 업무 수행 과정 · 문제 해결 경험 · 성과 · 직무 연결성 · 배운 점",
    topFields: [
      {
        key: "org",
        label: "회사 / 기관명",
        placeholder: "근무 또는 참여 기관",
      },
      {
        key: "department",
        label: "직무 / 부서",
        placeholder: "직무명 또는 부서명",
      },
      {
        key: "period",
        label: "근무 / 참여 기간",
        placeholder: "시작일 ~ 종료일",
      },
      {
        key: "task",
        label: "담당 업무",
        placeholder: "수행한 주요 업무 요약",
      },
      {
        key: "result",
        label: "주요 성과",
        placeholder: "업무 개선, 보고서 작성, 프로젝트 참여, 정량 성과 등",
      },
    ],
  },

  공모전: {
    type: "공모전",
    group: "detailed",
    titleLabel: "공모전명",
    description:
      "참가 이유 · 아이디어 도출 · 기획 과정 · 나의 역할 · 제출물 · 수상 결과 · 배운 점",
    topFields: [
      {
        key: "org",
        label: "주관기관",
        placeholder: "주최/주관 기관",
      },
      {
        key: "period",
        label: "참가 기간",
        placeholder: "준비 및 제출 기간",
      },
      {
        key: "role",
        label: "역할",
        placeholder: "팀장, 기획, 분석, 발표, 디자인 등",
      },
      {
        key: "result",
        label: "수상 / 결과",
        placeholder: "대상, 최우수상, 장려상, 참가 등",
      },
    ],
  },

  봉사활동: {
    type: "봉사활동",
    group: "detailed",
    titleLabel: "봉사활동명",
    description:
      "참여 동기 · 활동 대상 · 활동 내용 · 기여 경험 · 가치관 · 느낀 점 · 직무 관련성",
    topFields: [
      {
        key: "org",
        label: "기관 / 단체",
        placeholder: "봉사활동 기관 또는 단체",
      },
      {
        key: "period",
        label: "활동 기간",
        placeholder: "시작일 ~ 종료일",
      },
      {
        key: "role",
        label: "역할",
        placeholder: "봉사자, 운영 보조, 교육 지원, 멘토 등",
      },
    ],
  },

  교환학생: {
    type: "교환학생",
    group: "detailed",
    titleLabel: "교환학생 경험명",
    description:
      "참여 이유 · 수강 과목 및 학업 경험 · 문화 차이 경험 · 커뮤니케이션 경험 · 문제 해결 경험 · 협업 경험 · 성장 포인트 · 직무 관련성",
    topFields: [
      {
        key: "country",
        label: "국가 / 도시",
        placeholder: "파견 국가 및 도시",
      },
      {
        key: "org",
        label: "학교명",
        placeholder: "교환학생 파견 학교",
      },
      {
        key: "period",
        label: "기간",
        placeholder: "시작일 ~ 종료일",
      },
      {
        key: "majorField",
        label: "전공 / 수강 분야",
        placeholder: "수강한 전공 또는 학업 분야",
      },
    ],
  },

  어학: {
    type: "어학",
    group: "spec",
    titleLabel: "시험명",
    description:
      "취득 배경 · 학습 과정 · 점수/등급 · 응시일 · 유효기간 · 직무 연결성",
    topFields: [
      {
        key: "score",
        label: "점수 / 등급",
        placeholder: "900점, IH, AL 등",
      },
      {
        key: "testDate",
        label: "응시일",
        placeholder: "시험 응시 날짜",
      },
      {
        key: "expiryDate",
        label: "유효기간",
        placeholder: "성적 만료일",
      },
      {
        key: "certificate",
        label: "성적표",
        placeholder: "성적표 파일 첨부",
      },
    ],
  },

  자격증: {
    type: "자격증",
    group: "spec",
    titleLabel: "자격증명",
    description:
      "취득 배경 · 학습 과정 · 발급기관 · 취득일 · 유효기간 · 직무 연결성",
    topFields: [
      {
        key: "org",
        label: "발급기관",
        placeholder: "자격증 발급 기관",
      },
      {
        key: "acquiredDate",
        label: "취득일",
        placeholder: "자격증 취득 날짜",
      },
      {
        key: "expiryDate",
        label: "유효기간",
        placeholder: "유효기간이 있는 경우 입력",
      },
      {
        key: "certificate",
        label: "자격증 사본",
        placeholder: "자격증 파일 첨부",
      },
    ],
  },

  수상: {
    type: "수상",
    group: "spec",
    titleLabel: "수상명",
    description:
      "수상 배경 · 기여 내용 · 수상 결과 · 수상의 의미 · 직무 관련성",
    topFields: [
      {
        key: "org",
        label: "수여기관",
        placeholder: "상을 수여한 기관",
      },
      {
        key: "awardDate",
        label: "수상일",
        placeholder: "수상 날짜",
      },
      {
        key: "awardType",
        label: "수상 구분",
        placeholder: "대상, 최우수상, 우수상, 장려상 등",
      },
      {
        key: "certificate",
        label: "수상 증빙",
        placeholder: "상장 또는 증빙자료 첨부",
      },
    ],
  },

  수강과목: {
    type: "수강과목",
    group: "spec",
    titleLabel: "수강 과목명",
    description:
      "수강 이유 · 수강 과목 및 학업 경험 · 배운 내용 · 과제/프로젝트 · 성적 · 직무 연관성",
    topFields: [
      {
        key: "semester",
        label: "이수 학기",
        placeholder: "2025-1, 2025-2 등",
      },
      {
        key: "credit",
        label: "학점",
        placeholder: "3학점, 2학점 등",
      },
      {
        key: "grade",
        label: "성적",
        placeholder: "A+, A0, P 등",
      },
      {
        key: "relatedField",
        label: "관련 분야",
        placeholder: "데이터, 마케팅, 금융, 공공정책 등",
      },
    ],
  },

  "교육 이수": {
    type: "교육 이수",
    group: "spec",
    titleLabel: "교육 프로그램명",
    description:
      "교육 참여 이유 · 교육 내용 · 실습/프로젝트 · 수료 여부 · 배운 점 · 직무 연결성",
    topFields: [
      {
        key: "org",
        label: "운영기관",
        placeholder: "교육 운영 기관",
      },
      {
        key: "period",
        label: "교육 기간",
        placeholder: "시작일 ~ 종료일",
      },
      {
        key: "completionStatus",
        label: "수료 여부",
        placeholder: "수료, 진행 중, 미수료 등",
      },
      {
        key: "certificate",
        label: "수료증",
        placeholder: "수료증 파일 첨부",
      },
    ],
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
  { key: "relatedLink", label: "관련 링크" },
  { key: "portfolioLink", label: "포트폴리오 링크" },
  { key: "officialLink", label: "공식 링크" },
  { key: "relatedArticle", label: "관련 기사" },
  { key: "proofFile", label: "증빙 파일" },
  { key: "teamSize", label: "팀 규모" },
  { key: "tools", label: "사용 도구/기술" },
  { key: "detailMemo", label: "상세 메모" },
  { key: "relatedMaterial", label: "관련 자료" },
];
