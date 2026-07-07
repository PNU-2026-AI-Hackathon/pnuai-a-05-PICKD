import { useEffect, useRef, useState, type DragEvent } from "react";
import TableFilter from "./TableFilter";
import ActiveFilter from "./ActiveFilter";
import ApplicationRow from "./ApplicationRow";
import { getDDay, parseLocalDateTime } from "../../../../utils/date";
import { useApplication } from "../../../../context/ApplicationContext";
import { getNextStep } from "../../../../utils/status";
import {
  DEFAULT_COLUMNS,
  type Application,
} from "../../../../types/application";
import type { DocumentItem } from "../../../../types/document";
import ApplicationStatusBoard from "./ApplicationStatusBoard";
import {
  ResizeHandle,
  useResizableCols,
} from "../../../../hooks/useResizableCols";
import { getSchedulesForApplication } from "../../../../utils/calendarEvent";

const DEFAULT_WIDTHS: Record<string, number> = {
  company: 180,
  jobTitle: 240,
  position: 140,
  industry: 120,
  status: 130,
  nextStep: 130,
  deadlineDate: 130,
  dday: 100,
  documents: 180,
  checklistInComplete: 130,
  recentUpdated: 130,
  memo: 150,
};

const MIN_WIDTHS: Record<string, number> = {
  company: 120,
  jobTitle: 160,
  position: 100,
  industry: 90,
  status: 100,
  nextStep: 100,
  deadlineDate: 110,
  dday: 80,
  documents: 140,
  checklistInComplete: 100,
  recentUpdated: 110,
  memo: 140,
};

const ALL_TABLE_COLUMNS = [
  ["company", "기업명"],
  ["jobTitle", "공고명"],
  ["position", "직무"],
  ["industry", "산업"],
  ["status", "현재 상태"],
  ["nextStep", "다음 단계"],
  ["deadlineDate", "마감일"],
  ["dday", "남은 기간"],
  ["documents", "작성중인 서류"],
  ["checklistInComplete", "일정/할 일"],
  ["recentUpdated", "최근 수정일"],
  ["memo", "메모"],
] as const;

type TableColumn = (typeof ALL_TABLE_COLUMNS)[number];

const FIXED_COLUMN_KEYS = ["company", "jobTitle"] as const;
const FIXED_COLUMN_KEY_SET = new Set<string>(FIXED_COLUMN_KEYS);

const REORDERABLE_COLUMN_KEYS = ALL_TABLE_COLUMNS.map(([key]) => key).filter(
  (key) => !FIXED_COLUMN_KEY_SET.has(key),
);

const REORDERABLE_COLUMN_KEY_SET = new Set<string>(REORDERABLE_COLUMN_KEYS);

const DEFAULT_COLUMN_ORDER = REORDERABLE_COLUMN_KEYS;

const isFixedColumnKey = (key: string) => {
  return FIXED_COLUMN_KEY_SET.has(key);
};

const isReorderableColumnKey = (key: string) => {
  return REORDERABLE_COLUMN_KEY_SET.has(key);
};

const hasLinkedScheduleKeyword = (events: any[], keywords: string[]) => {
  return events.some((event) => {
    const summary = String(event?.summary ?? "");
    return keywords.some((keyword) => summary.includes(keyword));
  });
};

const getDateFieldScheduleCount = (application: Application, events: any[]) => {
  const applyCount =
    application.applyDate && !hasLinkedScheduleKeyword(events, ["지원", "제출"])
      ? 1
      : 0;
  const deadlineCount =
    application.deadlineDate && !hasLinkedScheduleKeyword(events, ["마감"])
      ? 1
      : 0;
  const interviewCount =
    application.interviewDate && !hasLinkedScheduleKeyword(events, ["면접"])
      ? 1
      : 0;

  return applyCount + deadlineCount + interviewCount;
};

