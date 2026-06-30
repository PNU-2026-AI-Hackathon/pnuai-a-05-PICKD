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
  onDelete?: (id: ExperienceItem["id"]) => void;
  onCopyToast?: () => void;
}

type FieldKind = "title" | "type" | "text" | "keywords" | "importance";

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
  onDelete,
  onCopyToast,
}: Props) {
  const [headerTypeOpen, setHeaderTypeOpen] = useState(false);
  const [rowTypeOpen, setRowTypeOpen] = useState(false);
  const [keywordOpen, setKeywordOpen] = useState(false);
  const [addFieldOpen, setAddFieldOpen] = useState(false);
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
    setActiveFieldMenuKey(null);
    setHeaderMenuOpen(false);
  };

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
    }
  }, [open]);

  useEffect(() => {
    if (!toastMessage) return;

    const timer = window.setTimeout(() => setToastMessage(""), 2200);

    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  if (!open || !item || !preset) return null;

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
      key: "__importance",
      label: "중요도",
      kind: "importance",
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

  const isImportant = Boolean(item.important || item.importance === "높음");
  const hiddenFieldCount = item.hiddenFieldKeys?.length ?? 0;

  const updateItem = (next: Partial<ExperienceItem>) => {
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
    const keyword = window.prompt("추가할 키워드를 입력해주세요.");

    if (!keyword?.trim()) return;
    if (item.keywords.includes(keyword.trim())) return;

    onChange({
      ...item,
      keywords: [...item.keywords, keyword.trim()],
    });
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
    const label = window.prompt("필드 이름을 입력해주세요.");

    if (!label?.trim()) return;

    addField({
      key: label.trim().replace(/\s/g, "_"),
      label: label.trim(),
    });
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <div
        className="
          h-[92vh]
          w-[1280px]
          overflow-hidden
          rounded-[8px]
          bg-[#FBFCFE]
          shadow-[0_26px_90px_rgba(15,23,42,0.35)]
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
        <div className="flex h-[88px] items-start justify-between border-b border-[#E5E7EB] px-7 py-5">
          <div>
            <div
              data-floating-area
              className="relative flex items-center gap-2 text-[13px] font-[600] text-[#64748B]"
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
                className="inline-flex items-center gap-1 font-[800] text-[#0F172A]"
              >
                {item.type}
                <ChevronDown size={14} />
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
                text-[24px]
                font-[800]
                tracking-[-0.03em]
                text-[#0F172A]
                outline-none
                placeholder:text-[#0F172A]
              "
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-9 items-center rounded-[8px] border border-[#E2E8F0] bg-white p-1">
              {(["작성중", "완료"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => updateItem({ status })}
                  className={`h-7 rounded-[6px] px-2 text-[12px] font-[800] ${item.status === status ? "bg-[#EFF6FF] text-[#2563EB]" : "text-[#94A3B8] hover:text-[#64748B]"}`}
                >
                  {status}
                </button>
              ))}
            </div>

            <button
              onClick={() => updateItem({ pinned: !item.pinned })}
              className={`flex h-9 w-9 items-center justify-center rounded-[8px] border bg-white transition-colors ${
                item.pinned
                  ? "border-[#E2E8F0] text-[#0F172A]"
                  : "border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]"
              }`}
              title={item.pinned ? "고정 해제" : "고정"}
            >
              <Pin
                size={16}
                fill={item.pinned ? "currentColor" : "none"}
                strokeWidth={item.pinned ? 2.6 : 2}
              />
            </button>

            <button
              onClick={() => setAiOpen((prev) => !prev)}
              className={`flex h-9 w-9 items-center justify-center rounded-[8px] border transition-colors ${
                aiOpen
                  ? "border-[#DBEAFE] bg-[#EFF6FF] text-[#2563EB]"
                  : "border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC]"
              }`}
              title="AI로 더 구체화하기"
            >
              <Sparkles size={16} />
            </button>

            <button
              onClick={() => setCopyOpen(true)}
              className="h-9 rounded-[8px] border border-[#E2E8F0] bg-white px-3 text-[13px] font-[700] text-[#0F172A]"
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
                className="flex h-9 w-9 items-center justify-center rounded-[8px] text-[#64748B] hover:bg-[#F8FAFC]"
                aria-label="경험 더보기 메뉴"
              >
                <MoreHorizontal size={20} />
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
              className="flex h-9 w-9 items-center justify-center text-[#64748B]"
            >
              <X size={21} />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(92vh-88px)] overflow-hidden">
          <div className="min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[930px] px-8 pb-10 pt-11">
              <div className="relative w-[790px] max-w-full">
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
                      setKeywordOpen((prev) => !prev);
                      setHeaderTypeOpen(false);
                      setRowTypeOpen(false);
                      setAddFieldOpen(false);
                      setActiveFieldMenuKey(null);
                    }}
                    onToggleKeyword={toggleKeyword}
                    onRemoveKeyword={removeKeyword}
                    onAddDirectKeyword={addDirectKeyword}
                    onToggleImportant={() =>
                      updateItem({
                        important: !isImportant,
                        importance: !isImportant ? "높음" : "보통",
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
                  className="relative grid min-h-[40px] grid-cols-[150px_1fr] items-center"
                >
                  <div>
                    <button
                      onClick={() => {
                        setAddFieldOpen((prev) => !prev);
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
                      onAddField={addField}
                      onAddCustomField={addCustomField}
                    />
                  )}
                </div>
              </div>

              <div className="mt-9 h-px w-[790px] max-w-full bg-[#E5E7EB]" />

              {/* DOCUMENT AREA */}
              <div className="mt-8 w-[790px] max-w-full">
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
                    min-h-[420px]
                    w-full
                    resize-none
                    bg-transparent
                    text-[18px]
                    font-[500]
                    leading-[1.8]
                    text-[#0F172A]
                    outline-none
                    placeholder:text-[#B8C2D1]
                  "
                />

                <p className="mt-16 text-[13px] font-[500] text-[#94A3B8]">
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
          <div className="fixed bottom-8 right-8 z-[70] flex min-h-[54px] items-center gap-3 rounded-[10px] border border-[#E2E8F0] bg-white px-5 py-3 text-[15px] font-[600] text-[#334155] shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
            <Check size={19} className="text-[#2563EB]" />
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
        className="w-[570px] rounded-[12px] border border-[#E2E8F0] bg-[#FBFCFE] px-9 pb-9 pt-8 shadow-[0_26px_90px_rgba(15,23,42,0.35)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-[24px] font-[800] tracking-[-0.03em] text-[#0F172A]">
              정말 삭제하시겠어요?
            </h2>
            <p className="mt-3 text-[19px] font-[600] tracking-[-0.03em] text-[#64748B]">
              이 경험을 삭제하면 되돌릴 수 없어요.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-[#475569] hover:bg-[#F8FAFC]"
            aria-label="삭제 확인 창 닫기"
          >
            <X size={22} />
          </button>
        </div>

        <div className="mt-10 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-12 rounded-[8px] border border-[#E2E8F0] bg-white px-5 text-[16px] font-[800] text-[#0F172A] hover:bg-[#F8FAFC]"
          >
            취소
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="h-12 rounded-[8px] bg-[#E0525D] px-5 text-[16px] font-[800] text-white hover:bg-[#DC4450]"
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
    <aside className="w-[370px] shrink-0 overflow-y-auto border-l border-[#E5E7EB] bg-white">
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
        min-h-[43px]
        grid-cols-[150px_1fr]
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
          title="드래그해서 순서 변경"
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

      <p className="text-[15px] font-[600] text-[#64748B]">{label}</p>

      <div className="min-w-0">
        {field.kind === "title" && (
          <input
            value={item.name}
            onChange={(e) => onChangeValue(e.target.value)}
            placeholder={placeholder}
            className="
              w-full bg-transparent
              text-[15px] font-[500] text-[#0F172A]
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
              text-[15px] font-[500] text-[#0F172A]
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
                  inline-flex h-[26px] items-center gap-1
                  rounded-full
                  bg-[#F1F5F9]
                  px-3
                  text-[13px]
                  font-[700]
                  text-[#475569]
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

            <button
              onClick={onOpenKeyword}
              className="
                h-[26px]
                rounded-full
                border border-dashed border-[#CBD5E1]
                bg-white
                px-3
                text-[13px]
                font-[700]
                text-[#64748B]
              "
            >
              + 키워드
            </button>

            {keywordOpen && (
              <KeywordMenu
                selectedKeywords={item.keywords}
                onToggleKeyword={onToggleKeyword}
                onAddDirectKeyword={onAddDirectKeyword}
              />
            )}
          </div>
        )}

        {field.kind === "importance" && (
          <button
            onClick={onToggleImportant}
            className="inline-flex items-center gap-2 text-[15px] font-[600] text-[#64748B]"
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

interface AddFieldMenuProps {
  onAddField: (field: { key: string; label: string }) => void;
  onAddCustomField: () => void;
}

function AddFieldMenu({ onAddField, onAddCustomField }: AddFieldMenuProps) {
  return (
    <div
      className="
        absolute left-0 top-9 z-30
        w-[290px]
        overflow-hidden
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
          onClick={() => onAddField(field)}
          className="
            flex h-10 w-full items-center
            px-4
            text-left
            text-[14px]
            font-[600]
            text-[#0F172A]
            hover:bg-[#F8FAFC]
          "
        >
          {field.label}
        </button>
      ))}

      <button
        className="
          flex h-11 w-full items-center justify-between
          border-y border-[#F1F5F9]
          px-4
          text-left
          text-[14px]
          font-[600]
          text-[#0F172A]
          hover:bg-[#F8FAFC]
        "
      >
        다른 유형의 필드
        <ChevronRight size={16} />
      </button>

      <button
        onClick={onAddCustomField}
        className="
          flex h-11 w-full items-center gap-2
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
