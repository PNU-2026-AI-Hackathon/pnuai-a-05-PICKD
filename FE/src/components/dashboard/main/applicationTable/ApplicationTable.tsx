import { useEffect, useRef, useState, type DragEvent } from "react";
import { createPortal } from "react-dom";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  GripVertical,
  Star,
} from "lucide-react";
import ActiveFilter, { ColumnPicker } from "./ActiveFilter";
import ApplicationRow from "./ApplicationRow";
import TableFilter from "./TableFilter";
import { getDDay, parseLocalDateTime } from "../../../../utils/date";
import { getCurrentDeadlineInfo } from "../../../../utils/applicationDeadline";
import { useApplication } from "../../../../context/ApplicationContext";
import { isActiveStatus } from "../../../../utils/status";
import {
  APPLICATION_STATUSES,
  DEFAULT_COLUMNS,
  type Application,
} from "../../../../types/application";
import ApplicationStatusBoard from "./ApplicationStatusBoard";
import {
  ColumnDivider,
  useResizableCols,
  useTableDividers,
} from "../../../../hooks/useResizableCols";
import { getSchedulesForApplication } from "../../../../utils/calendarEvent";

const GUTTER_COLUMN_WIDTH = 48;
const STAR_COLUMN_WIDTH = 36;
const ACTION_COLUMN_WIDTH = 56;

const DEFAULT_WIDTHS: Record<string, number> = {
  company: 90,
  jobTitle: 160,
  position: 80,
  employmentType: 75,
  status: 100,
  deadlineDate: 100,
  dday: 65,
  checklistInComplete: 90,
  industry: 90,
  recentUpdated: 100,
  createdAt: 95,
};

const MIN_WIDTHS: Record<string, number> = {
  company: 80,
  jobTitle: 130,
  position: 70,
  employmentType: 70,
  status: 90,
  deadlineDate: 90,
  dday: 60,
  checklistInComplete: 85,
  industry: 80,
  recentUpdated: 95,
  createdAt: 95,
};

const MAX_WIDTHS: Record<string, number> = {
  company: 200,
  jobTitle: 320,
  position: 160,
  employmentType: 140,
  status: 160,
  deadlineDate: 160,
  dday: 120,
  checklistInComplete: 160,
  industry: 160,
  recentUpdated: 160,
  createdAt: 160,
};

const ALL_TABLE_COLUMNS = [
  ["company", "기업명"],
  ["jobTitle", "공고명"],
  ["position", "직무"],
  ["employmentType", "고용형태"],
  ["status", "현재 상태"],
  ["deadlineDate", "지원마감일"],
  ["dday", "D-day"],
  ["checklistInComplete", "일정/할 일"],
  ["industry", "산업"],
  ["recentUpdated", "최근 수정일"],
  ["createdAt", "등록일"],
] as const;

type TableColumn = (typeof ALL_TABLE_COLUMNS)[number];

const FIXED_COLUMN_KEYS = ["company", "jobTitle"] as const;
const FIXED_COLUMN_KEY_SET = new Set<string>(FIXED_COLUMN_KEYS);

const REORDERABLE_COLUMN_KEYS = ALL_TABLE_COLUMNS.map(([key]) => key).filter(
  (key) => !FIXED_COLUMN_KEY_SET.has(key),
);

const REORDERABLE_COLUMN_KEY_SET = new Set<string>(REORDERABLE_COLUMN_KEYS);

const DEFAULT_COLUMN_ORDER = REORDERABLE_COLUMN_KEYS;
const ROW_ORDER_STORAGE_KEY = "pickd.application.rowOrder";
const PINNED_COLUMN_STORAGE_KEY = "pickd.application.pinnedColumns";

const COLUMN_FILTER_KIND: Record<string, "text" | "select"> = {
  company: "text",
  jobTitle: "text",
  position: "text",
  employmentType: "select",
  status: "select",
  deadlineDate: "select",
  dday: "select",
  checklistInComplete: "select",
  industry: "text",
  recentUpdated: "select",
  createdAt: "select",
};

