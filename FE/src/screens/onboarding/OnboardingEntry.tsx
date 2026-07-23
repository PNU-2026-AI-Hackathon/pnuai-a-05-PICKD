import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getOnboardingStatus, type OnboardingStep } from "../../api/onboarding";

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

export default function OnboardingEntry() {
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;

    getOnboardingStatus()
      .then((user) => {
        if (ignore) return;
        navigate(STEP_PATH[user.onboardingStep] ?? "/onboarding/step1", {
          replace: true,
        });
      })
      .catch(() => {
        if (!ignore) navigate("/", { replace: true });
      });

    return () => {
      ignore = true;
    };
  }, [navigate]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#F8FAFC] text-sm text-[#64748B]">
      온보딩 상태를 확인하고 있어요...
    </div>
  );
}
