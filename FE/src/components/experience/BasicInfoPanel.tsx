import { useEffect, useMemo, useState } from "react";
import { Check, Clipboard, Eye, EyeOff, Pencil, RotateCcw } from "lucide-react";

type InfoKey =
  | "name"
  | "hanjaName"
  | "engName"
  | "birth"
  | "email"
  | "phone"
  | "address"
  | "school"
  | "major"
  | "grade"
  | "military"
  | "veteran"
  | "disability"
  | "national"
  | "driverLicense"
  | "portfolioUrl"
  | "github"
  | "linkedin"
  | "blog"
  | "enrollYear"
  | "gradYear"
  | "gpa"
  | "minor"
  | "transfer"
  | "gender"
  | "nationality"
  | "hsSchool"
  | "hsLocation"
  | "hsEnroll"
  | "hsGrad"
  | "hsGradStatus";

const INFO_FIELDS: { key: InfoKey; label: string }[] = [
  { key: "name", label: "이름" },
  { key: "hanjaName", label: "한자 이름" },
  { key: "engName", label: "영문 이름" },
  { key: "birth", label: "생년월일" },
  { key: "email", label: "이메일" },
  { key: "phone", label: "전화번호" },
  { key: "address", label: "주소" },
  { key: "school", label: "학교" },
  { key: "major", label: "전공" },
  { key: "grade", label: "학년 / 졸업 여부" },
  { key: "military", label: "병역 사항" },
  { key: "veteran", label: "보훈 사항" },
  { key: "disability", label: "장애 사항" },
  { key: "national", label: "국가유공자 관련" },
  { key: "driverLicense", label: "운전면허" },
  { key: "portfolioUrl", label: "포트폴리오 URL" },
  { key: "github", label: "GitHub" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "blog", label: "블로그/노션" },
  { key: "enrollYear", label: "입학 연도" },
  { key: "gradYear", label: "졸업(예정) 연도" },
  { key: "gpa", label: "학점 (GPA)" },
  { key: "minor", label: "부전공" },
  { key: "transfer", label: "편입 여부" },
  { key: "gender", label: "성별" },
  { key: "nationality", label: "국적" },
  { key: "hsSchool", label: "고등학교" },
  { key: "hsLocation", label: "고등학교 소재지" },
  { key: "hsEnroll", label: "고등학교 입학년월" },
  { key: "hsGrad", label: "고등학교 졸업년월" },
  { key: "hsGradStatus", label: "고등학교 졸업여부" },
];

const FIELD_GROUPS: { title: string; keys: InfoKey[] }[] = [
  { title: "인적사항", keys: ["name", "hanjaName", "engName", "birth", "gender", "nationality"] },
  { title: "연락처", keys: ["email", "phone", "address"] },
  { title: "학력", keys: ["school", "major", "grade", "enrollYear", "gradYear", "gpa", "minor", "transfer"] },
  { title: "고등학교", keys: ["hsSchool", "hsLocation", "hsEnroll", "hsGrad", "hsGradStatus"] },
  { title: "온라인 프로필", keys: ["portfolioUrl", "github", "linkedin", "blog"] },
  { title: "병역·면허", keys: ["military", "veteran", "disability", "national", "driverLicense"] },
];

const DEFAULT_VISIBLE: InfoKey[] = [
  "name",
  "engName",
  "birth",
  "email",
  "phone",
  "address",
  "school",
  "major",
  "grade",
  "military",
  "driverLicense",
];

const INFO_DEFAULTS: Record<InfoKey, string> = {
  name: "",
  hanjaName: "",
  engName: "",
  birth: "",
  email: "",
  phone: "",
  address: "",
  school: "",
  major: "",
  grade: "",
  military: "해당 없음",
  veteran: "해당 없음",
  disability: "해당 없음",
  national: "해당 없음",
  driverLicense: "없음",
  portfolioUrl: "",
  github: "",
  linkedin: "",
  blog: "",
  enrollYear: "",
  gradYear: "",
  gpa: "",
  minor: "",
  transfer: "해당 없음",
  gender: "선택 안 함",
  nationality: "대한민국",
  hsSchool: "",
  hsLocation: "",
  hsEnroll: "",
  hsGrad: "",
  hsGradStatus: "해당 없음",
};

const LS_INFO_VISIBLE = "specs.info.visibleKeys.v4";
const LS_INFO_VALUES = "specs.info.values.v2";