type RowDropPosition = "before" | "after";

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

const QUICK_FILTERS = [
  "전체",
  "★",
  "마감임박",
  "|",
  ...APPLICATION_STATUSES.filter((status) => status !== "전형완료"),
] as const;

type QuickFilter = Exclude<(typeof QUICK_FILTERS)[number], "|">;

const getDaysUntilCurrentDeadline = (application: Application) => {
  const deadline = parseLocalDateTime(getCurrentDeadlineInfo(application).date);
  if (!deadline) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);

  return Math.ceil((deadline.getTime() - today.getTime()) / 86_400_000);
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

const toFilterDate = (value: unknown) => {
  const text = String(value ?? "").trim();
  if (!text) return "-";
  return text.length >= 10 ? text.slice(0, 10) : text;
};

const getApplicationColumnFilterValue = (
  application: Application & Record<string, any>,
  key: string,
) => {
  switch (key) {
    case "company":
      return String(application.company ?? "-");
    case "jobTitle":
      return String(application.jobTitle ?? "-");
    case "position":
      return String(application.position ?? "-");
    case "employmentType":
      return String(
        application.employmentType ??
          application.employType ??
          application.careerType ??
          application.jobType ??
          "-",
      );
    case "status":
      return String(application.status ?? "-");
    case "deadlineDate":
      return toFilterDate(application.deadlineDate);
    case "dday":
      return String(getDDay(getCurrentDeadlineInfo(application).date));
    case "checklistInComplete": {
      const scheduleCount =
        Number(
          application.scheduleCount ??
            application.calendarCount ??
            application.calendarEventCount ??
            application.schedules?.length ??
            application.calendarEvents?.length ??
            0,
        ) || 0;
      const todoCount =
        Number(
          application.todoCount ??
            application.checklistCount ??
            application.todos?.length ??
            application.checklists?.length ??
            0,
        ) || 0;
      return `일정 ${scheduleCount} / 할 일 ${todoCount}`;
    }
    case "industry":
      return String(application.industry ?? "-");
    case "recentUpdated":
      return toFilterDate(
        application.updatedAt ??
          application.recentUpdated ??
          application.documents?.[0]?.updatedAt,
      );
    case "createdAt":
      return toFilterDate(application.createdAt);
    default:
      return String(application[key] ?? "-");
  }
};

