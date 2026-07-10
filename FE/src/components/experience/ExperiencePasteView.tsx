import { Clipboard, Copy, ExternalLink, Pin } from "lucide-react";
import type { ExperienceId, ExperienceItem } from "../../types/experience";
import { EXPERIENCE_PRESETS } from "../../constants/experience/experiencePresets";

interface Props {
  items: ExperienceItem[];
  onCopy: (text: string) => void;
  onOpenItem: (item: ExperienceItem) => void;
  onTogglePin: (id: ExperienceId) => void;
}

export default function ExperiencePasteView({
  items,
  onCopy,
  onOpenItem,
  onTogglePin,
}: Props) {
  const pinItems = items.filter((item) => item.pin);

  if (pinItems.length === 0) {
    return (
      <div className="mt-[18px] rounded-[16px] border border-dashed border-[#CBD5E1] bg-white px-6 py-14 text-center">
        <Clipboard className="mx-auto mb-3 text-[#CBD5E1]" size={34} />
        <p className="text-[15px] font-[800] text-[#0F172A]">
          복붙용으로 고정된 항목이 없습니다.
        </p>
        <p className="mt-2 text-[13px] font-[600] text-[#94A3B8]">
          표의 관리 칸에서 고정 버튼을 누르면 이 화면에 복붙용 카드로
          표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-[18px] grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {pinItems.map((item) => (
        <PasteCard
          key={item.id}
          item={item}
          onCopy={onCopy}
          onOpenItem={onOpenItem}
          onTogglePin={onTogglePin}
        />
      ))}
    </div>
  );
}

function PasteCard({
  item,
  onCopy,
  onOpenItem,
  onTogglePin,
}: {
  item: ExperienceItem;
  onCopy: (text: string) => void;
  onOpenItem: (item: ExperienceItem) => void;
  onTogglePin: (id: ExperienceId) => void;
}) {
  const fields = getFilledFields(item);
  const documentText = item.fields.__body?.trim() ?? "";

  return (
    <article className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3 px-4 py-4">
        <div className="min-w-0">
          <span className="rounded-full bg-[#EFF6FF] px-2 py-1 text-[11px] font-[800] text-[#2563EB]">
            {item.type}
          </span>
          <h3 className="mt-2 line-clamp-2 text-[16px] font-[800] text-[#0F172A]">
            {item.name}
          </h3>
          <p className="mt-1 truncate text-[12px] font-[600] text-[#64748B]">
            {[getOrgText(item), getPeriodText(item)]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onTogglePin(item.id)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#2563EB] hover:bg-[#EFF6FF]"
            title="고정 해제"
          >
            <Pin size={16} className="fill-current" />
          </button>
          <button
            type="button"
            onClick={() => onOpenItem(item)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#F8FAFC]"
            title="상세 보기"
          >
            <ExternalLink size={16} />
          </button>
        </div>
      </div>

      <div className="divide-y divide-[#F1F5F9] border-t border-[#F1F5F9]">
        {documentText && (
          <section className="px-4 py-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[13px] font-[800] text-[#64748B]">
                자소서용 요약
              </p>
              <button
                type="button"
                onClick={() => onCopy(documentText)}
                className="inline-flex items-center gap-1 text-[12px] font-[800] text-[#64748B] hover:text-[#2563EB]"
              >
                <Copy size={13} />
                전체 복사
              </button>
            </div>
            <button
              type="button"
              onClick={() => onCopy(documentText)}
              className="w-full text-left text-[13px] font-[500] leading-7 text-[#0F172A] hover:text-[#2563EB] whitespace-pre-line"
            >
              {documentText}
            </button>
          </section>
        )}

        {fields.length > 0 && (
          <section className="space-y-2 px-4 py-4">
            <p className="text-[13px] font-[800] text-[#64748B]">세부 필드</p>
            {fields.map((field) => (
              <div key={field.key} className="flex items-center gap-2">
                <span className="w-[88px] shrink-0 text-[12px] font-[700] text-[#94A3B8]">
                  {field.label}
                </span>
                <button
                  type="button"
                  onClick={() => onCopy(field.value)}
                  className="group flex min-w-0 flex-1 items-center gap-1 text-left text-[13px] font-[600] text-[#0F172A] hover:text-[#2563EB]"
                >
                  <span className="truncate">{field.value}</span>
                  <Copy
                    size={13}
                    className="shrink-0 opacity-0 transition group-hover:opacity-100"
                  />
                </button>
              </div>
            ))}
          </section>
        )}
      </div>
    </article>
  );
}

function getFilledFields(item: ExperienceItem) {
  const presetFields = EXPERIENCE_PRESETS[item.type]?.topFields ?? [];
  const customFields = item.customTopFields ?? [];
  const labelMap = new Map<string, string>();

  [...presetFields, ...customFields].forEach((field) =>
    labelMap.set(field.key, item.fieldLabels?.[field.key] ?? field.label),
  );

  return Object.entries(item.fields ?? {})
    .filter(
      ([key, value]) =>
        key !== "__body" &&
        typeof value === "string" &&
        value.trim() &&
        !item.hiddenFieldKeys?.includes(key),
    )
    .map(([key, value]) => ({
      key,
      label: labelMap.get(key) ?? key,
      value: value.trim(),
    }));
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
    ""
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
