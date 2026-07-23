import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronRight, Folder, LayoutGrid } from "lucide-react";
import { createPortal } from "react-dom";


interface PortalTooltipProps {
  label: string;
  children: ReactNode;
  preferredSide?: "top" | "bottom";
}

function PortalTooltip({
  label,
  children,
  preferredSide = "bottom",
}: PortalTooltipProps) {
  const anchorRef = useRef<HTMLSpanElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, ready: false });

  const updatePosition = () => {
    const anchor = anchorRef.current;
    const tooltip = tooltipRef.current;
    if (!anchor || !tooltip) return;

    const viewportPadding = 8;
    const gap = 6;
    const anchorRect = anchor.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const bottomTop = anchorRect.bottom + gap;
    const topTop = anchorRect.top - tooltipRect.height - gap;
    const canUseBottom =
      bottomTop + tooltipRect.height <= window.innerHeight - viewportPadding;
    const canUseTop = topTop >= viewportPadding;

    let top =
      preferredSide === "top"
        ? canUseTop
          ? topTop
          : bottomTop
        : canUseBottom
          ? bottomTop
          : topTop;

    top = Math.min(
      Math.max(viewportPadding, top),
      window.innerHeight - tooltipRect.height - viewportPadding,
    );

    const centeredLeft =
      anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2;
    const left = Math.min(
      Math.max(viewportPadding, centeredLeft),
      window.innerWidth - tooltipRect.width - viewportPadding,
    );

    setPosition({ top, left, ready: true });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, label, preferredSide]);

  useEffect(() => {
    if (!open) return;

    const handleReposition = () => updatePosition();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open]);

  return (
    <>
      <span
        ref={anchorRef}
        className="inline-flex"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocusCapture={() => setOpen(true)}
        onBlurCapture={() => setOpen(false)}
      >
        {children}
      </span>

      {open &&
        createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            className="pointer-events-none fixed z-[10050] whitespace-nowrap rounded bg-[#1F2937] px-2 py-1 text-[12px] font-semibold leading-[1.4] text-white shadow-lg"
            style={{
              top: position.top,
              left: position.left,
              visibility: position.ready ? "visible" : "hidden",
            }}
          >
            {label}
          </div>,
          document.body,
        )}
    </>
  );
}

interface CompletedSectionProps {
  applications?: any[];
  onOpenApplication?: (application: any) => void;
}

function getText(...values: unknown[]) {
  const value = values.find(
    (candidate) =>
      typeof candidate === "string" && candidate.trim().length > 0,
  );

  return typeof value === "string" ? value : undefined;
}

function formatDate(value: unknown) {
  if (!value) return "-";
  return String(value).slice(0, 10);
}

function getYear(value: unknown) {
  if (!value) return String(new Date().getFullYear());
  const match = String(value).match(/\d{4}/);
  return match?.[0] ?? String(new Date().getFullYear());
}

function getCompanyName(application: any) {
  return (
    getText(
      application.companyName,
      application.company,
      application.notice?.companyName,
    ) ?? "회사명 없음"
  );
}

function getEmploymentType(application: any) {
  return (
    getText(
      application.employmentType,
      application.employType,
      application.careerType,
      application.jobType,
      application.notice?.jobType,
    ) ?? "고용형태 없음"
  );
}

function getPosition(application: any) {
  return (
    getText(
      application.position,
      application.notice?.position,
      application.notice?.jobTitle,
    ) ?? "직무 없음"
  );
}

function getJobTitle(application: any) {
  return (
    getText(
      application.jobTitle,
      application.noticeName,
      application.notice?.noticeName,
      application.notice?.jobTitle,
    ) ?? "공고명 없음"
  );
}

function getFinalResult(application: any) {
  const result = getText(
    application.finalResult,
    application.finalResultLabel,
    application.resultDetail,
    application.resultStatusDetail,
    application.resultStatus,
  );

  const labels: Record<string, string> = {
    PASSED: "최종합격",
    합격: "최종합격",
    REJECTED: "불합격",
    불합격: "불합격",
    ON_HOLD: "보류",
    HOLD: "보류",
    보류: "보류",
  };

  return result ? (labels[result] ?? result) : "세부 결과 미선택";
}

function getResultDate(application: any) {
  return formatDate(
    application.resultDate ??
      application.resultCheckedDate ??
      application.finalResultDate ??
      application.updatedAt ??
      application.deadlineDate,
  );
}

