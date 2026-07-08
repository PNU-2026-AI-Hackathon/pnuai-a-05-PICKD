import { Star } from "lucide-react";
import ApplicationMenu from "../ApplicationMenu";
import { useState, type MouseEvent } from "react";
import { getPositionColor } from "../../../../utils/application";
import {
  formatApplicationDate,
  getDDay,
  toBackendLocalDateTime,
  toDateInputValue,
} from "../../../../utils/date";
import { getStatusStyle, getStatusDisplay } from "../../../../utils/status";
import { getRelativeTime } from "../../../../utils/document";
import { useApplication } from "../../../../context/ApplicationContext";
import { Icon } from "@iconify/react";

interface Props {
  row: any;
  checkedIds: number[];
  toggleCheck: (id: number) => void;
  setFocusedApplication: any;
  focusedApplication: any;
  onEdit: any;
  onDelete: any;
  onChange: any;
  deleteApplications: any;
  addDocument: any;
  setCheckedIds: any;
  tableColumns: readonly (readonly [string, string])[];
  setIsDetailModalOpen: any;
  widths: Record<string, number>;
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
  onDelete,
  onChange,
  deleteApplications,
  addDocument,
  setCheckedIds,
  tableColumns,
  setIsDetailModalOpen,
  widths,
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

  const status = row.status ?? "WRITING";
  const finalResult = row.finalResult ?? null;
  const currentDday = getDDay(row.deadlineDate);

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
            className="border-b whitespace-nowrap border-r border-[#F1F5F9] overflow-hidden"
            style={cellStyle(key)}
          >
            <span
              className="block truncate px-3 text-black font-medium text-sm"
              title={row.company}
            >
              {row.company || "-"}
            </span>
          </td>
        );

      case "jobTitle":
        return (
          <td
            key={key}
            className="px-3 border-b whitespace-nowrap text-sm border-r border-[#F1F5F9] overflow-hidden truncate"
            style={cellStyle(key)}
            title={row.jobTitle}
          >
            <span className="font-medium text-[#0F172A]">
              {row.jobTitle || "-"}
            </span>
          </td>
        );

      case "position":
        return (
          <td
            key={key}
            className="border-b whitespace-nowrap text-sm text-center border-r border-[#F1F5F9] overflow-hidden"
            style={cellStyle(key)}
          >
            <span
              className={`inline-flex items-center justify-center px-2 py-[2px] text-xs font-semibold rounded ${getPositionColor(
                row.position || "-",
              )}`}
              title={row.position}
            >
              {row.position || "-"}
            </span>
          </td>
        );

      case "employmentType":
        return (
          <td
            key={key}
            className="px-3 border-b whitespace-nowrap text-sm text-[#64748B] border-r border-[#F1F5F9] overflow-hidden truncate"
            style={cellStyle(key)}
            title={getEmploymentType(row)}
          >
            {getEmploymentType(row)}
          </td>
        );

      case "status":
        return (
          <td
            key={key}
            className="border-b border-r border-[#F1F5F9] overflow-hidden"
            style={cellStyle(key)}
          >
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={openStatusModal}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold ${getStatusStyle(status)}`}
                title="지원상태 관리"
              >
                <span>{getStatusDisplay(status)}</span>
                {status === "COMPLETED" && finalResult && (
                  <span className="ml-1 rounded bg-white/70 px-1.5 py-0.5 text-[10px]">
                    {finalResult}
                  </span>
                )}
              </button>
            </div>
          </td>
        );

      case "deadlineDate":
        return (
          <td
            key={key}
            className="px-3 border-b whitespace-nowrap text-sm text-[#334155] border-r border-[#F1F5F9]"
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
                  if (event.key === "Enter") {
                    event.currentTarget.blur();
                  }
                  if (event.key === "Escape") {
                    setDeadlineValue(toDateInputValue(row.deadlineDate));
                    setIsEditingDeadline(false);
                  }
                }}
                className="w-full rounded-md border border-[#CBD5E1] px-2 py-1 text-sm outline-none focus:border-[#2563EB]"
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setDeadlineValue(toDateInputValue(row.deadlineDate));
                  setIsEditingDeadline(true);
                }}
                className="rounded px-1 py-1 hover:bg-[#F1F5F9] hover:text-[#2563EB]"
                title="마감일 수정"
              >
                {formatApplicationDate(row.deadlineDate)}
              </button>
            )}
          </td>
        );

      case "dday":
        return (
          <td
            key={key}
            className={`px-3 border-b whitespace-nowrap text-sm font-semibold border-r border-[#F1F5F9] ${
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
            style={cellStyle(key)}
          >
            {currentDday}
          </td>
        );

      case "checklistInComplete":
        return (
          <td
            key={key}
            className="px-3 border-b whitespace-nowrap border-r border-[#F1F5F9] overflow-hidden"
            style={cellStyle(key)}
            onClick={openStatusModal}
          >
            <button
              type="button"
              className="flex h-full w-full items-center justify-center gap-3 text-[13px] text-[#475569]"
              title="지원상태 관리"
            >
              {scheduleCount > 0 && (
                <span className="flex items-center gap-1">
                  <Icon
                    icon="lucide:calendar-days"
                    className="h-4 w-4 text-[#94A3B8]"
                  />
                  <span>{scheduleCount}</span>
                </span>
              )}

              {todoCount > 0 && (
                <span className="flex items-center gap-1">
                  <Icon
                    icon="lucide:square-check"
                    className="h-4 w-4 text-[#94A3B8]"
                  />
                  <span>{todoCount}</span>
                </span>
              )}

              {scheduleCount === 0 && todoCount === 0 && (
                <span className="text-[#CBD5E1]">-</span>
              )}
            </button>
          </td>
        );

      case "industry":
        return (
          <td
            key={key}
            className="px-3 border-b whitespace-nowrap text-sm font-semibold border-r border-[#F1F5F9] overflow-hidden truncate"
            style={cellStyle(key)}
            title={row.industry}
          >
            {row.industry || "-"}
          </td>
        );

      case "recentUpdated":
        return (
          <td
            key={key}
            className="px-3 border-b whitespace-nowrap text-sm text-[#64748B] border-r border-[#F1F5F9]"
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
            className="px-3 border-b whitespace-nowrap text-sm text-[#64748B] border-r border-[#F1F5F9]"
            style={cellStyle(key)}
          >
            {formatApplicationDate(row.createdAt)}
          </td>
        );

      default:
        return (
          <td
            key={key}
            className="px-3 border-b whitespace-nowrap text-sm text-[#64748B] border-r border-[#F1F5F9]"
            style={cellStyle(key)}
          >
            -
          </td>
        );
    }
  };

  return (
    <tr
      className={`hover:bg-[#F8FAFC] ${
        focusedApplication?.id === row.id ? "bg-[#F8FAFC]" : ""
      }`}
    >
      <td className="w-[48px] min-w-[48px] max-w-[48px] border-b text-sm border-r border-[#F1F5F9]">
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
      <td className="w-[48px] min-w-[48px] max-w-[48px] border-b border-r border-[#F1F5F9] text-center">
        <button
          onClick={async (e) => {
            e.stopPropagation();

            const updated = {
              ...row,
              important: !row.important,
            };
            await updateApplication(row.id, () => updated);
            await onChange?.();
          }}
          className="flex h-[48px] w-full items-center justify-center"
          title="관심 공고"
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
          onChange={onChange}
        />
      </td>
    </tr>
  );
}
