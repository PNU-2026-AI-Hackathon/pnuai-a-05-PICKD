import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getOnboardingStatus, type OnboardingStep } from "../api/onboarding";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"
).replace(/\/$/, "");

const STEP_PATH: Record<OnboardingStep, string> = {
  NONE: "/onboarding/step1",
  TERMS: "/onboarding/verify",
  VERIFICATION: "/onboarding/step2",
  BASIC: "/onboarding/step3",
  EDUCATION: "/onboarding/step4",
  INTERESTS: "/onboarding/step5",
  PREP: "/onboarding/step5",
  COMPLETED: "/main",
};

export default function LoginScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;

    getOnboardingStatus()
      .then((user) => {
        if (ignore) return;
        navigate(STEP_PATH[user.onboardingStep] ?? "/onboarding", {
          replace: true,
        });
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, [navigate]);

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-50">
      <h1 className="mb-4 text-2xl font-bold text-blue-500">Pickd</h1>
      <p className="mb-6 text-gray-500">
        AI 기반 개인 맞춤형 취업 매니지먼트 플랫폼
      </p>

      <button
        onClick={() => {
          window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
        }}
        className="flex items-center justify-center gap-2 rounded border bg-white px-4 py-2 hover:shadow"
      >
        Google 계정으로 시작하기
      </button>
    </div>
  );
}