export default function ApplicationTable({
  onEdit,
  onCompanyClick,
  onChange,
  onDelete,
  focusedApplication,
  setFocusedApplication,
  setIsDetailModalOpen,
  calendarEvents = [],
}: any) {
  const [checkedIds, setCheckedIds] = useState<number[]>([]);
  const [showActiveFilters, setShowActiveFilters] = useState(false);
  const [filters, setFilters] = useState<{ key: string; value: string }[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "board">("table");
  const [sort, setSort] = useState<{
    key: string;
    order: "asc" | "desc";
  } | null>(null);

  const applicationContext = useApplication() as any;
  const {
    applications = [],
    deleteApplications,
    addDocument,
  } = applicationContext as {
    applications: Application[];
    deleteApplications: (ids: number[]) => Promise<void>;
    addDocument: (...args: any[]) => any;
  };

  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    DEFAULT_COLUMNS.filter((column) => column !== "important"),
  );

  const [applicationOverrides, setApplicationOverrides] = useState<
    Record<string, Partial<Application>>
  >({});

  const mergedApplications = applications.map((application) => {
    const mergedApplication = {
      ...application,
      ...(applicationOverrides[String(application.id)] ?? {}),
    };
    const linkedCalendarEvents = getSchedulesForApplication(
      calendarEvents,
      mergedApplication,
    );

    return {
      ...mergedApplication,
      calendarEvents: linkedCalendarEvents,
      calendarEventCount:
        linkedCalendarEvents.length +
        getDateFieldScheduleCount(mergedApplication, linkedCalendarEvents),
    };
  });

  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("pickd.application.columnOrder");
      if (saved) {
        const parsed = JSON.parse(saved);

        return parsed.filter((key: string) => isReorderableColumnKey(key));
      }
    } catch {
      //
    }

    return DEFAULT_COLUMN_ORDER;
  });

  useEffect(() => {
    localStorage.setItem(
      "pickd.application.columnOrder",
      JSON.stringify(columnOrder),
    );
  }, [columnOrder]);

  const draggingColumnKey = useRef<string | null>(null);

  const handleColumnDragStart = (key: string) => {
    if (isFixedColumnKey(key)) return;
    draggingColumnKey.current = key;
  };

  const handleColumnDragOver = (e: DragEvent<HTMLTableCellElement>) => {
    e.preventDefault();
  };

  const handleColumnDrop = (targetKey: string) => {
    const draggingKey = draggingColumnKey.current;
    draggingColumnKey.current = null;

    if (!draggingKey || draggingKey === targetKey) return;
    if (isFixedColumnKey(draggingKey)) return;
    if (isFixedColumnKey(targetKey)) return;

    setColumnOrder((prev) => {
      const next = prev.filter((key) => key !== draggingKey);
      const targetIndex = next.indexOf(targetKey);

      if (targetIndex === -1) {
        return [...next, draggingKey];
      }

      next.splice(targetIndex, 0, draggingKey);
      return next;
    });
  };

  const { widths, onMouseDown } = useResizableCols(
    "pickd.application.colWidths",
    DEFAULT_WIDTHS,
    MIN_WIDTHS,
  );

  const toggleCheck = (id: number) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  };

  const applyApplicationPatch = async (
    applicationId: Application["id"],
    patch: Partial<Application>,
  ) => {
    const currentApplication = mergedApplications.find(
      (application) => application.id === applicationId,
    );

    if (!currentApplication) return;

    const nextApplication = {
      ...currentApplication,
      ...patch,
    };

    setApplicationOverrides((prev) => ({
      ...prev,
      [String(applicationId)]: {
        ...(prev[String(applicationId)] ?? {}),
        ...patch,
      },
    }));

    try {
      if (typeof applicationContext.updateApplication === "function") {
        await applicationContext.updateApplication(
          applicationId,
          (prevApplication: Application) =>
            ({
              ...prevApplication,
              ...patch,
            }) as Application,
        );
      } else if (typeof applicationContext.patchApplication === "function") {
        await applicationContext.patchApplication(applicationId, patch);
      } else if (typeof applicationContext.editApplication === "function") {
        await applicationContext.editApplication(nextApplication);
      }

      await onChange?.();
    } catch (error) {
      console.error("지원 공고 수정에 실패했습니다.", error);
    }
  };

  const handleChangeStatusFromBoard = (
    applicationId: Application["id"],
    nextStatus: string,
  ) => {
    applyApplicationPatch(applicationId, {
      status: nextStatus as Application["status"],
      recentUpdated: new Date().toISOString().slice(0, 10),
    } as Partial<Application>);
  };

  const handleToggleImportant = (applicationId: Application["id"]) => {
    const currentApplication = mergedApplications.find(
      (application) => application.id === applicationId,
    );

    if (!currentApplication) return;

    applyApplicationPatch(applicationId, {
      important: !currentApplication.important,
    } as Partial<Application>);
  };

  const handleOpenApplicationFromBoard = (application: Application) => {
    setFocusedApplication?.(application);
    setIsDetailModalOpen?.(true);
  };

  const handleDeleteSelected = async () => {
    if (checkedIds.length === 0) {
      alert("삭제할 항목을 선택해주세요.");
      return;
    }

    const confirmDelete = window.confirm(
      `${checkedIds.length}개의 항목을 삭제하시겠습니까?`,
    );

    if (!confirmDelete) return;

    await deleteApplications(checkedIds);
    setApplicationOverrides((prev) => {
      const next = { ...prev };
      checkedIds.forEach((id) => {
        delete next[String(id)];
      });
      return next;
    });

    checkedIds.forEach((id) => {
      onDelete?.(id);
    });

    if (onChange) await onChange();
    setCheckedIds([]);
    alert("삭제되었습니다");
  };

  const handleCopySelected = async () => {
    const selectedRows = mergedApplications.filter((app) =>
      checkedIds.includes(app.id),
    );

    if (selectedRows.length === 0) {
      alert("복사할 항목을 선택해주세요.");
      return;
    }

    const COPY_COLUMNS = [
      { key: "company", label: "기업명" },
      { key: "jobTitle", label: "공고명" },
      { key: "position", label: "직무" },
      { key: "industry", label: "산업" },
      { key: "status", label: "현재 상태" },
      { key: "nextStep", label: "다음 단계" },
      { key: "deadlineDate", label: "마감일" },
      { key: "dday", label: "남은 기간" },
      { key: "documents", label: "작성중인 서류" },
      { key: "checklistInComplete", label: "일정/할 일" },
      { key: "important", label: "중요" },
      { key: "recentUpdated", label: "최근 수정일" },
      { key: "memo", label: "메모" },
    ];

    const activeColumns = COPY_COLUMNS.filter(
      (column) =>
        column.key === "company" ||
        column.key === "jobTitle" ||
        visibleColumns.includes(column.key),
    );

    const headers = activeColumns.map((column) => column.label);

    const getColumnValue = (row: any, key: string) => {
      const scheduleCount =
        Number(row.calendarEventCount ?? row.calendarEvents?.length ?? 0) || 0;
      const todoCount = Number(row.todos?.length ?? 0) || 0;

      switch (key) {
        case "company":
          return row.company;
        case "jobTitle":
          return row.jobTitle;
        case "position":
          return row.position;
        case "industry":
          return row.industry;
        case "status":
          return row.status;
        case "nextStep":
          return getNextStep(row.status);
        case "deadlineDate":
          return row.deadlineDate || "-";
        case "dday":
          return getDDay(row.deadlineDate);
        case "documents":
          return row.documents?.length
            ? row.documents
                .slice(0, 2)
                .map((doc: DocumentItem) => `${doc.type} · ${doc.status}`)
                .join(", ")
            : "—";
        case "checklistInComplete":
          return `일정 ${scheduleCount} / 할 일 ${todoCount}`;
        case "important":
          return row.important ? "★" : "☆";
        case "recentUpdated":
          return row.documents?.[0]?.updatedAt || "-";
        case "memo":
          return row.memo || "-";
        default:
          return "-";
      }
    };

    const escapeHtml = (value: any) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const html = `
    <table border="1" style="border-collapse: collapse;">
      <thead>
        <tr>
          ${headers.map((h) => `<th>${h}</th>`).join("")}
        </tr>
      </thead>

      <tbody>
        ${selectedRows
          .map(
            (row) => `
              <tr>
                ${activeColumns
                  .map(
                    (column) =>
                      `<td>${escapeHtml(getColumnValue(row, column.key))}</td>`,
                  )
                  .join("")}
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;

    const text = [
      headers.join("\t"),

      ...selectedRows.map((row) =>
        activeColumns
          .map((column) => getColumnValue(row, column.key))
          .join("\t"),
      ),
    ].join("\n");

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], {
            type: "text/html",
          }),
          "text/plain": new Blob([text], {
            type: "text/plain",
          }),
        }),
      ]);

      alert("복사가 완료되었습니다.");
    } catch (err) {
      alert("복사에 실패했습니다.");
    }
  };

  const getUniqueValues = (key: string) => {
    const values = mergedApplications
      .map((row: any) => row[key])
      .filter(Boolean);

    return [...new Set(values)];
  };

  const groupedFilters = filters.reduce(
    (acc, filter) => {
      if (!acc[filter.key]) {
        acc[filter.key] = [];
      }

      acc[filter.key].push(filter.value);

      return acc;
    },
    {} as Record<string, string[]>,
  );

  const filteredRows = mergedApplications.filter((row) => {
    return Object.entries(groupedFilters).every(([key, values]) => {
      const rowValue = (row as any)[key];

      if (rowValue == null) return false;

      return (values as string[]).some((value) => String(rowValue).includes(String(value)));
    });
  });

  const searchedApplications = filteredRows.filter((application) => {
    const keyword = searchKeyword.trim().toLowerCase();

    if (!keyword) return true;

    return (
      String(application.company ?? "")
        .toLowerCase()
        .includes(keyword) ||
      String(application.jobTitle ?? "")
        .toLowerCase()
        .includes(keyword)
    );
  });

  const sortedRows = [...searchedApplications];

  if (sort) {
    sortedRows.sort((a, b) => {
      let aValue = 0;
      let bValue = 0;

      if (sort.key === "applyDate") {
        aValue = parseLocalDateTime(a.applyDate)?.getTime() ?? 0;
        bValue = parseLocalDateTime(b.applyDate)?.getTime() ?? 0;
      }

      if (sort.key === "dday") {
        aValue = parseLocalDateTime(a.deadlineDate)?.getTime() ?? 0;
        bValue = parseLocalDateTime(b.deadlineDate)?.getTime() ?? 0;
      }

      if (sort.key === "checklistInComplete") {
        aValue =
          (Number((a as any).calendarEventCount ?? (a as any).calendarEvents?.length ?? 0) || 0) +
          (a.todos?.length || 0);
        bValue =
          (Number((b as any).calendarEventCount ?? (b as any).calendarEvents?.length ?? 0) || 0) +
          (b.todos?.length || 0);
      }
      return sort.order === "asc" ? aValue - bValue : bValue - aValue;
    });
  }

  const handleSort = (key: string, order: "asc" | "desc") => {
    setSort({ key, order });
  };

  const EMPTY_COUNT = Math.max(0, 8 - sortedRows.length);

  const visibleRowIds = sortedRows.map((row) => row.id);

  const isAllVisibleRowsChecked =
    visibleRowIds.length > 0 &&
    visibleRowIds.every((id) => checkedIds.includes(id));

  const orderedColumnKeys = [
    ...columnOrder.filter((key) => isReorderableColumnKey(key)),
    ...REORDERABLE_COLUMN_KEYS.filter((key) => !columnOrder.includes(key)),
  ];

  const fixedTableColumns = ALL_TABLE_COLUMNS.filter(([key]) =>
    isFixedColumnKey(key),
  );

  const reorderableTableColumns = orderedColumnKeys
    .map((key) => ALL_TABLE_COLUMNS.find(([columnKey]) => columnKey === key))
    .filter((column): column is TableColumn => Boolean(column))
    .filter(([key]) => visibleColumns.includes(key));

  const tableColumns = [...fixedTableColumns, ...reorderableTableColumns];
  const tableWidth =
    48 +
    48 +
    56 +
    tableColumns.reduce((sum, [key]) => {
      return sum + (widths[key] ?? DEFAULT_WIDTHS[key] ?? 120);
    }, 0);

  return (
    <div className="bg-white rounded-xl overflow-visible">
      <div className="px-4 pt-[6px] pb-[6px] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {checkedIds.length > 0 && (
            <div className="flex items-center rounded-xl bg-white px-4">
              <span className="text-sm text-[#64748B] px-1">
                {checkedIds.length}개 선택됨
              </span>
              <button
                onClick={handleDeleteSelected}
                className="text-sm text-[#334155] px-3 py-1 hover:bg-gray-50"
              >
                삭제
              </button>
              <button
                onClick={handleCopySelected}
                className="text-sm text-[#334155] px-3 py-1 hover:bg-gray-50"
              >
                복사
              </button>
            </div>
          )}
        </div>

        <ActiveFilter
          show={showActiveFilters}
          setShow={setShowActiveFilters}
          filters={filters}
          setFilters={setFilters}
          sort={sort}
          setSort={setSort}
          groupedFilters={groupedFilters}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          searchKeyword={searchKeyword}
          setSearchKeyword={setSearchKeyword}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
      </div>

      <div className="w-full overflow-visible">
        <div
          className={
            viewMode === "board"
              ? "overflow-x-auto overflow-y-visible"
              : "overflow-x-auto overflow-y-visible max-h-[400px]"
          }
        >
          {viewMode === "board" ? (
            <ApplicationStatusBoard
              applications={sortedRows}
              onOpenApplication={handleOpenApplicationFromBoard}
              onToggleImportant={handleToggleImportant}
              onChangeStatus={handleChangeStatusFromBoard}
            />
          ) : (
            <div className="overflow-x-auto">
              <table
                className="border-separate border-spacing-0 table-fixed"
                style={{ width: tableWidth, minWidth: "100%" }}
              >
                <thead className="sticky top-0 z-30 bg-[#F1F5F9] text-sm text-black font-medium">
                  <tr>
                    <th className="w-[48px] px-4 py-3 bg-[#F1F5F9] sticky left-0 z-20 border-r border-[#E2E8F0]">
                      <label className="flex items-center justify-center cursor-pointer p-2 -m-2">
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={isAllVisibleRowsChecked}
                          onChange={() => {
                            if (isAllVisibleRowsChecked) {
                              setCheckedIds((prev) =>
                                prev.filter(
                                  (id) => !visibleRowIds.includes(id),
                                ),
                              );
                            } else {
                              setCheckedIds((prev) => [
                                ...new Set([...prev, ...visibleRowIds]),
                              ]);
                            }
                          }}
                        />

                        <div className="w-[15px] h-[15px] rounded-[4px] border-[1.5px] border-[#2563EB] flex items-center justify-center">
                          {isAllVisibleRowsChecked && (
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
                    </th>
                    <th className="w-[60px] min-w-[60px] max-w-[60px] px-3 py-3 bg-[#F1F5F9] border-r border-[#E2E8F0] text-center select-none">
                      중요
                    </th>
                    {tableColumns.map(([key, label], idx) => (
                      <th
                        key={key + idx}
                        className="relative px-4 py-3 text-left whitespace-nowrap bg-[#F1F5F9] border-r border-[#E2E8F0] select-none"
                        style={{
                          width: widths[key],
                          minWidth: widths[key],
                          maxWidth: widths[key],
                        }}
                        draggable={!isFixedColumnKey(key)}
                        onDragStart={() => handleColumnDragStart(key)}
                        onDragOver={
                          isFixedColumnKey(key)
                            ? undefined
                            : handleColumnDragOver
                        }
                        onDrop={
                          isFixedColumnKey(key)
                            ? undefined
                            : () => handleColumnDrop(key)
                        }
                      >
                        <div
                          className={`flex items-center gap-1 pr-2 ${
                            isFixedColumnKey(key) ? "" : "cursor-grab"
                          }`}
                        >
                          {label}

                          {[
                            "applyDate",
                            "dday",
                            "checklistInComplete",
                          ].includes(key) ? (
                            <TableFilter
                              mode="sort"
                              columnKey={key}
                              setFilters={setFilters}
                              setSort={setSort}
                              handleSort={handleSort}
                            />
                          ) : ![
                              "documents",
                              "important",
                              "recentUpdated",
                              "nextStep",
                              "memo",
                            ].includes(key) ? (
                            <TableFilter
                              mode="filter"
                              columnKey={key}
                              values={getUniqueValues(key)}
                              setFilters={setFilters}
                            />
                          ) : null}
                        </div>

                        <ResizeHandle onMouseDown={onMouseDown(key)} />
                      </th>
                    ))}
                    <th className="w-[56px] min-w-[56px] max-w-[56px] sticky right-0 bg-[#F1F5F9] z-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((row) => (
                    <ApplicationRow
                      key={row.id}
                      row={row}
                      visibleColumns={visibleColumns}
                      widths={widths}
                      checkedIds={checkedIds}
                      toggleCheck={toggleCheck}
                      onCompanyClick={onCompanyClick}
                      setFocusedApplication={setFocusedApplication}
                      focusedApplication={focusedApplication}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onChange={onChange}
                      deleteApplications={deleteApplications}
                      addDocument={addDocument}
                      setCheckedIds={setCheckedIds}
                      setIsDetailModalOpen={setIsDetailModalOpen}
                    />
                  ))}
                  {Array.from({ length: EMPTY_COUNT }).map((_, i) => (
                    <tr key={`empty-${i}`} className="h-[67px]">
                      {Array(tableColumns.length + 3)
                        .fill(null)
                        .map((_, idx) => (
                          <td key={idx}>&nbsp;</td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
