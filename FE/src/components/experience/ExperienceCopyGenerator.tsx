import { useEffect, useMemo, useState } from "react";
import { Copy, Sparkles, X } from "lucide-react";
import type { ExperienceItem } from "../../types/experience";

const COPY_PURPOSES = [
  "지원동기",
  "직무역량",
  "문제해결",
  "협업 경험",
  "도전 경험",
  "성과 경험",
  "성장 과정",
  "입사 후 포부",
  "면접 답변",
  "이력서 요약",
];

const LENGTH_OPTIONS = [100, 300, 500, 700, 1000];

interface Props {
  open: boolean;
  item: ExperienceItem | null;
  onClose: () => void;
  onCopy?: (text: string) => void;
}

export default function ExperienceCopyGenerator({ open, item, onClose, onCopy }: Props) {
  const [purpose, setPurpose] = useState("문제해결");
  const [length, setLength] = useState(500);
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  const sourceText = useMemo(() => {
    if (!item) return "";

    const fields = item.fields ?? {};
    const parts = [
      fields.__body,
      fields.overview,
      fields.problem,
      fields.myRole,
      fields.execution,
      fields.result,
      fields.metric,
      fields.learned,
      fields.jobFit,
      fields.tasks,
      item.role,
      item.keywords.join(", "),
    ]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .join(" ");

    return parts || item.name;
  }, [item]);

  useEffect(() => {
    if (open && item) {
      setText(makeCopyText(item, purpose, length, sourceText));
      setCopied(false);
    }
  }, [open, item, purpose, length, sourceText]);

  if (!open || !item) return null;

  const regenerate = () => {
    setText(makeCopyText(item, purpose, length, sourceText));
    setCopied(false);
  };

  const copyText = async () => {
    if (!text.trim()) return;
    await navigator.clipboard?.writeText(text);
    onCopy?.(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-4"
      onClick={onClose}
    >
      <div
        className="w-[560px] rounded-[16px] border border-[#E2E8F0] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.25)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[#E2E8F0] px-5 py-4">
          <div>
            <h3 className="text-[18px] font-[800] text-[#0F172A]">복붙용 문장 만들기</h3>
            <p className="mt-1 text-[13px] font-[500] text-[#64748B]">목적과 글자 수에 맞춰 경험을 바로 붙여넣을 수 있게 정리합니다.</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#F8FAFC]">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className="mb-1 block text-[12px] font-[700] text-[#64748B]">목적</span>
              <select
                value={purpose}
                onChange={(event) => setPurpose(event.target.value)}
                className="h-9 w-full rounded-[8px] border border-[#E2E8F0] bg-white px-3 text-[13px] font-[600] text-[#0F172A] outline-none focus:border-[#2563EB]"
              >
                {COPY_PURPOSES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1 block text-[12px] font-[700] text-[#64748B]">글자수</span>
              <select
                value={length}
                onChange={(event) => setLength(Number(event.target.value))}
                className="h-9 w-full rounded-[8px] border border-[#E2E8F0] bg-white px-3 text-[13px] font-[600] text-[#0F172A] outline-none focus:border-[#2563EB]"
              >
                {LENGTH_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}자 내외</option>
                ))}
              </select>
            </label>
          </div>

          <button
            type="button"
            onClick={regenerate}
            className="inline-flex h-9 items-center gap-2 rounded-[8px] border border-[#E2E8F0] bg-white px-3 text-[13px] font-[800] text-[#334155] hover:bg-[#F8FAFC]"
          >
            <Sparkles size={15} />
            생성하기
          </button>

          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="생성된 문장이 여기에 표시됩니다."
            className="min-h-[190px] w-full resize-none rounded-[10px] border border-[#E2E8F0] bg-[#FBFCFE] p-3 text-[14px] font-[500] leading-7 text-[#0F172A] outline-none focus:border-[#2563EB]"
          />

          <div className="flex items-center justify-between">
            <span className="text-[12px] font-[700] text-[#94A3B8]">현재 {text.length}자 / 목표 {length}자</span>
            <div className="flex items-center gap-2">
              {copied && <span className="text-[12px] font-[800] text-[#2563EB]">복사되었습니다.</span>}
              <button
                type="button"
                onClick={copyText}
                className="inline-flex h-9 items-center gap-2 rounded-[8px] bg-[#2563EB] px-3 text-[13px] font-[800] text-white hover:bg-[#1D4ED8]"
              >
                <Copy size={15} />
                복사하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function makeCopyText(item: ExperienceItem, purpose: string, length: number, sourceText: string) {
  const org = item.org || item.fields.org || item.fields.company || item.fields.host || item.fields.issuer || item.fields.school || item.fields.univ || "";
  const period = item.period || item.fields.period || item.fields.testDate || item.fields.issuedAt || item.fields.awardedAt || item.fields.semester || "";
  const role = item.role || item.fields.role || item.fields.position || item.fields.tasks || "";
  const result = item.fields.result || item.fields.metric || item.fields.awardYn || "";

  const prefix = [`[${purpose}]`, item.name, org, period].filter(Boolean).join(" ");
  const body = sourceText.replace(/\s+/g, " ").trim();
  const roleSentence = role ? `이 경험에서 저는 ${role} 역할을 맡았습니다.` : "";
  const resultSentence = result ? `주요 결과는 ${result}입니다.` : "";
  const keywordSentence = item.keywords.length ? `핵심 키워드는 ${item.keywords.join(", ")}입니다.` : "";
  const merged = [prefix, roleSentence, body, resultSentence, keywordSentence].filter(Boolean).join(" ");

  if (merged.length <= length) return merged;
  return `${merged.slice(0, Math.max(0, length - 1)).trim()}…`;
}
