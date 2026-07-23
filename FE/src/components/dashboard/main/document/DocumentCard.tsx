import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import type { MouseEvent } from "react";
import { type DocumentItem } from "../../../../types/document";
import { getDDay, formatApplicationDate } from "../../../../utils/date";
import { getRelativeTime } from "../../../../utils/document";

interface Props {
  item: DocumentItem;
  onToggleImportant?: (item: DocumentItem) => void | Promise<void>;
}

const getEmploymentType = (item: DocumentItem) =>
  item.application?.employmentType ||
  item.application?.employType ||
  item.application?.careerType ||
  item.application?.jobType ||
  "-";

const getDocumentTitle = (item: DocumentItem) => {
  const company = item.application?.company || item.company || "회사명 없음";
  const jobTitle =
    item.application?.jobTitle || item.application?.position || item.title || "공고명 없음";
  const employmentType = getEmploymentType(item);

  return [company, jobTitle, employmentType].filter(Boolean).join(" ");
};

const getDdayClass = (dday: string) => {
  if (dday === "-" || dday.startsWith("D+")) return "text-[#A4AEBE]";
  if (dday === "D-Day" || dday === "D-day") {
    return "font-semibold text-[#EF4444]";
  }
  const days = Number(dday.replace("D-", ""));
  if (Number.isFinite(days) && days <= 3) return "font-semibold text-[#EF4444]";
  if (Number.isFinite(days) && days <= 7) return "text-[#F58A1F]";
  return "text-[#64748B]";
};

export default function DocumentCard({ item, onToggleImportant }: Props) {
  const applicationId = item.application?.id ?? item.applicationId;
  const deadlineDate = item.application?.deadlineDate;
  const dday = getDDay(deadlineDate);
  const isImportant = Boolean(item.application?.important);

  const handleToggleImportant = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    await onToggleImportant?.(item);
  };

  const cardClass =
    "flex min-w-0 flex-col rounded-lg border border-[#E3E8EF] bg-white px-4 py-3.5 transition-colors hover:border-[#93C5FD] hover:bg-[#F8FAFC]";

  const content = (
    <>
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          onClick={handleToggleImportant}
          aria-label={isImportant ? "즐겨찾기 해제" : "즐겨찾기"}
          className="mt-0.5 shrink-0"
        >
          <Star
            className={`h-4 w-4 transition-colors ${
              isImportant
                ? "fill-[#F5B800] text-[#F5B800]"
                : "text-[#CBD5E1] hover:text-[#94A3B8]"
            }`}
            strokeWidth={2}
          />
        </button>

        <p className="min-w-0 flex-1 text-[15px] font-semibold leading-tight text-[#161C26]">
          {getDocumentTitle(item)}
        </p>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <span className="text-[13px] text-[#79859A]">{item.type || "지원서"}</span>
        <span className="text-[12px] text-[#CBD5E1]">·</span>
        <span className={`text-[13px] tabular-nums ${getDdayClass(dday)}`}>
          {dday}
        </span>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[12px] text-[#79859A] tabular-nums">
          <span>진행률</span>
          <span>{item.progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#EFF2F6]">
          <div
            className="h-full rounded-full bg-[#2563EB]"
            style={{ width: `${Math.min(100, Math.max(0, item.progress ?? 0))}%` }}
          />
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-3 text-[12px] text-[#79859A] tabular-nums">
        <span className="truncate">마감 {formatApplicationDate(deadlineDate)}</span>
        <span className="shrink-0">{getRelativeTime(item.updatedAt)}</span>
      </div>
    </>
  );

  return applicationId ? (
    <Link to={`/applications/${applicationId}`} className={cardClass}>
      {content}
    </Link>
  ) : (
    <div className={cardClass}>{content}</div>
  );
}
