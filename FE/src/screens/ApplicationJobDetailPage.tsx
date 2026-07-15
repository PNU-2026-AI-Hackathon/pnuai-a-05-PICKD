import { useState, useEffect, useRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ChevronRight,
  ExternalLink,
  PenLine,
  ArrowLeft,
  Copy,
  Check,
  X,
  Plus,
  CalendarDays,
  ScrollText,
  Highlighter,
  AlertCircle,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { getApplications } from "../api/application";
import { getNoticeDetail, type NoticeDetail } from "../api/notice";
import {
  createCoverLetterItem,
  deleteCoverLetterItem,
  getCoverLetters,
  updateCoverLetterItem,
  type CoverLetterItem,
} from "../api/coverLetter";
import type { Application } from "../types/application";

type ClassValue =
  | string
  | number
  | false
  | null
  | undefined
  | Record<string, boolean | undefined | null>;

function cn(...inputs: ClassValue[]) {
  return inputs
    .flatMap((input) => {
      if (!input) return [];
      if (typeof input === "string" || typeof input === "number")
        return [String(input)];
      return Object.entries(input)
        .filter(([, value]) => Boolean(value))
        .map(([key]) => key);
    })
    .join(" ");
}

function toast(message: string) {
  const toastEl = document.createElement("div");
  toastEl.textContent = message;
  toastEl.style.cssText = [
    "position:fixed",
    "left:50%",
    "bottom:28px",
    "transform:translateX(-50%)",
    "z-index:9999",
    "background:#0F172A",
    "color:white",
    "font-size:13px",
    "font-weight:600",
    "padding:10px 14px",
    "border-radius:999px",
    "box-shadow:0 12px 24px rgba(15,23,42,.18)",
    "transition:opacity .2s ease",
  ].join(";");
  document.body.appendChild(toastEl);
  window.setTimeout(() => {
    toastEl.style.opacity = "0";
    window.setTimeout(() => toastEl.remove(), 220);
  }, 1300);
}

type ButtonVariant = "default" | "outline" | "ghost";
type ButtonSize = "sm" | "default";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children?: ReactNode;
}