function lsGet<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export default function BasicInfoPanel() {
  const [values, setValues] = useState<Record<InfoKey, string>>(() => ({
    ...INFO_DEFAULTS,
    ...lsGet<Record<InfoKey, string>>(LS_INFO_VALUES, INFO_DEFAULTS),
  }));
  const [visibleKeys, setVisibleKeys] = useState<InfoKey[]>(() =>
    lsGet<InfoKey[]>(LS_INFO_VISIBLE, DEFAULT_VISIBLE),
  );
  const [editMode, setEditMode] = useState(false);
  const [copiedKey, setCopiedKey] = useState<InfoKey | null>(null);
  const [maskedKeys, setMaskedKeys] = useState<Set<InfoKey>>(new Set());

  useEffect(() => lsSet(LS_INFO_VALUES, values), [values]);
  useEffect(() => lsSet(LS_INFO_VISIBLE, visibleKeys), [visibleKeys]);

  const filledCount = INFO_FIELDS.filter((field) => values[field.key]?.trim()).length;
  const progress = Math.round((filledCount / INFO_FIELDS.length) * 100);

  const visibleGroups = useMemo(
    () =>
      FIELD_GROUPS.map((group) => ({
        title: group.title,
        fields: INFO_FIELDS.filter((field) => group.keys.includes(field.key) && visibleKeys.includes(field.key)),
      })).filter((group) => group.fields.length > 0),
    [visibleKeys],
  );

  const copyValue = async (key: InfoKey) => {
    const value = values[key];
    if (!value) return;
    await navigator.clipboard?.writeText(value);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1200);
  };

  const toggleMask = (key: InfoKey) => {
    setMaskedKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-[800] text-[#0F172A]">기본정보</h2>
          <p className="mt-1 text-[13px] font-[500] text-[#64748B]">
            두 번째 프로젝트의 기본정보 필드명을 그대로 가져온 섹션입니다.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-24 overflow-hidden rounded-full bg-[#E2E8F0]">
              <div className="h-full rounded-full bg-[#2563EB]" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-[12px] font-[700] text-[#64748B]">
              {filledCount}/{INFO_FIELDS.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setEditMode((prev) => !prev)}
            className="inline-flex h-9 items-center gap-2 rounded-[8px] border border-[#E2E8F0] bg-white px-3 text-[13px] font-[700] text-[#334155] hover:bg-[#F8FAFC]"
          >
            <Pencil size={15} />
            {editMode ? "보기" : "전체 편집"}
          </button>

          <button
            type="button"
            onClick={() => {
              setValues(INFO_DEFAULTS);
              setVisibleKeys(DEFAULT_VISIBLE);
            }}
            className="inline-flex h-9 items-center gap-2 rounded-[8px] border border-[#E2E8F0] bg-white px-3 text-[13px] font-[700] text-[#64748B] hover:bg-[#F8FAFC]"
          >
            <RotateCcw size={15} />
            초기화
          </button>
        </div>
      </div>

      {editMode ? (
        <div className="grid grid-cols-2 gap-3">
          {INFO_FIELDS.map((field) => {
            const visible = visibleKeys.includes(field.key);
            return (
              <div key={field.key} className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <label className="text-[13px] font-[700] text-[#475569]">{field.label}</label>
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleKeys((prev) =>
                        prev.includes(field.key)
                          ? prev.filter((key) => key !== field.key)
                          : [...prev, field.key],
                      )
                    }
                    className={`text-[12px] font-[700] ${visible ? "text-[#2563EB]" : "text-[#94A3B8]"}`}
                  >
                    {visible ? "표시" : "숨김"}
                  </button>
                </div>
                <input
                  value={values[field.key] ?? ""}
                  onChange={(event) =>
                    setValues((prev) => ({ ...prev, [field.key]: event.target.value }))
                  }
                  placeholder={`${field.label} 입력`}
                  className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-[13px] outline-none focus:border-[#2563EB]"
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-6">
          {visibleGroups.map((group) => (
            <section key={group.title}>
              <h3 className="mb-3 text-[14px] font-[800] text-[#334155]">{group.title}</h3>
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                {group.fields.map((field) => {
                  const value = values[field.key] || "";
                  const masked = maskedKeys.has(field.key);
                  return (
                    <div key={field.key} className="group rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[12px] font-[700] text-[#64748B]">{field.label}</p>
                        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                          <button type="button" onClick={() => toggleMask(field.key)} className="text-[#94A3B8] hover:text-[#0F172A]">
                            {masked ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                          <button type="button" onClick={() => copyValue(field.key)} className="text-[#94A3B8] hover:text-[#0F172A]">
                            {copiedKey === field.key ? <Check size={14} /> : <Clipboard size={14} />}
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 truncate text-[14px] font-[600] text-[#0F172A]">
                        {value ? (masked ? "••••••" : value) : "—"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export { INFO_FIELDS, FIELD_GROUPS };