export default function ApplicationTable({
  onEdit,
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
  const [activeQuickFilter, setActiveQuickFilter] =
    useState<QuickFilter>("전체");
  const [sort, setSort] = useState<{
    key: string;
    order: "asc" | "desc";
  } | null>(null);
  const [rowOrder, setRowOrder] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(ROW_ORDER_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed)
        ? parsed.filter((id): id is number => Number.isFinite(id))
        : [];
    } catch {
      return [];
    }
  });
  const [draggingRowId, setDraggingRowId] = useState<number | null>(null);
  const [rowDropTarget, setRowDropTarget] = useState<{
    id: number;
    position: RowDropPosition;
  } | null>(null);
  const [deleteConfirmIds, setDeleteConfirmIds] = useState<number[] | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);

    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 1800);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const toggleColumnSort = (key: string) => {
    setSort((current) => {
      if (!current || current.key !== key) return { key, order: "asc" };
      if (current.order === "asc") return { key, order: "desc" };
      return null;
    });
  };

  const applicationContext = useApplication() as any;
  const { applications = [], deleteApplications } = applicationContext as {
    applications: Application[];
    deleteApplications: (ids: number[]) => Promise<void>;
  };

  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    DEFAULT_COLUMNS.filter((column) => column !== "important"),
  );
  const [pinnedColumnKeys, setPinnedColumnKeys] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(PINNED_COLUMN_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return new Set(
        Array.isArray(parsed)
          ? parsed.filter((key): key is string =>
              REORDERABLE_COLUMN_KEY_SET.has(String(key)),
            )
          : [],
      );
    } catch {
      return new Set();
    }
  });
  const [tableInstanceId] = useState(
    () => `application-table-${Math.random().toString(36).slice(2, 10)}`,
  );

  useEffect(() => {
    localStorage.setItem(
      PINNED_COLUMN_STORAGE_KEY,
      JSON.stringify([...pinnedColumnKeys]),
    );
  }, [pinnedColumnKeys]);

  const togglePinnedColumn = (key: string) => {
    if (!isReorderableColumnKey(key)) return;
    setPinnedColumnKeys((previous) => {
      const next = new Set(previous);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleDeleteColumn = (key: string) => {
    if (!isReorderableColumnKey(key)) return;
    setVisibleColumns((previous) =>
      previous.filter((columnKey) => columnKey !== key),
    );
    setPinnedColumnKeys((previous) => {
      const next = new Set(previous);
      next.delete(key);
      return next;
    });
    setFilters((previous) => previous.filter((filter) => filter.key !== key));
    setSort((previous) => (previous?.key === key ? null : previous));
  };

  const setColumnFilterValues = (key: string, values: string[]) => {
    setFilters((previous) => [
      ...previous.filter((filter) => filter.key !== key),
      ...values.map((value) => ({ key, value })),
    ]);
  };

  const [applicationOverrides, setApplicationOverrides] = useState<
    Record<string, Partial<Application>>
  >({});

  useEffect(() => {
    setApplicationOverrides({});
  }, [applications]);

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

  useEffect(() => {
    if (applications.length === 0) return;

    const currentIds = applications.map((application) => application.id);
    const currentIdSet = new Set(currentIds);

    setRowOrder((previous) => {
      const retained = previous.filter((id) => currentIdSet.has(id));
      const retainedSet = new Set(retained);
      const added = currentIds.filter((id) => !retainedSet.has(id));
      const next = [...retained, ...added];

      return next.length === previous.length &&
        next.every((id, index) => id === previous[index])
        ? previous
        : next;
    });
  }, [applications]);

  useEffect(() => {
    localStorage.setItem(ROW_ORDER_STORAGE_KEY, JSON.stringify(rowOrder));
  }, [rowOrder]);

  const handleRowDragStart = (applicationId: number) => {
    setSort(null);
    setDraggingRowId(applicationId);
    setRowDropTarget(null);
  };

  const handleRowDragOver = (
    applicationId: number,
    position: RowDropPosition,
  ) => {
    if (draggingRowId === null || draggingRowId === applicationId) {
      setRowDropTarget(null);
      return;
    }

    setRowDropTarget({ id: applicationId, position });
  };

  const handleRowDrop = (
    targetApplicationId: number,
    position: RowDropPosition,
  ) => {
    if (draggingRowId === null || draggingRowId === targetApplicationId) {
      setDraggingRowId(null);
      setRowDropTarget(null);
      return;
    }

    const sourceApplicationId = draggingRowId;
    const currentIds = applications.map((application) => application.id);
    const currentIdSet = new Set(currentIds);

    setRowOrder((previous) => {
      const retained = previous.filter((id) => currentIdSet.has(id));
      const retainedSet = new Set(retained);
      const normalized = [
        ...retained,
        ...currentIds.filter((id) => !retainedSet.has(id)),
      ];
      const withoutSource = normalized.filter(
        (id) => id !== sourceApplicationId,
      );
      const targetIndex = withoutSource.indexOf(targetApplicationId);

      if (targetIndex === -1) return normalized;

      const insertIndex = position === "after" ? targetIndex + 1 : targetIndex;
      withoutSource.splice(insertIndex, 0, sourceApplicationId);
      return withoutSource;
    });

    setDraggingRowId(null);
    setRowDropTarget(null);
  };

  const handleRowDragEnd = () => {
    setDraggingRowId(null);
    setRowDropTarget(null);
  };

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
  const tableWrapRef = useRef<HTMLDivElement>(null);

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

  const { widths, onMouseDown, resizingKey } = useResizableCols(
    "pickd.application.colWidths.reference-v1",
    DEFAULT_WIDTHS,
    MIN_WIDTHS,
    MAX_WIDTHS,
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
    finalResult?: Application["finalResult"],
  ) => {
    applyApplicationPatch(applicationId, {
      status: nextStatus as Application["status"],
      finalResult: nextStatus === "전형완료" ? (finalResult ?? null) : null,
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

  const handleDeleteSelected = () => {
    if (checkedIds.length === 0) {
      showToast("삭제할 공고를 선택해 주세요");
      return;
    }

    setDeleteConfirmIds([...checkedIds]);
  };

  const performDelete = async () => {
    const ids = deleteConfirmIds;
    if (!ids?.length || isDeleting) return;

    try {
      setIsDeleting(true);
      await deleteApplications(ids);

      setApplicationOverrides((previous) => {
        const next = { ...previous };
        ids.forEach((id) => {
          delete next[String(id)];
        });
        return next;
      });

      ids.forEach((id) => onDelete?.(id));
      setCheckedIds((previous) => previous.filter((id) => !ids.includes(id)));

      if (onChange) await onChange();

      setDeleteConfirmIds(null);
      showToast(
        ids.length === 1
          ? "공고를 삭제했어요"
          : `공고 ${ids.length}개를 삭제했어요`,
      );
    } catch (error) {
      console.error("공고 삭제 실패:", error);
      showToast("공고 삭제에 실패했어요");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopySelected = async () => {
    const selectedRows = mergedApplications.filter((app) =>
      checkedIds.includes(app.id),
    );

    if (selectedRows.length === 0) {
      showToast("복사할 공고를 선택해 주세요");
      return;
    }

    const COPY_COLUMNS = [
      { key: "company", label: "기업명" },
      { key: "jobTitle", label: "공고명" },
      { key: "position", label: "직무" },
      { key: "employmentType", label: "고용형태" },
      { key: "status", label: "현재 상태" },
      { key: "deadlineDate", label: "지원마감일" },
      { key: "dday", label: "D-day" },
      { key: "checklistInComplete", label: "일정/할 일" },
      { key: "industry", label: "산업" },
      { key: "recentUpdated", label: "최근 수정일" },
      { key: "createdAt", label: "등록일" },
      { key: "important", label: "중요" },
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
        case "employmentType":
          return (
            row.employmentType ||
            row.employType ||
            row.careerType ||
            row.jobType ||
            "-"
          );
        case "industry":
          return row.industry;
        case "status":
          return row.status;
        case "deadlineDate":
          return row.deadlineDate || "-";
        case "dday":
          return getDDay(getCurrentDeadlineInfo(row).date);
        case "checklistInComplete":
          return `일정 ${scheduleCount} / 할 일 ${todoCount}`;
        case "important":
          return row.important ? "★" : "☆";
        case "recentUpdated":
          return (
            row.updatedAt ||
            row.recentUpdated ||
            row.documents?.[0]?.updatedAt ||
            "-"
          );
        case "createdAt":
          return row.createdAt || "-";
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

      showToast("복사 완료했습니다.");
    } catch (error) {
      console.error("공고 복사 실패:", error);
      showToast("복사에 실패했습니다.");
    }
  };

  const finalRecentThreshold = new Date();
  finalRecentThreshold.setMonth(finalRecentThreshold.getMonth() - 1);
  finalRecentThreshold.setHours(0, 0, 0, 0);

  const activeApplications = mergedApplications.filter((application) =>
    isActiveStatus(application.status),
  );

  const boardApplications = mergedApplications.filter((application) => {
    if (isActiveStatus(application.status)) return true;

    const updatedAt =
      parseLocalDateTime(application.updatedAt) ??
      parseLocalDateTime(application.recentUpdated);

    if (!updatedAt) return false;
    return updatedAt.getTime() >= finalRecentThreshold.getTime();
  });

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

  const filteredRows = activeApplications.filter((row) => {
    return Object.entries(groupedFilters).every(([key, values]) => {
      const rowValue = getApplicationColumnFilterValue(
        row as Application & Record<string, any>,
        key,
      );
      const filterKind = COLUMN_FILTER_KIND[key] ?? "select";

      if (filterKind === "text") {
        return (values as string[]).some((value) =>
          rowValue.toLowerCase().includes(String(value).toLowerCase()),
        );
      }

      return (values as string[]).includes(rowValue);
    });
  });

  const getColumnFilterOptions = (key: string) => {
    const values = new Set<string>();
    activeApplications.forEach((application) => {
      const value = getApplicationColumnFilterValue(
        application as Application & Record<string, any>,
        key,
      );
      if (value) values.add(value);
    });
    return [...values].sort((a, b) =>
      a.localeCompare(b, "ko", { numeric: true }),
    );
  };

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

  const getQuickFilterCount = (filter: QuickFilter) => {
    if (filter === "전체") return searchedApplications.length;
    if (filter === "★") {
      return searchedApplications.filter((application) => application.important)
        .length;
    }
    if (filter === "마감임박") {
      return searchedApplications.filter((application) => {
        const days = getDaysUntilCurrentDeadline(application);
        return days !== null && days > 0 && days <= 3;
      }).length;
    }

    return searchedApplications.filter(
      (application) => application.status === filter,
    ).length;
  };

  const quickFilteredApplications = searchedApplications.filter(
    (application) => {
      if (activeQuickFilter === "전체") return true;
      if (activeQuickFilter === "★") return Boolean(application.important);
      if (activeQuickFilter === "마감임박") {
        const days = getDaysUntilCurrentDeadline(application);
        return days !== null && days > 0 && days <= 3;
      }

      return application.status === activeQuickFilter;
    },
  );

  const sortedRows = [...quickFilteredApplications];

  if (!sort) {
    const rowOrderIndex = new Map(
      rowOrder.map((applicationId, index) => [applicationId, index]),
    );

    sortedRows.sort((a, b) => {
      const aIndex = rowOrderIndex.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const bIndex = rowOrderIndex.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      return aIndex - bIndex;
    });
  }

  if (sort) {
    const getSortValue = (row: Application): string | number => {
      switch (sort.key) {
        case "company":
          return row.company ?? "";
        case "jobTitle":
          return row.jobTitle ?? "";
        case "position":
          return row.position ?? "";
        case "employmentType":
          return (
            row.employmentType ||
            row.employType ||
            row.careerType ||
            row.jobType ||
            ""
          );
        case "status":
          return row.status ?? "";
        case "industry":
          return row.industry ?? "";
        case "deadlineDate":
        case "dday":
          return (
            parseLocalDateTime(getCurrentDeadlineInfo(row).date)?.getTime() ??
            Number.MAX_SAFE_INTEGER
          );
        case "createdAt":
          return parseLocalDateTime(row.createdAt)?.getTime() ?? 0;
        case "recentUpdated":
          return (
            parseLocalDateTime(row.updatedAt)?.getTime() ??
            parseLocalDateTime(row.recentUpdated)?.getTime() ??
            0
          );
        case "checklistInComplete":
          return (
            Number((row as any).calendarEventCount ?? 0) +
            Number(row.todos?.length ?? 0)
          );
        default:
          return String((row as any)[sort.key] ?? "");
      }
    };

    sortedRows.sort((a, b) => {
      const aValue = getSortValue(a);
      const bValue = getSortValue(b);
      const comparison =
        typeof aValue === "number" && typeof bValue === "number"
          ? aValue - bValue
          : String(aValue).localeCompare(String(bValue), "ko", {
              numeric: true,
            });
      return sort.order === "asc" ? comparison : -comparison;
    });
  }

  const visibleRowIds = sortedRows.map((row) => row.id);

  const isAllVisibleRowsChecked =
    visibleRowIds.length > 0 &&
    visibleRowIds.every((id) => checkedIds.includes(id));

  const normalizedColumnKeys = [
    ...columnOrder.filter((key) => isReorderableColumnKey(key)),
    ...REORDERABLE_COLUMN_KEYS.filter((key) => !columnOrder.includes(key)),
  ];
  const orderedColumnKeys = [
    ...normalizedColumnKeys.filter((key) => pinnedColumnKeys.has(key)),
    ...normalizedColumnKeys.filter((key) => !pinnedColumnKeys.has(key)),
  ];

  const fixedTableColumns = ALL_TABLE_COLUMNS.filter(([key]) =>
    isFixedColumnKey(key),
  );

  const reorderableTableColumns = orderedColumnKeys
    .map((key) => ALL_TABLE_COLUMNS.find(([columnKey]) => columnKey === key))
    .filter((column): column is TableColumn => Boolean(column))
    .filter(([key]) => visibleColumns.includes(key));

  const tableColumns = [...fixedTableColumns, ...reorderableTableColumns];
  const visibleColumnSignature = tableColumns.map(([key]) => key).join("|");
  const dividerBounds = useTableDividers(tableWrapRef, [
    visibleColumnSignature,
    widths,
    viewMode,
  ]);

  const visiblePinnedColumnKeys = tableColumns
    .map(([key]) => key)
    .filter((key) => pinnedColumnKeys.has(key));

  const frozenColumns: Array<{
    childIndex: number;
    left: number;
    last: boolean;
  }> = [];

  if (visiblePinnedColumnKeys.length > 0) {
    const frozenKeys = [
      "__gutter__",
      "__star__",
      ...FIXED_COLUMN_KEYS,
      ...visiblePinnedColumnKeys,
    ];
    let left = 0;

    frozenKeys.forEach((key, index) => {
      const tableColumnIndex = tableColumns.findIndex(
        ([columnKey]) => columnKey === key,
      );
      const childIndex =
        key === "__gutter__"
          ? 1
          : key === "__star__"
            ? 2
            : tableColumnIndex + 3;
      const width =
        key === "__gutter__"
          ? GUTTER_COLUMN_WIDTH
          : key === "__star__"
            ? STAR_COLUMN_WIDTH
            : (widths[key] ?? DEFAULT_WIDTHS[key] ?? 120);

      if (childIndex > 0) {
        frozenColumns.push({
          childIndex,
          left,
          last: index === frozenKeys.length - 1,
        });
      }
      left += width;
    });
  }

  const frozenColumnCss = frozenColumns
    .map(
      ({ childIndex, left, last }) => `
        #${tableInstanceId} thead th:nth-child(${childIndex}) {
          position: sticky;
          left: ${left}px;
          z-index: 45;
          background: #F8FAFC;
          ${last ? "box-shadow: inset -1px 0 0 #E2E8F0;" : ""}
        }
        #${tableInstanceId} tbody td:nth-child(${childIndex}) {
          position: sticky;
          left: ${left}px;
          z-index: 25;
          background: #FFFFFF;
          ${last ? "box-shadow: inset -1px 0 0 #E2E8F0;" : ""}
        }
        #${tableInstanceId} tbody tr:hover td:nth-child(${childIndex}) {
          background: #F8FAFC;
        }
      `,
    )
    .join("\n");

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-[#E3E8EF] bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-[#E3E8EF] px-3 py-1.5">
          <div className="flex items-center gap-2">
            {checkedIds.length > 0 && (
              <div className="flex items-center rounded-xl bg-white px-4">
                <span className="text-sm text-[#64748B] px-1">
                  {checkedIds.length}개 선택됨
                </span>
                <button
                  onClick={handleDeleteSelected}
                  className="text-sm text-[#E5484D] px-3 py-1 hover:bg-gray-50"
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

        <div className="flex flex-wrap items-center gap-1.5 border-b border-[#E3E8EF] px-3 py-1.5">
          {QUICK_FILTERS.map((filter, index) =>
            filter === "|" ? (
              <span
                key={`separator-${index}`}
                className="mx-0.5 h-3.5 w-px bg-[#E3E8EF]"
              />
            ) : (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveQuickFilter(filter)}
                className={`inline-flex h-6 items-center gap-1 rounded-md px-2 text-[12px] font-medium transition-colors ${
                  activeQuickFilter === filter
                    ? "bg-[#EFF6FF] text-[#1D4ED8]"
                    : "text-[#79859A] hover:bg-[#F6F8FB] hover:text-[#28303D]"
                }`}
              >
                {filter === "★" ? (
                  <Star
                    className={`h-[14px] w-[14px] ${
                      activeQuickFilter === filter
                        ? "fill-[#F5B800] text-[#F5B800]"
                        : "text-[#79859A]"
                    }`}
                    strokeWidth={2}
                  />
                ) : (
                  filter
                )}
                <span
                  className={`rounded-full px-1 py-px text-[12px] font-bold leading-none tabular-nums ${
                    activeQuickFilter === filter
                      ? "bg-white/80 text-[#1D4ED8]"
                      : "bg-[#EFF2F6] text-[#A4AEBE]"
                  }`}
                >
                  {getQuickFilterCount(filter)}
                </span>
              </button>
            ),
          )}

          {viewMode === "table" && (
            <ColumnPicker
              visibleColumns={visibleColumns}
              setVisibleColumns={setVisibleColumns}
            />
          )}
        </div>

        <div className="w-full">
          {viewMode === "board" ? (
            <div className="overflow-x-auto overflow-y-visible">
              <ApplicationStatusBoard
                applications={boardApplications}
                onOpenApplication={handleOpenApplicationFromBoard}
                onToggleImportant={handleToggleImportant}
                onChangeStatus={handleChangeStatusFromBoard}
              />
            </div>
          ) : (
            <div
              ref={tableWrapRef}
              className="relative min-h-[410px] overflow-x-auto bg-white"
            >
              {frozenColumnCss && <style>{frozenColumnCss}</style>}
              {dividerBounds.map((divider) => (
                <ColumnDivider
                  key={divider.key}
                  left={divider.left}
                  onMouseDown={onMouseDown(divider.key)}
                  active={resizingKey === divider.key}
                />
              ))}
              <table
                id={tableInstanceId}
                className="w-full min-w-full table-fixed text-[15px]"
              >
                <colgroup>
                  <col style={{ width: GUTTER_COLUMN_WIDTH }} />
                  <col style={{ width: STAR_COLUMN_WIDTH }} />
                  {tableColumns.map(([key]) => (
                    <col
                      key={key}
                      style={{
                        width: widths[key] ?? DEFAULT_WIDTHS[key] ?? 120,
                      }}
                    />
                  ))}
                  <col style={{ width: ACTION_COLUMN_WIDTH }} />
                  <col style={{ width: "100%" }} />
                </colgroup>

                <thead className="bg-[#F8FAFC]">
                  <tr className="select-none border-b border-[#E2E8F0] text-[14px] font-medium text-[#5A6678]">
                    <th className="w-12 py-3 pl-1 pr-3">
                      <label className="ml-5 flex h-4 w-4 cursor-pointer items-center justify-center">
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={isAllVisibleRowsChecked}
                          onChange={() => {
                            if (isAllVisibleRowsChecked) {
                              setCheckedIds((previous) =>
                                previous.filter(
                                  (id) => !visibleRowIds.includes(id),
                                ),
                              );
                            } else {
                              setCheckedIds((previous) => [
                                ...new Set([...previous, ...visibleRowIds]),
                              ]);
                            }
                          }}
                        />

                        <span className="flex h-4 w-4 items-center justify-center rounded-[4px] border-[1.5px] border-[#2563EB]">
                          {isAllVisibleRowsChecked && (
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
                        </span>
                      </label>
                    </th>

                    <th className="w-9 px-2 py-3 text-left whitespace-nowrap">
                      ★
                    </th>

                    {tableColumns.map(([key, label], index) => (
                      <th
                        key={key + index}
                        data-resizable-column={key}
                        className="group/header relative px-4 py-3 text-left whitespace-nowrap"
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
                        {!isFixedColumnKey(key) && (
                          <GripVertical className="pointer-events-none absolute left-0.5 top-1/2 h-[14px] w-[14px] -translate-y-1/2 text-[#A4AEBE] opacity-0 transition-opacity group-hover/header:opacity-100" />
                        )}

                        <span className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleColumnSort(key);
                            }}
                            className="inline-flex items-center gap-1 hover:text-[#28303D]"
                          >
                            {label}
                            {sort?.key === key &&
                              (sort.order === "asc" ? (
                                <ArrowUp
                                  className="h-[14px] w-[14px]"
                                  strokeWidth={2}
                                />
                              ) : (
                                <ArrowDown
                                  className="h-[14px] w-[14px]"
                                  strokeWidth={2}
                                />
                              ))}
                          </button>

                          <TableFilter
                            columnKey={key}
                            label={label}
                            sort={sort}
                            setSort={setSort}
                            filterKind={COLUMN_FILTER_KIND[key]}
                            filterOptions={
                              COLUMN_FILTER_KIND[key] === "select"
                                ? getColumnFilterOptions(key)
                                : []
                            }
                            filterValues={groupedFilters[key] ?? []}
                            onFilterChange={(values) =>
                              setColumnFilterValues(key, values)
                            }
                            pinned={pinnedColumnKeys.has(key)}
                            onTogglePin={
                              isFixedColumnKey(key)
                                ? undefined
                                : () => togglePinnedColumn(key)
                            }
                            onDeleteColumn={
                              isFixedColumnKey(key)
                                ? undefined
                                : () => handleDeleteColumn(key)
                            }
                          />
                        </span>
                      </th>
                    ))}

                    <th className="w-14" />
                    <th aria-hidden />
                  </tr>
                </thead>

                <tbody>
                  {sortedRows.map((row) => (
                    <ApplicationRow
                      key={row.id}
                      row={row}
                      tableColumns={tableColumns}
                      widths={widths}
                      checkedIds={checkedIds}
                      toggleCheck={toggleCheck}
                      setFocusedApplication={setFocusedApplication}
                      focusedApplication={focusedApplication}
                      onEdit={onEdit}
                      onChange={onChange}
                      setIsDetailModalOpen={setIsDetailModalOpen}
                      isDragging={draggingRowId === row.id}
                      dropPosition={
                        rowDropTarget?.id === row.id
                          ? rowDropTarget.position
                          : null
                      }
                      onRowDragStart={handleRowDragStart}
                      onRowDragOver={handleRowDragOver}
                      onRowDrop={handleRowDrop}
                      onRowDragEnd={handleRowDragEnd}
                      onRequestDelete={(applicationId) =>
                        setDeleteConfirmIds([applicationId])
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {deleteConfirmIds &&
        createPortal(
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/35 px-4 backdrop-blur-[1px]"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !isDeleting) {
                setDeleteConfirmIds(null);
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-application-title"
              className="w-full max-w-[380px] rounded-xl border border-[#E3E8EF] bg-white p-5 shadow-[0_24px_60px_-16px_rgba(15,23,42,0.34)]"
            >
              <h2
                id="delete-application-title"
                className="text-[16px] font-semibold text-[#161C26]"
              >
                정말 삭제하시겠어요?
              </h2>
              <p className="mt-2 text-[13px] leading-5 text-[#79859A]">
                {deleteConfirmIds.length === 1
                  ? "이 공고를 삭제하면 되돌릴 수 없어요."
                  : `${deleteConfirmIds.length}개의 공고를 삭제하면 되돌릴 수 없어요.`}
              </p>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteConfirmIds(null)}
                  className="h-8 rounded-md border border-[#E3E8EF] bg-white px-3 text-[12px] font-medium text-[#3E4859] hover:bg-[#F6F8FB] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => void performDelete()}
                  className="h-8 rounded-md bg-[#D24545] px-3 text-[12px] font-semibold text-white hover:bg-[#B93838] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeleting ? "삭제 중" : "삭제"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {toastMessage &&
        createPortal(
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-none fixed bottom-6 left-1/2 z-[10001] -translate-x-1/2"
          >
            <div className="flex min-w-max items-center gap-2 rounded-lg bg-[#161C26] px-4 py-2.5 text-[13px] font-medium text-white shadow-[0_14px_30px_-8px_rgba(15,23,42,0.48)]">
              <CheckCircle2
                className="h-4 w-4 text-white/90"
                strokeWidth={2.2}
              />
              <span>{toastMessage}</span>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
