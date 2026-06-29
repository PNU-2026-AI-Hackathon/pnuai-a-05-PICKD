import { Icon } from "@iconify/react";
import { createPortal } from "react-dom";
import ApplicationMenu from "../ApplicationMenu";
import { useEffect, useRef, useState } from "react";
import { getPositionColor } from "../../../../utils/application";
import { getDDay, formatApplicationDate } from "../../../../utils/date";
import { getStatusStyle, getNextStep } from "../../../../utils/status";
import { getRelativeTime } from "../../../../utils/document";
import { useApplication } from "../../../../context/ApplicationContext";
import type { ApplicationStatus } from "../../../../types/application";
import { updateApplication as updateApplicationApi } from "../../../../api/application";

interface Props {
  row: any;
  checkedIds: number[];
  toggleCheck: (id: number) => void;
  onCompanyClick: any;
  setFocusedApplication: any;
  focusedApplication: any;
  onEdit: any;
  onDelete: any;
  onChange: any;
  deleteApplications: any;
  addDocument: any;
  setCheckedIds: any;
  visibleColumns: any;
  setIsDetailModalOpen: any;
}

export default function ApplicationRow({
  row,
  checkedIds,
  toggleCheck,
  onCompanyClick,
  setFocusedApplication,
  focusedApplication,
  onEdit,
  onDelete,
  onChange,
  deleteApplications,
  addDocument,
  setCheckedIds,
  visibleColumns,
  setIsDetailModalOpen,
}: Props) {
  const { updateApplication } = useApplication();
  const isChecked = checkedIds.includes(row.id);
  const completedCount =
    row.todos?.filter((todo: any) => todo.completed).length || 0;
  const totalCount = row.todos?.length || 0;
  const progress = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;
  const [statusOpen, setStatusOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement | null>(null);
  const statusButtonRef = useRef<HTMLButtonElement | null>(null);
  const [statusPosition, setStatusPosition] = useState({
    top: 0,
    left: 0,
  });
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const statuses: ApplicationStatus[] = [
    "지원 예정",
    "작성중",
    "제출 완료",
    "결과 대기",
    "면접 전형",
    "최종 결과",
  ];

  const getCurrentDeadlineDate = (row: any) => {
    switch (row.status) {
      case "지원 예정":
      case "작성중":
        return row.deadlineDate;

      case "제출 완료":
      case "결과 대기":
      case "면접 전형":
        return row.interviewDate;

      case "최종 결과":
        return row.deadlineDate;

      default:
        return row.deadlineDate;
    }
  };

  const currentDeadlineDate = getCurrentDeadlineDate(row);
  const currentDday = getDDay(currentDeadlineDate);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setStatusOpen(false);
      }
    };

    if (statusOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [statusOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setStatusOpen(false);
    };

    if (statusOpen) {
      window.addEventListener("scroll", handleScroll, true);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [statusOpen]);

  return (
    <tr
      onClick={() => {
        setFocusedApplication(row);
      }}
      onDoubleClick={() => {
        setFocusedApplication(row);
        setIsDetailModalOpen(true);
      }}
      className={`[&>td]:px-3
        cursor-pointer hover:bg-[#F8FAFC]
        ${focusedApplication?.id === row.id ? "bg-[#F8FAFC]" : ""}
      `}
    >
      <td className="border-b text-sm border-r border-[#F1F5F9]">
        <label
          className="flex items-center justify-center cursor-pointer p-2 -m-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            className="hidden"
            checked={isChecked}
            onChange={() => toggleCheck(row.id)}
          />
          <div className="w-[15px] h-[15px] rounded-[4px] border-[1.5px] border-[#2563EB] flex items-center justify-center">
            {isChecked && (
              <svg
                className="w-3 h-3 text-[#2563EB]"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                viewBox="0 0 24 24"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </label>
      </td>

      <td className="border-b whitespace-nowrap border-r border-[#F1F5F9]">
        <span
          className="cursor-pointer text-black font-medium text-sm hover:text-green-600"
          onClick={(e) => {
            e.stopPropagation();
            onCompanyClick(row);
          }}
        >
          {row.company}
        </span>
      </td>
      <td className="border-b whitespace-nowrap text-sm border-r border-[#F1F5F9]">
        {row.jobTitle}
      </td>
      {visibleColumns.includes("position") && (
        <td className="border-b whitespace-nowrap text-sm text-center border-r border-[#F1F5F9]">
          <span
            className={`inline-flex items-center justify-center px-2 py-[2px] text-xs font-semibold rounded ${getPositionColor(
              row.position,
            )}`}
          >
            {row.position || "-"}
          </span>
        </td>
      )}
      {visibleColumns.includes("industry") && (
        <td className="border-b whitespace-nowrap text-sm font-semibold border-r border-[#F1F5F9]">
          {row.industry || "-"}
        </td>
      )}
      {visibleColumns.includes("status") && (
        <td className="border-b border-r border-[#F1F5F9] relative">
          <div
            ref={statusRef}
            className="flex items-center justify-center relative"
          >
            <button
              ref={statusButtonRef}
              onClick={(e) => {
                e.stopPropagation();
                const rect = statusButtonRef.current?.getBoundingClientRect();
                if (rect) {
                  setStatusPosition({
                    top: rect.bottom + 8,
                    left: rect.left,
                  });
                }
                setStatusOpen((prev) => !prev);
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold  ${getStatusStyle(row.status)}`}
            >
              <span>{row.status}</span>
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {statusOpen &&
              createPortal(
                <div
                  ref={dropdownRef}
                  className="fixed z-[9999]"
                  style={{
                    top: statusPosition.top,
                    left: statusPosition.left,
                  }}
                >
                  <div className="absolute -top-[7px] left-6 w-4 h-4 bg-white border-l border-t border-[#E2E8F0] rotate-45 pointer-events-none z-10" />
                  <div className="relative z-20 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl p-1 min-w-[100px]">
                    {statuses.map((status) => (
                      <div
                        key={status}
                        onClick={async (e) => {
                          e.stopPropagation();
                          const updated = {
                            ...row,
                            status,
                          };
                          await updateApplicationApi(row.id, updated);
                          updateApplication(row.id, () => updated);
                          await onChange?.();
                          setStatusOpen(false);
                        }}
                        className={`px-2 py-2 text-sm font-medium rounded-lg cursor-pointer  whitespace-nowrap text-center transition-colors
                        ${
                          row.status === status
                            ? "bg-[#2563EB] text-white"
                            : "text-[#334155] hover:bg-gray-100"
                        }
                        `}
                      >
                        {status}
                      </div>
                    ))}
                  </div>
                </div>,
                document.body,
              )}
          </div>
        </td>
      )}
      {visibleColumns.includes("nextStep") && (
        <td className="px-4 py-2 border-b whitespace-nowrap text-sm text-[#64748B] border-r border-[#F1F5F9]">
          {getNextStep(row.status)}
        </td>
      )}
      {visibleColumns.includes("deadlineDate") && (
        <td className="border-b whitespace-nowrap text-sm text-[#334155] border-r border-[#F1F5F9]">
          {formatApplicationDate(currentDeadlineDate)}
        </td>
      )}

      {visibleColumns.includes("dday") && (
        <td
          className={`border-b whitespace-nowrap text-sm font-semibold border-r border-[#F1F5F9] ${
            currentDday === "-"
              ? "text-[#64748B]"
              : currentDday.startsWith("D+")
                ? "text-[#94A3B8]"
                : currentDday === "D-Day" ||
                    (currentDday.startsWith("D-") &&
                      parseInt(currentDday.replace("D-", "")) <= 7)
                  ? "text-[#EF4444]"
                  : "text-[#64748B]"
          }`}
        >
          {currentDday}
        </td>
      )}
      {visibleColumns.includes("documents") && (
        <td className="border-b border-r border-[#F1F5F9]">
          {row.documents?.length ? (
            <div className="flex flex-col gap-1">
              {row.documents.slice(0, 2).map((doc: any) => (
                <div key={doc.id} className="truncate text-[13px]">
                  <span className="text-[#334155] text-sm">{doc.type}</span>
                  <span className="text-[#94A3B8] mx-1">·</span>
                  <span className="text-[#94A3B8]">{doc.status || "—"}</span>
                </div>
              ))}
            </div>
          ) : (
            "-"
          )}
        </td>
      )}
      {visibleColumns.includes("checklistInComplete") && (
        <td className="border-b whitespace-nowrap border-r border-[#F1F5F9]">
          <div className="flex items-center gap-2 min-w-[120px]">
            <div className="w-[120px] h-[6px] bg-[#E5E7EB] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2563EB] rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
            <span className="text-[13px] text-[#64748B] whitespace-nowrap">
              {completedCount}/{totalCount}
            </span>
          </div>
        </td>
      )}
      {visibleColumns.includes("important") && (
        <td className="border-b border-r border-[#F1F5F9] text-center">
          <button
            onClick={async (e) => {
              e.stopPropagation();

              const updated = {
                ...row,
                important: !row.important,
              };
              await updateApplicationApi(row.id, updated);
              updateApplication(row.id, () => updated);
            }}
            className="flex h-full w-full items-center justify-center"
          >
            <Icon
              icon={row.important ? "mdi:star" : "mdi:star-outline"}
              className={`text-[20px] transition-colors ${
                row.important ? "text-[#F58A1F]" : "text-[#7C8599]"
              }`}
            />
          </button>
        </td>
      )}
      {visibleColumns.includes("recentUpdated") && (
        <td className="border-b whitespace-nowrap text-sm text-[#64748B] border-r border-[#F1F5F9]">
          {row.documents?.[0]?.updatedAt
            ? getRelativeTime(row.documents[0].updatedAt)
            : "-"}
        </td>
      )}
      {visibleColumns.includes("memo") && (
        <td className="border-b text-sm text-[#64748B] max-w-[180px] truncate border-r border-[#F1F5F9]">
          {row.memo || "-"}
        </td>
      )}
      <td
        className="w-[56px] min-w-[56px] max-w-[56px] border-b border-[#F1F5F9] sticky right-0 bg-white z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <ApplicationMenu
          row={row}
          onEdit={onEdit}
          onDelete={async () => {
            const ok = window.confirm(
              `${row.company} 항목을 삭제하시겠습니까?`,
            );
            if (!ok) return;

            await deleteApplications([row.id]);
            onDelete?.(row.id);

            setCheckedIds((prev: number[]) =>
              prev.filter((id) => id !== row.id),
            );
            if (focusedApplication?.id === row.id) {
              setFocusedApplication(null);
            }
            if (onChange) await onChange();
            alert("삭제되었습니다");
          }}
          onAddDocument={addDocument}
        />
      </td>
    </tr>
  );
}
