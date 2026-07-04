import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateOnboarding } from "../../api/onboarding";

const onlyDigits = (value: string) => value.replace(/\D/g, "");
const toBirthDatePayload = (value: string) => onlyDigits(value).slice(0, 8);

export default function StepVerification() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    birthDate: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const isValid =
    form.name.trim().length > 0 &&
    toBirthDatePayload(form.birthDate).length === 8 &&
    onlyDigits(form.phone).length >= 10;

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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-[420px] rounded-xl bg-white p-8 shadow">
        <p className="mb-2 text-sm font-semibold text-blue-500">Step 1</p>
        <h2 className="mb-2 text-xl font-bold">본인 정보 확인</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="이름"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="w-full rounded border px-3 py-2"
          />

          <input
            type="date"
            value={form.birthDate}
            onChange={(e) => handleChange("birthDate", e.target.value)}
            className="w-full rounded border px-3 py-2"
          />

          <input
            type="text"
            inputMode="numeric"
            placeholder="휴대전화번호 숫자만 입력"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <button
          onClick={submit}
          disabled={!isValid || isSubmitting}
          className={`mt-6 w-full rounded py-2 ${
            isValid && !isSubmitting
              ? "bg-blue-500 text-white"
              : "cursor-not-allowed bg-gray-300 text-gray-500"
          }`}
        >
          {isSubmitting ? "저장 중..." : "다음"}
        </button>
      </div>
    </div>
  );
}
