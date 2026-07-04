import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateOnboarding } from "../../api/onboarding";

export default function Step2BasicInfo() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nickname: "",
    intro: "",
    currentResidence: "",
    desiredLocations: [] as string[],
    detailedAddress: "",
  });

  const [locationInput, setLocationInput] = useState("");

  const addLocation = () => {
    if (!locationInput.trim()) return;

    if (!form.desiredLocations.includes(locationInput)) {
      setForm({
        ...form,
        desiredLocations: [...form.desiredLocations, locationInput],
      });
    }

    setLocationInput("");
  };

  const removeLocation = (loc: string) => {
    setForm({
      ...form,
      desiredLocations: form.desiredLocations.filter((l) => l !== loc),
    });
  };

  const handleSubmit = async () => {
    if (form.nickname.length < 2) return alert("닉네임 2자 이상");
    if (!form.currentResidence) return alert("현재 거주지 입력");
    if (form.desiredLocations.length === 0) return alert("희망 지역 입력");

    try {
      await updateOnboarding({
        nickname: form.nickname,
        intro: form.intro,
        currentResidence: form.currentResidence,
        desiredLocations: form.desiredLocations,
        detailedAddress: form.detailedAddress,
      });

      navigate("/onboarding/step3");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow w-[420px]">
        <p className="mb-2 text-sm font-semibold text-blue-500">Step 2</p>
        <h2 className="text-xl font-bold mb-6">기본 정보 입력</h2>
        {/* 닉네임 */}
        <input
          placeholder="닉네임"
          value={form.nickname}
          onChange={(e) => setForm({ ...form, nickname: e.target.value })}
          className="w-full border px-3 py-2 rounded mb-3"
        />

        {/* 현재 거주지 */}
        <input
          placeholder="현재 거주 지역 (예: 부산)"
          value={form.currentResidence}
          onChange={(e) =>
            setForm({ ...form, currentResidence: e.target.value })
          }
          className="w-full border px-3 py-2 rounded mb-3"
        />

        {/* 희망 근무 지역 (입력 + 태그) */}
        <div className="mb-3">
          <input
            placeholder="희망 근무 지역 입력 후 Enter"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addLocation();
              }
            }}
            className="w-full border px-3 py-2 rounded"
          />

          <div className="flex flex-wrap gap-2 mt-2">
            {form.desiredLocations.map((loc, idx) => (
              <span
                key={idx}
                className="bg-blue-100 px-2 py-1 rounded text-sm flex items-center gap-1"
              >
                {loc}
                <button onClick={() => removeLocation(loc)}>✕</button>
              </span>
            ))}
          </div>
        </div>

        {/* 상세 주소 */}
        <input
          placeholder="상세 주소 (선택)"
          value={form.detailedAddress}
          onChange={(e) =>
            setForm({ ...form, detailedAddress: e.target.value })
          }
          className="w-full border px-3 py-2 rounded mb-3"
        />

        {/* 한 줄 소개 */}
        <textarea
          placeholder="한 줄 소개 (선택)"
          value={form.intro}
          onChange={(e) => setForm({ ...form, intro: e.target.value })}
          className="w-full border px-3 py-2 rounded mb-3"
        />

        <button
          onClick={handleSubmit}
          className="w-full bg-blue-500 text-white py-2 rounded"
        >
          다음
        </button>
      </div>
    </div>
  );
}
