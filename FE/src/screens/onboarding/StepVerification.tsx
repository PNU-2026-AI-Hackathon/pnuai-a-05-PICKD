import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateOnboarding } from "../../api/onboarding";
import { PickdLogoIcon } from "../../assets";

const onlyDigits = (value: string) => value.replace(/\D/g, "");
const toBirthDatePayload = (value: string) => onlyDigits(value).slice(0, 8);

export default function StepVerification() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    birthDate: "",
    phone: "",
    code: "",
  });
  const [sent, setSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const sendCode = () => {
    if (!form.phone) return;
    setSent(true);
  };

  const verifyCode = () => {
    if (form.code.length < 4) return;
    setVerified(true);
  };

  const isValid =
    form.name.trim().length > 0 &&
    toBirthDatePayload(form.birthDate).length === 8 &&
    verified;

  const submit = async () => {
    if (!isValid || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await updateOnboarding({
        name: form.name.trim(),
        birthDate: toBirthDatePayload(form.birthDate),
        phone: onlyDigits(form.phone),
      });
      navigate("/onboarding/step2");
    } catch (e) {
      console.error(e);
      alert("본인 정보 저장에 실패했어요. 입력값을 다시 확인해주세요.");
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
          <h1 className="mb-1 text-2xl font-bold text-gray-900">
            잠깐, 본인 확인이 필요해요
          </h1>
          <p className="mb-8 text-sm text-gray-400">꼭 필요한 것만 물어볼게요.</p>

          {/* 이름 */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-bold text-gray-800">이름</label>
            <input
              type="text"
              placeholder="실명을 입력해주세요"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </div>

          {/* 생년월일 */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-bold text-gray-800">생년월일</label>
            <input
              type="date"
              value={form.birthDate}
              onChange={(e) => handleChange("birthDate", e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </div>

          {/* 휴대전화번호 */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-bold text-gray-800">휴대전화번호</label>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                placeholder="숫자만 입력해주세요"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                disabled={verified}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 disabled:bg-gray-50 disabled:text-gray-400"
              />
              <button
                type="button"
                onClick={sendCode}
                disabled={!form.phone || verified}
                className={`shrink-0 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                  form.phone && !verified
                    ? "bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
                    : "cursor-not-allowed bg-gray-200 text-gray-400"
                }`}
              >
                {sent ? "재전송" : "인증요청"}
              </button>
            </div>
          </div>

          {/* 인증번호 */}
          {sent && !verified && (
            <div className="mb-6">
              <label className="mb-2 block text-sm font-bold text-gray-800">인증번호</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="인증번호를 입력해주세요"
                  value={form.code}
                  onChange={(e) => handleChange("code", e.target.value)}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
                />
                <button
                  type="button"
                  onClick={verifyCode}
                  disabled={form.code.length < 4}
                  className={`shrink-0 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                    form.code.length >= 4
                      ? "bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
                      : "cursor-not-allowed bg-gray-200 text-gray-400"
                  }`}
                >
                  확인
                </button>
              </div>
            </div>
          )}

          {/* 인증 완료 */}
          {verified && (
            <div className="mb-6 flex items-center gap-1.5 text-sm font-medium text-[#2563EB]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              인증이 완료되었어요
            </div>
          )}

          {/* 다음 버튼 */}
          <button
            onClick={submit}
            disabled={!isValid || isSubmitting}
            className={`w-full rounded-xl py-4 text-base font-semibold transition-colors ${
              isValid && !isSubmitting
                ? "bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
                : "cursor-not-allowed bg-gray-200 text-gray-400"
            }`}
          >
            {isSubmitting ? "저장 중..." : "다음"}
          </button>
        </div>
      </div>
    </div>
  );
}
