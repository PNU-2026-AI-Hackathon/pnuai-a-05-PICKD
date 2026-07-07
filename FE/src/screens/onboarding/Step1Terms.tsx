import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateOnboarding } from "../../api/onboarding";
import { PickdLogoIcon } from "../../assets";

const TERMS = [
  { key: "marketingAgreed", label: "만 14세 이상이에요", required: true },
  { key: "serviceAgreed", label: "이용약관 동의", required: true },
  { key: "privacyAgreed", label: "개인정보 수집·이용 동의", required: true },
  { key: "pushAgreed", label: "합격에 도움되는 공고·일정 소식 받기", required: false },
] as const;

type FormKey = "serviceAgreed" | "privacyAgreed" | "marketingAgreed" | "pushAgreed";

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
        checked
          ? "border-[#2563EB] bg-[#2563EB]"
          : "border-gray-300 bg-white"
      }`}
    >
      {checked && (
        <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
          <path d="M1 3.5L4 6.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

export default function Step1Terms() {
  const navigate = useNavigate();

  const [form, setForm] = useState<Record<FormKey, boolean>>({
    serviceAgreed: false,
    privacyAgreed: false,
    marketingAgreed: false,
    pushAgreed: false,
  });

  const allChecked = TERMS.every((t) => form[t.key]);
  const requiredChecked = TERMS.filter((t) => t.required).every((t) => form[t.key]);

  const handleChange = (key: FormKey) => {
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAll = () => {
    const value = !allChecked;
    setForm({ serviceAgreed: value, privacyAgreed: value, marketingAgreed: value, pushAgreed: value });
  };

  const submit = async () => {
    if (!requiredChecked) return;
    try {
      await updateOnboarding(form);
      navigate("/onboarding/verify");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFC]">
      {/* Top-left logo */}
      <div className="flex items-center gap-2 px-40 py-5">
        <PickdLogoIcon size={28} />
        <span className="text-base font-bold text-gray-900">Pickd</span>
      </div>

      {/* Center card */}
      <div className="flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[600px] rounded-2xl bg-white p-10 shadow-sm">
          {/* Header */}
          <p className="mb-2 text-sm font-semibold text-[#2563EB]">시작하기 전에</p>
          <h1 className="mb-8 text-2xl font-bold leading-snug text-gray-900">
            서비스 이용을 위해
            <br />
            약관에 동의해 주세요
          </h1>

          {/* 전체 동의 */}
          <button
            type="button"
            onClick={handleAll}
            className={`mb-5 flex w-full items-center gap-3 border ${
              allChecked ? "border-[#2563EB] bg-[#EEF0FD]" : "border-gray-300 bg-[#F3F4F8]"
            } rounded-xl px-5 py-4 text-left transition-colors`}
          >
            <Checkbox checked={allChecked} onChange={handleAll} />
            <span className="font-semibold text-gray-800 text-sm">전체 동의할게요</span>
          </button>

          {/* 개별 항목 */}
          <div className="space-y-4 px-1">
            {TERMS.map((t) => (
              <div key={t.key}>
                <button
                  type="button"
                  onClick={() => handleChange(t.key)}
                  className="flex w-full items-center gap-3 text-left"
                >
                  <Checkbox checked={form[t.key]} onChange={() => handleChange(t.key)} />
                  <span className="text-sm text-gray-700">
                    <span className={`mr-3 font-semibold ${t.required ? "text-[#2563EB]" : "text-gray-400"}`}>
                      {t.required ? "[필수]" : "[선택]"}
                    </span>
                    {t.label}
                  </span>
                </button>
                {t.key === "pushAgreed" && form.pushAgreed && (
                  <p className="ml-14 mt-3 rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-500">
                    관심 직무의 새 공고, 마감 임박 알림, 채용 설명회 소식을 보내드려요. 언제든 끌 수 있어요.
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* 다음 버튼 */}
          <button
            onClick={submit}
            disabled={!requiredChecked}
            className={`mt-10 w-full rounded-xl py-4 text-base font-semibold transition-colors ${
              requiredChecked
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
