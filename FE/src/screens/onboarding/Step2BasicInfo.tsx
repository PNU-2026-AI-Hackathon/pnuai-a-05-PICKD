import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateOnboarding } from "../../api/onboarding";
import { PickdLogoIcon } from "../../assets";

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
    if (!form.desiredLocations.includes(locationInput.trim())) {
      setForm((prev) => ({
        ...prev,
        desiredLocations: [...prev.desiredLocations, locationInput.trim()],
      }));
    }
    setLocationInput("");
  };

  const removeLocation = (loc: string) => {
    setForm((prev) => ({
      ...prev,
      desiredLocations: prev.desiredLocations.filter((l) => l !== loc),
    }));
  };

  const isValid =
    form.nickname.length >= 2 &&
    form.currentResidence.trim().length > 0 &&
    form.desiredLocations.length > 0;

  const handleSubmit = async () => {
    if (!isValid) return;

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

  const inputClass =
    "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20";

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      {/* Top-left logo */}
      <div className="flex items-center gap-2 px-40 py-5">
        <PickdLogoIcon size={28} />
        <span className="text-base font-bold text-gray-900">Pickd</span>
      </div>

      <div className="flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-[600px] rounded-2xl bg-white p-10 shadow-sm">
          <h1 className="mb-1 text-2xl font-bold text-gray-900">나를 소개해볼까요?</h1>
          <p className="mb-8 text-sm text-gray-400">입력할수록 더 정확한 공고를 추천받을 수 있어요.</p>

          {/* 닉네임 */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-bold text-gray-800">닉네임</label>
            <input
              placeholder="2~10자"
              value={form.nickname}
              onChange={(e) => setForm((prev) => ({ ...prev, nickname: e.target.value }))}
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-gray-400">서비스에서 표시될 이름이에요</p>
          </div>

          {/* 현재 거주지 */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-bold text-gray-800">현재 거주지</label>
            <input
              placeholder="예: 부산"
              value={form.currentResidence}
              onChange={(e) => setForm((prev) => ({ ...prev, currentResidence: e.target.value }))}
              className={inputClass}
            />
          </div>

          {/* 희망 근무 지역 */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-bold text-gray-800">희망 근무 지역</label>
            <div className="flex gap-2">
              <input
                placeholder="지역 입력 후 Enter 또는 추가"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLocation();
                  }
                }}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
              />
              <button
                type="button"
                onClick={addLocation}
                disabled={!locationInput.trim()}
                className={`shrink-0 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                  locationInput.trim()
                    ? "bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
                    : "cursor-not-allowed bg-gray-200 text-gray-400"
                }`}
              >
                추가
              </button>
            </div>
            {form.desiredLocations.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {form.desiredLocations.map((loc) => (
                  <span
                    key={loc}
                    className="flex items-center gap-1.5 rounded-full bg-[#EEF0FD] px-3 py-1 text-sm font-medium text-[#2563EB]"
                  >
                    {loc}
                    <button
                      type="button"
                      onClick={() => removeLocation(loc)}
                      className="leading-none text-[#2563EB] opacity-60 hover:opacity-100"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 상세 주소 */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-bold text-gray-800">
              상세 주소 <span className="font-normal text-gray-400">(선택)</span>
            </label>
            <input
              placeholder="상세 주소를 입력해주세요"
              value={form.detailedAddress}
              onChange={(e) => setForm((prev) => ({ ...prev, detailedAddress: e.target.value }))}
              className={inputClass}
            />
          </div>

          {/* 한 줄 소개 */}
          <div className="mb-8">
            <label className="mb-2 block text-sm font-bold text-gray-800">
              한 줄 소개 <span className="font-normal text-gray-400">(선택)</span>
            </label>
            <textarea
              placeholder="자신을 한 줄로 소개해주세요"
              value={form.intro}
              onChange={(e) => setForm((prev) => ({ ...prev, intro: e.target.value }))}
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 resize-none"
            />
          </div>

          {/* 다음 버튼 */}
          <button
            onClick={handleSubmit}
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
