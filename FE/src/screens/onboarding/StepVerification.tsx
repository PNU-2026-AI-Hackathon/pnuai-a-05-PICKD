import { useState } from "react";
import { useNavigate } from "react-router-dom";

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

  const handleChange = (key: string, value: string) => {
    setForm({ ...form, [key]: value });
  };

  const sendCode = () => {
    if (!form.phone) return;
    alert("인증번호가 전송되었습니다 (데모)");
    setSent(true);
  };

  const verifyCode = () => {
    if (form.code.length < 4) return;
    setVerified(true);
  };

  const submit = async () => {
    if (!verified) return;

    await fetch("http://localhost:8080/api/onboarding/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: form.name,
        birthDate: form.birthDate,
        phone: form.phone,
      }),
    });

    navigate("/onboarding/step2");
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow w-[400px]">
        <h2 className="text-xl font-bold mb-6">본인 인증</h2>

        <div className="space-y-4">
          {/* 이름 */}
          <input
            type="text"
            placeholder="이름"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />

          {/* 생년월일 */}
          <input
            type="date"
            value={form.birthDate}
            onChange={(e) => handleChange("birthDate", e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />

          {/* 전화번호 */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="휴대전화번호"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="flex-1 border px-3 py-2 rounded"
            />
            <button
              onClick={sendCode}
              className="bg-blue-500 text-white px-3 rounded"
            >
              인증요청
            </button>
          </div>

          {/* 인증번호 */}
          {sent && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="인증번호 입력"
                value={form.code}
                onChange={(e) => handleChange("code", e.target.value)}
                className="flex-1 border px-3 py-2 rounded"
              />
              <button
                onClick={verifyCode}
                className="bg-green-500 text-white px-3 rounded"
              >
                확인
              </button>
            </div>
          )}

          {/* 인증 상태 */}
          {verified && (
            <p className="text-green-500 text-sm">
              ✔ 인증이 완료되었습니다
            </p>
          )}
        </div>

        {/* 버튼 */}
        <button
          onClick={submit}
          disabled={!verified || !form.name || !form.birthDate}
          className={`mt-6 w-full py-2 rounded ${
            verified
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