function FolderSvgIcon() {
  return (
    <svg
      width="52"
      height="44"
      viewBox="0 0 52 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M3 16 L3 39 Q3 41 5 41 L47 41 Q49 41 49 39 L49 18 Q49 16 47 16 L26 16 Q24 16 23 14 L21 10 Q20 8 18 8 L5 8 Q3 8 3 10 Z"
        fill="#F1F5F9"
        stroke="#94A3B8"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M3 10 Q3 8 5 8 L18 8 Q20 8 21 10 L23 14 Q24 16 26 16 L3 16 Z"
        fill="#E2E8F0"
      />
    </svg>
  );
}

export default function CompletedSection({
  applications = [],
}: CompletedSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"file" | "card">("file");

  const displayApplications = applications.filter((application) => {
    const status = application.status ?? application.resultStatus;
    return status === "전형완료" || status === "COMPLETED";
  });

  if (displayApplications.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-xl border border-[#E3E8EF] bg-white">
      <div
        className={`flex items-center justify-between px-4 pb-1.5 pt-2 ${
          isOpen ? "" : "border-b border-[#E3E8EF]"
        }`}
      >
        <button
          type="button"
          onClick={() => setIsOpen((previous) => !previous)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <ChevronRight
            className={`h-4 w-4 shrink-0 text-[#79859A] transition-transform ${
              isOpen ? "rotate-90" : ""
            }`}
            strokeWidth={2}
          />
          <span className="text-[16px] font-semibold text-[#161C26]">
            완료된 공고
          </span>
          <span className="text-[13px] text-[#79859A]">
            {displayApplications.length}건
          </span>
        </button>

        <div className="inline-flex items-center gap-0.5 rounded-md border border-[#E3E8EF] bg-[#F6F8FB] p-0.5">
          <PortalTooltip label="폴더형" preferredSide="top">
            <button
              type="button"
              onClick={() => setViewMode("file")}
              aria-label="폴더형"
              className={`inline-flex h-[26px] w-[26px] items-center justify-center rounded transition-colors ${
                viewMode === "file"
                  ? "bg-white text-[#28303D] shadow-sm"
                  : "text-[#79859A] hover:text-[#28303D]"
              }`}
            >
              <Folder className="h-4 w-4" strokeWidth={2} />
            </button>
          </PortalTooltip>

          <PortalTooltip label="카드형" preferredSide="top">
            <button
              type="button"
              onClick={() => setViewMode("card")}
              aria-label="카드형"
              className={`inline-flex h-[26px] w-[26px] items-center justify-center rounded transition-colors ${
                viewMode === "card"
                  ? "bg-white text-[#28303D] shadow-sm"
                  : "text-[#79859A] hover:text-[#28303D]"
              }`}
            >
              <LayoutGrid className="h-4 w-4" strokeWidth={2} />
            </button>
          </PortalTooltip>
        </div>
      </div>

      {isOpen && (
        <div className="px-4 pb-4 pt-3">
          {viewMode === "file" ? (
            <div className="flex flex-wrap gap-1">
              {displayApplications.map((application) => {
                const year = getYear(
                  application.resultDate ??
                    application.updatedAt ??
                    application.deadlineDate ??
                    application.createdAt,
                );

                return (
                  <div
                    key={application.id}
                    className="flex w-[80px] select-none flex-col items-center gap-1.5 rounded-lg px-1 py-3"
                  >
                    <FolderSvgIcon />
                    <span className="text-[12px] leading-none text-[#A4AEBE] tabular-nums">
                      {year}
                    </span>
                    <span className="line-clamp-2 w-full px-0.5 text-center text-[12px] leading-tight text-[#79859A]">
                      {getCompanyName(application)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {displayApplications.map((application) => {
                const finalResult = getFinalResult(application);

                return (
                  <div
                    key={application.id}
                    className="rounded-lg border border-[#E3E8EF] bg-[#FBFCFE] p-3 text-left"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold text-[#161C26]">
                          {getCompanyName(application)}
                        </p>
                        <p className="mt-0.5 text-[13px] text-[#79859A]">
                          {getPosition(application)} {getEmploymentType(application)}
                        </p>
                      </div>
                      <span className="shrink-0 text-[13px] font-medium text-[#79859A]">
                        {finalResult}
                      </span>
                    </div>
                    <p className="mt-1.5 truncate text-[13px] text-[#79859A]">
                      {getJobTitle(application)}
                    </p>
                    <p className="mt-1 text-[12px] text-[#79859A] tabular-nums">
                      결과 확인일 {getResultDate(application)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
