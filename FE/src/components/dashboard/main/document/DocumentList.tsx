import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import type { MouseEvent } from "react";
import { formatApplicationDate, getDDay } from "../../../../utils/date";
import type { DocumentItem } from "../../../../types/document";
import { getRelativeTime } from "../../../../utils/document";

interface Props {
  documents: DocumentItem[];
  onToggleImportant?: (item: DocumentItem) => void | Promise<void>;
}

const getEmploymentType = (doc: DocumentItem) =>
  doc.application?.employmentType ||
  doc.application?.employType ||
  doc.application?.careerType ||
  doc.application?.jobType ||
  "-";

const getDocumentTitle = (doc: DocumentItem) => {
  const company = doc.application?.company || doc.company || "회사명 없음";
  const jobTitle =
    doc.application?.jobTitle || doc.application?.position || doc.title || "공고명 없음";
  return [company, jobTitle, getEmploymentType(doc)].filter(Boolean).join(" ");
};

const getDdayClass = (dday: string) => {
  if (dday === "-" || dday.startsWith("D+")) return "text-[#A4AEBE]";
  if (dday === "D-Day" || dday === "D-day") return "font-semibold text-[#EF4444]";
  const days = Number(dday.replace("D-", ""));
  if (Number.isFinite(days) && days <= 3) return "font-semibold text-[#EF4444]";
  if (Number.isFinite(days) && days <= 7) return "text-[#F58A1F]";
  return "text-[#64748B]";
};

export default function DocumentList({ documents, onToggleImportant }: Props) {
  if (documents.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-[14px] text-[#79859A]">
        작성 중인 서류가 없어요.
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#E3E8EF]/70">
      {documents.map((doc) => {
        const applicationId = doc.application?.id ?? doc.applicationId;
        const deadline = doc.application?.deadlineDate;
        const dday = getDDay(deadline);
        const isImportant = Boolean(doc.application?.important);

        const handleToggleImportant = async (
          event: MouseEvent<HTMLButtonElement>,
        ) => {
          event.preventDefault();
          event.stopPropagation();
          await onToggleImportant?.(doc);
        };

        const row = (
          <>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleToggleImportant}
                aria-label={isImportant ? "즐겨찾기 해제" : "즐겨찾기"}
                className="shrink-0"
              >
                <Star
                  className={`h-4 w-4 transition-colors ${
                    isImportant
                      ? "fill-[#F5B800] text-[#F5B800]"
                      : "text-[#CBD5E1] group-hover:text-[#94A3B8]"
                  }`}
                  strokeWidth={2}
                />
              </button>

              <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-[#161C26]">
                {getDocumentTitle(doc)}
              </span>

              <span className={`shrink-0 text-[13px] tabular-nums ${getDdayClass(dday)}`}>
                {dday}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-2 pl-6">
              <div className="h-1.5 max-w-[220px] flex-1 overflow-hidden rounded-full bg-[#EFF2F6]">
                <div
                  className="h-full rounded-full bg-[#2563EB]"
                  style={{ width: `${Math.min(100, Math.max(0, doc.progress ?? 0))}%` }}
                />
              </div>
              <span className="w-9 text-right text-[12px] text-[#79859A] tabular-nums">
                {doc.progress}%
              </span>
            </div>

            <div className="mt-1.5 flex items-center gap-2 pl-6 text-[12px] text-[#79859A] tabular-nums">
              <span>{doc.type || "지원서"}</span>
              <span className="text-[#CBD5E1]">·</span>
              <span>마감 {formatApplicationDate(deadline)}</span>
              <span className="text-[#CBD5E1]">·</span>
              <span>{getRelativeTime(doc.updatedAt)}</span>
            </div>
          </>
        );

        const className =
          "group block px-4 py-3 transition-colors hover:bg-[#F8FAFC]";

        return applicationId ? (
          <Link key={doc.id} to={`/applications/${applicationId}`} className={className}>
            {row}
          </Link>
        ) : (
          <div key={doc.id} className={className}>
            {row}
          </div>
        );
      })}
    </div>
  );
}
