import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateOnboarding } from "../../api/onboarding";

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

    const nextExp = {
      ...exp,
      title: exp.title.trim(),
    };

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

    const nextCert = {
      ...cert,
      name: cert.name.trim(),
    };

    setForm((prev) => {
      const certifications = [...prev.certifications];
      if (editingCertIndex !== null) certifications[editingCertIndex] = nextCert;
      else certifications.push(nextCert);
      return { ...prev, certifications };
    });

    setEditingCertIndex(null);
    setCert({ name: "", score: "", acquisitionDate: "" });
  };

  const submit = async () => {
    if (!form.targetPeriod.trim()) return alert("지원 예정 시기를 입력해주세요.");
    if (!form.currentStage.trim()) return alert("현재 준비 단계를 입력해주세요.");
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await updateOnboarding({
        targetPeriod: form.targetPeriod.trim(),
        currentStage: form.currentStage.trim(),
        focusItems: form.focusItems,
        hasResume: form.hasResume,
        hasBaseEssay: form.hasBaseEssay,
        hasPortfolio: form.hasPortfolio,
        experiences: form.experiences.map((e) => ({
          type: e.type,
          title: e.title,
          startDate: e.startDate,
          endDate: e.endDate,
        })),
        certifications: form.certifications.map((c) => ({
          name: c.name,
          score: c.score,
          acquisitionDate: c.acquisitionDate,
        })),
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-[560px] rounded-xl bg-white p-8 shadow">
        <p className="mb-2 text-sm font-semibold text-blue-500">Step 5</p>
        <h2 className="mb-6 text-xl font-bold">준비 상태</h2>

        <input
          placeholder="지원 예정 시기 (예: 2026 상반기, 3개월 이내)"
          value={form.targetPeriod}
          onChange={(e) => setForm({ ...form, targetPeriod: e.target.value })}
          className="mb-3 w-full rounded border p-2"
        />

        <input
          placeholder="현재 준비 단계 (예: 자소서 작성중, 코테 준비중)"
          value={form.currentStage}
          onChange={(e) => setForm({ ...form, currentStage: e.target.value })}
          className="mb-3 w-full rounded border p-2"
        />

        <h3 className="mb-2 font-semibold">집중 준비 항목</h3>
        <div className="mb-4 flex flex-wrap gap-2">
          {FOCUS_ITEMS.map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => toggleFocus(item)}
              className={`rounded border px-3 py-1 ${
                form.focusItems.includes(item) ? "bg-blue-500 text-white" : "bg-white"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mb-6 flex flex-wrap gap-4">
          {[
            ["hasResume", "이력서"],
            ["hasBaseEssay", "기본 자소서"],
            ["hasPortfolio", "포트폴리오"],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(form[key as keyof typeof form])}
                onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
              />
              {label} 보유
            </label>
          ))}
        </div>

        <section className="mb-6 rounded-lg border p-4">
          <h3 className="mb-3 font-semibold">경험 추가</h3>
          <select
            value={exp.type}
            onChange={(e) => setExp({ ...exp, type: e.target.value })}
            className="mb-2 w-full rounded border p-2"
          >
            {EXPERIENCE_TYPES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            placeholder="경험 제목"
            value={exp.title}
            onChange={(e) => setExp({ ...exp, title: e.target.value })}
            className="mb-2 w-full rounded border p-2"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="month"
              value={exp.startDate}
              onChange={(e) => setExp({ ...exp, startDate: e.target.value })}
              className="rounded border p-2"
            />
            <input
              type="month"
              value={exp.endDate}
              onChange={(e) => setExp({ ...exp, endDate: e.target.value })}
              className="rounded border p-2"
            />
          </div>
          <button
            type="button"
            onClick={addExperience}
            className="mt-3 rounded bg-gray-200 px-3 py-1"
          >
            {editingIndex !== null ? "경험 수정" : "경험 추가"}
          </button>

          {form.experiences.length > 0 && (
            <div className="mt-4 space-y-2">
              {form.experiences.map((item, idx) => (
                <div
                  key={`${item.title}-${idx}`}
                  className="flex items-center justify-between rounded border p-3"
                >
                  <button
                    type="button"
                    className="text-left"
                    onClick={() => {
                      setExp(item);
                      setEditingIndex(idx);
                    }}
                  >
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-sm text-gray-500">
                      {item.startDate || "시작 미입력"} ~ {item.endDate || "종료 미입력"}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForm({
                        ...form,
                        experiences: form.experiences.filter((_, i) => i !== idx),
                      });
                    }}
                    className="text-red-500"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mb-6 rounded-lg border p-4">
          <h3 className="mb-3 font-semibold">자격증 / 어학 추가</h3>
          <input
            placeholder="이름 (예: 정보처리기사, TOEIC)"
            value={cert.name}
            onChange={(e) => setCert({ ...cert, name: e.target.value })}
            className="mb-2 w-full rounded border p-2"
          />
          <input
            placeholder="점수 또는 급수 (선택)"
            value={cert.score}
            onChange={(e) => setCert({ ...cert, score: e.target.value })}
            className="mb-2 w-full rounded border p-2"
          />
          <input
            type="month"
            value={cert.acquisitionDate}
            onChange={(e) => setCert({ ...cert, acquisitionDate: e.target.value })}
            className="mb-2 w-full rounded border p-2"
          />
          <button
            type="button"
            onClick={addCert}
            className="rounded bg-gray-200 px-3 py-1"
          >
            {editingCertIndex !== null ? "자격/어학 수정" : "자격/어학 추가"}
          </button>

          {form.certifications.length > 0 && (
            <div className="mt-4 space-y-2">
              {form.certifications.map((item, idx) => (
                <div
                  key={`${item.name}-${idx}`}
                  className="flex items-center justify-between rounded border p-3"
                >
                  <button
                    type="button"
                    className="text-left"
                    onClick={() => {
                      setCert(item);
                      setEditingCertIndex(idx);
                    }}
                  >
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.score || "점수/급수 미입력"}
                      {item.acquisitionDate && ` · ${item.acquisitionDate}`}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForm({
                        ...form,
                        certifications: form.certifications.filter((_, i) => i !== idx),
                      });
                    }}
                    className="text-red-500"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <button
          onClick={submit}
          disabled={isSubmitting}
          className="w-full rounded bg-blue-500 py-2 text-white disabled:bg-gray-300"
        >
          {isSubmitting ? "저장 중..." : "완료"}
        </button>
      </div>
    </div>
  );
}
