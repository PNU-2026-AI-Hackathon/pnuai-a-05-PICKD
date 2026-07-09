import { useEffect, useMemo, useState } from "react";
import { Check, Clipboard, Eye, EyeOff, Pencil, RotateCcw } from "lucide-react";
import { getUserProfile, updateUserProfile } from "../../api/user";

// "20050226" → "2005-02-26"
function toInputDate(val: string) {
  return val && /^\d{8}$/.test(val) ? `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}` : val;
}

// "2005-02-26" → "20050226"
function toApiDate(val: string) {
  return val && /^\d{4}-\d{2}-\d{2}$/.test(val) ? val.replace(/-/g, "") : val;
}

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
  { key: "industries", label: "관심 산업" },
  { key: "jobGroups", label: "희망 직군" },
  { key: "employmentType", label: "고용 형태" },
  { key: "companyTypes", label: "희망 기업 유형" },
  { key: "targetCompany", label: "목표 기업" },
  { key: "salaryRange", label: "희망 연봉" },
  { key: "targetPeriod", label: "목표 취업 기간" },
  { key: "currentStage", label: "현재 준비 단계" },
  { key: "focusItems", label: "집중 준비 항목" },
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

const ENROLLMENT_STATUS_LABEL: Record<string, string> = {
  ENROLLED: "재학",
  GRADUATED: "졸업",
  LOA: "휴학",
  EXPECTED: "졸업예정",
  DROPOUT: "중퇴",
};

