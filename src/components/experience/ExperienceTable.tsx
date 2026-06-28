import { ChevronDown, Layers, Pencil, Pin } from "lucide-react";
import type { ExperienceItem } from "../../types/experience";

interface Props {
  items: ExperienceItem[];
  onRowClick: (item: ExperienceItem) => void;
}

type LooseExperienceItem = ExperienceItem &
  Record<string, unknown> & {
    pinned?: boolean;
    fixed?: boolean;
    organization?: string;
    institution?: string;
    affiliation?: string;
    company?: string;
    period?: string;
    startDate?: string;
    endDate?: string;
    updatedAt?: string;
    modifiedAt?: string;
    fields?: Record<string, unknown>;
  };

export default function ExperienceTable({ items, onRowClick }: Props) {
  return (
    <div
      className="
        mt-[18px]
        overflow-hidden
        rounded-[16px]
        border border-[#E2E8F0]
        bg-white
      "
    >
      <table className="w-full table-fixed border-collapse">
        <thead className="bg-[#F8FAFC]">
          <tr className="h-[40px] border-b border-[#E2E8F0]">
            <th className="w-[62px] px-4">
              <div className="flex items-center justify-center">
                <div
                  className="
                    h-[18px]
                    w-[18px]
                    rounded-full
                    border-[1.5px] border-[#2563EB]
                    bg-white
                  "
                />
              </div>
            </th>

            <TableHead className="w-[125px]">유형</TableHead>
            <TableHead className="w-[300px]">항목명</TableHead>
            <TableHead className="w-[185px]">기관/소속</TableHead>
            <TableHead className="w-[165px]">기간</TableHead>
            <TableHead>주요 키워드</TableHead>
            <TableHead className="w-[150px]">최근 수정</TableHead>
            <TableHead className="w-[145px]">관리 상태</TableHead>
          </tr>
        </thead>

        <tbody>
          {items.map((item) => {
            const looseItem = item as LooseExperienceItem;

            return (
              <tr
                key={item.id}
                onClick={() => onRowClick(item)}
                className="
                  h-[48px]
                  cursor-pointer
                  border-b border-[#F1F5F9]
                  transition-colors
                  last:border-b-0
                  hover:bg-[#F8FAFC]
                "
              >
                <td className="px-4">
                  <div className="flex items-center justify-center">
                    <div
                      className="
                        h-[18px]
                        w-[18px]
                        rounded-full
                        border-[1.5px] border-[#2563EB]
                        bg-white
                      "
                    />
                  </div>
                </td>

                <td className="px-3 text-[14px] font-[500] text-[#475569]">
                  {item.type}
                </td>

                <td className="px-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="
                        truncate
                        text-[16px]
                        font-[700]
                        tracking-[-0.01em]
                        text-[#020617]
                      "
                    >
                      {item.name || "새 경험"}
                    </span>

                    {(looseItem.pinned || looseItem.fixed) && (
                      <Pin
                        size={14}
                        strokeWidth={1.8}
                        className="shrink-0 text-[#94A3B8]"
                      />
                    )}
                  </div>
                </td>

                <td className="px-3 text-[14px] font-[500] text-[#64748B]">
                  <span className="block truncate">
                    {getOrganization(looseItem)}
                  </span>
                </td>

                <td className="px-3 text-[14px] font-[500] text-[#475569]">
                  <span className="block truncate">{getPeriod(looseItem)}</span>
                </td>

                <td className="px-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.keywords.length > 0 ? (
                      item.keywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="
                            inline-flex h-[28px] items-center
                            rounded-[6px]
                            bg-[#F1F5F9]
                            px-2
                            text-[12px]
                            font-[500]
                            text-[#475569]
                          "
                        >
                          {keyword}
                        </span>
                      ))
                    ) : (
                      <span className="text-[14px] text-[#CBD5E1]">—</span>
                    )}
                  </div>
                </td>

                <td className="px-3 text-[14px] font-[500] text-[#475569]">
                  {getUpdatedAt(looseItem)}
                </td>

                <td className="px-3">
                  <ManageStatus status={item.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
}

function TableHead({ children, className = "" }: TableHeadProps) {
  return (
    <th
      className={`
        px-3
        text-left
        text-[14px]
        font-[600]
        text-[#64748B]
        ${className}
      `}
    >
      <div className="flex items-center gap-1">
        <span>{children}</span>
        <ChevronDown size={14} strokeWidth={1.7} className="text-[#CBD5E1]" />
      </div>
    </th>
  );
}

interface ManageStatusProps {
  status: string;
}

function ManageStatus({ status }: ManageStatusProps) {
  if (status === "병합 필요") {
    return <Layers size={17} strokeWidth={1.8} className="text-[#64748B]" />;
  }

  if (status === "보완 필요" || status === "확인 필요") {
    return <Pencil size={17} strokeWidth={1.8} className="text-[#64748B]" />;
  }

  return <span className="text-[14px] font-[500] text-[#CBD5E1]">—</span>;
}

function getTextValue(item: LooseExperienceItem, keys: string[]) {
  for (const key of keys) {
    const directValue = item[key];

    if (typeof directValue === "string" && directValue.trim()) {
      return directValue;
    }

    if (typeof directValue === "number") {
      return String(directValue);
    }

    const fieldValue = item.fields?.[key];

    if (typeof fieldValue === "string" && fieldValue.trim()) {
      return fieldValue;
    }

    if (typeof fieldValue === "number") {
      return String(fieldValue);
    }
  }

  return "";
}

function getOrganization(item: LooseExperienceItem) {
  return (
    getTextValue(item, [
      "organization",
      "institution",
      "affiliation",
      "company",
      "school",
      "agency",
      "기관",
      "소속",
      "기관/소속",
    ]) || "—"
  );
}

function getPeriod(item: LooseExperienceItem) {
  const period = getTextValue(item, ["period", "기간"]);

  if (period) return period;

  const startDate = getTextValue(item, ["startDate", "startedAt", "시작일"]);
  const endDate = getTextValue(item, ["endDate", "endedAt", "종료일"]);

  if (startDate && endDate) return `${startDate} ~ ${endDate}`;
  if (startDate) return startDate;

  return "—";
}

function getUpdatedAt(item: LooseExperienceItem) {
  return (
    getTextValue(item, [
      "updatedAt",
      "modifiedAt",
      "recentlyUpdatedAt",
      "최근 수정",
      "최근수정",
    ]) || "—"
  );
}
