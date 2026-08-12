import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { logout } from "../api/auth";

export default function SettingScreen() {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      await logout();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoggingOut(false);
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="min-h-full bg-[#F8FAFC] px-10 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white">
            <Icon
              icon="mdi:cog-outline"
              className="text-[22px] text-[#64748B]"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">설정</h1>
            <p className="mt-0.5 text-sm text-[#64748B]">
              계정 관련 설정을 관리할 수 있어요.
            </p>
          </div>
        </div>

        <section className="mt-8">
          <h2 className="mb-3 px-1 text-[13px] font-semibold tracking-wide text-[#94A3B8]">
            계정
          </h2>

          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF]">
                  <Icon
                    icon="mdi:logout"
                    className="text-[20px] text-[#2563EB]"
                  />
                </div>
                <div className="pt-2 text-base font-semibold text-[#0F172A]">
                  로그아웃
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="shrink-0 rounded-xl bg-[#0F172A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
