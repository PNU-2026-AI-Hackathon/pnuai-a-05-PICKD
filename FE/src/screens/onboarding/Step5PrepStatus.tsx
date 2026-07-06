import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateOnboarding } from "../../api/onboarding";
import { PickdLogoIcon } from "../../assets";

type ExperienceInput = {
  type: string;
  title: string;
  startDate: string;
  endDate: string;
};

type CertificationInput = {
  name: string;
  score: string;
  acquisitionDate: string;
};

const EXPERIENCE_TYPES = [
  ["PROJECT", "프로젝트"],
  ["INTERN", "인턴/직무경험"],
  ["ACTIVITY", "대외활동"],
  ["CONTEST", "공모전"],
  ["VOLUNTEER", "봉사활동"],
  ["EXCHANGE", "교환학생"],
  ["AWARD", "수상"],
  ["COURSE", "수강과목"],
  ["EDUCATION", "교육 이수"],
  ["RESEARCH", "학부연구생"],
] as const;

const FOCUS_ITEMS = ["서류", "코딩테스트", "면접", "포트폴리오", "경험 정리"];

const inputClass =
  "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20";

const selectClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20";

const chipClass = (selected: boolean) =>
  `rounded-3xl border px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
    selected
      ? "border-[#2563EB] bg-[#EEF0FD] text-[#2563EB]"
      : "shadow-xs bg-gray-50 text-gray-600 hover:border-gray-300"
  }`;

