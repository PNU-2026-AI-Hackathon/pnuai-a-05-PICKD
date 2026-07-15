import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Columns3,
  Grid2X2,
  Layers,
  List,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Clipboard,
  X,
  Pin,
} from "lucide-react";

import ExperienceHeader from "../components/experience/ExperienceHeader";
import ExperienceTable, {
  EXPERIENCE_TABLE_COLUMNS,
  getExperienceColumnValue,
  type ExperienceColumnFilter,
  type ExperienceColumnKey,
} from "../components/experience/ExperienceTable";
import ExperienceEntryModal from "../components/experience/modal/ExperienceEntryModal";
import ExperienceDetailModal from "../components/experience/modal/ExperienceDetailModal";
import ExperienceExtractWizardModal from "../components/experience/modal/ExperienceExtractWizardModal";
import BasicInfoPanel from "../components/experience/BasicInfoPanel";
import FilesPanel from "../components/experience/FilesPanel";
import ExperiencePasteView from "../components/experience/ExperiencePasteView";
import { useClickOutside } from "../hooks/useClickOutside";
import { useApplication } from "../context/ApplicationContext";
import {
  EXPERIENCE_PRESETS,
  EXPERIENCE_TYPES,
  type ExperienceType,
} from "../constants/experience/experiencePresets";

import type { ExperienceId, ExperienceItem } from "../types/experience";
import {
  createExperience as createExperienceApi,
  deleteExperience as deleteExperienceApi,
  getExistingItemIdsFromPendingBatches,
  getExperiences as fetchExperiences,
  getPendingDuplicateBatches,
  updateExperience as updateExperienceApi,
} from "../api/experience";

const LS_VISIBLE_COLUMNS = "pickd.experience.visibleColumns.v3";

type ActiveTab = "db" | "basic-info" | "files";
type ViewMode = "list" | "card" | "paste";

