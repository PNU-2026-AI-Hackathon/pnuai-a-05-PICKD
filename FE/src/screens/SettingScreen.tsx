import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
      <div className="max-w-3xl rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">설정</h1>
        <p className="mt-2 text-sm text-slate-500">
          계정 관련 설정을 관리할 수 있어요.
        </p>

        <div className="mt-8 rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">로그아웃</h2>
              <p className="mt-1 text-sm text-slate-500">
                서버에 저장된 refresh token을 비우고 access/refresh 쿠키를 삭제해요.
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="shrink-0 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
