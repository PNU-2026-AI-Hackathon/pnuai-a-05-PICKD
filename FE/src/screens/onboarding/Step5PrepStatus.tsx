import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateOnboarding } from "../../api/onboarding";

export default function Step5PrepStatus() {
  const navigate = useNavigate();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [form, setForm] = useState({
    targetPeriod: "",
    currentStage: "",
    focusItems: [] as string[],
    hasResume: false,
    hasBaseEssay: false,
    hasPortfolio: false,
    experiences: [] as any[],
    certifications: [] as any[],
  });

  const [examInput, setExamInput] = useState("");

  const [exp, setExp] = useState({
    type: "PROJECT",
    title: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  const [editingCertIndex, setEditingCertIndex] = useState<number | null>(null);

  const [cert, setCert] = useState({
    type: "LICENSE",
    name: "",
    score: "",
    acquisitionDate: "",
  });

  const toggle = (key: string, value: string) => {
    const list = form[key as keyof typeof form] as string[];

    if (list.includes(value)) {
      setForm({
        ...form,
        [key]: list.filter((v) => v !== value),
      });
    } else {
      setForm({
        ...form,
        [key]: [...list, value],
      });
    }
  };

  const addExperience = () => {
    if (!exp.title) return alert("경험 제목 입력");

    if (editingIndex !== null) {
      const updated = [...form.experiences];
      updated[editingIndex] = exp;

      setForm({ ...form, experiences: updated });
      setEditingIndex(null);
    } else {
      setForm({
        ...form,
        experiences: [...form.experiences, exp],
      });
    }

    setExp({
      type: "PROJECT",
      title: "",
      description: "",
      startDate: "",
      endDate: "",
    });
  };

  const addCert = () => {
    if (!cert.name) return alert("자격증 이름 입력");

    if (editingCertIndex !== null) {
      const updated = [...form.certifications];
      updated[editingCertIndex] = cert;

      setForm({ ...form, certifications: updated });
      setEditingCertIndex(null);
    } else {
      setForm({
        ...form,
        certifications: [...form.certifications, cert],
      });
    }

    setCert({
      type: "LICENSE",
      name: "",
      score: "",
      acquisitionDate: "",
    });
  };

  const submit = async () => {
    if (!form.targetPeriod || !form.currentStage) {
      return alert("필수 항목 입력");
    }

    try {
      await updateOnboarding({
        targetPeriod: form.targetPeriod,
        currentStage: form.currentStage,
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
    }
  };
  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow w-[500px] max-h-screen overflow-y-auto">
        <h2 className="text-xl font-bold mb-6">준비 상태</h2>
        {/* 목표 기간 */}
        <input
          placeholder="지원 예정 시기 (예: 6개월)"
          value={form.targetPeriod}
          onChange={(e) => setForm({ ...form, targetPeriod: e.target.value })}
          className="border p-2 mb-3 w-full"
        />
        {/* 현재 단계 */}
        <input
          placeholder="현재 준비 단계"
          value={form.currentStage}
          onChange={(e) => setForm({ ...form, currentStage: e.target.value })}
          className="border p-2 mb-3 w-full"
        />
        {/* 집중 준비 */}
        <h3 className="mb-2">집중 준비 항목</h3>
        <div className="flex gap-2 flex-wrap mb-4">
          {["서류", "코딩테스트", "면접"].map((i) => (
            <button
              key={i}
              onClick={() => toggle("focusItems", i)}
              className={`px-3 py-1 border rounded ${
                form.focusItems.includes(i) ? "bg-blue-500 text-white" : ""
              }`}
            >
              {i}
            </button>
          ))}
        </div>
        {/* 보유 여부 */}
        <div className="flex gap-4 mb-4">
          {[
            ["hasResume", "이력서"],
            ["hasBaseEssay", "자소서"],
            ["hasPortfolio", "포트폴리오"],
          ].map(([key, label]) => (
            <label key={key}>
              <input
                type="checkbox"
                onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
              />
              {label}
            </label>
          ))}
        </div>
        {/* 경험 */}
        <h3>경험 추가</h3>
        <select
          value={exp.type}
          onChange={(e) => setExp({ ...exp, type: e.target.value })}
          className="border p-2 mb-2 w-full"
        >
          <option value="PROJECT">프로젝트</option>
          <option value="INTERN">인턴</option>
          <option value="ACTIVITY">대외활동</option>
          <option value="AWARD">수상</option>
        </select>
        <input
          placeholder="제목"
          value={exp.title}
          onChange={(e) => setExp({ ...exp, title: e.target.value })}
          className="border p-2 mb-2 w-full"
        />
        <input
          placeholder="설명"
          value={exp.description}
          onChange={(e) => setExp({ ...exp, description: e.target.value })}
          className="border p-2 mb-2 w-full"
        />
        <button onClick={addExperience} className="bg-gray-200 px-3 py-1 mb-4">
          경험 추가
        </button>
        <h3 className="mt-4 mb-2">추가된 경험</h3>
        <div className="space-y-2 mb-4">
          {form.experiences.map((item, idx) => (
            <div
              key={idx}
              className="border p-3 rounded flex justify-between items-center"
            >
              <div
                className="cursor-pointer"
                onClick={() => {
                  setExp(item);
                  setEditingIndex(idx);
                }}
              >
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-gray-500">
                  {item.startDate} ~ {item.endDate}
                </p>
              </div>

              <button
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
        {/* 자격증 */}
        <h3>자격증 / 어학</h3>
        <select
          value={cert.type}
          onChange={(e) => setCert({ ...cert, type: e.target.value })}
          className="border p-2 mb-2 w-full"
        >
          <option value="LICENSE">자격증</option>
          <option value="LANGUAGE">어학</option>
        </select>
        <input
          placeholder="이름"
          value={cert.name}
          onChange={(e) => setCert({ ...cert, name: e.target.value })}
          className="border p-2 mb-2 w-full"
        />
        <input
          placeholder="점수 (선택)"
          value={cert.score}
          onChange={(e) => setCert({ ...cert, score: e.target.value })}
          className="border p-2 mb-2 w-full"
        />
        <button onClick={addCert} className="bg-gray-200 px-3 py-1 mb-4">
          추가
        </button>
        <h3 className="mt-4 mb-2">추가된 자격증 / 어학</h3>
        <div className="space-y-2 mb-4">
          {form.certifications.map((item, idx) => (
            <div
              key={idx}
              className="border p-3 rounded flex justify-between items-center"
            >
              <div
                className="cursor-pointer"
                onClick={() => {
                  setCert(item);
                  setEditingCertIndex(idx);
                }}
              >
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-gray-500">
                  {item.type === "LICENSE" ? "자격증" : "어학"}
                  {item.score && ` / 점수: ${item.score}`}
                </p>
              </div>

              <button
                onClick={() => {
                  setForm({
                    ...form,
                    certifications: form.certifications.filter(
                      (_, i) => i !== idx,
                    ),
                  });
                }}
                className="text-red-500"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={submit}
          className="w-full bg-blue-500 text-white py-2 rounded"
        >
          완료
        </button>
      </div>
    </div>
  );
}
