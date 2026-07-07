import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateOnboarding } from "../../api/onboarding";
import { PickdLogoIcon } from "../../assets";

const EMPLOYMENT_TYPES = [
  { value: "FULL_TIME", label: "정규직" },
  { value: "INTERN", label: "인턴" },
];

const INDUSTRIES = ["IT", "금융", "제조", "마케팅"];
const JOB_GROUPS = ["개발", "기획", "디자인"];
const COMPANY_TYPES = ["대기업", "중견기업", "스타트업"];

const SALARY_OPTIONS = [
  { value: "", label: "연봉 선택" },
  { value: "3000", label: "3,000만원 이상" },
  { value: "4000", label: "4,000만원 이상" },
  { value: "5000", label: "5,000만원 이상" },
];

const chipClass = (selected: boolean) =>
  `rounded-3xl border px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
    selected
      ? "border-[#2563EB] bg-[#EEF0FD] text-[#2563EB]"
      : "shadow-xs bg-gray-50 text-gray-600 hover:border-gray-300"
  }`;

export default function Step4Interest() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    industries: [] as string[],
    jobGroups: [] as string[],
    employmentType: "",
    companyTypes: [] as string[],
    keywords: [] as string[],
    targetCompany: "",
    salaryRange: "",
  });

  const [keywordInput, setKeywordInput] = useState("");

  const toggle = (key: "industries" | "jobGroups" | "companyTypes", value: string) => {
    const list = form[key];
    setForm((prev) => ({
      ...prev,
      [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    }));
  };

  const addKeyword = () => {
    if (!keywordInput.trim() || form.keywords.includes(keywordInput.trim())) return;
    setForm((prev) => ({ ...prev, keywords: [...prev.keywords, keywordInput.trim()] }));
    setKeywordInput("");
  };

  const removeKeyword = (k: string) => {
    setForm((prev) => ({ ...prev, keywords: prev.keywords.filter((v) => v !== k) }));
  };

  const isValid =
    form.employmentType !== "" &&
    form.industries.length > 0 &&
    form.jobGroups.length > 0 &&
    form.companyTypes.length > 0 &&
    form.keywords.length > 0;

  const submit = async () => {
    if (!isValid) return;
    try {
      await updateOnboarding({
        industries: form.industries,
        jobGroups: form.jobGroups,
        employmentType: form.employmentType,
        companyTypes: form.companyTypes,
        keywords: form.keywords,
        targetCompany: form.targetCompany,
        salaryRange: form.salaryRange,
      });
      navigate("/onboarding/step5");
    } catch (e) {
      console.error(e);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20";

  return (
    <div className="min-h-screen bg-[#F9FAFC]">
      {/* Top-left logo */}
      <div className="flex items-center gap-2 px-40 py-5">
        <PickdLogoIcon size={28} />
        <span className="text-base font-bold text-gray-900">Pickd</span>
      </div>

      <div className="flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-[600px] rounded-2xl bg-white p-10 shadow-sm">
          <h1 className="mb-1 text-2xl font-bold text-gray-900">어떤 일에 관심 있으세요?</h1>
          <p className="mb-8 text-sm text-gray-400">이 선택으로 공고 적합도를 계산하고 맞춤 추천을 만들어요.</p>

          {/* 고용 형태 */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-bold text-gray-800">고용 형태</label>
            <div className="flex gap-2">
              {EMPLOYMENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, employmentType: t.value }))}
                  className={chipClass(form.employmentType === t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 관심 산업 */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-bold text-gray-800">관심 산업</label>
            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggle("industries", item)}
                  className={chipClass(form.industries.includes(item))}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* 직무 */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-bold text-gray-800">관심 직무</label>
            <div className="flex flex-wrap gap-2">
              {JOB_GROUPS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggle("jobGroups", item)}
                  className={chipClass(form.jobGroups.includes(item))}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* 기업 유형 */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-bold text-gray-800">기업 유형</label>
            <div className="flex flex-wrap gap-2">
              {COMPANY_TYPES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggle("companyTypes", item)}
                  className={chipClass(form.companyTypes.includes(item))}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* 키워드 */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-bold text-gray-800">키워드</label>
            <div className="flex gap-2">
              <input
                placeholder="키워드 입력 후 Enter 또는 추가"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addKeyword();
                  }
                }}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
              />
              <button
                type="button"
                onClick={addKeyword}
                disabled={!keywordInput.trim()}
                className={`shrink-0 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                  keywordInput.trim()
                    ? "bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
                    : "cursor-not-allowed bg-gray-200 text-gray-400"
                }`}
              >
                추가
              </button>
            </div>
            {form.keywords.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {form.keywords.map((k) => (
                  <span
                    key={k}
                    className="flex items-center gap-1.5 rounded-full bg-[#EEF0FD] px-3 py-1 text-sm font-medium text-[#2563EB]"
                  >
                    {k}
                    <button
                      type="button"
                      onClick={() => removeKeyword(k)}
                      className="leading-none opacity-60 hover:opacity-100"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 목표 기업 */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-bold text-gray-800">
              목표 기업 <span className="font-normal text-gray-400">(선택)</span>
            </label>
            <input
              placeholder="예: 카카오, 네이버"
              value={form.targetCompany}
              onChange={(e) => setForm((prev) => ({ ...prev, targetCompany: e.target.value }))}
              className={inputClass}
            />
          </div>

          {/* 희망 연봉 */}
          <div className="mb-8">
            <label className="mb-2 block text-sm font-bold text-gray-800">
              희망 연봉 <span className="font-normal text-gray-400">(선택)</span>
            </label>
            <select
              value={form.salaryRange}
              onChange={(e) => setForm((prev) => ({ ...prev, salaryRange: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
            >
              {SALARY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* 다음 버튼 */}
          <button
            onClick={submit}
            disabled={!isValid}
            className={`w-full rounded-xl py-4 text-base font-semibold transition-colors ${
              isValid
                ? "bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
                : "cursor-not-allowed bg-gray-200 text-gray-400"
            }`}
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
