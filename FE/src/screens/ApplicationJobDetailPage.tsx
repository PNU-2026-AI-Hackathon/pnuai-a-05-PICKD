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
  Info,
  ClipboardList,
  ListChecks,
  BookOpen,
  ScrollText,
  Highlighter,
  AlertCircle,
  FileText,
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

// ---------- Highlight key helpers ----------
function hlKey(section: string, group: string, idx: number) {
  return `${section}::${group}::${idx}`;
}

// ---------- Essay status chip ----------
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

// ---------- Small utilities ----------
function CopyButton({
  text,
  label = "복사",
}: {
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          toast("복사했어요");
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
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

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  rightSlot,
}: {
  icon: any;
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-[15px] font-semibold text-foreground tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <span className="text-[11px] text-muted-foreground ml-1">
            {subtitle}
          </span>
        )}
      </div>
      {rightSlot}
    </div>
  );
}

// ---------- HighlightableLine ----------
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

// ---------- Main component ----------
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

  // Navigate to Tab3 (AI Cover) immediately — no confirmation
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
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex overflow-hidden">
        {/* Main scroll area */}
        <div className="flex-1 overflow-y-auto">
          {/* Sticky top bar */}
          <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
            <div className="px-8 py-3 flex items-center justify-between">
              <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Link
                  to="/main"
                  className="hover:text-foreground transition-colors"
                >
                  지원 대시보드
                </Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-foreground font-medium">
                  {job.company} {job.division ?? ""}
                </span>
              </nav>

              <div className="flex items-center gap-2">
                {/* 원문 보기 — triggers right slide panel */}
                <span ref={rawButtonRef} className="inline-flex">
                  <Button
                    variant={rawOpen ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs gap-1.5 rounded-md"
                    onClick={() => setRawOpen((v) => !v)}
                  >
                    <ScrollText className="w-3.5 h-3.5" />
                    {rawOpen ? "원문 닫기" : "원문 보기"}
                  </Button>
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1.5 rounded-md"
                  onClick={() => navigate("/main")}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  대시보드로
                </Button>
              </div>
            </div>
          </div>

          {/* Expired / D-3 notice */}
          {(job.expired ||
            (!job.expired && job.dday !== null && job.dday <= 3)) && (
            <div className="px-8 pt-4">
              <div
                className={cn(
                  "flex items-center gap-2 text-[13px] rounded-lg px-4 py-2.5",
                  job.expired
                    ? "bg-muted/40 text-muted-foreground"
                    : "bg-[var(--pickd-red-light,#fff1f2)] text-pickd-red",
                )}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {job.expired
                  ? "마감된 공고입니다"
                  : `마감 D-${job.dday} · 서류 제출 기한이 얼마 남지 않았습니다`}
              </div>
            </div>
          )}

          {/* Document header — title area */}
          <div className="px-8 pt-6 pb-5 border-b border-border">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
                <span className="font-medium text-foreground">
                  {job.company}
                </span>
                {job.division && (
                  <>
                    <span className="text-border">·</span>
                    <span>{job.division}</span>
                  </>
                )}
                <span className="text-border">·</span>
                <span>{job.role}</span>
              </div>
              <h1 className="text-[26px] font-bold text-foreground tracking-[-0.04em] leading-tight">
                {job.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                <SummaryItem label="지원 기간" value={job.period} />
                <SummaryItem
                  label="마감"
                  value={
                    <span
                      className={cn(
                        "font-medium",
                        job.dday !== null && job.dday <= 3
                          ? "text-pickd-red"
                          : "text-foreground",
                      )}
                    >
                      {job.deadline}
                    </span>
                  }
                />
                <SummaryItem
                  label="D-day"
                  value={
                    <span
                      className={cn(
                        "font-semibold tabular-nums",
                        job.dday !== null && job.dday <= 3
                          ? "text-pickd-red"
                          : "text-foreground",
                      )}
                    >
                      {formatDday(job.dday)}
                    </span>
                  }
                />
                <SummaryItem
                  label="지원 상태"
                  value={
                    <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                      {job.status}
                    </span>
                  }
                />
              </div>

              {/* Essay progress summary */}
              {job.essays.length > 0 &&
                (() => {
                  const doneCount = job.essays.filter(
                    (e: DetailEssay) => e.status === "완료",
                  ).length;
                  return (
                    <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          자소서
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {job.essays.map((e: DetailEssay) => (
                          <div
                            key={e.id ?? e.no}
                            title={`Q${e.no}: ${e.status}`}
                            className={cn(
                              "w-2.5 h-2.5 rounded-full transition-colors",
                              e.status === "완료"
                                ? "bg-pickd-green"
                                : e.status === "작성중"
                                  ? "bg-indigo-500"
                                  : e.status === "초안"
                                    ? "bg-pickd-orange"
                                    : "bg-border",
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {doneCount}/{job.essays.length} 완료
                      </span>
                    </div>
                  );
                })()}
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-6 space-y-10 max-w-[900px]">
            {/* Section 1. 기본 정보 */}
            <section>
              <SectionHeader
                icon={Info}
                title="1. 기본 정보"
                subtitle="Properties"
              />
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {Object.entries(job.basic).map(([k, v], i) => (
                      <tr
                        key={k}
                        className={cn(
                          "group border-b border-border/60 last:border-b-0 hover:bg-muted/20",
                          i % 2 === 1 && "bg-muted/10",
                        )}
                      >
                        <td className="w-[160px] px-4 py-2.5 text-xs text-muted-foreground font-medium align-top">
                          {k}
                        </td>
                        <td className="px-4 py-2.5 text-[13px] leading-relaxed">
                          <div className="flex items-start justify-between gap-3">
                            <span
                              className={cn(
                                "break-words",
                                k === "D-day" &&
                                  job.dday !== null &&
                                  job.dday <= 3
                                  ? "text-pickd-red font-semibold"
                                  : "text-foreground",
                              )}
                            >
                              {String(v)}
                            </span>
                            <CopyButton text={String(v)} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 2. 지원 핵심 정보 — 중요 표시 기능 포함 */}
            <section>
              <SectionHeader
                icon={ClipboardList}
                title="2. 지원 핵심 정보"
                subtitle="Eligibility & Requirements"
                rightSlot={
                  eligibilityHighlightCount > 0 && (
                    <button
                      onClick={() => clearHighlightsByPrefix("eligibility::")}
                      className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      강조 {eligibilityHighlightCount}개 초기화
                    </button>
                  )
                }
              />

              {/* Highlight hint — shown once until first highlight */}
              {eligibilityHighlightCount === 0 && (
                <p className="text-[11px] text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Highlighter className="w-3 h-3" />
                  줄에 마우스를 올리면 중요 표시 버튼이 나타납니다
                </p>
              )}

              <div className="border border-border rounded-lg overflow-hidden">
                {Object.entries(job.eligibility).map(
                  ([groupKey, items]: any, i) => (
                    <div
                      key={groupKey}
                      className={cn(
                        "grid grid-cols-[160px_1fr] border-b border-border/60 last:border-b-0",
                        i % 2 === 1 && "bg-muted/10",
                      )}
                    >
                      <div className="px-4 py-3 text-xs font-medium text-muted-foreground border-r border-border/60 self-start pt-3.5">
                        {groupKey}
                      </div>
                      <div className="px-4 py-2">
                        <ul className="space-y-0.5">
                          {items.map((text: string, idx: number) => {
                            const key = hlKey("eligibility", groupKey, idx);
                            return (
                              <HighlightableLine
                                key={idx}
                                lineKey={key}
                                text={text}
                                highlighted={isHighlighted(key)}
                                onToggle={toggleHighlight}
                              />
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </section>

            {/* Section 3. 전형 정보 */}
            <section>
              <SectionHeader
                icon={ListChecks}
                title="3. 전형 정보"
                subtitle="Hiring Process"
              />
              <div className="relative pl-6">
                {/* 수직 타임라인 선 */}
                <div className="absolute left-2.5 top-3 bottom-3 w-px bg-border" />
                <div className="space-y-3">
                  {job.process.map((p: any, i: number) => (
                    <div
                      key={i}
                      className="relative flex items-start gap-4 group"
                    >
                      {/* 스텝 번호 */}
                      <div className="absolute -left-6 flex items-center justify-center w-5 h-5 rounded-full bg-background border-2 border-border group-hover:border-indigo-400 transition-colors mt-2.5">
                        <span className="text-[10px] font-bold text-muted-foreground group-hover:text-indigo-500 transition-colors">
                          {i + 1}
                        </span>
                      </div>
                      <div className="flex-1 border border-border rounded-lg px-4 py-3 hover:bg-muted/20 hover:border-indigo-200 transition-all">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-foreground">
                              {p.step}
                            </p>
                            <p className="text-[12px] text-muted-foreground mt-0.5">
                              {p.detail}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[12px] tabular-nums text-foreground/80">
                              {p.schedule}
                            </p>
                            {p.note && (
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {p.note}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Section 4. 직무 설명 · 요구 역량 — 지원 핵심 정보와 동일한 표 형식 */}
            <section>
              <SectionHeader
                icon={BookOpen}
                title="4. 직무 설명 · 요구 역량"
                subtitle="Job Description"
                rightSlot={
                  jdHighlightCount > 0 && (
                    <button
                      onClick={() => clearHighlightsByPrefix("jd::")}
                      className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      강조 {jdHighlightCount}개 초기화
                    </button>
                  )
                }
              />

              {jdHighlightCount === 0 && (
                <p className="text-[11px] text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Highlighter className="w-3 h-3" />
                  줄에 마우스를 올리면 중요 표시 버튼이 나타납니다
                </p>
              )}

              <div className="border border-border rounded-lg overflow-hidden">
                {jobDescriptionRows.map(({ groupKey, items }, i) => (
                  <div
                    key={groupKey}
                    className={cn(
                      "grid grid-cols-[160px_1fr] border-b border-border/60 last:border-b-0",
                      i % 2 === 1 && "bg-muted/10",
                    )}
                  >
                    <div className="px-4 py-3 text-xs font-medium text-muted-foreground border-r border-border/60 self-start pt-3.5">
                      {groupKey}
                    </div>
                    <div className="px-4 py-2">
                      <ul className="space-y-0.5">
                        {items.map((text: string, idx: number) => {
                          const key = hlKey("jd", groupKey, idx);
                          return (
                            <HighlightableLine
                              key={idx}
                              lineKey={key}
                              text={text}
                              highlighted={isHighlighted(key)}
                              onToggle={toggleHighlight}
                            />
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 5. 자소서 문항 */}
            <section>
              <SectionHeader
                icon={PenLine}
                title="5. 자소서 문항"
                subtitle={`${job.essays.length}문항`}
                rightSlot={
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs rounded-md"
                    onClick={handleAddEssay}
                  >
                    <PenLine className="w-3.5 h-3.5" />
                    문항 추가
                  </Button>
                }
              />

              {essayFormOpen && (
                <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50/30 p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <p className="text-[13px] font-semibold text-foreground">
                      {essayDraft.id ? "자소서 문항 수정" : "자소서 문항 추가"}
                    </p>
                    <button
                      onClick={handleCancelEssay}
                      className="w-7 h-7 rounded-md hover:bg-white border border-transparent hover:border-border text-muted-foreground hover:text-foreground flex items-center justify-center transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">
                        문항
                      </label>
                      <textarea
                        value={essayDraft.question}
                        onChange={(event) =>
                          setEssayDraft((prev) => ({
                            ...prev,
                            question: event.target.value,
                          }))
                        }
                        placeholder="예: 지원 동기와 입사 후 목표를 작성해 주세요."
                        className="min-h-[86px] w-full resize-none rounded-lg border border-border bg-white px-3 py-2 text-[13px] leading-relaxed outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">
                          글자 수 제한
                        </label>
                        <input
                          value={essayDraft.maxLength}
                          onChange={(event) =>
                            setEssayDraft((prev) => ({
                              ...prev,
                              maxLength: event.target.value.replace(
                                /[^0-9]/g,
                                "",
                              ),
                            }))
                          }
                          placeholder="700"
                          className="h-9 w-full rounded-lg border border-border bg-white px-3 text-[13px] outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">
                          답변 초안/메모 선택 입력
                        </label>
                        <input
                          value={essayDraft.answer}
                          onChange={(event) =>
                            setEssayDraft((prev) => ({
                              ...prev,
                              answer: event.target.value,
                            }))
                          }
                          placeholder="아직 답변이 없으면 비워둬도 됩니다."
                          className="h-9 w-full rounded-lg border border-border bg-white px-3 text-[13px] outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
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
                </div>
              )}

              {job.essays.length === 0 ? (
                <div className="border border-border rounded-lg px-4 py-6 text-center">
                  <p className="text-[13px] text-muted-foreground">
                    이 공고는 별도 문항이 없어요
                  </p>
                  <button
                    onClick={handleAddEssay}
                    className="mt-2 text-[12px] font-medium text-primary hover:underline"
                  >
                    직접 문항 추가하기
                  </button>
                </div>
              ) : (
                <ol className="space-y-3">
                  {job.essays.map((e: DetailEssay, idx: number) => (
                    <li
                      key={e.id ?? e.no}
                      ref={(el) => {
                        essayRefs.current[idx] = el;
                      }}
                      className={cn(
                        "rounded-xl border bg-card transition-shadow hover:shadow-sm",
                        e.status === "작성중" &&
                          "border-indigo-200 bg-indigo-50/30",
                        e.status === "초안" &&
                          "border-pickd-orange/30 bg-orange-50/20",
                        e.status === "완료" &&
                          "border-pickd-green/30 bg-green-50/20",
                        e.status === "미작성" && "border-border",
                      )}
                    >
                      <div className="p-5">
                        {/* 상단: 번호 + 상태 + 메타 + 버튼 */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold",
                                e.status === "완료"
                                  ? "bg-pickd-green text-white"
                                  : e.status === "작성중"
                                    ? "bg-indigo-500 text-white"
                                    : e.status === "초안"
                                      ? "bg-pickd-orange text-white"
                                      : "bg-muted text-muted-foreground",
                              )}
                            >
                              {e.status === "완료" ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                e.no
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <EssayStatus status={e.status} />
                              {e.aiGenerated && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-600">
                                  AI 추출
                                </span>
                              )}
                              {e.source === "NOTICE" && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                  공고 문항
                                </span>
                              )}
                              <span className="text-[11px] text-muted-foreground tabular-nums">
                                {e.charLimit
                                  ? `${e.charLimit.toLocaleString()}자 이내`
                                  : "제한 없음"}
                              </span>
                              {e.updated && (
                                <span className="text-[11px] text-muted-foreground/50">
                                  수정 {e.updated}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 whitespace-nowrap rounded-md"
                              onClick={() => handleEditEssay(e)}
                            >
                              수정
                            </Button>
                            <Button
                              size="sm"
                              variant={
                                e.status === "미작성" ? "outline" : "default"
                              }
                              className={cn(
                                "h-7 text-xs gap-1 whitespace-nowrap rounded-md",
                                e.status !== "미작성" &&
                                  "bg-indigo-600 hover:bg-indigo-700 text-white border-0",
                              )}
                              onClick={() => goToTab3(e)}
                            >
                              <PenLine className="w-3 h-3" />
                              {e.status === "미작성"
                                ? "작성하기"
                                : "이어서 작성하기"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs rounded-md text-muted-foreground hover:text-pickd-red"
                              onClick={() => void handleDeleteEssay(e)}
                            >
                              삭제
                            </Button>
                          </div>
                        </div>

                        {/* 문항 */}
                        <p className="text-[14px] font-medium text-foreground leading-relaxed pl-9">
                          {e.question}
                        </p>

                        {/* 작성 내용 미리보기 */}
                        {e.preview && (
                          <div className="mt-3 pl-9">
                            <div className="relative bg-background border border-border/60 rounded-lg px-4 py-3">
                              <div className="absolute top-3 left-3 w-0.5 h-[calc(100%-24px)] bg-indigo-300 rounded-full" />
                              <p className="pl-3 text-[13px] text-foreground/75 leading-relaxed line-clamp-3">
                                {e.preview}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* 미작성 안내 */}
                        {!e.preview && e.status === "미작성" && (
                          <p className="mt-2 pl-9 text-[12px] text-muted-foreground/50">
                            아직 작성된 내용이 없어요
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <div className="h-12" />
          </div>
        </div>

        {/* Right slide panel: raw source */}
        <aside
          ref={rawPanelRef}
          className={cn(
            "border-l border-border flex flex-col shrink-0 transition-all duration-300 overflow-hidden",
            rawOpen ? "w-[440px]" : "w-0",
          )}
        >
          {rawOpen && (
            <div className="flex flex-col h-full w-[440px]">
              {/* Panel header */}
              <div className="px-5 py-3.5 border-b border-border bg-muted/30 flex items-center justify-between shrink-0 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
                    <ScrollText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-foreground leading-tight">
                      원문 공고
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {job.company} · 원본 채용공고문
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setRawOpen(false)}
                  className="w-7 h-7 rounded-md hover:bg-muted border border-transparent hover:border-border text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto p-4 bg-muted/10">
                <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
                  {/* Mini toolbar */}
                  <div className="px-4 py-2 border-b border-border/60 bg-muted/20 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
                      {job.rawSource.length.toLocaleString()}자
                    </span>
                    <CopyButton text={job.rawSource} label="전체 복사" />
                  </div>
                  {/* Raw text */}
                  <pre className="p-5 text-[12px] leading-[1.85] text-foreground/80 whitespace-pre-wrap font-mono select-text">
                    {job.rawSource}
                  </pre>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-border bg-muted/30 shrink-0 flex items-center justify-between gap-2">
                <p className="text-[11px] text-muted-foreground">
                  원본 공고 출처
                </p>
                <a
                  href={job.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
                >
                  원문 사이트 열기
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
