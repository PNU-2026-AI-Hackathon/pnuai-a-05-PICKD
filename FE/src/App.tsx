import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import LoginScreen from "./screens/LoginScreen";
import MainScreen from "./screens/MainScreen";
import ExperienceScreen from "./screens/ExperienceScreen";
import AiScreen from "./screens/AiScreen";
import SettingScreen from "./screens/SettingScreen";
import HelpScreen from "./screens/HelpScrenn.tsx";
import CalendarScreen from "./screens/CalenderScreen.tsx";
import ApplicationJobDetailPage from "./screens/ApplicationJobDetailPage";

import OnboardingEntry from "./screens/onboarding/OnboardingEntry.tsx";
import Step1Terms from "./screens/onboarding/Step1Terms.tsx";
import StepVerification from "./screens/onboarding/StepVerification.tsx";
import Step2BasicInfo from "./screens/onboarding/Step2BasicInfo.tsx";
import Step3Education from "./screens/onboarding/Step3Education.tsx";
import Step4Interest from "./screens/onboarding/Step4Interest.tsx";
import Step5PrepStatus from "./screens/onboarding/Step5PrepStatus.tsx";
import OnboardingComplete from "./screens/onboarding/OnboardingComplete.tsx";

import { ApplicationProvider } from "./context/ApplicationContext";

function App() {
  return (
    <ApplicationProvider>
      <BrowserRouter>
        <Routes>
          {/* 로그인 */}
          <Route path="/" element={<LoginScreen />} />

          {/* 온보딩 진입 */}
          <Route path="/onboarding" element={<OnboardingEntry />} />

          {/* 온보딩 단계 */}
          <Route path="/onboarding/step1" element={<Step1Terms />} />
          <Route path="/onboarding/verify" element={<StepVerification />} />
          <Route path="/onboarding/step2" element={<Step2BasicInfo />} />
          <Route path="/onboarding/step3" element={<Step3Education />} />
          <Route path="/onboarding/step4" element={<Step4Interest />} />
          <Route path="/onboarding/step5" element={<Step5PrepStatus />} />
          <Route path="/onboarding/complete" element={<OnboardingComplete />} />

          <Route
            path="/applications/:applicationId"
            element={<ApplicationJobDetailPage />}
          />

          {/* 메인 영역 */}
          <Route element={<Layout />}>
            <Route path="/main" element={<MainScreen />} />
            <Route path="/experience" element={<ExperienceScreen />} />
            <Route path="/ai" element={<AiScreen />} />
            <Route path="/calendar" element={<CalendarScreen />} />
            <Route path="/settings" element={<SettingScreen />} />
            <Route path="/help" element={<HelpScreen />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ApplicationProvider>
  );
}

export default App;