const LS_INFO_VISIBLE = "specs.info.visibleKeys.v5";
const LS_INFO_VALUES = "specs.info.values.v3";

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
  const [snapshot, setSnapshot] = useState<Record<InfoKey, string> | null>(null);
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
          birthDate: toInputDate(profile.birthDate ?? ""),
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
      .catch(() => {
        // 프로필 조회 실패 시 기존 로컬스토리지 값 유지
      });
  }, []);

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

  const toArray = (val: string) =>
    val ? val.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const splitArr = (val: string) =>
    val ? val.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const handleSave = async () => {
    lsSet(LS_INFO_VALUES, values);
    lsSet(LS_INFO_VISIBLE, visibleKeys);

    const payload: Parameters<typeof updateUserProfile>[0] = {};
    if (values.name) payload.name = values.name;
    if (values.nickname) payload.nickname = values.nickname;
    if (values.phone) payload.phone = values.phone;
    if (values.birthDate) payload.birthDate = toApiDate(values.birthDate);
    if (values.intro) payload.intro = values.intro;
    if (values.currentResidence) payload.currentResidence = values.currentResidence;
    if (values.desiredLocations) payload.desiredLocations = splitArr(values.desiredLocations);
    if (values.detailedAddress) payload.detailedAddress = values.detailedAddress;
    if (values.schoolName) payload.schoolName = values.schoolName;
    if (values.department) payload.department = values.department;
    if (values.doubleMajor) payload.doubleMajor = values.doubleMajor;
    if (values.minor) payload.minor = values.minor;
    if (values.degreeType) payload.degreeType = values.degreeType;
    if (values.enrollmentStatus) payload.enrollmentStatus = values.enrollmentStatus;
    if (values.graduationDate) payload.graduationDate = values.graduationDate;
    if (values.gpa) payload.gpa = Number(values.gpa);
    if (values.campus) payload.campus = values.campus;
    if (values.industries) payload.industries = splitArr(values.industries);
    if (values.jobGroups) payload.jobGroups = splitArr(values.jobGroups);
    if (values.employmentType) payload.employmentType = values.employmentType;
    if (values.companyTypes) payload.companyTypes = splitArr(values.companyTypes);
    if (values.targetCompany) payload.targetCompany = values.targetCompany;
    if (values.salaryRange) payload.salaryRange = values.salaryRange;
    if (values.targetPeriod) payload.targetPeriod = values.targetPeriod;
    if (values.currentStage) payload.currentStage = values.currentStage;
    if (values.focusItems) payload.focusItems = splitArr(values.focusItems);

    try {
      await updateUserProfile(payload);
    } catch {
      alert("프로필 저장에 실패했습니다. 다시 시도해주세요.");
    }
  };

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
            onClick={async () => {
              if (editMode) {
                await handleSave();
              } else {
                setSnapshot(values);
              }
              setEditMode((prev) => !prev);
            }}
            className="inline-flex h-9 items-center gap-2 rounded-[8px] border border-[#E2E8F0] bg-white px-3 text-[13px] font-[700] text-[#334155] hover:bg-[#F8FAFC]"
          >
            <Pencil size={15} />
            {editMode ? "저장" : "전체 편집"}
          </button>

          {editMode && (
            <button
              type="button"
              onClick={() => {
                if (snapshot) setValues(snapshot);
                setEditMode(false);
              }}
              className="inline-flex h-9 items-center gap-2 rounded-[8px] border border-[#E2E8F0] bg-white px-3 text-[13px] font-[700] text-[#64748B] hover:bg-[#F8FAFC]"
            >
              <RotateCcw size={15} />
              취소
            </button>
          )}
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
                {(field.key === "hasResume" || field.key === "hasBaseEssay" || field.key === "hasPortfolio") ? (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={values[field.key] === "있음"}
                      onChange={(event) =>
                        setValues((prev) => ({ ...prev, [field.key]: event.target.checked ? "있음" : "없음" }))
                      }
                      className="h-4 w-4 rounded border-[#E2E8F0] accent-[#2563EB]"
                    />
                    <span className="text-[13px] text-[#475569]">보유</span>
                  </label>
                ) : field.key === "focusItems" ? (
                  <div className="flex flex-wrap gap-1.5">
                    {["서류", "코딩테스트", "면접", "포트폴리오", "경험정리"].map((item) => {
                      const selected = toArray(values.focusItems).includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            const current = toArray(values.focusItems);
                            const next = selected
                              ? current.filter((v) => v !== item)
                              : [...current, item];
                            setValues((prev) => ({ ...prev, focusItems: next.join(", ") }));
                          }}
                          className={`rounded-lg border px-3 py-1 text-[12px] font-[600] transition-colors ${
                            selected
                              ? "border-[#2563EB] bg-[#2563EB] text-white"
                              : "border-[#E2E8F0] bg-white text-[#475569]"
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                ) : field.key === "salaryRange" ? (
                  <select
                    value={values.salaryRange ?? ""}
                    onChange={(event) =>
                      setValues((prev) => ({ ...prev, salaryRange: event.target.value }))
                    }
                    className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-[13px] outline-none focus:border-[#2563EB]"
                  >
                    <option value="">선택</option>
                    <option value="3000">3000만원+</option>
                    <option value="4000">4000만원+</option>
                    <option value="5000">5000만원+</option>
                  </select>
                ) : field.key === "companyTypes" ? (
                  <div className="flex flex-wrap gap-1.5">
                    {["대기업", "중견기업", "스타트업"].map((item) => {
                      const selected = toArray(values.companyTypes).includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            const current = toArray(values.companyTypes);
                            const next = selected
                              ? current.filter((v) => v !== item)
                              : [...current, item];
                            setValues((prev) => ({ ...prev, companyTypes: next.join(", ") }));
                          }}
                          className={`rounded-lg border px-3 py-1 text-[12px] font-[600] transition-colors ${
                            selected
                              ? "border-[#2563EB] bg-[#2563EB] text-white"
                              : "border-[#E2E8F0] bg-white text-[#475569]"
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                ) : field.key === "jobGroups" ? (
                  <div className="flex flex-wrap gap-1.5">
                    {["개발", "기획", "디자인"].map((item) => {
                      const selected = toArray(values.jobGroups).includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            const current = toArray(values.jobGroups);
                            const next = selected
                              ? current.filter((v) => v !== item)
                              : [...current, item];
                            setValues((prev) => ({ ...prev, jobGroups: next.join(", ") }));
                          }}
                          className={`rounded-lg border px-3 py-1 text-[12px] font-[600] transition-colors ${
                            selected
                              ? "border-[#2563EB] bg-[#2563EB] text-white"
                              : "border-[#E2E8F0] bg-white text-[#475569]"
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                ) : field.key === "industries" ? (
                  <div className="flex flex-wrap gap-1.5">
                    {["IT", "금융", "제조", "마케팅"].map((item) => {
                      const selected = toArray(values.industries).includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            const current = toArray(values.industries);
                            const next = selected
                              ? current.filter((v) => v !== item)
                              : [...current, item];
                            setValues((prev) => ({ ...prev, industries: next.join(", ") }));
                          }}
                          className={`rounded-lg border px-3 py-1 text-[12px] font-[600] transition-colors ${
                            selected
                              ? "border-[#2563EB] bg-[#2563EB] text-white"
                              : "border-[#E2E8F0] bg-white text-[#475569]"
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                ) : field.key === "employmentType" ? (
                  <select
                    value={values.employmentType ?? ""}
                    onChange={(event) =>
                      setValues((prev) => ({ ...prev, employmentType: event.target.value }))
                    }
                    className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-[13px] outline-none focus:border-[#2563EB]"
                  >
                    <option value="">선택</option>
                    <option value="FULL_TIME">정규직</option>
                    <option value="INTERN">인턴</option>
                  </select>
                ) : field.key === "degreeType" ? (
                  <select
                    value={values.degreeType ?? ""}
                    onChange={(event) =>
                      setValues((prev) => ({ ...prev, degreeType: event.target.value }))
                    }
                    className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-[13px] outline-none focus:border-[#2563EB]"
                  >
                    <option value="">선택</option>
                    <option value="ASSOCIATE">전문학사</option>
                    <option value="BACHELOR">학사</option>
                    <option value="MASTER">석사</option>
                    <option value="DOCTOR">박사</option>
                  </select>
                ) : field.key === "enrollmentStatus" ? (
                  <select
                    value={values.enrollmentStatus ?? ""}
                    onChange={(event) =>
                      setValues((prev) => ({ ...prev, enrollmentStatus: event.target.value }))
                    }
                    className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-[13px] outline-none focus:border-[#2563EB]"
                  >
                    <option value="">선택</option>
                    <option value="ENROLLED">재학</option>
                    <option value="GRADUATED">졸업</option>
                    <option value="EXPECTED">졸업예정</option>
                    <option value="LOA">휴학</option>
                    <option value="DROPOUT">중퇴</option>
                  </select>
                ) : (
                  <input
                    type={field.key === "graduationDate" ? "month" : field.key === "birthDate" ? "date" : "text"}
                    value={values[field.key] ?? ""}
                    onChange={(event) =>
                      setValues((prev) => ({ ...prev, [field.key]: event.target.value }))
                    }
                    placeholder={`${field.label} 입력`}
                    className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-[13px] outline-none focus:border-[#2563EB]"
                  />
                )}
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
                  const rawValue = values[field.key] || "";
                  const value =
                    field.key === "enrollmentStatus"
                      ? ENROLLMENT_STATUS_LABEL[rawValue] ?? rawValue
                      : rawValue;
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