export default function ExperienceScreen() {
  const { applications } = useApplication();
  const [experiences, setExperiences] = useState<ExperienceItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ExperienceItem | null>(null);
  const [isCreatingExperience, setIsCreatingExperience] = useState(false);
  const [entryOpen, setEntryOpen] = useState(false);
  const [extractOpen, setExtractOpen] = useState(false);
  const [extractMode, setExtractMode] = useState<"extract" | "pending">(
    "extract",
  );
  const [pendingFocusItemId, setPendingFocusItemId] =
    useState<ExperienceId | null>(null);
  const [, setLoadingExperiences] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("전체");
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("db");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedIds, setSelectedIds] = useState<ExperienceId[]>([]);
  const [columnPanelOpen, setColumnPanelOpen] = useState(false);
  const [toastText, setToastText] = useState("");
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<ExperienceColumnKey[]>(
    () => loadVisibleColumns(),
  );
  const [columnFilters, setColumnFilters] = useState<
    Partial<Record<ExperienceColumnKey, ExperienceColumnFilter>>
  >({});
  const [sortState, setSortState] = useState<{
    key: ExperienceColumnKey;
    dir: "asc" | "desc";
  } | null>(null);
  const columnPanelRef = useRef<HTMLDivElement | null>(null);
  const updateTimerRef = useRef<number | null>(null);

  useClickOutside(
    [columnPanelRef],
    () => setColumnPanelOpen(false),
    columnPanelOpen,
  );

  useEffect(() => {
    void reloadExperiences();

    return () => {
      if (updateTimerRef.current) window.clearTimeout(updateTimerRef.current);
    };
  }, []);

  async function reloadExperiences() {
    setLoadingExperiences(true);
    try {
      const [items, pending] = await Promise.all([
        fetchExperiences(),
        getPendingDuplicateBatches(),
      ]);
      const nextItems = markPendingDuplicateExperiences(items, pending.batches);
      setExperiences(nextItems);
      setSelectedIds((prev) =>
        prev.filter((id) => nextItems.some((item) => item.id === id)),
      );
      setSelectedItem((prev) =>
        prev ? (nextItems.find((item) => item.id === prev.id) ?? prev) : prev,
      );
    } catch (error) {
      showToast(`경험 목록을 불러오지 못했습니다. ${getErrorMessage(error)}`);
    } finally {
      setLoadingExperiences(false);
    }
  }

  async function reloadPendingDuplicateState() {
    try {
      const pending = await getPendingDuplicateBatches();
      setExperiences((prev) =>
        markPendingDuplicateExperiences(prev, pending.batches),
      );
    } catch {
      // 미처리 batch 조회 실패는 목록 사용을 막지 않습니다.
    }
  }

  useEffect(() => {
    try {
      localStorage.setItem(LS_VISIBLE_COLUMNS, JSON.stringify(visibleColumns));
    } catch {
      // ignore
    }
  }, [visibleColumns]);

  const filterTabs = useMemo(() => {
    const ownedTypes = new Set(experiences.map((item) => item.type));
    const orderedTypes = EXPERIENCE_TYPES.filter((type) =>
      ownedTypes.has(type),
    );
    const knownTypes = new Set<string>(EXPERIENCE_TYPES);
    const extraTypes = Array.from(ownedTypes)
      .filter((type) => !knownTypes.has(type))
      .sort((a, b) => a.localeCompare(b, "ko"));
    return ["전체", ...orderedTypes, ...extraTypes];
  }, [experiences]);

  const getFilterCount = (filter: string) => {
    if (filter === "전체") return experiences.length;
    return experiences.filter((item) => item.type === filter).length;
  };

  useEffect(() => {
    if (!filterTabs.includes(selectedFilter)) setSelectedFilter("전체");
  }, [filterTabs, selectedFilter]);

  const baseFilteredExperiences = useMemo(() => {
    return experiences.filter((item) => {
      const searchValue = searchText.trim().toLowerCase();
      const orgText = getOrgText(item).toLowerCase();

      const matchesSearch =
        searchValue === "" ||
        item.name.toLowerCase().includes(searchValue) ||
        item.type.toLowerCase().includes(searchValue) ||
        orgText.includes(searchValue) ||
        item.keywords.some((keyword) =>
          keyword.toLowerCase().includes(searchValue),
        );

      const matchesFilter =
        selectedFilter === "전체" ||
        (selectedFilter === "고정됨" && Boolean(item.pin)) ||
        item.type === selectedFilter;

      return matchesSearch && matchesFilter;
    });
  }, [experiences, searchText, selectedFilter]);

  const filteredExperiences = useMemo(() => {
    const filtered = baseFilteredExperiences.filter((item) => {
      for (const [key, filter] of Object.entries(columnFilters) as [
        ExperienceColumnKey,
        ExperienceColumnFilter,
      ][]) {
        if (!filter) continue;

        const value = getExperienceColumnValue(item, key);
        if (filter.kind === "select") {
          if (filter.values.length === 0) continue;
          if (Array.isArray(value)) {
            if (!value.some((entry) => filter.values.includes(entry)))
              return false;
          } else if (!filter.values.includes(String(value))) {
            return false;
          }
        } else {
          const query = filter.q.trim().toLowerCase();
          if (!query) continue;
          if (Array.isArray(value)) {
            if (!value.some((entry) => entry.toLowerCase().includes(query)))
              return false;
          } else if (!String(value).toLowerCase().includes(query)) {
            return false;
          }
        }
      }

      return true;
    });

    if (!sortState) return filtered;

    return [...filtered].sort((a, b) => {
      const aValue = getExperienceColumnValue(a, sortState.key);
      const bValue = getExperienceColumnValue(b, sortState.key);
      const aText = Array.isArray(aValue) ? aValue.join(",") : String(aValue);
      const bText = Array.isArray(bValue) ? bValue.join(",") : String(bValue);
      const compare = aText.localeCompare(bText, "ko", { numeric: true });
      return sortState.dir === "asc" ? compare : -compare;
    });
  }, [baseFilteredExperiences, columnFilters, sortState]);

  const filterOptions = useMemo(() => {
    const options: Partial<Record<ExperienceColumnKey, string[]>> = {};

    EXPERIENCE_TABLE_COLUMNS.forEach((column) => {
      const set = new Set<string>();
      experiences.forEach((item) => {
        const value = getExperienceColumnValue(item, column.key);
        if (Array.isArray(value))
          value.forEach((entry) => entry && set.add(entry));
        else if (value) set.add(String(value));
      });
      options[column.key] = Array.from(set).sort((a, b) =>
        a.localeCompare(b, "ko", { numeric: true }),
      );
    });

    return options;
  }, [experiences]);

  const activeFilterCount = (
    Object.values(columnFilters) as ExperienceColumnFilter[]
  ).filter((filter) => {
    if (!filter) return false;
    return filter.kind === "text"
      ? Boolean(filter.q.trim())
      : filter.values.length > 0;
  }).length;

  const createNewExperience = async (
    type: ExperienceType = "프로젝트",
    patch?: Partial<ExperienceItem>,
  ) => {
    const preset = EXPERIENCE_PRESETS[type];
    const fields = preset.topFields.reduce<Record<string, string>>(
      (acc, field) => {
        acc[field.key] = "";
        return acc;
      },
      {},
    );

    const draftItem: ExperienceItem = {
      id: `local-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      name: patch?.name ?? "새 경험",
      org: "",
      period: "",
      role: "",
      competencies: [],
      keywords: [],
      status: "작성중",
      missing: [],
      linkedExperienceIds: [],
      important: false,
      pin: false,
      customTopFields: [],
      hiddenFieldKeys: [],
      topFieldOrder: undefined,
      fieldLabels: {},
      updatedAt: "방금 전",
      ...patch,
      fields: {
        ...fields,
        ...(patch?.fields ?? {}),
      },
    };

    setEntryOpen(false);
    setActiveTab("db");

    setSelectedItem(draftItem);
    setIsCreatingExperience(true);

    return draftItem;
  };

  const updateExperience = (updatedItem: ExperienceItem) => {
    const normalizedItem = {
      ...updatedItem,
      updatedAt: "방금 전",
    };

    // 상세 모달에서 입력 중인 값은 selectedItem draft에만 반영합니다.
    // 표 목록(experiences)과 백엔드는 저장 버튼을 눌렀을 때만 갱신됩니다.
    setSelectedItem(normalizedItem);
  };

  const saveExperience = async (item: ExperienceItem) => {
    const normalizedItem: ExperienceItem = {
      ...item,
      updatedAt: "방금 전",
    };

    try {
      if (
        isCreatingExperience ||
        String(normalizedItem.id).startsWith("local-")
      ) {
        const createdId = await createExperienceApi(normalizedItem);
        const createdItem = {
          ...normalizedItem,
          id: createdId,
        };

        setExperiences((prev) => [createdItem, ...prev]);
        setSelectedItem(null);
        setIsCreatingExperience(false);

        showToast("경험이 저장되었습니다.");
        void reloadExperiences();
        return;
      }

      await updateExperienceApi(normalizedItem.id, normalizedItem);

      setExperiences((prev) =>
        prev.map((experience) =>
          experience.id === normalizedItem.id ? normalizedItem : experience,
        ),
      );

      setSelectedItem(null);
      showToast("수정 내용이 저장되었습니다.");
      void reloadExperiences();
    } catch (error) {
      showToast(`경험 저장에 실패했습니다. ${getErrorMessage(error)}`);
    }
  };

  const toggleSelect = (id: ExperienceId) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id],
    );
  };

  const toggleSelectAll = (ids: ExperienceId[]) => {
    setSelectedIds((prev) => {
      const allChecked = ids.length > 0 && ids.every((id) => prev.includes(id));
      if (allChecked) return prev.filter((id) => !ids.includes(id));
      return [...new Set([...prev, ...ids])];
    });
  };

  const toggleImportant = async (id: ExperienceId) => {
    const target = experiences.find((item) => item.id === id);
    if (!target) return;

    const updatedItem: ExperienceItem = {
      ...target,
      important: !target.important,
      updatedAt: "방금 전",
    };

    setExperiences((prev) =>
      prev.map((item) => (item.id === id ? updatedItem : item)),
    );
    setSelectedItem((prev) => (prev?.id === id ? updatedItem : prev));

    if (String(id).startsWith("local-")) return;

    try {
      await updateExperienceApi(id, updatedItem);
      void reloadExperiences();
    } catch (error) {
      showToast(`중요 표시 저장에 실패했습니다. ${getErrorMessage(error)}`);
      void reloadExperiences();
    }
  };

  const togglePin = async (id: ExperienceId) => {
    const target = experiences.find((item) => item.id === id);
    if (!target) return;

    const updatedItem: ExperienceItem = {
      ...target,
      pin: !target.pin,
      updatedAt: "방금 전",
    };

    setExperiences((prev) =>
      prev.map((item) => (item.id === id ? updatedItem : item)),
    );
    setSelectedItem((prev) => (prev?.id === id ? updatedItem : prev));

    if (String(id).startsWith("local-")) return;

    try {
      await updateExperienceApi(id, updatedItem);
      void reloadExperiences();
    } catch (error) {
      showToast(`고정 상태 저장에 실패했습니다. ${getErrorMessage(error)}`);
      void reloadExperiences();
    }
  };

  const openExperienceFromMenu = (item: ExperienceItem) => {
    setIsCreatingExperience(false);
    setSelectedItem(item);
  };

  const duplicateExperience = async (item: ExperienceItem) => {
    const duplicatedItem: ExperienceItem = {
      ...item,
      id: `local-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: `${item.name || "새 경험"} 복사본`,
      competencies: [...item.competencies],
      keywords: [...item.keywords],
      missing: [...item.missing],
      linkedExperienceIds: [...item.linkedExperienceIds],
      fields: { ...item.fields },
      pin: false,
      updatedAt: "방금 전",
    };

    try {
      const createdId = await createExperienceApi(duplicatedItem);
      setExperiences((previous) => [
        { ...duplicatedItem, id: createdId },
        ...previous,
      ]);
      showToast("경험을 복제했어요");
      void reloadExperiences();
    } catch (error) {
      showToast(`경험 복제에 실패했습니다. ${getErrorMessage(error)}`);
    }
  };

  const linkExperienceToApplication = async (
    item: ExperienceItem,
    applicationId: string | number,
  ) => {
    const application = applications.find(
      (candidate) => String(candidate.id) === String(applicationId),
    );
    if (!application) return;

    const linkedIds = String(item.fields.linkedApplicationIds ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (linkedIds.includes(String(application.id))) {
      showToast("이미 연결된 공고예요");
      return;
    }

    const updatedItem: ExperienceItem = {
      ...item,
      fields: {
        ...item.fields,
        linkedApplicationIds: [...linkedIds, String(application.id)].join(","),
      },
      updatedAt: "방금 전",
    };

    setExperiences((previous) =>
      previous.map((candidate) =>
        candidate.id === item.id ? updatedItem : candidate,
      ),
    );

    try {
      await updateExperienceApi(item.id, updatedItem);
      showToast(`${application.company} 공고에 연결했어요`);
      void reloadExperiences();
    } catch (error) {
      showToast(`공고 연결에 실패했습니다. ${getErrorMessage(error)}`);
      void reloadExperiences();
    }
  };

  const changeExperienceTypeFromMenu = async (
    item: ExperienceItem,
    type: ExperienceType,
  ) => {
    if (item.type === type) return;

    const updatedItem: ExperienceItem = {
      ...item,
      type,
      updatedAt: "방금 전",
    };

    setExperiences((previous) =>
      previous.map((candidate) =>
        candidate.id === item.id ? updatedItem : candidate,
      ),
    );

    try {
      await updateExperienceApi(item.id, updatedItem);
      showToast(`유형을 '${type}'(으)로 바꿨어요`);
      void reloadExperiences();
    } catch (error) {
      showToast(`유형 변경에 실패했습니다. ${getErrorMessage(error)}`);
      void reloadExperiences();
    }
  };

  const setSelectFilter = (key: ExperienceColumnKey, values: string[]) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      if (values.length === 0) delete next[key];
      else next[key] = { kind: "select", values };
      return next;
    });
  };

  const setTextFilter = (key: ExperienceColumnKey, q: string) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      if (!q.trim()) delete next[key];
      else next[key] = { kind: "text", q };
      return next;
    });
  };

  const toggleSort = (key: ExperienceColumnKey) => {
    setSortState((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  };

  const toggleVisibleColumn = (key: ExperienceColumnKey) => {
    setVisibleColumns((prev) => {
      if (prev.includes(key))
        return prev.filter((columnKey) => columnKey !== key);
      return [...prev, key];
    });
  };

  const resetColumns = () => {
    setVisibleColumns(
      EXPERIENCE_TABLE_COLUMNS.filter((column) => column.defaultVisible).map(
        (column) => column.key,
      ),
    );
    try {
      localStorage.removeItem("pickd.experience.colWidths.v5");
      localStorage.removeItem("pickd.experience.columnOrder.v5");
      localStorage.removeItem("pickd.experience.rowOrder.v1");
      localStorage.removeItem(LS_VISIBLE_COLUMNS);
    } catch {
      // ignore
    }
  };

  const copyText = async (text: string) => {
    if (!text.trim()) return;
    await navigator.clipboard?.writeText(text);
    showToast("복사되었습니다.");
  };

  const showToast = (message: string) => {
    setToastText(message);
    window.setTimeout(() => setToastText(""), 1400);
  };

  const exportItemsToCsv = (
    items: ExperienceItem[],
    filename: string,
    toastMessage: string,
  ) => {
    const headers = [
      "유형",
      "항목명",
      "기관/소속",
      "기간",
      "주요 키워드",
      "중요",
      "관리 상태",
      "최근 수정",
      "본문",
    ];

    const rows = items.map((item) => [
      item.type,
      item.name,
      getOrgText(item),
      getPeriodText(item),
      item.keywords.join(", "),
      item.important ? "true" : "false",
      item.status,
      item.updatedAt ?? "",
      item.fields.__body ?? "",
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
    showToast(toastMessage);
  };

  const exportExcel = () => {
    exportItemsToCsv(
      filteredExperiences,
      "experience-export.csv",
      "Excel에서 열 수 있는 CSV 파일로 내보냈습니다.",
    );
  };

  const exportSelectedItems = () => {
    const selectedItems = experiences.filter((item) =>
      selectedIds.includes(item.id),
    );

    if (selectedItems.length === 0) return;

    exportItemsToCsv(
      selectedItems,
      "experience-selected-export.csv",
      "선택 항목을 Excel에서 열 수 있는 CSV 파일로 내보냈습니다.",
    );
  };

  const confirmBulkDelete = async () => {
    const idsToDelete = [...selectedIds];

    setExperiences((prev) =>
      prev.filter((item) => !idsToDelete.includes(item.id)),
    );
    setSelectedIds([]);
    setBulkDeleteConfirmOpen(false);

    try {
      await Promise.all(
        idsToDelete
          .filter((id) => !String(id).startsWith("local-"))
          .map((id) => deleteExperienceApi(id)),
      );
      showToast("선택 항목이 삭제되었습니다.");
      void reloadExperiences();
    } catch (error) {
      showToast(`일부 항목 삭제에 실패했습니다. ${getErrorMessage(error)}`);
      void reloadExperiences();
    }
  };

  const deleteSingleExperience = async (id: ExperienceId) => {
    setExperiences((prev) => prev.filter((item) => item.id !== id));
    setSelectedItem(null);

    try {
      if (!String(id).startsWith("local-")) await deleteExperienceApi(id);
      showToast("경험이 삭제되었습니다.");
      void reloadExperiences();
    } catch (error) {
      showToast(`경험 삭제에 실패했습니다. ${getErrorMessage(error)}`);
      void reloadExperiences();
    }
  };

  const openPendingDuplicateResolver = (item?: ExperienceItem) => {
    setExtractMode("pending");
    setPendingFocusItemId(item?.id ?? null);
    setExtractOpen(true);
  };

  const mergeCompletedItems = (items: ExperienceItem[]) => {
    if (items.length === 0) return;

    setExperiences((prev) => mergeExperienceItems(prev, items));
    showToast(`${items.length}개의 경험이 반영되었습니다.`);
    void reloadExperiences();
  };

  return (
    <div className="min-h-screen bg-[#FBFCFE] px-10 pb-10 pt-8">
      <div className="mx-auto max-w-[1400px] space-y-3">
        <ExperienceHeader
          onOpenPaste={() => {
            setActiveTab("db");
            setViewMode("paste");
          }}
          onExtract={() => {
            setActiveTab("db");
            setExtractMode("extract");
            setPendingFocusItemId(null);
            setExtractOpen(true);
          }}
          onExportExcel={exportExcel}
        />

        <div className="mt-3 flex h-9 w-fit items-center gap-1 rounded-lg bg-[#EFF2F6] p-1">
          <TabButton
            active={activeTab === "db"}
            onClick={() => setActiveTab("db")}
          >
            경험·스펙 DB
          </TabButton>
          <TabButton
            active={activeTab === "basic-info"}
            onClick={() => setActiveTab("basic-info")}
          >
            기본정보
          </TabButton>
          <TabButton
            active={activeTab === "files"}
            onClick={() => setActiveTab("files")}
          >
            파일함
          </TabButton>
        </div>

        {activeTab === "db" && (
          <>
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => setEntryOpen(true)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#2563EB] px-3.5 text-[13px] font-[600] text-white transition-colors hover:bg-[#1D4ED8]"
              >
                <Plus size={14} strokeWidth={2.2} />
                경험 추가
              </button>

              <div className="ml-auto flex items-center gap-1.5">
                <div className="flex h-7 w-40 items-center gap-1.5 rounded-md border border-[#E3E8EF] bg-white px-2">
                  <Search size={13} className="text-[#79859A]" />
                  <input
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="항목명 검색"
                    className="w-full bg-transparent text-[13px] text-[#28303D] outline-none placeholder:text-[#A4AEBE]"
                  />
                </div>

                <button
                  type="button"
                  data-tooltip="필터 초기화"
                  aria-label="필터 초기화"
                  onClick={() => {
                    setColumnFilters({});
                    setSortState(null);
                  }}
                  className={`group relative flex h-7 w-7 items-center justify-center rounded-md border border-[#E3E8EF] bg-white transition-colors hover:bg-[#EFF2F6] ${activeFilterCount ? "text-[#2563EB]" : "text-[#79859A]"}`}
                >
                  <SlidersHorizontal size={16} strokeWidth={2} />
                  {activeFilterCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2563EB] px-1 text-[10px] font-[800] text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <div ref={columnPanelRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setColumnPanelOpen((prev) => !prev)}
                    className="group relative flex h-7 w-7 items-center justify-center rounded-md border border-[#E3E8EF] bg-white text-[#79859A] transition-colors hover:bg-[#EFF2F6] hover:text-[#28303D]"
                    data-tooltip="컬럼 표시"
                    aria-label="컬럼 표시"
                  >
                    <Columns3 size={15} strokeWidth={2} />
                  </button>

                  {columnPanelOpen && (
                    <ColumnPanel
                      visibleColumns={visibleColumns}
                      onToggleColumn={toggleVisibleColumn}
                      onReset={resetColumns}
                      onClose={() => setColumnPanelOpen(false)}
                    />
                  )}
                </div>

                <div className="flex items-center rounded-md border border-[#E3E8EF] bg-[#F6F8FB] p-[2px]">
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`group relative flex h-7 w-7 items-center justify-center rounded-md transition ${
                      viewMode === "list"
                        ? "bg-white text-[#334155] shadow-sm"
                        : "text-[#64748B] hover:bg-white/70"
                    }`}
                    data-tooltip="리스트 보기"
                    aria-label="리스트 보기"
                  >
                    <List size={15} strokeWidth={2} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode("card")}
                    className={`group relative flex h-7 w-7 items-center justify-center rounded-md transition ${
                      viewMode === "card"
                        ? "bg-white text-[#334155] shadow-sm"
                        : "text-[#64748B] hover:bg-white/70"
                    }`}
                    data-tooltip="카드 보기"
                    aria-label="카드 보기"
                  >
                    <Grid2X2 size={15} strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-3 flex min-w-0 items-end border-b border-[#E3E8EF]">
              <div className="flex min-w-0 flex-1 items-end overflow-x-auto">
                {filterTabs.map((filter) => {
                  const active =
                    selectedFilter === filter && viewMode !== "paste";
                  return (
                    <button
                      key={filter}
                      onClick={() => {
                        setSelectedFilter(filter);
                        if (viewMode === "paste") setViewMode("list");
                      }}
                      className={`flex shrink-0 items-center gap-1 border-b-2 px-3 py-2 text-[12px] font-[500] whitespace-nowrap transition-colors ${
                        active
                          ? "border-[#2563EB] font-[700] text-[#2563EB]"
                          : "border-transparent text-[#64748B] hover:text-[#28303D]"
                      }`}
                    >
                      <span>{filter}</span>
                      <span
                        className={`tabular-nums text-[11px] font-[700] ${
                          active ? "text-[#60A5FA]" : "text-[#CBD5E1]"
                        }`}
                      >
                        {getFilterCount(filter)}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() =>
                  setViewMode((prev) => (prev === "paste" ? "list" : "paste"))
                }
                className={`mb-1 ml-3 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors ${
                  viewMode === "paste"
                    ? "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]"
                    : "border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC]"
                }`}
                aria-label="복붙 보기"
              >
                <Clipboard size={15} strokeWidth={2} />
              </button>
            </div>

            {selectedIds.length > 0 && viewMode !== "paste" && (
              <div className="mt-3 flex items-center justify-between rounded-lg border border-[#D8E4F5] bg-[#F8FBFF] px-4 py-2">
                <div className="flex items-center gap-3 text-[13px] font-[600]">
                  <span className="text-[#2563EB]">
                    {selectedIds.length}개 선택됨
                  </span>

                  <span className="h-5 w-px bg-[#D8E4F5]" />

                  <button
                    type="button"
                    onClick={() => setBulkDeleteConfirmOpen(true)}
                    className="text-[#EF4444] transition-colors hover:text-[#DC2626]"
                  >
                    삭제
                  </button>

                  <button
                    type="button"
                    onClick={exportSelectedItems}
                    className="text-[#2563EB] transition-colors hover:text-[#1D4ED8]"
                  >
                    내보내기
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94A3B8] transition-colors hover:bg-[#EFF6FF] hover:text-[#64748B]"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {viewMode === "paste" ? (
              <ExperiencePasteView
                items={baseFilteredExperiences}
                onCopy={copyText}
                onOpenItem={(item) => {
                  setIsCreatingExperience(false);
                  setSelectedItem(item);
                }}
                onTogglePin={togglePin}
              />
            ) : viewMode === "list" ? (
              <ExperienceTable
                items={filteredExperiences}
                onRowClick={(item) => {
                  setIsCreatingExperience(false);
                  setSelectedItem(item);
                }}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onToggleSelectAll={toggleSelectAll}
                onToggleImportant={toggleImportant}
                onTogglePin={togglePin}
                onOpenPendingDuplicates={openPendingDuplicateResolver}
                visibleColumns={visibleColumns}
                columnFilters={columnFilters}
                filterOptions={filterOptions}
                onSetSelectFilter={setSelectFilter}
                onSetTextFilter={setTextFilter}
                sortState={sortState}
                onToggleSort={toggleSort}
                onClearSort={() => setSortState(null)}
                applications={applications.map((application) => ({
                  id: application.id,
                  company: application.company,
                  title: application.jobTitle,
                }))}
                typeOptions={EXPERIENCE_TYPES}
                onEditItem={openExperienceFromMenu}
                onDuplicateItem={(item) => void duplicateExperience(item)}
                onLinkApplication={(item, applicationId) =>
                  void linkExperienceToApplication(item, applicationId)
                }
                onChangeType={(item, type) =>
                  void changeExperienceTypeFromMenu(
                    item,
                    type as ExperienceType,
                  )
                }
                onDeleteItem={(item) => void deleteSingleExperience(item.id)}
              />
            ) : (
              <ExperienceCardGrid
                items={filteredExperiences}
                onOpen={(item) => {
                  setIsCreatingExperience(false);
                  setSelectedItem(item);
                }}
                onToggleImportant={toggleImportant}
                onTogglePin={togglePin}
              />
            )}
          </>
        )}

        {activeTab === "basic-info" && (
          <div className="mt-[26px]">
            <BasicInfoPanel />
          </div>
        )}

        {activeTab === "files" && (
          <div className="mt-[26px]">
            <FilesPanel />
          </div>
        )}

        <ExperienceEntryModal
          open={entryOpen}
          onClose={() => setEntryOpen(false)}
          onDirectInput={() => void createNewExperience()}
          onImport={() => {
            setEntryOpen(false);
            setExtractOpen(true);
          }}
        />

        <ExperienceExtractWizardModal
          open={extractOpen}
          mode={extractMode}
          focusItemId={pendingFocusItemId}
          onClose={() => setExtractOpen(false)}
          onCompleted={mergeCompletedItems}
          onPendingChanged={() => void reloadPendingDuplicateState()}
        />

        <ExperienceDetailModal
          open={!!selectedItem}
          item={selectedItem}
          onClose={() => {
            setSelectedItem(null);
            setIsCreatingExperience(false);
          }}
          onChange={updateExperience}
          onSave={saveExperience}
          onDelete={isCreatingExperience ? undefined : deleteSingleExperience}
          onCopyToast={() => showToast("복사되었습니다.")}
        />

        {bulkDeleteConfirmOpen && (
          <DeleteConfirmModal
            title="정말 삭제하시겠어요?"
            description={`${selectedIds.length}개의 경험을 삭제하면 되돌릴 수 없어요.`}
            onCancel={() => setBulkDeleteConfirmOpen(false)}
            onConfirm={confirmBulkDelete}
          />
        )}

        {toastText && (
          <div className="fixed bottom-6 left-1/2 z-[10001] -translate-x-1/2 rounded-lg bg-[#161C26] px-4 py-2.5 text-[13px] font-[500] text-white shadow-[0_14px_30px_-8px_rgba(15,23,42,0.48)]">
            {toastText}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-7 items-center rounded-md px-3 text-[13px] font-[500] transition ${
        active
          ? "bg-white text-[#0F172A] shadow-sm"
          : "text-[#64748B] hover:bg-white/60"
      }`}
    >
      {children}
    </button>
  );
}

function ColumnPanel({
  visibleColumns,
  onToggleColumn,
  onReset,
  onClose,
}: {
  visibleColumns: ExperienceColumnKey[];
  onToggleColumn: (key: ExperienceColumnKey) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute right-0 top-8 z-40 w-[220px] rounded-lg border border-[#E3E8EF] bg-white p-2 shadow-[0_12px_28px_-6px_rgba(22,28,38,0.18)]">
      <div className="mb-1 flex items-center justify-between px-2 py-1">
        <p className="text-[13px] font-[800] text-[#0F172A]">컬럼 표시</p>
        <button
          type="button"
          onClick={onClose}
          className="text-[#94A3B8] hover:text-[#64748B]"
        >
          <X size={16} />
        </button>
      </div>

      {EXPERIENCE_TABLE_COLUMNS.map((column) => {
        const checked = visibleColumns.includes(column.key);
        return (
          <label
            key={column.key}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 hover:bg-[#F8FAFC]"
          >
            <span
              className={`flex h-[16px] w-[16px] items-center justify-center rounded-[4px] border ${checked ? "border-[#2563EB] bg-[#2563EB]" : "border-[#CBD5E1] bg-white"}`}
            >
              {checked && (
                <Check size={11} strokeWidth={3} className="text-white" />
              )}
            </span>
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggleColumn(column.key)}
              className="sr-only"
            />
            <span className="text-[13px] font-[700] text-[#334155]">
              {column.label}
            </span>
          </label>
        );
      })}

      <button
        type="button"
        onClick={onReset}
        className="mt-1 h-9 w-full rounded-lg border border-[#E2E8F0] text-[13px] font-[800] text-[#64748B] hover:bg-[#F8FAFC]"
      >
        기본값으로 되돌리기
      </button>
    </div>
  );
}

function ExperienceCardGrid({
  items,
  onOpen,
  onToggleImportant,
  onTogglePin,
}: {
  items: ExperienceItem[];
  onOpen: (item: ExperienceItem) => void;
  onToggleImportant: (id: ExperienceId) => void;
  onTogglePin: (id: ExperienceId) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="mt-[18px] rounded-[16px] border border-dashed border-[#CBD5E1] bg-white py-16 text-center text-[#94A3B8]">
        <p className="text-sm font-[700]">조건에 맞는 경험이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const important = Boolean(item.important);
        const role = getExperienceCardRole(item);
        const action = getExperienceCardAction(item);
        const result = getExperienceCardResult(item);
        const competencyTags = getExperienceCardCompetencies(item);

        return (
          <article
            key={item.id}
            onClick={() => onOpen(item)}
            className="flex min-h-[350px] cursor-pointer flex-col rounded-xl border border-[#E3E8EF] bg-white px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-[#CBD5E1] hover:shadow-[0_12px_30px_-18px_rgba(15,23,42,0.35)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-md border border-[#D9E8F8] bg-[#F3F8FD] px-1.5 py-0.5 text-[11px] font-[600] text-[#2F6799]">
                    {item.type}
                  </span>
                  <ExperienceStatusBadge status={item.status} />
                  <ExperienceManageIndicator item={item} />
                </div>
                <h3 className="mt-2 line-clamp-2 text-[15px] font-[700] leading-5 text-[#28303D]">
                  {item.name}
                </h3>
                <p className="mt-1 text-[11px] leading-5 text-[#79859A]">
                  {getPeriodText(item) || "기간 미입력"} ·{" "}
                  {getExperienceCardOrg(item)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleImportant(item.id);
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded hover:bg-[#EFF2F6]"
                  aria-label={important ? "중요 표시 해제" : "중요 표시"}
                >
                  <Star
                    size={14}
                    className={
                      important
                        ? "fill-[#F58A1F] text-[#F58A1F]"
                        : "text-[#94A3B8]"
                    }
                  />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onTogglePin(item.id);
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded hover:bg-[#EFF2F6]"
                  aria-label={item.pin ? "고정 해제" : "고정"}
                >
                  <Pin
                    size={14}
                    className={
                      item.pin
                        ? "fill-[#2563EB] text-[#2563EB]"
                        : "text-[#94A3B8]"
                    }
                  />
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3 border-t border-[#EEF2F6] pt-3">
              <ExperienceCardDetail label="나의 역할" value={role} />
              <ExperienceCardDetail
                label="행동"
                value={action}
                valueClassName="line-clamp-3"
              />
              <ExperienceCardDetail label="정량 성과" value={result} />
            </div>

            <div className="mt-5 pt-4">
              <p className="mb-2 text-[10px] font-[800] tracking-wide text-[#94A3B8]">
                역량 태그
              </p>
              <div className="flex flex-wrap gap-1.5">
                {competencyTags.length > 0 ? (
                  competencyTags.slice(0, 5).map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full bg-[#F1F5F9] px-2.5 py-1 text-[11px] font-[700] text-[#475569]"
                    >
                      {keyword}
                    </span>
                  ))
                ) : (
                  <span className="text-[12px] font-[600] text-[#CBD5E1]">
                    역량 태그 없음
                  </span>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function ExperienceCardDetail({
  label,
  value,
  valueClassName = "",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="grid grid-cols-[64px_1fr] gap-2">
      <span className="text-[10px] font-[800] tracking-wide text-[#94A3B8]">
        {label}
      </span>
      <p
        className={`text-[12px] leading-5 text-[#475569] ${valueClassName}`.trim()}
      >
        {value}
      </p>
    </div>
  );
}

function ExperienceStatusBadge({
  status,
}: {
  status: ExperienceItem["status"];
}) {
  const className =
    status === "정리 완료" || status === "완료"
      ? "border-[#BFE9D7] bg-[#ECFDF5] text-[#087A55]"
      : status === "병합 필요"
        ? "border-[#F5DCA9] bg-[#FFF8E8] text-[#9A6700]"
        : status === "AI 질문 필요"
          ? "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]"
          : status === "작성중"
            ? "border-[#DDE3EA] bg-[#F6F8FB] text-[#64748B]"
            : "border-[#F4D0D3] bg-[#FFF1F2] text-[#B4232B]";

  return (
    <span
      className={`rounded-md border px-1.5 py-0.5 text-[10px] font-[700] ${className}`}
    >
      {status}
    </span>
  );
}

function getExperienceCardOrg(item: ExperienceItem) {
  const org = getOrgText(item);
  if (org !== "기관 미입력") return org;

  if (item.fields.activity) return item.fields.activity;
  if (item.type === "공모전") {
    const contestName = item.name
      .replace(/\s+(대상|최우수상|우수상|장려상|수상)\s*$/, "")
      .trim();
    if (contestName) return contestName;
  }

  return "소속 미입력";
}

function getExperienceCardRole(item: ExperienceItem) {
  return (
    item.role ||
    item.fields.role ||
    item.fields.activity ||
    item.fields.tasks ||
    "역할 미입력"
  );
}

function getExperienceCardAction(item: ExperienceItem) {
  return (
    item.fields.action ||
    item.fields.actions ||
    item.fields.tasks ||
    item.fields.task ||
    item.fields.key_experience ||
    item.fields.__body ||
    "행동 내용 미입력"
  );
}

function getExperienceCardResult(item: ExperienceItem) {
  const explicitResult =
    item.fields.result || item.fields.achievements || item.fields.deliverables;
  if (explicitResult) return explicitResult;

  const contestResult = [item.fields.rank, item.fields.prize, item.fields.award]
    .filter(Boolean)
    .join(" · ");
  if (contestResult) return contestResult;

  const languageResult = [
    item.fields.toeic ? `TOEIC ${item.fields.toeic}` : "",
    item.fields.opic ? `OPIc ${item.fields.opic}` : "",
    item.fields.score || "",
  ]
    .filter(Boolean)
    .join(" · ");
  if (languageResult) return languageResult;

  return "정량 성과 미입력";
}

function getExperienceCardCompetencies(item: ExperienceItem) {
  return Array.from(
    new Set(
      [...item.competencies, ...item.keywords]
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

function ExperienceManageIndicator({ item }: { item: ExperienceItem }) {
  if (item.hasMergeCandidate || item.status === "병합 필요") {
    return (
      <span
        className="group relative inline-flex h-5 w-5 items-center justify-center rounded text-[#C5860E]"
        data-tooltip="비슷한 항목이 있어요"
        aria-label="비슷한 항목이 있어요"
      >
        <Layers className="h-3.5 w-3.5" />
      </span>
    );
  }

  if (item.hasUnansweredAiQuestion || item.status === "AI 질문 필요") {
    return (
      <span
        className="group relative inline-flex h-5 w-5 items-center justify-center text-[#2563EB]"
        data-tooltip="미답변 AI 질문이 있어요"
        aria-label="미답변 AI 질문이 있어요"
      >
        <Sparkles className="h-3.5 w-3.5" />
      </span>
    );
  }

  if (item.status === "작성중") {
    return (
      <span
        className="group relative inline-flex h-5 w-5 items-center justify-center text-[#A4AEBE]"
        data-tooltip="아직 정리 중"
        aria-label="아직 정리 중"
      >
        <Pencil className="h-3.5 w-3.5" />
      </span>
    );
  }

  return null;
}

function DeleteConfirmModal({
  title,
  description,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[380px] rounded-xl border border-[#E3E8EF] bg-white p-5 shadow-[0_24px_60px_-16px_rgba(15,23,42,0.34)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[16px] font-[600] text-[#161C26]">{title}</h3>
            <p className="mt-2 text-[13px] leading-5 text-[#79859A]">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#79859A] transition-colors hover:bg-[#EFF2F6]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-8 rounded-md border border-[#E3E8EF] bg-white px-3 text-[12px] font-[500] text-[#3E4859] transition-colors hover:bg-[#F6F8FB]"
          >
            취소
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="h-8 rounded-md bg-[#D24545] px-3 text-[12px] font-[600] text-white transition-colors hover:bg-[#B93838]"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}

function mergeExperienceItems(
  previous: ExperienceItem[],
  incoming: ExperienceItem[],
) {
  const incomingIds = new Set(incoming.map((item) => item.id));
  return [...incoming, ...previous.filter((item) => !incomingIds.has(item.id))];
}

function markPendingDuplicateExperiences(
  items: ExperienceItem[],
  batches: Parameters<typeof getExistingItemIdsFromPendingBatches>[0],
) {
  const pendingExistingIds = getExistingItemIdsFromPendingBatches(batches);

  return items.map((item) => ({
    ...item,
    hasMergeCandidate: pendingExistingIds.has(String(item.id)),
    status: pendingExistingIds.has(String(item.id)) ? "병합 필요" : item.status,
  }));
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message) as {
        message?: string;
        error?: string;
      };
      return parsed.message ?? parsed.error ?? error.message;
    } catch {
      return error.message;
    }
  }

  return "요청 처리 중 오류가 발생했습니다.";
}

function loadVisibleColumns() {
  try {
    const raw = localStorage.getItem(LS_VISIBLE_COLUMNS);
    if (raw) {
      const parsed = JSON.parse(raw) as ExperienceColumnKey[];
      const validKeys = new Set(
        EXPERIENCE_TABLE_COLUMNS.map((column) => column.key),
      );
      const filtered = parsed.filter((key) => validKeys.has(key));
      if (filtered.length > 0) return filtered;
    }
  } catch {
    // ignore
  }
  return EXPERIENCE_TABLE_COLUMNS.filter((column) => column.defaultVisible).map(
    (column) => column.key,
  );
}

function getOrgText(item: ExperienceItem) {
  return (
    item.org ||
    item.fields.org ||
    item.fields.company ||
    item.fields.host ||
    item.fields.issuer ||
    item.fields.school ||
    item.fields.univ ||
    item.fields.lab ||
    "기관 미입력"
  );
}

function getPeriodText(item: ExperienceItem) {
  return (
    item.period ||
    item.fields.period ||
    item.fields.testDate ||
    item.fields.issuedAt ||
    item.fields.awardedAt ||
    item.fields.semester ||
    ""
  );
}