function Button({
  variant = "default",
  size = "default",
  className,
  ...props
}: ButtonProps) {
  const variants: Record<ButtonVariant, string> = {
    default: "bg-[#2563EB] text-white hover:bg-[#1D4ED8]",
    outline:
      "border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC]",
    ghost: "text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]",
  };
  const sizes: Record<ButtonSize, string> = {
    sm: "h-9 px-3",
    default: "h-10 px-4",
  };

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

// ---------- Empty detail fallback ----------
const emptyJob = {
  company: "-",
  division: "-",
  title: "지원 공고 상세",
  role: "직무 미지정",
  period: "- ~ -",
  deadline: "-",
  deadlineDate: null,
  dday: null,
  expired: false,
  status: "WRITING",
  docsInProgress: [],
  sourceUrl: "#",
  basic: {
    기업명: "-",
    공고명: "-",
    "모집 직무": "-",
    산업: "-",
    근무지: "-",
    "채용 형태": "-",
    "공고 분류": "-",
    "접수 시작일": "-",
    "접수 마감일": "-",
    "D-day": "-",
    등록일: "-",
    "최근 수정일": "-",
  },
  eligibility: {
    "지원 자격": ["지원 공고 정보를 불러오면 표시됩니다."],
    "필수 조건": ["지원 공고 정보를 불러오면 표시됩니다."],
    우대사항: ["지원 공고 정보를 불러오면 표시됩니다."],
    "가산점 요소": ["지원 공고 정보를 불러오면 표시됩니다."],
    "제출 서류": ["지원 공고 정보를 불러오면 표시됩니다."],
  },
  process: [
    {
      step: "지원 일정",
      schedule: "-",
      detail: "지원 공고 정보를 불러오면 표시됩니다.",
      note: null,
    },
  ],
  essays: [],
  jobDescription: "지원 공고 정보를 불러오면 표시됩니다.",
  competencies: ["지원 공고 정보를 불러오면 표시됩니다."],
  rawSource: "",
};

type DetailEssay = {
  id?: number;
  no: number;
  question: string;
  charLimit: number;
  status: "미작성" | "작성중" | "초안" | "완료";
  updated: string | null;
  preview: string | null;
  answer?: string | null;
  orderIndex?: number | null;
  aiGenerated?: boolean;
  source?: "APPLICATION" | "NOTICE";
};

type EssayDraft = {
  id?: number;
  question: string;
  answer: string;
  maxLength: string;
  orderIndex: number;
  aiGenerated: boolean;
  source?: "APPLICATION" | "NOTICE";
};

const EMPTY_DRAFT: EssayDraft = {
  question: "",
  answer: "",
  maxLength: "",
  orderIndex: 0,
  aiGenerated: false,
};

function splitText(value?: string | null) {
  if (!value) return [];
  return value
    .split(/\n|•|ㆍ|·|-/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function compact(values: Array<string | null | undefined>) {
  return values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
}

function formatDate(value?: string | Date | null) {
  if (!value) return "-";
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "-";
    return value.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  return value;
}

function formatDateTime(value?: string | Date | null) {
  if (!value) return "-";
  const normalized =
    value instanceof Date ? value : new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(normalized.getTime())) return String(value);

  return normalized.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDate(value?: string | Date | null) {
  if (!value) return null;
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? null : value;

  const parsed = new Date(String(value).replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getDday(value?: string | Date | null) {
  const target = toDate(value);
  if (!target) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDay = new Date(target);
  targetDay.setHours(0, 0, 0, 0);

  return Math.ceil((targetDay.getTime() - today.getTime()) / 86_400_000);
}

function formatDday(dday: number | null) {
  if (dday == null) return "-";
  if (dday < 0) return `D+${Math.abs(dday)}`;
  if (dday === 0) return "D-day";
  return `D-${dday}`;
}

function getRelativeTime(value?: string | null) {
  const date = toDate(value);
  if (!date) return null;
  const diff = Date.now() - date.getTime();
  const minute = Math.floor(diff / 60_000);
  if (minute < 1) return "방금 전";
  if (minute < 60) return `${minute}분 전`;
  const hour = Math.floor(minute / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day}일 전`;
  return formatDate(date);
}

function labelEmploymentType(value?: string | null) {
  const labels: Record<string, string> = {
    FULL_TIME: "정규직",
    INTERN: "인턴",
    EXPERIENTIAL_INTERN: "체험형 인턴",
    CONTRACT: "계약직",
    FREELANCER: "프리랜서",
  };
  return value ? (labels[value] ?? value) : "-";
}

function labelCategory(value?: string | null) {
  const labels: Record<string, string> = {
    FULL_TIME: "신입/정규직",
    INTERN: "인턴",
    EXPERIENTIAL_INTERN: "체험형 인턴",
    CONTRACT: "계약직",
    FREELANCER: "프리랜서",
  };
  return value ? (labels[value] ?? value) : "-";
}

function getApplicationDeadline(
  application: Application | null,
  notice: NoticeDetail | null,
) {
  return application?.deadlineDate ?? notice?.endedAt ?? null;
}

function buildEligibility(
  application: Application | null,
  notice: NoticeDetail | null,
) {
  const sections = notice?.sections ?? [];
  const documents = notice?.documents ?? [];

  const generalQualifications = sections.flatMap((section) =>
    (section.qualifications ?? []).flatMap((qualification) =>
      splitText(qualification.generalQualification),
    ),
  );

  const mandatoryQualifications = sections.flatMap((section) =>
    (section.qualifications ?? []).flatMap((qualification) =>
      splitText(qualification.mandatoryQualification),
    ),
  );

  const generalPreferences = sections.flatMap((section) =>
    (section.preferences ?? []).flatMap((preference) =>
      splitText(preference.generalPreference),
    ),
  );

  const additionalPoints = sections.flatMap((section) =>
    (section.preferences ?? []).flatMap((preference) =>
      compact([
        preference.additionalPoints,
        preference.certificatePreference,
        preference.veteranPreference,
        preference.disabilityPreference,
      ]).flatMap(splitText),
    ),
  );

  const submitDocuments = documents.flatMap((document) =>
    compact([
      document.mandatoryDocuments,
      document.proofDocuments,
      document.submissionNotes,
    ]).flatMap(splitText),
  );

  const fallbackSubmitDocuments = (application?.documents ?? []).map(
    (document) => document.title,
  );

  return {
    "지원 자격":
      generalQualifications.length > 0
        ? generalQualifications
        : ["공고에서 별도 지원 자격을 확인하지 못했어요."],
    "필수 조건":
      mandatoryQualifications.length > 0
        ? mandatoryQualifications
        : [application?.position || "지원 직무 정보를 확인해 주세요."],
    우대사항:
      generalPreferences.length > 0
        ? generalPreferences
        : ["등록된 우대사항이 없어요."],
    "가산점 요소":
      additionalPoints.length > 0
        ? additionalPoints
        : ["등록된 가산점 요소가 없어요."],
    "제출 서류":
      submitDocuments.length > 0
        ? submitDocuments
        : fallbackSubmitDocuments.length > 0
          ? fallbackSubmitDocuments
          : ["등록된 제출 서류가 없어요."],
  };
}

function buildProcess(notice: NoticeDetail | null) {
  const processes = notice?.processes ?? [];

  if (processes.length === 0) {
    return [
      {
        step: "지원 일정",
        schedule: "-",
        detail: "등록된 전형 정보가 없어요.",
        note: null,
      },
    ];
  }

  return processes.map((process) => {
    const scheduleItems = compact([
      process.applicationPeriod && `접수 ${process.applicationPeriod}`,
      process.documentScreenSchedule &&
        `서류 ${process.documentScreenSchedule}`,
      process.writtenExamSchedule && `필기 ${process.writtenExamSchedule}`,
      process.interviewSchedule && `면접 ${process.interviewSchedule}`,
      process.joinDate && `입사 ${process.joinDate}`,
    ]);

    return {
      step: process.processName || "전형 단계",
      schedule: scheduleItems.join(" · ") || "-",
      detail: process.scheduleNotes || "상세 전형 정보",
      note: process.scheduleNotes,
    };
  });
}

function buildJobDescription(notice: NoticeDetail | null) {
  const responsibilities = (notice?.sections ?? [])
    .flatMap((section) => splitText(section.responsibilities))
    .filter(Boolean);

  return responsibilities.length > 0
    ? responsibilities.join("\n")
    : "등록된 직무 설명이 없어요.";
}

function buildCompetencies(
  application: Application | null,
  notice: NoticeDetail | null,
) {
  const sections = notice?.sections ?? [];
  const qualificationTexts = sections.flatMap((section) =>
    (section.qualifications ?? []).flatMap((qualification) =>
      compact([
        qualification.generalQualification,
        qualification.mandatoryQualification,
      ]).flatMap(splitText),
    ),
  );

  const preferenceTexts = sections.flatMap((section) =>
    (section.preferences ?? []).flatMap((preference) =>
      compact([
        preference.generalPreference,
        preference.additionalPoints,
        preference.certificatePreference,
      ]).flatMap(splitText),
    ),
  );

  const competencies = [...qualificationTexts, ...preferenceTexts];

  if (competencies.length > 0) return competencies.slice(0, 8);
  return compact([
    application?.position,
    application?.industry,
    "공고 상세 내용을 확인해 주세요.",
  ]);
}

function mapCoverLettersToEssays(items: CoverLetterItem[]): DetailEssay[] {
  return [...items]
    .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0) || a.id - b.id)
    .map((item, index) => {
      const answer = item.answer?.trim() ?? "";
      return {
        id: item.id,
        no: index + 1,
        question: item.question,
        charLimit: item.maxLength ?? 0,
        status: answer ? "작성중" : "미작성",
        updated: getRelativeTime(item.updatedAt ?? item.createdAt ?? null),
        preview: answer || null,
        answer,
        orderIndex: item.orderIndex,
        aiGenerated: item.aiGenerated,
        source: item.applicationId ? "APPLICATION" : "NOTICE",
      };
    });
}

function buildRawSource(
  application: Application | null,
  notice: NoticeDetail | null,
  coverLetters: CoverLetterItem[],
) {
  if (!application && !notice) return "";

  const sections = notice?.sections ?? [];
  const lines = [
    `[${application?.company ?? notice?.companyName ?? "기업"}] ${application?.jobTitle ?? notice?.noticeName ?? "채용공고"}`,
    "",
    "■ 기본 정보",
    `기업명: ${application?.company ?? notice?.companyName ?? "-"}`,
    `공고명: ${application?.jobTitle ?? notice?.noticeName ?? "-"}`,
    `직무: ${application?.position ?? sections[0]?.jobTitle ?? "-"}`,
    `산업: ${application?.industry ?? "-"}`,
    `근무지: ${notice?.workplaceAddress ?? sections[0]?.workplace ?? notice?.region1depth ?? "-"}`,
    `접수 기간: ${notice?.startedAt ?? "-"} ~ ${application?.deadlineDate ?? notice?.endedAt ?? "-"}`,
    "",
    "■ 모집 부문",
    ...sections.flatMap((section) =>
      compact([
        section.sectionName && `- ${section.sectionName}`,
        section.jobTitle && `  직무: ${section.jobTitle}`,
        section.responsibilities && `  담당 업무: ${section.responsibilities}`,
        section.headcount && `  모집 인원: ${section.headcount}`,
        section.workplace && `  근무지: ${section.workplace}`,
      ]),
    ),
    "",
    "■ 지원 핵심 정보",
    ...Object.entries(buildEligibility(application, notice)).flatMap(
      ([key, values]) => [`${key}`, ...values.map((value) => `  - ${value}`)],
    ),
    "",
    "■ 자기소개서 문항",
    ...(coverLetters.length > 0
      ? mapCoverLettersToEssays(coverLetters).map(
          (essay) =>
            `  ${essay.no}. ${essay.question}${essay.charLimit ? ` (${essay.charLimit}자)` : ""}`,
        )
      : ["  등록된 문항 없음"]),
  ];

  return lines.filter((line) => line != null).join("\n");
}

function buildJobFromBackend(
  application: Application | null,
  notice: NoticeDetail | null,
  coverLetters: CoverLetterItem[],
) {
  if (!application && !notice && coverLetters.length === 0) {
    return emptyJob;
  }

  const deadlineValue = getApplicationDeadline(application, notice);
  const dday = getDday(deadlineValue);
  const expired = dday != null && dday < 0;
  const sections = notice?.sections ?? [];
  const firstSection = sections[0];
  const essays = mapCoverLettersToEssays(coverLetters);
  const periodStart = notice?.startedAt ? formatDate(notice.startedAt) : "-";
  const periodEnd = application?.deadlineDate
    ? formatDate(application.deadlineDate)
    : formatDate(notice?.endedAt);
  const sourceUrl =
    application?.sourceUrl || application?.url || notice?.noticeUrl || "#";

  return {
    company: application?.company || notice?.companyName || "-",
    division:
      application?.industry ||
      firstSection?.sectionName ||
      labelCategory(notice?.category),
    title: application?.jobTitle || notice?.noticeName || "지원 공고 상세",
    role:
      application?.position ||
      firstSection?.jobTitle ||
      firstSection?.sectionName ||
      "직무 미지정",
    period: `${periodStart} ~ ${periodEnd}`,
    deadline: formatDateTime(deadlineValue),
    deadlineDate: toDate(deadlineValue),
    dday,
    expired,
    status: application?.status ?? "WRITING",
    docsInProgress: application?.documents ?? [],
    sourceUrl,
    basic: {
      기업명: application?.company || notice?.companyName || "-",
      공고명: application?.jobTitle || notice?.noticeName || "-",
      "모집 직무": application?.position || firstSection?.jobTitle || "-",
      산업: application?.industry ?? "-",
      근무지:
        notice?.workplaceAddress ??
        firstSection?.workplace ??
        notice?.region1depth ??
        "-",
      "채용 형태": labelEmploymentType(notice?.employmentType),
      "공고 분류": labelCategory(notice?.category),
      "접수 시작일": notice?.startedAt ? formatDate(notice.startedAt) : "-",
      "접수 마감일": formatDateTime(deadlineValue),
      "D-day": formatDday(dday),
      등록일: formatDate(application?.createdAt),
      "최근 수정일": formatDateTime(application?.updatedAt),
    },
    eligibility: buildEligibility(application, notice),
    process: buildProcess(notice),
    essays,
    jobDescription: buildJobDescription(notice),
    competencies: buildCompetencies(application, notice),
    rawSource: buildRawSource(application, notice, coverLetters),
  };
}

function hlKey(section: string, group: string, idx: number) {
  return `${section}::${group}::${idx}`;
}

function EssayStatus({ status }: { status: string }) {
  const cls =
    status === "완료"
      ? "bg-pickd-green-light text-pickd-green"
      : status === "작성중"
        ? "bg-indigo-100 text-indigo-600"
        : status === "초안"
          ? "bg-pickd-orange-light text-pickd-orange"
          : "bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap",
        cls,
      )}
    >
      {status}
    </span>
  );
}

function CopyButton({
  text,
  label = "복사",
  always = false,
}: {
  text: string;
  label?: string;
  always?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          toast("복사 완료했습니다.");
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-[#79859A] transition-colors hover:bg-[#EFF2F6] hover:text-[#28303D]",
        always ? "opacity-100" : "opacity-0 group-hover:opacity-100",
      )}
      title="복사하기"
    >
      {copied ? (
        <Check className="w-3 h-3 text-pickd-green" />
      ) : (
        <Copy className="w-3 h-3" />
      )}
      {label}
    </button>
  );
}

interface HighlightableLineProps {
  lineKey: string;
  text: string;
  highlighted: boolean;
  onToggle: (key: string) => void;
}

function HighlightableLine({
  lineKey,
  text,
  highlighted,
  onToggle,
}: HighlightableLineProps) {
  return (
    <li
      className={cn(
        "group/line flex items-start gap-2 px-3 py-2 -mx-3 rounded-md transition-colors",
        highlighted ? "bg-[#FFF4D6]" : "hover:bg-[#F1F5F9]",
      )}
    >
      {/* Highlight toggle button — visible on hover or when highlighted */}
      <button
        type="button"
        onClick={() => onToggle(lineKey)}
        data-tooltip={highlighted ? "강조 해제" : "중요 표시"}
        aria-label={highlighted ? "강조 해제" : "중요 표시"}
        className={cn(
          "relative shrink-0 mt-0.5 w-4 h-4 flex items-center justify-center rounded transition-all",
          highlighted
            ? "opacity-100 text-[var(--warning)]"
            : "opacity-0 group-hover/line:opacity-100 text-muted-foreground hover:text-[var(--warning)]",
        )}
      >
        <Highlighter className="w-3 h-3" />
      </button>

      {/* Bullet */}
      <span className="text-muted-foreground select-none shrink-0 mt-0.5 text-[11px]">
        •
      </span>

      {/* Text — semibold when highlighted */}
      <span
        className={cn(
          "text-[13px] leading-relaxed break-words flex-1",
          highlighted ? "text-foreground font-semibold" : "text-foreground",
        )}
      >
        {text}
      </span>
    </li>
  );
}

function DetailSection({
  n,
  title,
  subtitle,
  right,
  children,
}: {
  n: number;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mb-5 last:mb-0">
      <div className="group rounded-2xl border border-[#E3E8EF] bg-white px-6 py-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#EFF2F6] text-[10px] font-bold tabular-nums text-[#79859A]">
              {n}
            </span>
            <h2 className="text-[15px] font-semibold tracking-tight text-[#161C26]">
              {title}
            </h2>
            {subtitle && (
              <span className="text-[11px] text-[#79859A]">{subtitle}</span>
            )}
          </div>
          {right}
        </div>
        {children}
      </div>
    </section>
  );
}

function getDetailStatusClass(status?: string | null) {
  switch (status) {
    case "작성중":
      return "bg-[#EFF6FF] text-[#1D4ED8]";
    case "지원완료":
      return "bg-[#EFF2F6] text-[#5A6678]";
    case "서류전형":
      return "bg-[#EEF2FF] text-[#4F46E5]";
    case "필기전형":
      return "bg-[#ECFEFF] text-[#0F766E]";
    case "면접전형":
      return "bg-[#FFF7ED] text-[#C2410C]";
    case "전형완료":
      return "bg-[#EFF2F6] text-[#5A6678]";
    default:
      return "bg-[#EFF2F6] text-[#5A6678]";
  }
}

export default function ApplicationJobDetailPage() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [application, setApplication] = useState<Application | null>(null);
  const [notice, setNotice] = useState<NoticeDetail | null>(null);
  const [coverLetters, setCoverLetters] = useState<CoverLetterItem[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [rawOpen, setRawOpen] = useState(false);
  const [highlights, setHighlights] = useState<Set<string>>(new Set());
  const [essayDraft, setEssayDraft] = useState<EssayDraft>(EMPTY_DRAFT);
  const [essayFormOpen, setEssayFormOpen] = useState(false);
  const [savingEssay, setSavingEssay] = useState(false);
  const rawButtonRef = useRef<HTMLSpanElement | null>(null);
  const rawPanelRef = useRef<HTMLElement | null>(null);
  const [checkedDocs, setCheckedDocs] = useState<Set<string>>(new Set());

  // 자소서 문항 ref — 작성중인 서류에서 진입 시 마지막 작업 문항으로 스크롤
  const essayRefs = useRef<(HTMLLIElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  void scrollContainerRef;

  const numericApplicationId = Number(applicationId);
  const job = buildJobFromBackend(application, notice, coverLetters);

  const loadCoverLettersFor = async (
    targetApplication: Application,
    targetNotice: NoticeDetail | null,
  ) => {
    const appItems = await getCoverLetters({
      applicationId: targetApplication.id,
    });
    let noticeItems: CoverLetterItem[] = [];

    if (targetApplication.noticeId != null) {
      try {
        noticeItems = await getCoverLetters({
          noticeId: targetApplication.noticeId,
        });
      } catch {
        noticeItems = (targetNotice?.coverLetterItems ?? []).map((item) => ({
          ...item,
          noticeId: targetApplication.noticeId ?? null,
          applicationId: null,
        }));
      }
    }

    const merged = new Map<number, CoverLetterItem>();
    [...noticeItems, ...appItems].forEach((item) => {
      merged.set(item.id, item);
    });

    setCoverLetters(
      Array.from(merged.values()).sort(
        (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0) || a.id - b.id,
      ),
    );
  };

  const loadDetail = async () => {
    if (!numericApplicationId || Number.isNaN(numericApplicationId)) {
      setPageError("지원 공고 ID가 올바르지 않아요.");
      setPageLoading(false);
      return;
    }

    try {
      setPageLoading(true);
      setPageError(null);

      const applications = await getApplications();
      const targetApplication = (applications ?? []).find(
        (item) => Number(item.id) === numericApplicationId,
      );

      if (!targetApplication) {
        throw new Error("지원 공고를 찾을 수 없어요.");
      }

      setApplication(targetApplication);

      let targetNotice: NoticeDetail | null = null;
      if (targetApplication.noticeId != null) {
        try {
          targetNotice = await getNoticeDetail(targetApplication.noticeId);
        } catch (error) {
          console.warn("공고 상세 조회 실패:", error);
        }
      }

      setNotice(targetNotice);
      await loadCoverLettersFor(targetApplication, targetNotice);
    } catch (error) {
      console.error("지원 공고 상세 조회 실패:", error);
      setPageError(
        error instanceof Error
          ? error.message
          : "지원 공고 상세 정보를 불러오지 못했어요.",
      );
    } finally {
      setPageLoading(false);
    }
  };

  const reloadCoverLetters = async () => {
    if (!application) return;
    await loadCoverLettersFor(application, notice);
  };

  useEffect(() => {
    void loadDetail();
  }, [applicationId]);

  useEffect(() => {
    const handleApplicationRefresh = () => {
      void loadDetail();
    };

    window.addEventListener("applicationUpdated", handleApplicationRefresh);
    window.addEventListener("googleCalendarUpdated", handleApplicationRefresh);

    return () => {
      window.removeEventListener(
        "applicationUpdated",
        handleApplicationRefresh,
      );
      window.removeEventListener(
        "googleCalendarUpdated",
        handleApplicationRefresh,
      );
    };
  }, [applicationId]);

  useEffect(() => {
    if (!rawOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      const clickedPanel = rawPanelRef.current?.contains(target);
      const clickedButton = rawButtonRef.current?.contains(target);

      if (!clickedPanel && !clickedButton) {
        setRawOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [rawOpen]);

  useEffect(() => {
    if (pageLoading) return;

    const fromDoclist =
      new URLSearchParams(location.search).get("from") === "doclist";
    if (!fromDoclist) return;
    // 마지막으로 작업 중인 문항(작성중 or 초안) 찾기
    const lastActiveIdx =
      [...job.essays]
        .map((e: DetailEssay, i: number) => ({ i, status: e.status }))
        .filter(({ status }) => status === "작성중" || status === "초안")
        .pop()?.i ?? 0;
    const el = essayRefs.current[lastActiveIdx];
    if (el) {
      setTimeout(
        () => el.scrollIntoView({ behavior: "smooth", block: "center" }),
        120,
      );
    }
  }, [pageLoading, location.search, job.essays.length]);

  const toggleHighlight = (key: string) => {
    setHighlights((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const isHighlighted = (key: string) => highlights.has(key);

  const getHighlightCountByPrefix = (prefix: string) =>
    Array.from(highlights).filter((key) => key.startsWith(prefix)).length;

  const clearHighlightsByPrefix = (prefix: string) => {
    setHighlights((prev) => {
      const next = new Set(prev);
      Array.from(next).forEach((key) => {
        if (key.startsWith(prefix)) next.delete(key);
      });
      return next;
    });
  };

  const handleAddEssay = () => {
    setEssayDraft({
      ...EMPTY_DRAFT,
      orderIndex: job.essays.length,
    });
    setEssayFormOpen(true);
  };

  const handleEditEssay = (essay: DetailEssay) => {
    setEssayDraft({
      id: essay.id,
      question: essay.question,
      answer: essay.answer ?? "",
      maxLength: essay.charLimit ? String(essay.charLimit) : "",
      orderIndex: essay.orderIndex ?? essay.no - 1,
      aiGenerated: Boolean(essay.aiGenerated),
      source: essay.source,
    });
    setEssayFormOpen(true);
  };

  const handleCancelEssay = () => {
    setEssayFormOpen(false);
    setEssayDraft(EMPTY_DRAFT);
  };

  const handleSaveEssay = async () => {
    if (!application) return;
    const question = essayDraft.question.trim();
    if (!question) {
      toast("문항을 입력해 주세요");
      return;
    }

    const maxLength = essayDraft.maxLength.trim()
      ? Number(essayDraft.maxLength.trim())
      : null;

    if (maxLength != null && (Number.isNaN(maxLength) || maxLength < 0)) {
      toast("글자 수는 0 이상의 숫자로 입력해 주세요");
      return;
    }

    const payload = {
      question,
      answer: essayDraft.answer.trim() || null,
      maxLength,
      orderIndex: essayDraft.orderIndex,
      aiGenerated: essayDraft.aiGenerated,
      applicationId: application.id,
      noticeId: null,
    };

    try {
      setSavingEssay(true);
      if (essayDraft.id) {
        await updateCoverLetterItem(essayDraft.id, payload);
        toast("자소서 문항을 수정했어요");
      } else {
        await createCoverLetterItem(payload);
        toast("자소서 문항을 추가했어요");
      }
      handleCancelEssay();
      await reloadCoverLetters();
    } catch (error) {
      console.error("자소서 문항 저장 실패:", error);
      toast("문항 저장에 실패했어요");
    } finally {
      setSavingEssay(false);
    }
  };

  const handleDeleteEssay = async (essay: DetailEssay) => {
    if (!essay.id) return;
    const ok = window.confirm("이 자소서 문항을 삭제할까요?");
    if (!ok) return;

    try {
      await deleteCoverLetterItem(essay.id);
      toast("자소서 문항을 삭제했어요");
      await reloadCoverLetters();
    } catch (error) {
      console.error("자소서 문항 삭제 실패:", error);
      toast("문항 삭제에 실패했어요");
    }
  };

  const eligibilityHighlightCount = getHighlightCountByPrefix("eligibility::");

/*
  const jdHighlightCount = getHighlightCountByPrefix("jd::");
  const jobDescriptionRows = [
    {
      groupKey: "직무 설명",
      items:
        splitText(job.jobDescription).length > 0
          ? splitText(job.jobDescription)
          : [job.jobDescription],
    },
    { groupKey: "요구 역량", items: job.competencies },
  ];
*/

  const urgent = !job.expired && job.dday !== null && job.dday <= 3;
  const submitDocs = (job.eligibility["제출 서류"] ?? []) as string[];
  const requirementGroups = Object.entries(job.eligibility).filter(
    ([label]) => label !== "제출 서류",
  ) as [string, string[]][];
  const basicCopy = Object.entries(job.basic)
    .map(([label, value]) => `${label}: ${String(value)}`)
    .join("\n");
  const jobCopy = `[직무 설명]\n${job.jobDescription}\n\n[요구 역량]\n${job.competencies
    .map((item: string) => `· ${item}`)
    .join("\n")}`;
  const requirementCopy = requirementGroups
    .map(
      ([label, items]) =>
        `[${label}]\n${items.map((item) => `· ${item}`).join("\n")}`,
    )
    .join("\n\n");
  const documentCopy = submitDocs.map((item) => `· ${item}`).join("\n");

  const toggleDocument = (documentName: string) => {
    setCheckedDocs((previous) => {
      const next = new Set(previous);
      if (next.has(documentName)) next.delete(documentName);
      else next.add(documentName);
      return next;
    });
  };

  const goToTab3 = (essay: DetailEssay) => {
    const params = new URLSearchParams({
      from: "job",
      applicationId: String(application?.id ?? applicationId ?? ""),
      essay: String(essay.no),
    });

    if (essay.id) params.set("coverLetterId", String(essay.id));
    navigate(`/ai?${params.toString()}`);
  };

  if (pageLoading) {
    return (
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center text-[13px] text-muted-foreground">
          지원 공고 상세 정보를 불러오는 중이에요.
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="rounded-xl border border-border bg-card px-6 py-5 text-center shadow-sm">
            <p className="text-[14px] font-semibold text-foreground">
              상세 정보를 불러오지 못했어요
            </p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {pageError}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/main")}
              >
                대시보드로
              </Button>
              <Button size="sm" onClick={() => void loadDetail()}>
                다시 불러오기
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#FBFCFE]">
      <Sidebar />

      <div className="flex min-w-0 flex-1 overflow-hidden">
        <div className="min-w-0 flex-1 overflow-y-auto bg-white">
          <div className="sticky top-0 z-20 border-b border-[#E3E8EF]/70 bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-[860px] items-center justify-between px-8 py-3">
              <nav className="flex min-w-0 items-center gap-1.5 text-xs text-[#79859A]">
                <Link
                  to="/main"
                  className="shrink-0 transition-colors hover:text-[#28303D]"
                >
                  지원 대시보드
                </Link>
                <ChevronRight className="h-3 w-3 shrink-0" />
                <span className="truncate font-medium text-[#28303D]">
                  {job.company} {job.division ?? ""}
                </span>
              </nav>

              <div className="flex shrink-0 items-center gap-2">
                <span ref={rawButtonRef} className="inline-flex">
                  <Button
                    variant={rawOpen ? "default" : "ghost"}
                    size="sm"
                    className="h-7 rounded-md px-2.5 text-xs"
                    onClick={() => setRawOpen((open) => !open)}
                  >
                    <ScrollText className="h-3.5 w-3.5" />
                    {rawOpen ? "원문 닫기" : "원문 보기"}
                  </Button>
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 rounded-md px-2.5 text-xs"
                  onClick={() => navigate("/main")}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  대시보드로
                </Button>
              </div>
            </div>
          </div>

          <main className="mx-auto max-w-[860px] px-8 pb-24 pt-11">
            <header className="mb-8">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs text-[#79859A]">
                <span className="font-medium text-[#28303D]">{job.company}</span>
                {job.division && (
                  <>
                    <span className="text-[#CBD3DE]">·</span>
                    <span>{job.division}</span>
                  </>
                )}
                <span className="text-[#CBD3DE]">·</span>
                <span>{job.role}</span>
              </div>

              <h1 className="text-[26px] font-bold leading-tight tracking-[-0.04em] text-[#161C26]">
                {job.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-2 text-xs text-[#79859A]">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  마감 {job.deadline}
                </span>
                <span
                  className={cn(
                    "inline-flex h-5 items-center rounded-full px-2 text-[10px] font-semibold tabular-nums",
                    urgent
                      ? "bg-[#FCEBEC] text-[#B4232C]"
                      : "bg-[#EFF2F6] text-[#5A6678]",
                  )}
                >
                  {formatDday(job.dday)}
                </span>
                <span
                  className={cn(
                    "inline-flex h-5 items-center gap-1.5 rounded-full px-2 text-[10px] font-semibold",
                    getDetailStatusClass(job.status),
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                  {job.status}
                </span>
              </div>

              {(job.expired || urgent) && (
                <div
                  className={cn(
                    "mt-3 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px]",
                    job.expired
                      ? "bg-[#EFF2F6] text-[#79859A]"
                      : "bg-[#FCEBEC] text-[#B4232C]",
                  )}
                >
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {job.expired
                    ? "마감된 공고입니다"
                    : "제출 기한이 얼마 남지 않았어요"}
                </div>
              )}
            </header>

            <DetailSection
              n={1}
              title="기본 정보"
              right={<CopyButton label="복사" text={basicCopy} />}
            >
              <dl className="divide-y divide-[#E3E8EF]/50">
                {Object.entries(job.basic).map(([label, value]) => (
                  <div key={label} className="flex items-start gap-3 py-2">
                    <dt className="w-28 shrink-0 pt-0.5 text-xs text-[#79859A]">
                      {label}
                    </dt>
                    <dd
                      className={cn(
                        "flex-1 break-words text-[13px] leading-relaxed text-[#28303D]",
                        label === "D-day" && urgent &&
                          "font-semibold text-[#B4232C]",
                      )}
                    >
                      {String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </DetailSection>

            <DetailSection
              n={2}
              title="직무 설명 · 요구 역량"
              right={<CopyButton label="복사" text={jobCopy} />}
            >
              <div className="space-y-5">
                <div>
                  <h3 className="mb-1 text-xs font-semibold text-[#79859A]">
                    직무 설명
                  </h3>
                  <p className="text-[13px] leading-relaxed text-[#28303D]">
                    {job.jobDescription}
                  </p>
                </div>
                <div>
                  <h3 className="mb-1 text-xs font-semibold text-[#79859A]">
                    요구 역량
                  </h3>
                  <ul className="space-y-0.5">
                    {job.competencies.map((competency: string, index: number) => {
                      const key = hlKey("jd", "competency", index);
                      return (
                        <HighlightableLine
                          key={key}
                          lineKey={key}
                          text={competency}
                          highlighted={isHighlighted(key)}
                          onToggle={toggleHighlight}
                        />
                      );
                    })}
                  </ul>
                </div>
              </div>
            </DetailSection>

            <DetailSection
              n={3}
              title="지원 자격 · 우대"
              right={
                <div className="flex items-center gap-2">
                  {eligibilityHighlightCount > 0 && (
                    <button
                      type="button"
                      onClick={() => clearHighlightsByPrefix("eligibility::")}
                      className="flex items-center gap-1 text-[11px] text-[#79859A] hover:text-[#28303D]"
                    >
                      <X className="h-3 w-3" />
                      강조 {eligibilityHighlightCount}개 초기화
                    </button>
                  )}
                  <CopyButton label="복사" text={requirementCopy} />
                </div>
              }
            >
              <div className="space-y-5">
                {requirementGroups.map(([label, items]) => (
                  <div key={label}>
                    <h3 className="mb-1 text-xs font-semibold text-[#79859A]">
                      {label}
                    </h3>
                    <ul className="space-y-0.5">
                      {items.map((text, index) => {
                        const key = hlKey("eligibility", label, index);
                        return (
                          <HighlightableLine
                            key={key}
                            lineKey={key}
                            text={text}
                            highlighted={isHighlighted(key)}
                            onToggle={toggleHighlight}
                          />
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </DetailSection>

            <DetailSection
              n={4}
              title="전형 절차"
              right={
                <span className="text-[11px] text-[#A4AEBE]">
                  일정이 없으면 ‘미정’으로 표시돼요
                </span>
              }
            >
              <div>
                {job.process.map((process: any, index: number) => {
                  const hasSchedule = Boolean(
                    process.schedule && String(process.schedule).trim(),
                  );

                  return (
                    <div
                      key={`${process.step}-${index}`}
                      className="flex items-start gap-3.5 border-b border-[#E3E8EF]/50 py-3 last:border-0"
                    >
                      <span className="w-5 shrink-0 pt-0.5 text-right text-[13px] font-semibold tabular-nums text-[#A4AEBE]">
                        {index + 1}
                      </span>
                      <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-[#28303D]">
                            {process.step}
                          </p>
                          {process.detail && (
                            <p className="mt-0.5 text-xs text-[#79859A]">
                              {process.detail}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <p
                            className={cn(
                              "text-xs tabular-nums",
                              hasSchedule
                                ? "text-[#4E5968]"
                                : "text-[#A4AEBE]",
                            )}
                          >
                            {hasSchedule ? process.schedule : "일정 미정"}
                          </p>
                          {process.note && (
                            <p className="mt-0.5 text-[11px] text-[#79859A]">
                              {process.note}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </DetailSection>

            <DetailSection
              n={5}
              title="제출 서류"
              right={
                submitDocs.length > 0 ? (
                  <CopyButton label="복사" text={documentCopy} />
                ) : undefined
              }
            >
              {submitDocs.length === 0 ? (
                <p className="px-2 py-1 text-[11px] text-[#A4AEBE]">
                  공고에 명시된 제출 서류가 없어요
                </p>
              ) : (
                <ul className="space-y-0.5">
                  {submitDocs.map((documentName) => {
                    const checked = checkedDocs.has(documentName);
                    return (
                      <li key={documentName}>
                        <button
                          type="button"
                          onClick={() => toggleDocument(documentName)}
                          className="-mx-2 flex w-[calc(100%+16px)] items-center gap-2.5 rounded px-2 py-1.5 text-left transition-colors hover:bg-[#F6F8FB]"
                        >
                          <span
                            className={cn(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border transition-colors",
                              checked
                                ? "border-[#15926A] bg-[#15926A] text-white"
                                : "border-[#CBD3DE] bg-white",
                            )}
                          >
                            {checked && <Check className="h-3 w-3" />}
                          </span>
                          <span
                            className={cn(
                              "truncate text-[13px] leading-relaxed",
                              checked
                                ? "text-[#79859A] line-through"
                                : "text-[#28303D]",
                            )}
                          >
                            {documentName}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </DetailSection>

            <DetailSection
              n={6}
              title="자기소개서"
              subtitle={`${job.essays.length}문항`}
              right={
                <button
                  type="button"
                  onClick={handleAddEssay}
                  className="flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-medium text-[#79859A] hover:bg-[#F6F8FB] hover:text-[#2563EB]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  문항 추가
                </button>
              }
            >
              {essayFormOpen && (
                <div className="mb-4 rounded-xl border border-[#E3E8EF] bg-[#F8FAFC] p-4">
                  <div className="grid gap-3 sm:grid-cols-[1fr_130px]">
                    <div>
                      <label className="mb-1.5 block text-[11px] font-medium text-[#79859A]">
                        문항
                      </label>
                      <input
                        value={essayDraft.question}
                        onChange={(event) =>
                          setEssayDraft((previous) => ({
                            ...previous,
                            question: event.target.value,
                          }))
                        }
                        placeholder="자기소개서 문항을 입력하세요"
                        className="h-9 w-full rounded-lg border border-[#D8E0EA] bg-white px-3 text-[13px] outline-none focus:border-[#2563EB]"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-medium text-[#79859A]">
                        글자 수
                      </label>
                      <input
                        value={essayDraft.maxLength}
                        onChange={(event) =>
                          setEssayDraft((previous) => ({
                            ...previous,
                            maxLength: event.target.value.replace(/[^0-9]/g, ""),
                          }))
                        }
                        placeholder="700"
                        className="h-9 w-full rounded-lg border border-[#D8E0EA] bg-white px-3 text-[13px] outline-none focus:border-[#2563EB]"
                      />
                    </div>
                  </div>
                  <textarea
                    value={essayDraft.answer}
                    onChange={(event) =>
                      setEssayDraft((previous) => ({
                        ...previous,
                        answer: event.target.value,
                      }))
                    }
                    placeholder="답변 초안이나 메모가 있으면 입력하세요"
                    className="mt-3 min-h-[82px] w-full resize-y rounded-lg border border-[#D8E0EA] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#2563EB]"
                  />
                  <div className="mt-3 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={handleCancelEssay}
                      disabled={savingEssay}
                    >
                      취소
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 text-xs"
                      onClick={handleSaveEssay}
                      disabled={savingEssay}
                    >
                      {savingEssay ? "저장 중" : "저장"}
                    </Button>
                  </div>
                </div>
              )}

              {job.essays.length === 0 ? (
                <p className="px-2 py-3 text-[13px] text-[#79859A]">
                  이 공고는 별도 문항이 없어요
                </p>
              ) : (
                <ol className="divide-y divide-[#E3E8EF]">
                  {job.essays.map((essay: DetailEssay, index: number) => (
                    <li
                      key={essay.id ?? essay.no}
                      ref={(element) => {
                        essayRefs.current[index] = element;
                      }}
                      className="py-5 first:pt-2"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-semibold tabular-nums text-[#79859A]">
                              Q{essay.no}
                            </span>
                            <EssayStatus status={essay.status} />
                            <span className="text-[11px] text-[#79859A]">
                              {essay.charLimit
                                ? `${essay.charLimit.toLocaleString()}자`
                                : "제한 없음"}
                              {essay.updated ? ` · 수정 ${essay.updated}` : ""}
                            </span>
                          </div>
                          <p className="text-sm font-semibold leading-relaxed text-[#28303D]">
                            {essay.question}
                          </p>
                          {essay.preview ? (
                            <p className="mt-1.5 line-clamp-3 whitespace-pre-wrap text-[13px] leading-relaxed text-[#79859A]">
                              {essay.preview}
                            </p>
                          ) : (
                            <p className="mt-1 text-xs text-[#A4AEBE]">
                              아직 작성된 내용이 없어요
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-md text-xs"
                            onClick={() => handleEditEssay(essay)}
                          >
                            수정
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-md text-xs text-[#2563EB]"
                            onClick={() => goToTab3(essay)}
                          >
                            <PenLine className="h-3 w-3" />
                            {essay.status === "미작성" ? "작성하기" : "이어서 작성"}
                          </Button>
                          {essay.id && (
                            <button
                              type="button"
                              onClick={() => void handleDeleteEssay(essay)}
                              className="h-8 rounded-md px-2 text-[11px] text-[#A4AEBE] hover:bg-[#FCEBEC] hover:text-[#B4232C]"
                            >
                              삭제
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </DetailSection>
          </main>
        </div>

        <aside
          ref={rawPanelRef}
          className={cn(
            "flex shrink-0 flex-col overflow-hidden border-l border-[#E3E8EF] bg-white transition-[width] duration-300",
            rawOpen ? "w-[440px]" : "w-0",
          )}
        >
          {rawOpen && (
            <div className="flex h-full w-[440px] flex-col">
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#E3E8EF] bg-[#F8FAFC] px-5 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#E3E8EF] bg-white">
                    <ScrollText className="h-4 w-4 text-[#79859A]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold leading-tight text-[#28303D]">
                      공고 원문
                    </p>
                    <p className="truncate text-[11px] text-[#79859A]">
                      {job.company} · 추출된 원본
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRawOpen(false)}
                  aria-label="원문 닫기"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-transparent text-[#79859A] transition-all hover:border-[#E3E8EF] hover:bg-[#EFF2F6] hover:text-[#28303D]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-[#FBFCFE] p-4">
                <pre className="whitespace-pre-wrap font-mono text-xs leading-[1.85] text-[#4E5968]">
                  {job.rawSource || "추출된 공고 원문이 없습니다."}
                </pre>
              </div>

              <div className="flex shrink-0 items-center justify-between gap-2 border-t border-[#E3E8EF] bg-[#F8FAFC] px-5 py-3">
                <CopyButton always label="전체 복사" text={job.rawSource} />
                <a
                  href={job.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#2563EB] hover:underline"
                >
                  원문 사이트 열기
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

