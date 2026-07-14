import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Pin,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from "lucide-react";

import {
  EXPERIENCE_PRESETS,
  EXPERIENCE_TYPES,
  EXTRA_FIELD_OPTIONS,
  KEYWORD_OPTIONS,
  type ExperienceType,
} from "../../../constants/experience/experiencePresets";

import type { CustomTopField, ExperienceItem } from "../../../types/experience";
import { Icon } from "@iconify/react";
import ExperienceCopyGenerator from "../ExperienceCopyGenerator";

interface Props {
  open: boolean;
  item: ExperienceItem | null;
  onClose: () => void;
  onChange: (item: ExperienceItem) => void;
  onSave?: (item: ExperienceItem) => void;
  onDelete?: (id: ExperienceItem["id"]) => void;
  onCopyToast?: () => void;
}

type FieldKind = "title" | "type" | "text" | "keywords" | "important";

interface FieldRowData {
  key: string;
  label: string;
  placeholder?: string;
  kind: FieldKind;
  custom?: boolean;
}

export default function ExperienceDetailModal({
  open,
  item,
  onClose,
  onChange,
  onSave,
  onDelete,
  onCopyToast,
}: Props) {
  const [headerTypeOpen, setHeaderTypeOpen] = useState(false);
  const [rowTypeOpen, setRowTypeOpen] = useState(false);
  const [keywordOpen, setKeywordOpen] = useState(false);
  const [directKeywordInputOpen, setDirectKeywordInputOpen] = useState(false);
  const [directKeywordValue, setDirectKeywordValue] = useState("");
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const [otherFieldMenuOpen, setOtherFieldMenuOpen] = useState(false);
  const [customFieldModalOpen, setCustomFieldModalOpen] = useState(false);
  const [customFieldLabel, setCustomFieldLabel] = useState("");
  const [customFieldValue, setCustomFieldValue] = useState("");
  const [activeFieldMenuKey, setActiveFieldMenuKey] = useState<string | null>(
    null,
  );
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [draggingFieldKey, setDraggingFieldKey] = useState<string | null>(null);
  const [dragOverFieldKey, setDragOverFieldKey] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<
    "before" | "after" | null
  >(null);
  const [showSentenceTags, setShowSentenceTags] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [draftAnswer, setDraftAnswer] = useState("");
  const [generatedSentences, setGeneratedSentences] = useState<string[]>([]);
  const [aiQuestionIndex, setAiQuestionIndex] = useState(0);
  const [toastMessage, setToastMessage] = useState("");
  const [saveState, setSaveState] = useState<"저장됨" | "작성중">("저장됨");
  const bodyTextAreaRef = useRef<HTMLTextAreaElement | null>(null);

  const preset = item ? EXPERIENCE_PRESETS[item.type] : null;
  const aiQuestion = useMemo(() => {
    if (!preset) return "어떤 행동들을 했고 어떤 과정을 거쳤나요?";

    const questions = preset.aiQuestions?.length
      ? preset.aiQuestions
      : ["어떤 행동들을 했고 어떤 과정을 거쳤나요?"];

    return questions[aiQuestionIndex % questions.length];
  }, [preset, aiQuestionIndex]);

  const closeFloatingMenus = () => {
    setHeaderTypeOpen(false);
    setRowTypeOpen(false);
    setKeywordOpen(false);
    setAddFieldOpen(false);
    setOtherFieldMenuOpen(false);
    setActiveFieldMenuKey(null);
    setHeaderMenuOpen(false);
  };

  useEffect(() => {
    if (open && item) setSaveState("저장됨");
  }, [open, item?.id]);

  useEffect(() => {
    if (!open) {
      closeFloatingMenus();
      setDraggingFieldKey(null);
      setDragOverFieldKey(null);
      setDragOverPosition(null);
      setCopyOpen(false);
      setAiOpen(false);
      setDraftAnswer("");
      setGeneratedSentences([]);
      setToastMessage("");
      setHeaderMenuOpen(false);
      setDeleteConfirmOpen(false);
      setOtherFieldMenuOpen(false);
      setCustomFieldModalOpen(false);
      setCustomFieldLabel("");
      setCustomFieldValue("");
      setDirectKeywordInputOpen(false);
      setDirectKeywordValue("");
    }
  }, [open]);

  useEffect(() => {
    if (!toastMessage) return;

    const timer = window.setTimeout(() => setToastMessage(""), 2200);

    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  if (!open || !item || !preset) return null;

  const currentStatus = item.status === "완료" ? "완료" : "작성중";

  const defaultRows: FieldRowData[] = [
    {
      key: "__title",
      label: preset.titleLabel,
      placeholder: preset.titleLabel,
      kind: "title",
    },
    ...preset.topFields.map((field) => ({
      key: field.key,
      label: field.label,
      placeholder: field.placeholder,
      kind: "text" as const,
    })),
    {
      key: "__keywords",
      label: "주요 키워드",
      kind: "keywords",
    },
    {
      key: "__important",
      label: "중요",
      kind: "important",
    },
  ];

  const customRows: FieldRowData[] = (item.customTopFields ?? []).map(
    (field) => ({
      key: field.key,
      label: field.label,
      placeholder: field.placeholder,
      kind: "text",
      custom: true,
    }),
  );

  const allRows = [...defaultRows, ...customRows];
  const hiddenKeys = new Set(item.hiddenFieldKeys ?? []);
  const order = item.topFieldOrder ?? [];
  const rowMap = new Map(allRows.map((row) => [row.key, row]));

  const orderedFromSaved = order
    .map((key) => rowMap.get(key))
    .filter((row): row is FieldRowData => Boolean(row));

  const restRows = allRows.filter((row) => !order.includes(row.key));

  const orderedRows = [...orderedFromSaved, ...restRows].filter(
    (row) => !hiddenKeys.has(row.key),
  );

  const existingFieldKeys = new Set(allRows.map((row) => row.key));
  const seenOtherFieldKeys = new Set<string>();
  const otherTypeFieldGroups = EXPERIENCE_TYPES.filter(
    (type) => type !== item.type,
  )
    .map((type) => ({
      type,
      fields: EXPERIENCE_PRESETS[type].topFields.filter((field) => {
        if (
          existingFieldKeys.has(field.key) ||
          seenOtherFieldKeys.has(field.key)
        ) {
          return false;
        }
        seenOtherFieldKeys.add(field.key);
        return true;
      }),
    }))
    .filter((group) => group.fields.length > 0);

  const isImportant = Boolean(item.important);
  const hiddenFieldCount = item.hiddenFieldKeys?.length ?? 0;

  const updateItem = (next: Partial<ExperienceItem>) => {
    setSaveState("작성중");
    onChange({
      ...item,
      ...next,
    });
  };

  const updateFieldValue = (key: string, value: string) => {
    const nextItem: ExperienceItem = {
      ...item,
      fields: {
        ...item.fields,
        [key]: value,
      },
    };

    if (key === "org") nextItem.org = value;
    if (key === "period") nextItem.period = value;
    if (key === "role") nextItem.role = value;

    setSaveState("작성중");
    onChange(nextItem);
  };

  const changeType = (type: ExperienceType) => {
    onChange({
      ...item,
      type,
      topFieldOrder: undefined,
      hiddenFieldKeys: [],
      fieldLabels: {},
      customTopFields: item.customTopFields ?? [],
    });

    setHeaderTypeOpen(false);
    setRowTypeOpen(false);
  };

  const getFieldValue = (key: string) => {
    if (key === "org") return item.org ?? item.fields[key] ?? "";
    if (key === "period") return item.period ?? item.fields[key] ?? "";
    if (key === "role") return item.role ?? item.fields[key] ?? "";

    return item.fields[key] ?? "";
  };

  const getFieldLabel = (field: FieldRowData) => {
    return item.fieldLabels?.[field.key] ?? field.label;
  };

  const toggleKeyword = (keyword: string) => {
    const exists = item.keywords.includes(keyword);

    onChange({
      ...item,
      keywords: exists
        ? item.keywords.filter((itemKeyword) => itemKeyword !== keyword)
        : [...item.keywords, keyword],
    });
  };

  const removeKeyword = (keyword: string) => {
    onChange({
      ...item,
      keywords: item.keywords.filter((itemKeyword) => itemKeyword !== keyword),
    });
  };

  const addDirectKeyword = () => {
    setKeywordOpen(false);
    setDirectKeywordInputOpen(true);
    setDirectKeywordValue("");
  };

  const submitDirectKeyword = () => {
    const keyword = directKeywordValue.trim();

    if (!keyword) return;
    if (item.keywords.includes(keyword)) {
      showToast("이미 추가된 키워드예요.");
      setDirectKeywordValue("");
      return;
    }

    onChange({
      ...item,
      keywords: [...item.keywords, keyword],
    });
    setDirectKeywordValue("");
  };

  const addField = (field: { key: string; label: string }) => {
    const newField: CustomTopField = {
      key: `custom_${field.key}_${Date.now()}`,
      label: field.label,
      placeholder: `${field.label} 입력`,
    };

    onChange({
      ...item,
      customTopFields: [...(item.customTopFields ?? []), newField],
      topFieldOrder: [...orderedRows.map((row) => row.key), newField.key],
    });

    setAddFieldOpen(false);
  };

  const addCustomField = () => {
    setAddFieldOpen(false);
    setOtherFieldMenuOpen(false);
    setCustomFieldLabel("");
    setCustomFieldValue("");
    setCustomFieldModalOpen(true);
  };

  const confirmAddCustomField = () => {
    const label = customFieldLabel.trim();
    if (!label) return;

    const normalizedKey =
      label
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]+/g, "_")
        .replace(/^_+|_+$/g, "") || "field";
    const key = `custom_${normalizedKey}_${Date.now()}`;
    const newField: CustomTopField = {
      key,
      label,
      placeholder: `${label} 입력`,
    };

    onChange({
      ...item,
      fields: {
        ...item.fields,
        [key]: customFieldValue.trim(),
      },
      customTopFields: [...(item.customTopFields ?? []), newField],
      topFieldOrder: [...orderedRows.map((row) => row.key), key],
    });

    setCustomFieldModalOpen(false);
    setCustomFieldLabel("");
    setCustomFieldValue("");
  };

  const renameField = (field: FieldRowData) => {
    const nextLabel = window.prompt(
      "변경할 필드 이름을 입력해주세요.",
      getFieldLabel(field),
    );

    if (!nextLabel?.trim()) return;

    onChange({
      ...item,
      fieldLabels: {
        ...(item.fieldLabels ?? {}),
        [field.key]: nextLabel.trim(),
      },
    });

    setActiveFieldMenuKey(null);
  };

  const hideField = (field: FieldRowData) => {
    onChange({
      ...item,
      hiddenFieldKeys: [...(item.hiddenFieldKeys ?? []), field.key],
    });

    setActiveFieldMenuKey(null);
  };

  const deleteField = (field: FieldRowData) => {
    if (!field.custom) {
      hideField(field);
      return;
    }

    const nextFields = { ...item.fields };
    delete nextFields[field.key];

    onChange({
      ...item,
      fields: nextFields,
      customTopFields: (item.customTopFields ?? []).filter(
        (customField) => customField.key !== field.key,
      ),
      topFieldOrder: (item.topFieldOrder ?? []).filter(
        (key) => key !== field.key,
      ),
    });

    setActiveFieldMenuKey(null);
  };

  const moveField = (field: FieldRowData, direction: "up" | "down") => {
    const currentOrder = orderedRows.map((row) => row.key);
    const index = currentOrder.indexOf(field.key);
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (index === -1) return;
    if (targetIndex < 0 || targetIndex >= currentOrder.length) return;

    const nextOrder = [...currentOrder];

    [nextOrder[index], nextOrder[targetIndex]] = [
      nextOrder[targetIndex],
      nextOrder[index],
    ];

    onChange({
      ...item,
      topFieldOrder: nextOrder,
    });

    setActiveFieldMenuKey(null);
  };

  const clearDragState = () => {
    setDraggingFieldKey(null);
    setDragOverFieldKey(null);
    setDragOverPosition(null);
  };

  const handleFieldDragStart = (fieldKey: string) => {
    closeFloatingMenus();
    setDraggingFieldKey(fieldKey);
  };

  const handleFieldDragOver = (
    fieldKey: string,
    position: "before" | "after",
  ) => {
    if (!draggingFieldKey || draggingFieldKey === fieldKey) return;

    setDragOverFieldKey(fieldKey);
    setDragOverPosition(position);
  };

  const reorderFieldByDrag = (
    targetFieldKey: string,
    position: "before" | "after",
  ) => {
    if (!draggingFieldKey || draggingFieldKey === targetFieldKey) {
      clearDragState();
      return;
    }

    const currentOrder = orderedRows.map((row) => row.key);
    const sourceIndex = currentOrder.indexOf(draggingFieldKey);
    const targetIndex = currentOrder.indexOf(targetFieldKey);

    if (sourceIndex === -1 || targetIndex === -1) {
      clearDragState();
      return;
    }

    const nextOrder = [...currentOrder];
    const [movingKey] = nextOrder.splice(sourceIndex, 1);
    const nextTargetIndex = nextOrder.indexOf(targetFieldKey);

    nextOrder.splice(
      position === "before" ? nextTargetIndex : nextTargetIndex + 1,
      0,
      movingKey,
    );

    onChange({
      ...item,
      topFieldOrder: nextOrder,
    });

    clearDragState();
  };

  const handleFieldDragEnd = () => {
    clearDragState();
  };

  const showToast = (message: string) => {
    setToastMessage(message);
  };

  const showHiddenFields = () => {
    if (hiddenFieldCount === 0) return;

    onChange({
      ...item,
      hiddenFieldKeys: [],
    });

    setHeaderMenuOpen(false);
    showToast("숨겨진 필드를 다시 표시했어요.");
  };

  const requestDeleteExperience = () => {
    setHeaderMenuOpen(false);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteExperience = () => {
    if (!onDelete) {
      setDeleteConfirmOpen(false);
      showToast("삭제 기능을 부모 컴포넌트에 연결해야 해요.");
      return;
    }

    onDelete(item.id);
    setDeleteConfirmOpen(false);
    onClose();
  };

  const makeTemporaryAiSentence = (answer: string) => {
    const normalizedAnswer = answer.trim();

    if (!normalizedAnswer) return "";

    if (
      normalizedAnswer.endsWith(".") ||
      normalizedAnswer.endsWith("!") ||
      normalizedAnswer.endsWith("?") ||
      normalizedAnswer.endsWith("다") ||
      normalizedAnswer.endsWith("요")
    ) {
      return normalizedAnswer;
    }

    return `${normalizedAnswer}.`;
  };

  const submitAiAnswer = () => {
    const sentence = makeTemporaryAiSentence(draftAnswer);

    if (!sentence) return;

    setGeneratedSentences((prev) => [sentence, ...prev]);
    setDraftAnswer("");
  };

  const applyGeneratedSentence = (sentence: string) => {
    const body = item.fields.__body ?? "";
    const nextBody = body.trim() ? `${body.trim()}\n\n${sentence}` : sentence;

    updateFieldValue("__body", nextBody);
    setGeneratedSentences((prev) => prev.filter((item) => item !== sentence));
    showToast("문장을 본문 끝에 추가했어요.");
  };

  const insertSentenceAtCursor = (sentence: string) => {
    const textarea = bodyTextAreaRef.current;
    const body = item.fields.__body ?? "";
    const start = textarea?.selectionStart ?? body.length;
    const end = textarea?.selectionEnd ?? start;
    const before = body.slice(0, start);
    const after = body.slice(end);
    const beforeGap = before && !before.endsWith("\n") ? "\n\n" : "";
    const afterGap = after && !after.startsWith("\n") ? "\n\n" : "";
    const nextBody = `${before}${beforeGap}${sentence}${afterGap}${after}`;
    const nextCursor = `${before}${beforeGap}${sentence}`.length;

    updateFieldValue("__body", nextBody);
    showToast("문장을 본문에 추가했어요.");

    window.setTimeout(() => {
      bodyTextAreaRef.current?.focus();
      bodyTextAreaRef.current?.setSelectionRange(nextCursor, nextCursor);
    }, 0);
  };

  const handleGeneratedSentenceDrop = (
    event: DragEvent<HTMLTextAreaElement>,
  ) => {
    const sentence = event.dataTransfer.getData("text/plain");

    if (!sentence) return;

    event.preventDefault();
    insertSentenceAtCursor(sentence);
    setGeneratedSentences((prev) => prev.filter((item) => item !== sentence));
  };

  const receiveNextAiQuestion = () => {
    setAiQuestionIndex((prev) => prev + 1);
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/35 px-4 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div
        className="
          h-[96vh]
          max-h-[96vh]
          w-[95vw]
          max-w-[1140px]
          overflow-hidden
          rounded-xl
          border border-[#E3E8EF]
          bg-[#FBFCFE]
          shadow-[0_24px_60px_-16px_rgba(15,23,42,0.34)]
        "
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => {
          const target = event.target as HTMLElement;
          if (!target.closest("[data-floating-area]")) {
            closeFloatingMenus();
          }
        }}
      >
        {/* HEADER */}
        <div className="flex min-h-[64px] items-center justify-between gap-4 border-b border-[#E5E7EB] px-6 py-3.5">
          <div>
            <div
              data-floating-area
              className="relative flex items-center gap-2 text-[11px] font-[600] text-[#64748B]"
            >
              <span>경험정리</span>
              <span>›</span>

              <button
                onClick={() => {
                  setHeaderTypeOpen((prev) => !prev);
                  setRowTypeOpen(false);
                  setKeywordOpen(false);
                  setAddFieldOpen(false);
                  setActiveFieldMenuKey(null);
                }}
                className="inline-flex items-center gap-1 rounded px-1 py-0.5 font-[500] text-[#0F172A] hover:bg-[#EFF2F6]"
              >
                {item.type}
                <ChevronDown size={12} />
              </button>

              {headerTypeOpen && (
                <TypeDropdown
                  selectedType={item.type}
                  onSelect={changeType}
                  className="absolute left-[72px] top-7"
                />
              )}
            </div>

            <input
              value={item.name}
              onChange={(e) => updateItem({ name: e.target.value })}
              placeholder="새 경험"
              className="
                mt-2
                w-[460px]
                bg-transparent
                text-[20px]
                font-[700]
                tracking-[-0.01em]
                text-[#0F172A]
                outline-none
                placeholder:text-[#0F172A]
              "
            />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="text-[11px] text-[#79859A]">{saveState}</span>
            <div className="flex h-7 items-center rounded-md border border-[#E3E8EF] bg-[#EFF2F6]/50 p-0.5">
              {(["작성중", "완료"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => updateItem({ status })}
                  className={`h-5 rounded px-2 text-[11px] transition-colors ${currentStatus === status ? "bg-white font-[600] text-[#28303D] shadow-sm" : "text-[#79859A] hover:text-[#28303D]"}`}
                >
                  {status}
                </button>
              ))}
            </div>

            {onSave && (
              <button
                type="button"
                onClick={() => {
                  setSaveState("저장됨");
                  onSave({
                    ...item,
                    status: currentStatus,
                  });
                }}
                disabled={!item.name.trim()}
                className="inline-flex h-7 items-center gap-1 rounded-md bg-[#2563EB] px-2.5 text-[11px] font-[600] text-white transition-colors hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:bg-[#A4AEBE]"
              >
                <Check size={12} />
                저장
              </button>
            )}

            <button
              onClick={() => updateItem({ pin: !item.pin })}
              className={`flex h-7 w-7 items-center justify-center rounded-md border bg-white transition-colors ${
                item.pin
                  ? "border-[#E2E8F0] text-[#0F172A]"
                  : "border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]"
              }`}
              data-tooltip={item.pin ? "고정 해제" : "고정"}
              aria-label={item.pin ? "고정 해제" : "고정"}
            >
              <Pin
                size={14}
                fill={item.pin ? "currentColor" : "none"}
                strokeWidth={item.pin ? 2.6 : 2}
              />
            </button>

            <button
              onClick={() => setAiOpen((prev) => !prev)}
              className={`flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${
                aiOpen
                  ? "border-[#DBEAFE] bg-[#EFF6FF] text-[#2563EB]"
                  : "border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC]"
              }`}
              data-tooltip="AI로 더 구체화 하기"
              aria-label="AI로 더 구체화 하기"
            >
              <Sparkles size={14} />
            </button>

            <button
              onClick={() => setCopyOpen(true)}
              className="h-7 rounded-md border border-[#E3E8EF] bg-white px-2 text-[11px] text-[#5A6678] hover:bg-[#F6F8FB] hover:text-[#28303D]"
            >
              복붙용 문장 만들기
            </button>

            <div data-floating-area className="relative">
              <button
                type="button"
                onClick={() => {
                  setHeaderMenuOpen((prev) => !prev);
                  setHeaderTypeOpen(false);
                  setRowTypeOpen(false);
                  setKeywordOpen(false);
                  setAddFieldOpen(false);
                  setActiveFieldMenuKey(null);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-md text-[#79859A] hover:bg-[#EFF2F6]"
                aria-label="경험 더보기 메뉴"
              >
                <MoreHorizontal size={15} />
              </button>

              {headerMenuOpen && (
                <HeaderMoreMenu
                  hiddenFieldCount={hiddenFieldCount}
                  onShowHiddenFields={showHiddenFields}
                  onDelete={requestDeleteExperience}
                />
              )}
            </div>

            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-md text-[#79859A] hover:bg-[#EFF2F6]"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(96vh-64px)] overflow-hidden">
          <div className="min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[820px] space-y-8 px-10 py-8">
              <div className="relative w-full max-w-full">
                {orderedRows.map((field) => (
                  <TopFieldRow
                    key={field.key}
                    field={field}
                    label={getFieldLabel(field)}
                    placeholder={field.placeholder}
                    value={getFieldValue(field.key)}
                    item={item}
                    isImportant={isImportant}
                    keywordOpen={keywordOpen}
                    directKeywordInputOpen={directKeywordInputOpen}
                    directKeywordValue={directKeywordValue}
                    rowTypeOpen={rowTypeOpen}
                    activeMenuOpen={activeFieldMenuKey === field.key}
                    isDragging={draggingFieldKey === field.key}
                    isDragOver={dragOverFieldKey === field.key}
                    dragOverPosition={
                      dragOverFieldKey === field.key ? dragOverPosition : null
                    }
                    onDragStart={() => handleFieldDragStart(field.key)}
                    onDragOver={(position) =>
                      handleFieldDragOver(field.key, position)
                    }
                    onDrop={(position) =>
                      reorderFieldByDrag(field.key, position)
                    }
                    onDragEnd={handleFieldDragEnd}
                    onChangeValue={(value) => {
                      if (field.kind === "title") {
                        updateItem({ name: value });
                        return;
                      }

                      updateFieldValue(field.key, value);
                    }}
                    onToggleRowType={() => {
                      setRowTypeOpen((prev) => !prev);
                      setHeaderTypeOpen(false);
                      setKeywordOpen(false);
                      setAddFieldOpen(false);
                      setActiveFieldMenuKey(null);
                    }}
                    onSelectType={changeType}
                    onOpenKeyword={() => {
                      setDirectKeywordInputOpen(false);
                      setDirectKeywordValue("");
                      setKeywordOpen((prev) => !prev);
                      setHeaderTypeOpen(false);
                      setRowTypeOpen(false);
                      setAddFieldOpen(false);
                      setActiveFieldMenuKey(null);
                    }}
                    onToggleKeyword={toggleKeyword}
                    onRemoveKeyword={removeKeyword}
                    onAddDirectKeyword={addDirectKeyword}
                    onChangeDirectKeyword={setDirectKeywordValue}
                    onSubmitDirectKeyword={submitDirectKeyword}
                    onCancelDirectKeyword={() => {
                      setDirectKeywordInputOpen(false);
                      setDirectKeywordValue("");
                    }}
                    onToggleImportant={() =>
                      updateItem({
                        important: !isImportant,
                      })
                    }
                    onOpenFieldMenu={() => {
                      setActiveFieldMenuKey((prev) =>
                        prev === field.key ? null : field.key,
                      );
                      setHeaderTypeOpen(false);
                      setRowTypeOpen(false);
                      setKeywordOpen(false);
                      setAddFieldOpen(false);
                    }}
                    onRename={() => renameField(field)}
                    onMoveUp={() => moveField(field, "up")}
                    onMoveDown={() => moveField(field, "down")}
                    onHide={() => hideField(field)}
                    onDelete={() => deleteField(field)}
                  />
                ))}

                {/* FIELD ADD */}
                <div
                  data-floating-area
                  className="relative grid min-h-[36px] grid-cols-[120px_1fr] items-center gap-x-4"
                >
                  <div>
                    <button
                      onClick={() => {
                        setAddFieldOpen((prev) => !prev);
                        setOtherFieldMenuOpen(false);
                        setHeaderTypeOpen(false);
                        setRowTypeOpen(false);
                        setKeywordOpen(false);
                        setActiveFieldMenuKey(null);
                      }}
                      className="text-[24px] font-[300] text-[#64748B]"
                    >
                      +
                    </button>
                  </div>

                  {addFieldOpen && (
                    <AddFieldMenu
                      otherTypeFieldGroups={otherTypeFieldGroups}
                      otherFieldMenuOpen={otherFieldMenuOpen}
                      onToggleOtherFieldMenu={() =>
                        setOtherFieldMenuOpen((prev) => !prev)
                      }
                      onAddField={addField}
                      onAddCustomField={addCustomField}
                    />
                  )}
                </div>
              </div>

              <div className="h-px w-full bg-[#E3E8EF]" />

              {/* DOCUMENT AREA */}
              <div className="w-full">
                <div className="mb-5 flex items-center justify-between">
                  <p className="text-[14px] font-[700] text-[#64748B]">
                    비어 있음
                  </p>

                  <label className="flex cursor-pointer items-center gap-2 text-[13px] font-[600] text-[#475569]">
                    <input
                      type="checkbox"
                      checked={showSentenceTags}
                      onChange={(e) => setShowSentenceTags(e.target.checked)}
                      className="h-4 w-4 accent-[#C2185B]"
                    />
                    문장 태그 보기
                  </label>
                </div>

                <textarea
                  ref={bodyTextAreaRef}
                  value={item.fields.__body ?? ""}
                  onChange={(e) => updateFieldValue("__body", e.target.value)}
                  onDragOver={(event) => {
                    if (
                      Array.from(event.dataTransfer.types).includes(
                        "text/plain",
                      )
                    ) {
                      event.preventDefault();
                    }
                  }}
                  onDrop={handleGeneratedSentenceDrop}
                  placeholder="자유롭게 써내려가 보세요. 자소서 초안을 그대로 옮겨 적어도 좋아요."
                  className="
                    min-h-[440px]
                    w-full
                    resize-none
                    bg-transparent
                    text-[14px]
                    leading-7
                    text-[#28303D]
                    outline-none
                    placeholder:text-[#B8C2D1]
                  "
                />

                <p className="mt-3 text-[10px] leading-5 text-[#A4AEBE]">
                  추천 흐름 — {preset.description}
                </p>
              </div>
            </div>
          </div>

          {aiOpen && (
            <AiQuestionPanel
              question={aiQuestion}
              answer={draftAnswer}
              generatedSentences={generatedSentences}
              onChangeAnswer={setDraftAnswer}
              onSubmitAnswer={submitAiAnswer}
              onNextQuestion={receiveNextAiQuestion}
              onApplySentence={applyGeneratedSentence}
              onRemoveSentence={(sentence) =>
                setGeneratedSentences((prev) =>
                  prev.filter((item) => item !== sentence),
                )
              }
              onRewriteSentence={(sentence) => {
                setDraftAnswer(sentence);
                setGeneratedSentences((prev) =>
                  prev.filter((item) => item !== sentence),
                );
              }}
              onClose={() => setAiOpen(false)}
            />
          )}
        </div>

        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 z-[10001] flex -translate-x-1/2 items-center gap-2 rounded-lg bg-[#161C26] px-4 py-2.5 text-[13px] font-[500] text-white shadow-[0_14px_30px_-8px_rgba(15,23,42,0.48)]">
            <Check size={15} className="text-white/90" />
            {toastMessage}
          </div>
        )}
      </div>

      {deleteConfirmOpen && (
        <DeleteConfirmModal
          onCancel={() => setDeleteConfirmOpen(false)}
          onConfirm={confirmDeleteExperience}
        />
      )}

      {customFieldModalOpen && (
        <CustomFieldModal
          label={customFieldLabel}
          value={customFieldValue}
          onChangeLabel={setCustomFieldLabel}
          onChangeValue={setCustomFieldValue}
          onCancel={() => {
            setCustomFieldModalOpen(false);
            setCustomFieldLabel("");
            setCustomFieldValue("");
          }}
          onConfirm={confirmAddCustomField}
        />
      )}

      <ExperienceCopyGenerator
        open={copyOpen}
        item={item}
        onClose={() => setCopyOpen(false)}
        onCopy={onCopyToast}
      />
    </div>
  );
}

interface HeaderMoreMenuProps {
  hiddenFieldCount: number;
  onShowHiddenFields: () => void;
  onDelete: () => void;
}

function HeaderMoreMenu({
  hiddenFieldCount,
  onShowHiddenFields,
  onDelete,
}: HeaderMoreMenuProps) {
  return (
    <div
      className="
        absolute right-0 top-11 z-40
        w-[190px]
        overflow-hidden
        rounded-[8px]
        border border-[#E2E8F0]
        bg-white
        py-2
        shadow-[0_12px_28px_rgba(15,23,42,0.16)]
      "
    >
      <button
        type="button"
        onClick={onShowHiddenFields}
        disabled={hiddenFieldCount === 0}
        className={`flex h-10 w-full items-center gap-2 px-4 text-left text-[14px] font-[700] ${
          hiddenFieldCount === 0
            ? "cursor-not-allowed text-[#CBD5E1]"
            : "text-[#0F172A] hover:bg-[#F8FAFC]"
        }`}
      >
        <Eye size={15} />
        숨겨진 필드 보이기
        {hiddenFieldCount > 0 && (
          <span className="ml-auto text-[12px] font-[800] text-[#94A3B8]">
            {hiddenFieldCount}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={onDelete}
        className="flex h-10 w-full items-center gap-2 border-t border-[#F1F5F9] px-4 text-left text-[14px] font-[700] text-[#EF4444] hover:bg-[#FEF2F2]"
      >
        <Trash2 size={15} />
        삭제하기
      </button>
    </div>
  );
}

interface CustomFieldModalProps {
  label: string;
  value: string;
  onChangeLabel: (value: string) => void;
  onChangeValue: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

function CustomFieldModal({
  label,
  value,
  onChangeLabel,
  onChangeValue,
  onCancel,
  onConfirm,
}: CustomFieldModalProps) {
  const canSubmit = Boolean(label.trim());

  return (
    <div
      className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/70 px-4"
      onClick={(event) => {
        event.stopPropagation();
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        className="w-full max-w-[530px] rounded-[12px] border border-[#E2E8F0] bg-[#FBFCFE] px-9 pb-5 pt-7 shadow-[0_26px_90px_rgba(15,23,42,0.35)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-[20px] font-[800] tracking-[-0.03em] text-[#0F172A]">
              사용자 지정 필드
            </h2>
            <p className="mt-3 text-[14px] font-[500] text-[#64748B]">
              원하는 항목명과 값을 자유롭게 입력하세요.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-[#475569] hover:bg-[#F8FAFC]"
          >
            <X size={20} />
          </button>
        </div>

        <label className="mt-5 block">
          <span className="mb-2 block text-[14px] font-[600] text-[#64748B]">
            항목명
          </span>
          <input
            autoFocus
            value={label}
            onChange={(event) => onChangeLabel(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && canSubmit) onConfirm();
              if (event.key === "Escape") onCancel();
            }}
            placeholder="예: 멘토"
            className="h-[40px] w-full rounded-[10px] border border-[#CBD5E1] bg-white px-4 text-[14px] text-[#334155] outline-none placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
          />
        </label>

        <label className="mt-4 block">
          <span className="mb-2 block text-[14px] font-[600] text-[#64748B]">
            값 (선택)
          </span>
          <input
            value={value}
            onChange={(event) => onChangeValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && canSubmit) onConfirm();
              if (event.key === "Escape") onCancel();
            }}
            placeholder="값을 입력하세요"
            className="h-[40px] w-full rounded-[9px] border border-[#CBD5E1] bg-white px-4 text-[14px] text-[#334155] outline-none placeholder:text-[#94A3B8] focus:border-[#2563EB]"
          />
        </label>

        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 rounded-[8px] border border-[#E2E8F0] bg-white px-3 text-[14px] font-[800] text-[#0F172A] hover:bg-[#F8FAFC]"
          >
            취소
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={onConfirm}
            className="h-9 rounded-[8px] bg-[#7FAAF4] px-3 text-[14px] font-[800] text-white hover:bg-[#6798EF] disabled:cursor-not-allowed disabled:opacity-45"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}

interface DeleteConfirmModalProps {
  onCancel: () => void;
  onConfirm: () => void;
}

function DeleteConfirmModal({ onCancel, onConfirm }: DeleteConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4"
      onClick={(event) => {
        event.stopPropagation();
        onCancel();
      }}
    >
      <div
        className="w-[570px] rounded-[12px] border border-[#E2E8F0] bg-[#FBFCFE] px-9 pb-7 pt-8 shadow-[0_26px_90px_rgba(15,23,42,0.35)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-[20px] font-[800] tracking-[-0.03em] text-[#0F172A]">
              휴지통으로 옮길까요?
            </h2>
            <p className="mt-3 text-[16px] font-[600] tracking-[-0.03em] text-[#64748B]">
              이 경험을 휴지통으로 옮겨요. 14일 안에 복원할 수 있어요.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-[#475569] hover:bg-[#F8FAFC]"
            aria-label="삭제 확인 창 닫기"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-10 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-[8px] border border-[#E2E8F0] bg-white px-5 text-[14px] font-[800] text-[#0F172A] hover:bg-[#F8FAFC]"
          >
            취소
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="h-10 rounded-[8px] bg-[#E0525D] px-5 text-[14px] font-[800] text-white hover:bg-[#DC4450]"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}

interface AiQuestionPanelProps {
  question: string;
  answer: string;
  generatedSentences: string[];
  onChangeAnswer: (answer: string) => void;
  onSubmitAnswer: () => void;
  onNextQuestion: () => void;
  onApplySentence: (sentence: string) => void;
  onRemoveSentence: (sentence: string) => void;
  onRewriteSentence: (sentence: string) => void;
  onClose: () => void;
}

function AiQuestionPanel({
  question,
  answer,
  generatedSentences,
  onChangeAnswer,
  onSubmitAnswer,
  onNextQuestion,
  onApplySentence,
  onRemoveSentence,
  onRewriteSentence,
  onClose,
}: AiQuestionPanelProps) {
  return (
    <aside className="w-[320px] shrink-0 overflow-y-auto border-l border-[#E3E8EF] bg-white">
      <div className="border-b border-[#F1F5F9] px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[15px] font-[800] text-[#0F172A]">
              <Sparkles size={18} className="text-[#2563EB]" />
              AI 질문
            </div>
            <p className="mt-2 text-[13px] font-[600] text-[#64748B]">
              이 경험을 더 구체적으로 만들어 봐요.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#64748B] hover:bg-[#F8FAFC]"
            aria-label="AI 질문 닫기"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="space-y-4 px-5 py-4">
        <div className="rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] p-4">
          <p className="text-[12px] font-[700] text-[#64748B]">AI의 질문</p>
          <p className="mt-2 text-[15px] font-[800] leading-6 text-[#0F172A]">
            {question}
          </p>

          <button
            type="button"
            onClick={onNextQuestion}
            className="mt-3 text-[13px] font-[700] text-[#64748B] hover:text-[#2563EB]"
          >
            ⟳ 다른 질문 받기
          </button>
        </div>

        <textarea
          value={answer}
          onChange={(event) => onChangeAnswer(event.target.value)}
          placeholder="짧게 답변해 주세요. AI가 자소서 톤의 문장으로 다듬어 드려요."
          className="h-[96px] w-full resize-none rounded-[8px] border border-[#E2E8F0] bg-white px-4 py-3 text-[14px] font-[600] leading-6 text-[#0F172A] outline-none placeholder:text-[#64748B] focus:border-[#2563EB]"
        />

        <button
          type="button"
          onClick={onSubmitAnswer}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-[#2563EB] text-[14px] font-[800] text-white hover:bg-[#1D4ED8]"
        >
          <Wand2 size={17} />
          문장으로 다듬기
        </button>

        {generatedSentences.length > 0 && (
          <div className="border-t border-[#F1F5F9] pt-4">
            <p className="mb-3 text-[13px] font-[700] text-[#64748B]">
              생성된 문장
            </p>

            <div className="space-y-3">
              {generatedSentences.map((sentence) => (
                <div
                  key={sentence}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "copy";
                    event.dataTransfer.setData("text/plain", sentence);
                  }}
                  className="cursor-grab rounded-[8px] border border-[#E2E8F0] bg-white p-4 active:cursor-grabbing"
                >
                  <p className="text-[12px] font-[700] text-[#64748B]">
                    {question}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-[15px] font-[700] leading-6 text-[#0F172A]">
                    {sentence}
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onApplySentence(sentence)}
                        className="h-8 rounded-[8px] bg-[#2563EB] px-3 text-[13px] font-[800] text-white hover:bg-[#1D4ED8]"
                      >
                        반영
                      </button>
                      <span className="text-[13px] font-[700] text-[#64748B]">
                        드래그해서 넣기
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onRewriteSentence(sentence)}
                        className="text-[13px] font-[800] text-[#0F172A] hover:text-[#2563EB]"
                      >
                        다시 쓰기
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveSentence(sentence)}
                        className="flex h-7 w-7 items-center justify-center rounded-[7px] text-[#64748B] hover:bg-[#F8FAFC]"
                        aria-label="생성된 문장 삭제"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

interface TypeDropdownProps {
  selectedType: ExperienceType;
  onSelect: (type: ExperienceType) => void;
  className?: string;
}

function TypeDropdown({
  selectedType,
  onSelect,
  className = "",
}: TypeDropdownProps) {
  return (
    <div
      className={`
        z-30
        w-[210px]
        overflow-hidden
        rounded-[8px]
        border border-[#E2E8F0]
        bg-white
        py-2
        shadow-[0_10px_30px_rgba(15,23,42,0.15)]
        ${className}
      `}
    >
      <p className="px-4 pb-2 text-[13px] font-[600] text-[#94A3B8]">
        유형 선택
      </p>

      {EXPERIENCE_TYPES.map((type) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          className="
            flex h-9 w-full items-center justify-between
            px-4
            text-left
            text-[14px]
            font-[600]
            text-[#0F172A]
            hover:bg-[#F8FAFC]
          "
        >
          <span>{type}</span>

          {selectedType === type && (
            <Check size={15} className="text-[#2563EB]" />
          )}
        </button>
      ))}
    </div>
  );
}

interface TopFieldRowProps {
  field: FieldRowData;
  label: string;
  placeholder?: string;
  value: string;
  item: ExperienceItem;
  isImportant: boolean;
  keywordOpen: boolean;
  directKeywordInputOpen: boolean;
  directKeywordValue: string;
  rowTypeOpen: boolean;
  activeMenuOpen: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  dragOverPosition: "before" | "after" | null;
  onDragStart: () => void;
  onDragOver: (position: "before" | "after") => void;
  onDrop: (position: "before" | "after") => void;
  onDragEnd: () => void;
  onChangeValue: (value: string) => void;
  onToggleRowType: () => void;
  onSelectType: (type: ExperienceType) => void;
  onOpenKeyword: () => void;
  onToggleKeyword: (keyword: string) => void;
  onRemoveKeyword: (keyword: string) => void;
  onAddDirectKeyword: () => void;
  onChangeDirectKeyword: (value: string) => void;
  onSubmitDirectKeyword: () => void;
  onCancelDirectKeyword: () => void;
  onToggleImportant: () => void;
  onOpenFieldMenu: () => void;
  onRename: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onHide: () => void;
  onDelete: () => void;
}

function TopFieldRow({
  field,
  label,
  placeholder,
  value,
  item,
  isImportant,
  keywordOpen,
  directKeywordInputOpen,
  directKeywordValue,
  rowTypeOpen,
  activeMenuOpen,
  isDragging,
  isDragOver,
  dragOverPosition,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onChangeValue,
  onToggleRowType,
  onSelectType,
  onOpenKeyword,
  onToggleKeyword,
  onRemoveKeyword,
  onAddDirectKeyword,
  onChangeDirectKeyword,
  onSubmitDirectKeyword,
  onCancelDirectKeyword,
  onToggleImportant,
  onOpenFieldMenu,
  onRename,
  onMoveUp,
  onMoveDown,
  onHide,
  onDelete,
}: TopFieldRowProps) {
  void rowTypeOpen;
  void onToggleRowType;
  void onSelectType;

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    const rect = event.currentTarget.getBoundingClientRect();
    const position =
      event.clientY < rect.top + rect.height / 2 ? "before" : "after";
    onDragOver(position);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    const rect = event.currentTarget.getBoundingClientRect();
    const position =
      event.clientY < rect.top + rect.height / 2 ? "before" : "after";
    onDrop(position);
  };

  return (
    <div
      className={`
        group
        relative
        grid
        min-h-[38px]
        grid-cols-[120px_1fr]
        gap-x-4
        items-center
        rounded-[6px]
        ${isDragging ? "opacity-45" : ""}
      `}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={onDragEnd}
    >
      {isDragOver && dragOverPosition === "before" && (
        <div className="absolute left-0 right-0 top-0 z-20 h-[2px] rounded-full bg-[#2563EB]" />
      )}

      {isDragOver && dragOverPosition === "after" && (
        <div className="absolute bottom-0 left-0 right-0 z-20 h-[2px] rounded-full bg-[#2563EB]" />
      )}

      <div
        data-floating-area
        className={`
          absolute
          -left-12
          top-1/2
          z-20
          -translate-y-1/2
          ${activeMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
        `}
      >
        <button
          type="button"
          draggable
          onClick={(event) => {
            event.stopPropagation();
            onOpenFieldMenu();
          }}
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", field.key);
            onDragStart();
          }}
          onDragEnd={onDragEnd}
          className="
            flex h-7 w-7 cursor-grab items-center justify-center
            rounded-md
            text-[#94A3B8]
            hover:bg-[#EEF2F7]
            hover:text-[#475569]
            active:cursor-grabbing
          "
          aria-label="필드 메뉴 및 순서 변경"
        >
          <GripVertical size={17} strokeWidth={2.2} />
        </button>

        {activeMenuOpen && (
          <FieldControlMenu
            onRename={onRename}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onHide={onHide}
            onDelete={onDelete}
          />
        )}
      </div>

      <p className="text-[11px] text-[#79859A]">{label}</p>

      <div className="min-w-0">
        {field.kind === "title" && (
          <input
            value={item.name}
            onChange={(e) => onChangeValue(e.target.value)}
            placeholder={placeholder}
            className="
              w-full bg-transparent
              text-[13px] text-[#28303D]
              outline-none
              placeholder:text-[#AAB4C3]
            "
          />
        )}

        {field.kind === "text" && (
          <input
            value={value}
            onChange={(e) => onChangeValue(e.target.value)}
            placeholder={placeholder}
            className="
              w-full bg-transparent
              text-[13px] text-[#28303D]
              outline-none
              placeholder:text-[#AAB4C3]
            "
          />
        )}

        {field.kind === "keywords" && (
          <div
            data-floating-area
            className="relative flex flex-wrap items-center gap-2"
          >
            {item.keywords.map((keyword) => (
              <span
                key={keyword}
                className="
                  inline-flex h-5 items-center gap-1
                  rounded-md border border-[#E3E8EF]
                  bg-[#F6F8FB]
                  px-1.5
                  text-[11px]
                  text-[#5A6678]
                "
              >
                {keyword}

                <button
                  onClick={() => onRemoveKeyword(keyword)}
                  className="text-[#94A3B8]"
                >
                  ×
                </button>
              </span>
            ))}

            {directKeywordInputOpen ? (
              <input
                autoFocus
                value={directKeywordValue}
                onChange={(event) => onChangeDirectKeyword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    onSubmitDirectKeyword();
                  }
                  if (event.key === "Escape") {
                    onCancelDirectKeyword();
                  }
                }}
                onBlur={() => {
                  if (!directKeywordValue.trim()) onCancelDirectKeyword();
                }}
                placeholder="키워드 입력 후 Enter"
                className="h-7 w-[244px] rounded-full border border-[#2563EB] bg-white px-3 text-[13px] text-[#475569] outline-none placeholder:text-[#94A3B8] focus:ring-1 focus:ring-[#2563EB]/25"
              />
            ) : (
              <button
                onClick={onOpenKeyword}
                className="
                  h-5
                  rounded-md
                  border border-dashed border-[#CDD5E0]
                  bg-white
                  px-1.5
                  text-[11px]
                  text-[#79859A]
                "
              >
                + 키워드
              </button>
            )}

            {keywordOpen && !directKeywordInputOpen && (
              <KeywordMenu
                selectedKeywords={item.keywords}
                onToggleKeyword={onToggleKeyword}
                onAddDirectKeyword={onAddDirectKeyword}
              />
            )}
          </div>
        )}

        {field.kind === "important" && (
          <button
            onClick={onToggleImportant}
            className="inline-flex items-center gap-2 text-[13px] text-[#79859A]"
          >
            <Icon
              icon={isImportant ? "mdi:star" : "mdi:star-outline"}
              className={`text-[20px] transition-colors ${
                isImportant ? "text-[#F58A1F]" : "text-[#7C8599]"
              }`}
            />
          </button>
        )}
      </div>
    </div>
  );
}

interface KeywordMenuProps {
  selectedKeywords: string[];
  onToggleKeyword: (keyword: string) => void;
  onAddDirectKeyword: () => void;
}

function KeywordMenu({
  selectedKeywords,
  onToggleKeyword,
  onAddDirectKeyword,
}: KeywordMenuProps) {
  return (
    <div
      className="
        absolute left-0 top-8 z-30
        w-[170px]
        overflow-hidden
        rounded-[8px]
        border border-[#E2E8F0]
        bg-white
        py-2
        shadow-[0_12px_28px_rgba(15,23,42,0.16)]
      "
    >
      <button
        onClick={onAddDirectKeyword}
        className="
          flex h-10 w-full items-center gap-2
          border-b border-[#F1F5F9]
          px-4
          text-left
          text-[14px]
          font-[700]
          text-[#0F172A]
          hover:bg-[#F8FAFC]
        "
      >
        <Plus size={15} />
        직접 입력
      </button>

      {KEYWORD_OPTIONS.map((keyword) => {
        const selected = selectedKeywords.includes(keyword);

        return (
          <button
            key={keyword}
            onClick={() => onToggleKeyword(keyword)}
            className="
              flex h-9 w-full items-center justify-between
              px-4
              text-left
              text-[14px]
              font-[600]
              text-[#0F172A]
              hover:bg-[#F8FAFC]
            "
          >
            <span>{keyword}</span>

            {selected && <Check size={14} className="text-[#2563EB]" />}
          </button>
        );
      })}
    </div>
  );
}

interface OtherTypeFieldGroup {
  type: ExperienceType;
  fields: { key: string; label: string; placeholder?: string }[];
}

interface AddFieldMenuProps {
  otherTypeFieldGroups: OtherTypeFieldGroup[];
  otherFieldMenuOpen: boolean;
  onToggleOtherFieldMenu: () => void;
  onAddField: (field: { key: string; label: string }) => void;
  onAddCustomField: () => void;
}

function AddFieldMenu({
  otherTypeFieldGroups,
  otherFieldMenuOpen,
  onToggleOtherFieldMenu,
  onAddField,
  onAddCustomField,
}: AddFieldMenuProps) {
  const [activeType, setActiveType] = useState<ExperienceType | null>(null);

  const handleAddField = (field: { key: string; label: string }) => {
    onAddField(field);
    setActiveType(null);
  };

  return (
    <div
      className="
        absolute top-8 left-0 z-50
        w-[250px]
        overflow-visible
        rounded-[8px]
        border border-[#E2E8F0]
        bg-white
        py-2
        shadow-[0_12px_28px_rgba(15,23,42,0.16)]
      "
    >
      {EXTRA_FIELD_OPTIONS.map((field) => (
        <button
          key={field.key}
          type="button"
          onClick={() => handleAddField(field)}
          className="
            flex h-9 w-full items-center
            px-5
            text-left
            text-[13px]
            font-[600]
            text-[#0F172A]
            hover:bg-[#F8FAFC]
          "
        >
          {field.label}
        </button>
      ))}

      <div className="relative border-y border-[#F1F5F9]">
        <button
          type="button"
          onClick={() => {
            onToggleOtherFieldMenu();
            setActiveType(null);
          }}
          onMouseEnter={() => {
            if (!otherFieldMenuOpen) onToggleOtherFieldMenu();
          }}
          className={`
            flex h-9 w-full items-center justify-between
            px-5
            text-left
            text-[13px]
            font-[600]
            text-[#0F172A]
            transition-colors
            ${otherFieldMenuOpen ? "bg-[#EAF2FF]" : "hover:bg-[#F8FAFC]"}
          `}
        >
          <span>다른 유형의 필드</span>
          <ChevronRight size={15} />
        </button>

        {otherFieldMenuOpen && (
          <div
            className="
              absolute bottom-0 left-[calc(100%+8px)] z-[60]
              w-[190px]
              overflow-visible
              rounded-[8px]
              border border-[#E2E8F0]
              bg-white
              py-1
              shadow-[0_12px_28px_rgba(15,23,42,0.16)]
            "
          >
            {otherTypeFieldGroups.length === 0 ? (
              <p className="px-4 py-3 text-[12px] text-[#94A3B8]">
                추가할 수 있는 필드가 없어요.
              </p>
            ) : (
              otherTypeFieldGroups.map((group) => {
                const selected = activeType === group.type;

                return (
                  <div
                    key={group.type}
                    className="relative"
                    onMouseEnter={() => setActiveType(group.type)}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setActiveType((previous) =>
                          previous === group.type ? null : group.type,
                        )
                      }
                      className={`
          flex h-[42px] w-full items-center justify-between
          px-4
          text-left
          text-[13px]
          font-[600]
          text-[#0F172A]
          transition-colors
          ${selected ? "bg-[#EAF2FF]" : "hover:bg-[#F8FAFC]"}
        `}
                    >
                      <span>{group.type}</span>
                      <ChevronRight size={15} />
                    </button>

                    {selected && (
                      <div
                        className="
            absolute
            left-full
            top-0
            z-[70]
            ml-2
            max-h-[340px]
            w-[190px]
            overflow-y-auto
            rounded-[8px]
            border border-[#E2E8F0]
            bg-white
            py-1
            shadow-[0_12px_28px_rgba(15,23,42,0.16)]
          "
                      >
                        {group.fields.length > 0 ? (
                          group.fields.map((field) => (
                            <button
                              key={`${group.type}-${field.key}`}
                              type="button"
                              onClick={() => handleAddField(field)}
                              className="
                  flex min-h-[42px] w-full items-center
                  px-4 py-2
                  text-left
                  text-[13px]
                  font-[600]
                  text-[#0F172A]
                  hover:bg-[#F8FAFC]
                "
                            >
                              {field.label}
                            </button>
                          ))
                        ) : (
                          <p className="px-4 py-4 text-[13px] text-[#94A3B8]">
                            추가할 수 있는 필드가 없습니다.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onAddCustomField}
        className="
          flex h-10 w-full items-center gap-2
          px-4
          text-left
          text-[14px]
          font-[700]
          text-[#0F172A]
          hover:bg-[#F8FAFC]
        "
      >
        <Plus size={15} />
        사용자 지정 필드
      </button>
    </div>
  );
}

interface FieldControlMenuProps {
  onRename: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onHide: () => void;
  onDelete: () => void;
}

function FieldControlMenu({
  onRename,
  onMoveUp,
  onMoveDown,
  onHide,
  onDelete,
}: FieldControlMenuProps) {
  return (
    <div
      className="
        absolute left-0 top-8 z-30
        w-[170px]
        overflow-hidden
        rounded-[8px]
        border border-[#E2E8F0]
        bg-white
        py-2
        shadow-[0_12px_28px_rgba(15,23,42,0.16)]
      "
    >
      <button
        onClick={onRename}
        className="flex h-9 w-full items-center gap-2 px-4 text-left text-[14px] font-[600] text-[#0F172A] hover:bg-[#F8FAFC]"
      >
        <Pencil size={15} />
        이름 바꾸기
      </button>

      <button
        onClick={onMoveUp}
        className="flex h-9 w-full items-center px-4 text-left text-[14px] font-[600] text-[#0F172A] hover:bg-[#F8FAFC]"
      >
        위로 이동
      </button>

      <button
        onClick={onMoveDown}
        className="flex h-9 w-full items-center px-4 text-left text-[14px] font-[600] text-[#0F172A] hover:bg-[#F8FAFC]"
      >
        아래로 이동
      </button>

      <button
        onClick={onHide}
        className="flex h-9 w-full items-center gap-2 border-t border-[#F1F5F9] px-4 text-left text-[14px] font-[600] text-[#0F172A] hover:bg-[#F8FAFC]"
      >
        <EyeOff size={15} />
        숨기기
      </button>

      <button
        onClick={onDelete}
        className="flex h-9 w-full items-center gap-2 px-4 text-left text-[14px] font-[600] text-[#EF4444] hover:bg-[#FEF2F2]"
      >
        <Trash2 size={15} />
        삭제
      </button>
    </div>
  );
}
