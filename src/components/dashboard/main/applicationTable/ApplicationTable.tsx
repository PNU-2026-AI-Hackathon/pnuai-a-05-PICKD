import { useState } from "react";
import TableFilter from "./TableFilter";
import ActiveFilter from "./ActiveFilter";
import ApplicationRow from "./ApplicationRow";
import { getDDay } from "../../../../utils/date";
import { useApplication } from "../../../../context/ApplicationContext";
import { getNextStep } from "../../../../utils/status";
import { DEFAULT_COLUMNS } from "../../../../types/application";
import type { DocumentItem } from "../../../../types/document";
import type { Todo } from "../../../../types/todo";

export default function ApplicationTable({
  onEdit,
  onCompanyClick,
  onChange,
  onDelete,
  focusedApplication,
  setFocusedApplication,
  setIsDetailModalOpen,
}: any) {
  const [checkedIds, setCheckedIds] = useState<number[]>([]);
  const [showActiveFilters, setShowActiveFilters] = useState(false);
  const [filters, setFilters] = useState<{ key: string; value: string }[]>([]);
  const [sort, setSort] = useState<{
    key: string;
    order: "asc" | "desc";
  } | null>(null);

  const { applications, deleteApplications } = useApplication();
  const { addDocument } = useApplication();
  const [visibleColumns, setVisibleColumns] =
    useState<string[]>(DEFAULT_COLUMNS);

  console.log(applications.map((a) => a.status));

  const toggleCheck = (id: number) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
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
    checkedIds.forEach((id) => {
      onDelete?.(id);
    });

    if (onChange) await onChange();
    setCheckedIds([]);
    alert("삭제되었습니다");
  };

  const handleCopySelected = async () => {
    const selectedRows = applications.filter((app) =>
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
      const completedCount =
        row.todos?.filter((todo: Todo) => todo.completed).length || 0;

      const totalCount = row.todos?.length || 0;

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
          return `${completedCount}/${totalCount}`;
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
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");

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
    const values = applications.map((row: any) => row[key]).filter(Boolean);

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

  const filteredRows = applications.filter((row) => {
    return Object.entries(groupedFilters).every(([key, values]) => {
      const rowValue = (row as any)[key];

      if (rowValue == null) return false;

      return values.some((value) => String(rowValue).includes(String(value)));
    });
  });

  const sortedRows = [...filteredRows];

  if (sort) {
    sortedRows.sort((a, b) => {
      let aValue = 0;
      let bValue = 0;

      if (sort.key === "applyDate") {
        aValue = a.applyDate ? new Date(a.applyDate).getTime() : 0;
        bValue = b.applyDate ? new Date(b.applyDate).getTime() : 0;
      }

      if (sort.key === "dday") {
        aValue = a.deadlineDate ? new Date(a.deadlineDate).getTime() : 0;
        bValue = b.deadlineDate ? new Date(b.deadlineDate).getTime() : 0;
      }

      if (sort.key === "checklistInComplete") {
        aValue = a.todos?.filter((t) => !t.completed).length || 0;
        bValue = b.todos?.filter((t) => !t.completed).length || 0;
      }
      return sort.order === "asc" ? aValue - bValue : bValue - aValue;
    });
  }

  const handleSort = (key: string, order: "asc" | "desc") => {
    setSort({ key, order });
  };

  const EMPTY_COUNT = Math.max(0, 8 - sortedRows.length);

  return (
    <div className="bg-white rounded-xl overflow-visible">
      <div className="px-4 pt-[6px] pb-[6px] flex items-center justify-between">
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
        />
      </div>

      <div className="w-full overflow-visible">
        <div className="overflow-x-auto overflow-y-visible max-h-[400px]">
          <table className="w-full min-w-full border-separate border-spacing-0">
            <thead className="sticky top-0 z-30 bg-[#F1F5F9] text-sm text-black font-medium">
              <tr>
                <th className="w-[48px] px-4 py-3 bg-[#F1F5F9] sticky left-0 z-20 border-r border-[#E2E8F0]">
                  <label className="flex items-center justify-center cursor-pointer p-2 -m-2">
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={
                        filteredRows.length > 0 &&
                        checkedIds.length === filteredRows.length
                      }
                      onChange={() => {
                        const isAllChecked =
                          checkedIds.length === filteredRows.length;

                        if (isAllChecked) {
                          setCheckedIds([]);
                        } else {
                          setCheckedIds(sortedRows.map((row) => row.id));
                        }
                      }}
                    />

                    <div className="w-[15px] h-[15px] rounded-[4px] border-[1.5px] border-[#2563EB] flex items-center justify-center">
                      {filteredRows.length > 0 &&
                        checkedIds.length === filteredRows.length && (
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
                {[
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
                  ["important", "중요"],
                  ["recentUpdated", "최근 수정일"],
                  ["memo", "메모"],
                ]
                  .filter(([key]) => {
                    if (key === "company" || key === "jobTitle") {
                      return true;
                    }
                    return visibleColumns.includes(key);
                  })
                  .map(([key, label], idx) => (
                    <th
                      key={key + idx}
                      className="px-4 py-3 text-left whitespace-nowrap relative bg-[#F1F5F9] border-r border-[#E2E8F0]"
                    >
                      <div className="flex items-center gap-1">
                        {label}

                        {["applyDate", "dday", "checklistInComplete"].includes(
                          key,
                        ) ? (
                          <TableFilter
                            mode="sort"
                            columnKey={key}
                            setFilters={setFilters}
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
                  {Array(visibleColumns.length + 4)
                    .fill(null)
                    .map((_, idx) => (
                      <td key={idx}>&nbsp;</td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
