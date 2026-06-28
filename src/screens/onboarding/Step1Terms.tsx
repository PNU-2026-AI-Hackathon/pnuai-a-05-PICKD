import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateOnboarding } from "../../api/onboarding";

export default function Step1Terms() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    serviceAgreed: false,
    privacyAgreed: false,
    marketingAgreed: false,
    pushAgreed: false,
  });

  const allChecked =
    form.serviceAgreed &&
    form.privacyAgreed &&
    form.marketingAgreed &&
    form.pushAgreed;

  const requiredChecked = form.serviceAgreed && form.privacyAgreed;

  const handleChange = (key: string) => {
    setForm({ ...form, [key]: !form[key as keyof typeof form] });
  };

  const handleAll = () => {
    const value = !allChecked;
    setForm({
      serviceAgreed: value,
      privacyAgreed: value,
      marketingAgreed: value,
      pushAgreed: value,
    });
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
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow w-[400px]">
        <h2 className="text-xl font-bold mb-6">약관 동의</h2>

        {/* 전체 동의 */}
        <div className="mb-4 border-b pb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={allChecked} onChange={handleAll} />
            <span className="font-semibold">전체 동의</span>
          </label>
        </div>

        {/* 개별 동의 */}
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.serviceAgreed}
              onChange={() => handleChange("serviceAgreed")}
            />
            <span>
              <span className="text-red-500">[필수]</span> 서비스 이용약관 동의
            </span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.privacyAgreed}
              onChange={() => handleChange("privacyAgreed")}
            />
            <span>
              <span className="text-red-500">[필수]</span> 개인정보 수집·이용
              동의
            </span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.marketingAgreed}
              onChange={() => handleChange("marketingAgreed")}
            />
            <span>
              <span className="text-gray-400">[선택]</span> 마케팅 정보 수신
              동의
            </span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.pushAgreed}
              onChange={() => handleChange("pushAgreed")}
            />
            <span>
              <span className="text-gray-400">[선택]</span> 푸시 알림 수신 동의
            </span>
          </label>
        </div>

        {/* 버튼 */}
        <button
          onClick={submit}
          disabled={!requiredChecked}
          className={`mt-6 w-full py-2 rounded ${
            requiredChecked
              ? "bg-blue-500 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          다음
        </button>
      </div>
    </div>
  );
}
