import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateOnboarding } from "../../api/onboarding";

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

  const addKeyword = () => {
    if (!keywordInput.trim()) return;

    if (!form.keywords.includes(keywordInput)) {
      setForm({
        ...form,
        keywords: [...form.keywords, keywordInput],
      });
    }

    setKeywordInput("");
  };

  const submit = async () => {
    if (!form.employmentType) return alert("고용 형태 필수");
    if (form.industries.length === 0) return alert("산업 선택");
    if (form.jobGroups.length === 0) return alert("직무 선택");
    if (form.companyTypes.length === 0) return alert("기업 유형 선택");
    if (form.keywords.length === 0) return alert("키워드 입력");

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

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow w-[500px] overflow-y-auto max-h-screen">
        <p className="mb-2 text-sm font-semibold text-blue-500">Step 4</p>
        <h2 className="text-xl font-bold mb-6">관심 분야 설정</h2>

        {/* 고용 형태 */}
        <h3>고용 형태 *</h3>
        <div className="flex gap-2 mb-4">
          {["FULL_TIME", "INTERN"].map((type) => (
            <button
              key={type}
              onClick={() => setForm({ ...form, employmentType: type })}
              className={`px-3 py-1 border rounded ${
                form.employmentType === type ? "bg-blue-500 text-white" : ""
              }`}
            >
              {type === "FULL_TIME" ? "정규직" : "인턴"}
            </button>
          ))}
        </div>

        {/* 산업 */}
        <h3>관심 산업 *</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {["IT", "금융", "제조", "마케팅"].map((item) => (
            <button
              key={item}
              onClick={() => toggle("industries", item)}
              className={`px-3 py-1 border rounded ${
                form.industries.includes(item) ? "bg-blue-500 text-white" : ""
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* 직무 */}
        <h3>직무 *</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {["개발", "기획", "디자인"].map((item) => (
            <button
              key={item}
              onClick={() => toggle("jobGroups", item)}
              className={`px-3 py-1 border rounded ${
                form.jobGroups.includes(item) ? "bg-blue-500 text-white" : ""
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* 기업 유형 */}
        <h3>기업 유형 *</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {["대기업", "중견기업", "스타트업"].map((item) => (
            <button
              key={item}
              onClick={() => toggle("companyTypes", item)}
              className={`px-3 py-1 border rounded ${
                form.companyTypes.includes(item) ? "bg-blue-500 text-white" : ""
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* 키워드 */}
        <h3>키워드 *</h3>
        <input
          placeholder="Enter로 추가"
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addKeyword();
            }
          }}
          className="border p-2 w-full"
        />
        <div className="flex flex-wrap gap-2 mt-2 mb-4">
          {form.keywords.map((k, i) => (
            <span key={i} className="bg-blue-100 px-2 py-1 rounded">
              {k}
            </span>
          ))}
        </div>

        {/* 목표 기업 */}
        <input
          placeholder="목표 기업"
          value={form.targetCompany}
          onChange={(e) => setForm({ ...form, targetCompany: e.target.value })}
          className="border p-2 w-full mb-3"
        />

        {/* 연봉 */}
        <select
          value={form.salaryRange}
          onChange={(e) => setForm({ ...form, salaryRange: e.target.value })}
          className="border p-2 w-full mb-3"
        >
          <option value="">연봉 선택</option>
          <option value="3000">3000+</option>
          <option value="4000">4000+</option>
          <option value="5000">5000+</option>
        </select>

        <button
          onClick={submit}
          className="w-full bg-blue-500 text-white py-2 rounded"
        >
          다음
        </button>
      </div>
    </div>
  );
}