export default function Step5PrepStatus() {
  const navigate = useNavigate();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingCertIndex, setEditingCertIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    targetPeriod: "",
    currentStage: "",
    focusItems: [] as string[],
    hasResume: false,
    hasBaseEssay: false,
    hasPortfolio: false,
    experiences: [] as ExperienceInput[],
    certifications: [] as CertificationInput[],
  });

  const [exp, setExp] = useState<ExperienceInput>({
    type: "PROJECT",
    title: "",
    startDate: "",
    endDate: "",
  });

  const [cert, setCert] = useState<CertificationInput>({
    name: "",
    score: "",
    acquisitionDate: "",
  });

  const toggleFocus = (value: string) => {
    setForm((prev) => ({
      ...prev,
      focusItems: prev.focusItems.includes(value)
        ? prev.focusItems.filter((v) => v !== value)
        : [...prev.focusItems, value],
    }));
  };

  const addExperience = () => {
    if (!exp.title.trim()) return alert("경험 제목을 입력해주세요.");
    const nextExp = { ...exp, title: exp.title.trim() };
    setForm((prev) => {
      const experiences = [...prev.experiences];
      if (editingIndex !== null) experiences[editingIndex] = nextExp;
      else experiences.push(nextExp);
      return { ...prev, experiences };
    });
    setEditingIndex(null);
    setExp({ type: "PROJECT", title: "", startDate: "", endDate: "" });
  };

  const addCert = () => {
    if (!cert.name.trim()) return alert("자격증/어학 이름을 입력해주세요.");
    const nextCert = { ...cert, name: cert.name.trim() };
    setForm((prev) => {
      const certifications = [...prev.certifications];
      if (editingCertIndex !== null) certifications[editingCertIndex] = nextCert;
      else certifications.push(nextCert);
      return { ...prev, certifications };
    });
    setEditingCertIndex(null);
    setCert({ name: "", score: "", acquisitionDate: "" });
  };

  const isValid = form.targetPeriod.trim().length > 0 && form.currentStage.trim().length > 0;

  const submit = async () => {
    if (!isValid || isSubmitting) return;
    try {
      setIsSubmitting(true);
      await updateOnboarding({
        targetPeriod: form.targetPeriod.trim(),
        currentStage: form.currentStage.trim(),
        focusItems: form.focusItems,
        hasResume: form.hasResume,
        hasBaseEssay: form.hasBaseEssay,
        hasPortfolio: form.hasPortfolio,
        experiences: form.experiences,
        certifications: form.certifications,
      });
      navigate("/main");
    } catch (e) {
      console.error(e);
      alert("온보딩 완료 저장에 실패했어요. 입력값을 다시 확인해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      {/* Top-left logo */}
      <div className="flex items-center gap-2 px-40 py-5">
        <PickdLogoIcon size={28} />
        <span className="text-base font-bold text-gray-900">Pickd</span>
      </div>

      <div className="flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-[600px] rounded-2xl bg-white p-10 shadow-sm">
          <h1 className="mb-1 text-2xl font-bold text-gray-900">지금 어디쯤 계세요?</h1>
          <p className="mb-8 text-sm text-gray-400">준비 상태에 맞게 일정과 콘텐츠를 추천해드려요.</p>

          {/* 지원 예정 시기 */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-bold text-gray-800">지원 시기</label>
            <div className="flex flex-wrap gap-2">
              {["이번 분기", "6개월 안", "1년 안", "아직 탐색 중"].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, targetPeriod: option }))}
                  className={chipClass(form.targetPeriod === option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 현재 준비 단계 */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-bold text-gray-800">현재 준비 단계</label>
            <input
              placeholder="예: 자소서 작성중, 코테 준비중"
              value={form.currentStage}
              onChange={(e) => setForm((prev) => ({ ...prev, currentStage: e.target.value }))}
              className={inputClass}
            />
          </div>

          {/* 집중 준비 항목 */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-bold text-gray-800">
              집중 준비 항목 <span className="font-normal text-gray-400">(선택)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {FOCUS_ITEMS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleFocus(item)}
                  className={chipClass(form.focusItems.includes(item))}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* 보유 서류 */}
          <div className="mb-6">
            <label className="mb-3 block text-sm font-bold text-gray-800">
              보유 서류 <span className="font-normal text-gray-400">(선택)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {([["hasResume", "이력서"], ["hasBaseEssay", "기본 자소서"], ["hasPortfolio", "포트폴리오"]] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, [key]: !prev[key] }))}
                  className={chipClass(Boolean(form[key]))}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 경험 추가 */}
          <div className="mb-6">
            <label className="mb-3 block text-sm font-bold text-gray-800">
              경험 <span className="font-normal text-gray-400">(선택)</span>
            </label>
            <div className="rounded-xl border border-gray-200 p-4">
              <div className="mb-3 grid grid-cols-2 gap-3">
                <select
                  value={exp.type}
                  onChange={(e) => setExp((prev) => ({ ...prev, type: e.target.value }))}
                  className={selectClass}
                >
                  {EXPERIENCE_TYPES.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <input
                  placeholder="경험 제목"
                  value={exp.title}
                  onChange={(e) => setExp((prev) => ({ ...prev, title: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div className="mb-3 grid grid-cols-2 gap-3">
                <input
                  type="month"
                  value={exp.startDate}
                  onChange={(e) => setExp((prev) => ({ ...prev, startDate: e.target.value }))}
                  className={inputClass + " text-gray-700"}
                />
                <input
                  type="month"
                  value={exp.endDate}
                  onChange={(e) => setExp((prev) => ({ ...prev, endDate: e.target.value }))}
                  className={inputClass + " text-gray-700"}
                />
              </div>
              <button
                type="button"
                onClick={addExperience}
                className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-200"
              >
                {editingIndex !== null ? "경험 수정" : "+ 경험 추가"}
              </button>

              {form.experiences.length > 0 && (
                <div className="mt-4 space-y-2">
                  {form.experiences.map((item, idx) => (
                    <div key={`${item.title}-${idx}`} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                      <button
                        type="button"
                        className="text-left"
                        onClick={() => { setExp(item); setEditingIndex(idx); }}
                      >
                        <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                        <p className="text-xs text-gray-400">
                          {item.startDate || "시작 미입력"} ~ {item.endDate || "종료 미입력"}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, experiences: prev.experiences.filter((_, i) => i !== idx) }))}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 자격증 / 어학 */}
          <div className="mb-8">
            <label className="mb-3 block text-sm font-bold text-gray-800">
              자격증 / 어학 <span className="font-normal text-gray-400">(선택)</span>
            </label>
            <div className="rounded-xl border border-gray-200 p-4">
              <div className="mb-3 grid grid-cols-2 gap-3">
                <input
                  placeholder="이름 (예: 정보처리기사, TOEIC)"
                  value={cert.name}
                  onChange={(e) => setCert((prev) => ({ ...prev, name: e.target.value }))}
                  className={inputClass}
                />
                <input
                  placeholder="점수 또는 급수"
                  value={cert.score}
                  onChange={(e) => setCert((prev) => ({ ...prev, score: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div className="mb-3">
                <input
                  type="month"
                  value={cert.acquisitionDate}
                  onChange={(e) => setCert((prev) => ({ ...prev, acquisitionDate: e.target.value }))}
                  className={inputClass + " text-gray-700"}
                />
              </div>
              <button
                type="button"
                onClick={addCert}
                className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-200"
              >
                {editingCertIndex !== null ? "자격/어학 수정" : "+ 자격/어학 추가"}
              </button>

              {form.certifications.length > 0 && (
                <div className="mt-4 space-y-2">
                  {form.certifications.map((item, idx) => (
                    <div key={`${item.name}-${idx}`} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                      <button
                        type="button"
                        className="text-left"
                        onClick={() => { setCert(item); setEditingCertIndex(idx); }}
                      >
                        <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-400">
                          {item.score || "점수/급수 미입력"}
                          {item.acquisitionDate && ` · ${item.acquisitionDate}`}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, certifications: prev.certifications.filter((_, i) => i !== idx) }))}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 완료 버튼 */}
          <button
            onClick={submit}
            disabled={!isValid || isSubmitting}
            className={`w-full rounded-xl py-4 text-base font-semibold transition-colors ${
              isValid && !isSubmitting
                ? "bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
                : "cursor-not-allowed bg-gray-200 text-gray-400"
            }`}
          >
            {isSubmitting ? "저장 중..." : "완료"}
          </button>
        </div>
      </div>
    </div>
  );
}
