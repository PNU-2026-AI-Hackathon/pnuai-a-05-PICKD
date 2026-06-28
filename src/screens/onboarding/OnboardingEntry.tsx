import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OnboardingEntry() {
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/onboarding/status", {
      credentials: "include",
    })
      .then((res) => res.text())
      .then((step) => {
        const cleanStep = step.trim();

        const map: any = {
          NONE: "/onboarding/step1",
          TERMS: "/onboarding/verify",
          VERIFICATION: "/onboarding/step2",
          BASIC: "/onboarding/step3",
          EDUCATION: "/onboarding/step4",
          INTERESTS: "/onboarding/step5",
          COMPLETED: "/main",
        };

        navigate(map[cleanStep] || "/onboarding/step1");
      });
  }, []);

  return <div>Loading...</div>;
}
