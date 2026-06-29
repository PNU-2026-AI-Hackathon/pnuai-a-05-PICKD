import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:8080/api/onboarding/status", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.text();
      })
      .then(() => {
        navigate("/onboarding");
      })
      .catch(() => {});
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <h1 className="text-2xl font-bold text-blue-500 mb-4">Pickd</h1>
      <p className="text-gray-500 mb-6">
        AI 기반 개인 맞춤형 취업 매니지먼트 플랫폼
      </p>

      <button
        onClick={() => {
          window.location.href =
            "http://localhost:8080/oauth2/authorization/google";
        }}
        className="flex items-center justify-center gap-2 border px-4 py-2 rounded hover:shadow"
      >
        Google 계정으로 시작하기
      </button>
    </div>
  );
}
