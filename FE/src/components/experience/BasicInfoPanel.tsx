import { useEffect, useMemo, useState } from "react";
import { Check, Clipboard, Eye, EyeOff, Pencil, RotateCcw } from "lucide-react";
import { getUserProfile } from "../../api/user";

type InfoKey =
  | "name"
  | "nickname"
  | "email"
  | "phone"
  | "birthDate"
  | "intro"
  | "currentResidence"
  | "detailedAddress"
  | "desiredLocations"
  | "schoolName"
  | "department"
  | "doubleMajor"
  | "minor"
  | "degreeType"
  | "enrollmentStatus"
  | "graduationDate"
  | "gpa"
  | "campus"
  | "industries"
  | "jobGroups"
  | "employmentType"
  | "companyTypes"
  | "targetCompany"
  | "salaryRange"
  | "targetPeriod"
  | "currentStage"
  | "focusItems"
  | "hasResume"
  | "hasBaseEssay"
  | "hasPortfolio";

const INFO_FIELDS: { key: InfoKey; label: string }[] = [
  { key: "name", label: "이름" },
  { key: "nickname", label: "닉네임" },
  { key: "email", label: "이메일" },
  { key: "phone", label: "전화번호" },
  { key: "birthDate", label: "생년월일" },
  { key: "intro", label: "자기소개" },
  { key: "currentResidence", label: "현재 거주지" },
  { key: "detailedAddress", label: "상세 주소" },
  { key: "desiredLocations", label: "희망 근무지" },
  { key: "schoolName", label: "학교" },
  { key: "department", label: "학과" },
  { key: "doubleMajor", label: "복수전공" },
  { key: "minor", label: "부전공" },
  { key: "degreeType", label: "학위 유형" },
  { key: "enrollmentStatus", label: "재학 상태" },
  { key: "graduationDate", label: "졸업일" },
  { key: "gpa", label: "학점 (GPA)" },
  { key: "campus", label: "캠퍼스" },
  { key: "industries", label: "희망 산업" },
  { key: "jobGroups", label: "희망 직군" },
  { key: "employmentType", label: "고용 형태" },
  { key: "companyTypes", label: "희망 기업 유형" },
  { key: "targetCompany", label: "목표 기업" },
  { key: "salaryRange", label: "희망 연봉" },
  { key: "targetPeriod", label: "목표 취업 시기" },
  { key: "currentStage", label: "현재 준비 단계" },
  { key: "focusItems", label: "집중 항목" },
  { key: "hasResume", label: "이력서 보유" },
  { key: "hasBaseEssay", label: "기본 자소서 보유" },
  { key: "hasPortfolio", label: "포트폴리오 보유" },
];

const FIELD_GROUPS: { title: string; keys: InfoKey[] }[] = [
  { title: "인적사항", keys: ["name", "nickname", "birthDate", "intro"] },
  { title: "연락처", keys: ["email", "phone", "currentResidence", "detailedAddress", "desiredLocations"] },
  { title: "학력", keys: ["schoolName", "department", "doubleMajor", "minor", "degreeType", "enrollmentStatus", "graduationDate", "gpa", "campus"] },
  { title: "취업 목표", keys: ["industries", "jobGroups", "employmentType", "companyTypes", "targetCompany", "salaryRange", "targetPeriod", "currentStage", "focusItems"] },
  { title: "보유 자료", keys: ["hasResume", "hasBaseEssay", "hasPortfolio"] },
];

const DEFAULT_VISIBLE: InfoKey[] = [
  "name",
  "email",
  "phone",
  "birthDate",
  "currentResidence",
  "schoolName",
  "department",
  "enrollmentStatus",
  "graduationDate",
  "gpa",
];

const INFO_DEFAULTS: Record<InfoKey, string> = {
  name: "",
  nickname: "",
  email: "",
  phone: "",
  birthDate: "",
  intro: "",
  currentResidence: "",
  detailedAddress: "",
  desiredLocations: "",
  schoolName: "",
  department: "",
  doubleMajor: "",
  minor: "",
  degreeType: "",
  enrollmentStatus: "",
  graduationDate: "",
  gpa: "",
  campus: "",
  industries: "",
  jobGroups: "",
  employmentType: "",
  companyTypes: "",
  targetCompany: "",
  salaryRange: "",
  targetPeriod: "",
  currentStage: "",
  focusItems: "",
  hasResume: "",
  hasBaseEssay: "",
  hasPortfolio: "",
};

const LS_INFO_VISIBLE = "specs.info.visibleKeys.v5";

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
  const [values, setValues] = useState<Record<InfoKey, string>>(INFO_DEFAULTS);
  const [visibleKeys, setVisibleKeys] = useState<InfoKey[]>(() =>
    lsGet<InfoKey[]>(LS_INFO_VISIBLE, DEFAULT_VISIBLE),
  );
  const [editMode, setEditMode] = useState(false);
  const [copiedKey, setCopiedKey] = useState<InfoKey | null>(null);
  const [maskedKeys, setMaskedKeys] = useState<Set<InfoKey>>(new Set());

  useEffect(() => {
    getUserProfile()
      .then((profile) => {
        const apiValues: Partial<Record<InfoKey, string>> = {
          name: profile.name ?? "",
          nickname: profile.nickname ?? "",
          email: profile.email ?? "",
          phone: profile.phone ?? "",
          birthDate: profile.birthDate ?? "",
          intro: profile.intro ?? "",
          currentResidence: profile.currentResidence ?? "",
          detailedAddress: profile.detailedAddress ?? "",
          desiredLocations: profile.desiredLocations?.join(", ") ?? "",
          schoolName: profile.schoolName ?? "",
          department: profile.department ?? "",
          doubleMajor: profile.doubleMajor ?? "",
          minor: profile.minor ?? "",
          degreeType: profile.degreeType ?? "",
          enrollmentStatus: profile.enrollmentStatus ?? "",
          graduationDate: profile.graduationDate ?? "",
          gpa: profile.gpa != null ? String(profile.gpa) : "",
          campus: profile.campus ?? "",
          industries: profile.industries?.join(", ") ?? "",
          jobGroups: profile.jobGroups?.join(", ") ?? "",
          employmentType: profile.employmentType ?? "",
          companyTypes: profile.companyTypes?.join(", ") ?? "",
          targetCompany: profile.targetCompany ?? "",
          salaryRange: profile.salaryRange ?? "",
          targetPeriod: profile.targetPeriod ?? "",
          currentStage: profile.currentStage ?? "",
          focusItems: profile.focusItems?.join(", ") ?? "",
          hasResume: profile.hasResume ? "있음" : "없음",
          hasBaseEssay: profile.hasBaseEssay ? "있음" : "없음",
          hasPortfolio: profile.hasPortfolio ? "있음" : "없음",
        };

        setValues((prev) => ({ ...prev, ...apiValues }));
      })
      .catch((error) => {
        console.error("프로필 조회 실패:", error);
        setValues(INFO_DEFAULTS);
      });
  }, []);

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
            프로필에서 불러온 기본정보입니다.
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
