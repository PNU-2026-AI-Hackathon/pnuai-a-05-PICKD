import { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  EyeOff,
  MoreHorizontal,
  Pencil,
  Pin,
  Plus,
  Sparkles,
  Trash2,
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

interface Props {
  open: boolean;
  item: ExperienceItem | null;
  onClose: () => void;
  onChange: (item: ExperienceItem) => void;
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
}: Props) {
  const [headerTypeOpen, setHeaderTypeOpen] = useState(false);
  const [rowTypeOpen, setRowTypeOpen] = useState(false);
  const [keywordOpen, setKeywordOpen] = useState(false);
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const [activeFieldMenuKey, setActiveFieldMenuKey] = useState<string | null>(
    null,
  );
  const [showSentenceTags, setShowSentenceTags] = useState(false);

  if (!open || !item) return null;

  const preset = EXPERIENCE_PRESETS[item.type];

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

  const isImportant = Boolean(item.important ?? item.pinned);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div
        className="
          h-[92vh]
          w-[1280px]
          overflow-hidden
          rounded-[8px]
          bg-[#FBFCFE]
          shadow-[0_26px_90px_rgba(15,23,42,0.35)]
        "
      >
        {/* HEADER */}
        <div className="flex h-[88px] items-start justify-between border-b border-[#E5E7EB] px-7 py-5">
          <div>
            <div className="relative flex items-center gap-2 text-[13px] font-[600] text-[#64748B]">
              <span>경험정리</span>
              <span>›</span>

              <button
                onClick={() => {
                  setHeaderTypeOpen((prev) => !prev);
                  setRowTypeOpen(false);
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
            <span className="mr-2 text-[13px] font-[600] text-[#64748B]">
              저장됨
            </span>
            <button className="h-9 rounded-[8px] border border-[#E2E8F0] bg-white px-3 text-[13px] font-[700] text-[#64748B]">
              저장하기
            </button>

            <button
              onClick={() => updateItem({ pinned: !item.pinned })}
              className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#E2E8F0] bg-white text-[#64748B]"
            >
              <Pin size={16} />
            </button>

            <button className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#E2E8F0] bg-white text-[#64748B]">
              <Sparkles size={16} />
            </button>

            <button className="h-9 rounded-[8px] border border-[#E2E8F0] bg-white px-3 text-[13px] font-[700] text-[#0F172A]">
              복붙용 문장 만들기
            </button>

            <button className="flex h-9 w-9 items-center justify-center text-[#64748B]">
              <MoreHorizontal size={20} />
            </button>

            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center text-[#64748B]"
            >
              <X size={21} />
            </button>
          </div>
        </div>

        <div className="h-[calc(92vh-88px)] overflow-y-auto">
          <div className="mx-auto w-[930px] px-4 pb-10 pt-11">
            <div className="relative w-[790px]">
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
                  }}
                  onSelectType={changeType}
                  onOpenKeyword={() => setKeywordOpen((prev) => !prev)}
                  onToggleKeyword={toggleKeyword}
                  onRemoveKeyword={removeKeyword}
                  onAddDirectKeyword={addDirectKeyword}
                  onToggleImportant={() =>
                    updateItem({
                      important: !isImportant,
                      pinned: !isImportant,
                    })
                  }
                  onOpenFieldMenu={() =>
                    setActiveFieldMenuKey((prev) =>
                      prev === field.key ? null : field.key,
                    )
                  }
                  onRename={() => renameField(field)}
                  onMoveUp={() => moveField(field, "up")}
                  onMoveDown={() => moveField(field, "down")}
                  onHide={() => hideField(field)}
                  onDelete={() => deleteField(field)}
                />
              ))}

              {/* FIELD ADD */}
              <div className="relative grid min-h-[40px] grid-cols-[150px_1fr] items-center">
                <div>
                  <button
                    onClick={() => setAddFieldOpen((prev) => !prev)}
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

            <div className="mt-9 h-px w-[790px] bg-[#E5E7EB]" />

            {/* DOCUMENT AREA */}
            <div className="mt-8 w-[790px]">
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
                value={item.fields.__body ?? ""}
                onChange={(e) => updateFieldValue("__body", e.target.value)}
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
      </div>
    </div>
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
  return (
    <div
      className="
        group
        relative
        grid
        min-h-[43px]
        grid-cols-[150px_1fr_32px]
        items-center
      "
    >
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
          <div className="relative flex flex-wrap items-center gap-2">
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

      <div className="relative flex justify-end">
        <button
          onClick={onOpenFieldMenu}
          className="
            hidden h-7 w-7 items-center justify-center
            rounded-md
            text-[#64748B]
            hover:bg-[#F1F5F9]
            group-hover:flex
          "
        >
          <MoreHorizontal size={18} />
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
        absolute right-0 top-8 z-30
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
