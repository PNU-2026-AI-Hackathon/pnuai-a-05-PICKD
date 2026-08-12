import { Pencil, Star } from "lucide-react";
import ApplicationMenu from "../ApplicationMenu";
import { useState, type DragEvent, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import {
  formatApplicationDate,
  getDDay,
  toBackendLocalDateTime,
  toDateInputValue,
} from "../../../../utils/date";
import { getFinalResultTone, getStatusTone } from "../../../../utils/status";
import { getRelativeTime } from "../../../../utils/document";
import { useApplication } from "../../../../context/ApplicationContext";
import { Icon } from "@iconify/react";
import { getCurrentDeadlineInfo } from "../../../../utils/applicationDeadline";
import { createApplication } from "../../../../api/application";
import type { ApplicationStatus } from "../../../../types/application";

interface Props {
  row: any;
  checkedIds: number[];
  toggleCheck: (id: number) => void;
  setFocusedApplication: any;
  focusedApplication: any;
  onEdit: any;
  onChange: any;
  tableColumns: readonly (readonly [string, string])[];
  setIsDetailModalOpen: any;
  widths: Record<string, number>;
  isDragging: boolean;
  dropPosition: "before" | "after" | null;
  onRowDragStart: (applicationId: number) => void;
  onRowDragOver: (applicationId: number, position: "before" | "after") => void;
  onRowDrop: (applicationId: number, position: "before" | "after") => void;
  onRowDragEnd: () => void;
  onRequestDelete: (applicationId: number) => void;
}

const getEmploymentType = (row: any) =>
  row.employmentType || row.employType || row.careerType || row.jobType || "-";

export default function ApplicationRow({
  row,
  checkedIds,
  toggleCheck,
  setFocusedApplication,
  focusedApplication,
  onEdit,
  onChange,
  tableColumns,
  setIsDetailModalOpen,
  widths,
  isDragging,
  dropPosition,
  onRowDragStart,
  onRowDragOver,
  onRowDrop,
  onRowDragEnd,
  onRequestDelete,
}: Props) {
  const { updateApplication } = useApplication();
  const isChecked = checkedIds.includes(row.id);
  const totalCount = row.todos?.length || 0;
  const dateFieldScheduleCount = [
    row.applyDate,
    row.deadlineDate,
    row.interviewDate,
  ].filter(Boolean).length;

  const scheduleCount =
    Number(
      row.scheduleCount ??
        row.calendarCount ??
        row.calendarEventCount ??
        row.schedules?.length ??
        row.calendarEvents?.length ??
        row.events?.length ??
        0,
    ) || dateFieldScheduleCount;

  const todoCount =
    Number(
      row.todoCount ??
        row.checklistCount ??
        row.todos?.length ??
        row.checklists?.length ??
        totalCount ??
        0,
    ) || 0;

  const [isEditingDeadline, setIsEditingDeadline] = useState(false);
  const [deadlineValue, setDeadlineValue] = useState(
    toDateInputValue(row.deadlineDate),
  );

  const status = row.status ?? "작성중";
  const finalResult = row.finalResult ?? null;
  const deadlineInfo = getCurrentDeadlineInfo(row);
  const currentDday = getDDay(deadlineInfo.date);

  const cellStyle = (key: string) => ({
    width: widths[key] ?? 120,
    minWidth: widths[key] ?? 120,
    maxWidth: widths[key] ?? 120,
  });

  const openStatusModal = (event?: MouseEvent) => {
    event?.stopPropagation();
    setFocusedApplication(row);
    setIsDetailModalOpen(true);
  };

  const handleToggleImportant = async () => {
    await updateApplication(row.id, {
      ...row,
      important: !row.important,
    });
    await onChange?.();
  };

  const handleDuplicate = async () => {
    try {
      await createApplication({
        ...row,
        noticeId: null,
        company: row.company,
        jobTitle: row.jobTitle,
        position: row.position,
        industry: row.industry,
        status: row.status,
        finalResult:
          row.status === "전형완료" ? (row.finalResult ?? null) : null,
        manualRegistration: true,
      });
      await onChange?.();
    } catch (error) {
      console.error("공고 복제 실패:", error);
      alert("공고 복제에 실패했습니다.");
    }
  };

  const handleChangeStatus = async (nextStatus: ApplicationStatus) => {
    try {
      await updateApplication(row.id, {
        ...row,
        status: nextStatus,
        finalResult:
          nextStatus === "전형완료" ? (row.finalResult ?? null) : null,
      });
      await onChange?.();
    } catch (error) {
      console.error("상태 변경 실패:", error);
      alert("상태 변경에 실패했습니다.");
    }
  };

  const handleDelete = () => {
    onRequestDelete(row.id);
  };

  const saveDeadline = async () => {
    setIsEditingDeadline(false);

    const nextDeadlineDate = toBackendLocalDateTime(deadlineValue) ?? null;
    const currentDeadlineDate =
      toBackendLocalDateTime(row.deadlineDate) ?? null;
    if (nextDeadlineDate === currentDeadlineDate) return;

    const updated = {
      ...row,
      deadlineDate: nextDeadlineDate ?? undefined,
    };

    try {
      await updateApplication(row.id, () => updated);
      await onChange?.();
    } catch (error) {
      console.error("마감일 수정 실패:", error);
      setDeadlineValue(toDateInputValue(row.deadlineDate));
      alert("마감일 수정에 실패했습니다.");
    }
  };

  const renderTableCell = (key: string) => {
    switch (key) {
      case "company":
        return (
          <td
            key={key}
            className="overflow-hidden px-4 py-2.5 text-[15px] text-[#64748B] whitespace-nowrap"
            style={cellStyle(key)}
          >
            <span className="block truncate">{row.company || "-"}</span>
          </td>
        );

      case "jobTitle":
        return (
          <td
            key={key}
            className="overflow-hidden px-4 py-2.5 text-[14px] font-medium whitespace-nowrap"
            style={cellStyle(key)}
          >
            <Link
              to={`/applications/${row.id}`}
              onClick={(event) => event.stopPropagation()}
              className="block truncate text-[#161C26] transition-colors hover:text-[#2563EB] hover:underline hover:underline-offset-2"
              data-tooltip={`${row.jobTitle || "공고"} — 공고 상세 보기`}
            >
              {row.jobTitle || "-"}
            </Link>
          </td>
        );

      case "position":
        return (
          <td
            key={key}
            className="overflow-hidden px-4 py-2.5 text-[14px] text-[#64748B] whitespace-nowrap"
            style={cellStyle(key)}
          >
            <span className="block truncate">{row.position || "-"}</span>
          </td>
        );

      case "employmentType":
        return (
          <td
            key={key}
            className="overflow-hidden px-4 py-2.5 text-[14px] text-[#64748B] whitespace-nowrap"
            style={cellStyle(key)}
          >
            <span className="block truncate">{getEmploymentType(row)}</span>
          </td>
        );

      case "status": {
        const statusTone = getStatusTone(status);
        const finalTone = getFinalResultTone(finalResult);

        return (
          <td
            key={key}
            className="overflow-hidden px-4 py-2.5 whitespace-nowrap"
            style={cellStyle(key)}
          >
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={openStatusModal}
                className="inline-flex h-5 items-center gap-1.5 rounded-full px-2 text-[10px] font-semibold tracking-[-0.01em] transition-opacity hover:opacity-75"
                style={{
                  backgroundColor: statusTone.backgroundColor,
                  color: statusTone.color,
                }}
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: statusTone.dotColor }}
                />
                <span>{status}</span>
              </button>

              {status === "전형완료" && finalResult && (
                <button
                  type="button"
                  onClick={openStatusModal}
                  className="inline-flex h-5 items-center gap-1.5 rounded-full px-2 text-[10px] font-semibold tracking-[-0.01em] transition-opacity hover:opacity-75"
                  style={{
                    backgroundColor: finalTone.backgroundColor,
                    color: finalTone.color,
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: finalTone.dotColor }}
                  />
                  <span>{finalResult}</span>
                </button>
              )}
            </div>
          </td>
        );
      }

      case "deadlineDate":
        return (
          <td
            key={key}
            className="px-4 py-2.5 text-[15px] text-[#475569] whitespace-nowrap"
            style={cellStyle(key)}
            onClick={(event) => event.stopPropagation()}
          >
            {isEditingDeadline ? (
              <input
                type="date"
                value={deadlineValue}
                autoFocus
                onChange={(event) => setDeadlineValue(event.target.value)}
                onBlur={saveDeadline}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                  if (event.key === "Escape") {
                    setDeadlineValue(toDateInputValue(row.deadlineDate));
                    setIsEditingDeadline(false);
                  }
                }}
                className="w-full rounded-md border border-[#CBD5E1] px-2 py-1 text-[14px] outline-none focus:border-[#2563EB]"
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setDeadlineValue(toDateInputValue(row.deadlineDate));
                  setIsEditingDeadline(true);
                }}
                className="rounded px-1 py-1 transition-colors hover:bg-[#F1F5F9] hover:text-[#2563EB]"
                data-tooltip="마감일 수정"
                aria-label="마감일 수정"
              >
                <span className="inline-flex flex-col leading-tight">
                  <span>{formatApplicationDate(row.deadlineDate)}</span>
                  {deadlineInfo.label !== "지원마감일" && (
                    <span className="text-[12px] text-[#94A3B8]">
                      대표: {deadlineInfo.label}
                    </span>
                  )}
                </span>
              </button>
            )}
          </td>
        );

      case "dday": {
        const ddayTone =
          currentDday === "-"
            ? "bg-[#F1F5F9] text-[#94A3B8]"
            : currentDday.startsWith("D+")
              ? "bg-[#F1F5F9] text-[#94A3B8]"
              : currentDday === "D-Day" ||
                  (currentDday.startsWith("D-") &&
                    parseInt(currentDday.replace("D-", "")) <= 7)
                ? "bg-[#FEF2F2] text-[#EF4444]"
                : "bg-[#F1F5F9] text-[#64748B]";

        return (
          <td
            key={key}
            className="px-4 py-2.5 text-left whitespace-nowrap"
            style={cellStyle(key)}
          >
            <span
              className={`inline-flex min-w-9 items-center justify-center rounded-full px-2 py-1 text-[12px] font-semibold ${ddayTone}`}
            >
              {currentDday}
            </span>
          </td>
        );
      }

      case "checklistInComplete":
        return (
          <td
            key={key}
            className="overflow-hidden px-4 py-2.5 whitespace-nowrap"
            style={cellStyle(key)}
            onClick={openStatusModal}
          >
            <button
              type="button"
              className="inline-flex items-center gap-2.5 text-[15px] text-[#475569]"
            >
              {scheduleCount > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Icon
                    icon="lucide:calendar-days"
                    className="h-[18px] w-[18px] text-[#94A3B8]"
                  />
                  <span>{scheduleCount}</span>
                </span>
              )}

              {todoCount > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Icon
                    icon="lucide:square-check"
                    className="h-[18px] w-[18px] text-[#94A3B8]"
                  />
                  <span>{todoCount}</span>
                </span>
              )}

              {scheduleCount === 0 && todoCount === 0 && (
                <span className="text-[#CBD5E1]">—</span>
              )}
            </button>
          </td>
        );

      case "industry":
        return (
          <td
            key={key}
            className="overflow-hidden px-4 py-2.5 text-[15px] text-[#64748B] whitespace-nowrap"
            style={cellStyle(key)}
          >
            <span className="block truncate">{row.industry || "-"}</span>
          </td>
        );

      case "recentUpdated":
        return (
          <td
            key={key}
            className="px-4 py-2.5 text-[15px] text-[#64748B] whitespace-nowrap"
            style={cellStyle(key)}
          >
            {row.updatedAt
              ? getRelativeTime(row.updatedAt)
              : row.documents?.[0]?.updatedAt
                ? getRelativeTime(row.documents[0].updatedAt)
                : "-"}
          </td>
        );

      case "createdAt":
        return (
          <td
            key={key}
            className="px-4 py-2.5 text-[15px] text-[#64748B] tabular-nums whitespace-nowrap"
            style={cellStyle(key)}
          >
            {formatApplicationDate(row.createdAt)}
          </td>
        );

      default:
        return (
          <td
            key={key}
            className="px-4 py-2.5 text-[15px] text-[#64748B] whitespace-nowrap"
            style={cellStyle(key)}
          >
            -
          </td>
        );
    }
  };

  const getDropPosition = (event: DragEvent<HTMLTableRowElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return event.clientY < rect.top + rect.height / 2 ? "before" : "after";
  };

  return (
    <tr
      className={`group h-11 border-b border-[#E2E8F0]/60 transition-[background-color,box-shadow,opacity] hover:bg-[#F8FAFC] ${
        focusedApplication?.id === row.id ? "bg-[#F8FAFC]" : ""
      } ${isDragging ? "opacity-45" : ""} ${
        dropPosition === "before"
          ? "shadow-[inset_0_2px_0_#2563EB]"
          : dropPosition === "after"
            ? "shadow-[inset_0_-2px_0_#2563EB]"
            : ""
      }`}
      onDragOver={(event) => {
        if (isDragging) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        onRowDragOver(row.id, getDropPosition(event));
      }}
      onDrop={(event) => {
        event.preventDefault();
        onRowDrop(row.id, getDropPosition(event));
      }}
    >
      <td className="relative w-12 py-2.5 pl-1 pr-3 whitespace-nowrap">
        <ApplicationMenu
          row={row}
          onEdit={onEdit}
          onToggleImportant={handleToggleImportant}
          onDuplicate={handleDuplicate}
          onChangeStatus={handleChangeStatus}
          onDelete={handleDelete}
          isDragging={isDragging}
          onRowDragStart={() => onRowDragStart(row.id)}
          onRowDragEnd={onRowDragEnd}
        />
        <label
          className="ml-5 flex h-4 w-4 cursor-pointer items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            className="hidden"
            checked={isChecked}
            onChange={() => toggleCheck(row.id)}
          />
          <div className="flex h-4 w-4 items-center justify-center rounded-[4px] border-[1.5px] border-[#2563EB]">
            {isChecked && (
              <svg
                className="h-[13px] w-[13px] text-[#2563EB]"
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
      <td className="w-9 px-2 py-2.5 text-left whitespace-nowrap">
        <button
          onClick={async (e) => {
            e.stopPropagation();
            await handleToggleImportant();
          }}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md"
        >
          <Star
            size={18}
            className={
              row.important ? "fill-[#F58A1F] text-[#F58A1F]" : "text-[#94A3B8]"
            }
          />
        </button>
      </td>

      {tableColumns.map(([key]) => renderTableCell(key))}

      <td className="w-14 py-2.5" onClick={(e) => e.stopPropagation()}>
        <Link
          to={`/applications/${row.id}`}
          className="mx-auto flex h-8 w-8 items-center justify-center rounded-md text-[#A4AEBE] opacity-0 transition-all hover:bg-[#EFF2F6] hover:text-[#5A6678] group-hover:opacity-100"
        >
          <Pencil className="h-4 w-4" strokeWidth={2} />
        </Link>
      </td>
      <td aria-hidden />
    </tr>
  );
}
