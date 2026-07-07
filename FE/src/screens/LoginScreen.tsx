import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getOnboardingStatus, type OnboardingStep } from "../api/onboarding";
import { PickdLogoIcon } from "../assets";

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

const features = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="8" y1="14" x2="10" y2="14" />
        <line x1="8" y1="17" x2="14" y2="17" />
      </svg>
    ),
    title: "공고·일정을 한눈에",
    desc: "마감·전형 일정을 놓치지 않게",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    title: "경험은 한 번만 정리",
    desc: "자소서·이력서에 그대로 재사용",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 0 1 0 20" />
        <path d="M12 2a10 10 0 0 0 0 20" strokeDasharray="3 3" />
        <path d="M8 9l3 3-3 3" />
        <path d="M13 12h3" />
      </svg>
    ),
    title: "AI 자소서 초안까지",
    desc: "내 경험으로 초안을 빠르게",
  },
];

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F6FA] px-4">
      {/* Logo */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#E8EAFB]">
        <PickdLogoIcon size={48} />
      </div>

      {/* Headline */}
      <h1 className="mb-3 text-center text-3xl font-bold leading-snug text-gray-900">
        흩어진 취업 준비,
        <br />
        여기서 <span className="text-[#2563EB]">픽.</span>
      </h1>

      {/* Subheadline */}
      <p className="mb-8 text-center text-sm text-gray-400">
        공고·일정·경험·자소서를 한 곳에서. 1분이면 시작해요.
      </p>

      {/* Google Login Button */}
      <button
        onClick={() => {
          window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
        }}
        className="mb-10 flex w-full max-w-sm items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-6 py-4 text-base font-medium text-gray-700 shadow-sm transition hover:shadow-md"
      >
        <svg width="20" height="20" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-7.9l-6.6 5.1C9.6 39.6 16.3 44 24 44z"/>
          <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.3 4-4.2 5.2l6.2 5.2C36.9 40.1 44 35 44 24c0-1.3-.1-2.6-.4-3.9z"/>
        </svg>
        Google로 계속하기
      </button>

      <div className="grid w-full max-w-2xl grid-cols-3 gap-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="flex flex-col items-center rounded-2xl bg-white px-4 py-6 text-center shadow-sm"
          >
            <div className="mb-3 text-[#2563EB]">{f.icon}</div>
            <p className="mb-1 text-sm font-semibold text-gray-800">{f.title}</p>
            <p className="text-xs text-gray-400">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
