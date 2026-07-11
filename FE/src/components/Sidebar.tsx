import { useNavigate, useLocation } from "react-router-dom";
import {
  PickdLogoIcon,
  DashboardIcon,
  PortfolioIcon,
  DocumentIcon,
  SettingsIcon,
  HelpIcon,
  CalendarIcon,
} from "../assets";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isSettingsActive = location.pathname === "/settings";
  const isHelpActive = location.pathname === "/help";

  const menuItems = [
    { name: "지원 대시보드", path: "/main", Icon: DashboardIcon, size: 21 },
    {
      name: "개인경험 정리",
      path: "/experience",
      Icon: PortfolioIcon,
      size: 24,
    },
    { name: "AI 자소서", path: "/ai", Icon: DocumentIcon, size: 22 },
    { name: "캘린더", path: "/calendar", Icon: CalendarIcon, size: 21 },
  ];

  return (
    <nav className="sticky top-0 z-40 flex h-screen min-h-screen w-[60px] shrink-0 flex-col items-center border-r border-gray-200 bg-white py-6">
      <div className="mb-7 cursor-pointer" onClick={() => navigate("/main")}>
        <PickdLogoIcon size={32} />
      </div>

      <div className="flex-1 flex flex-col gap-3">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all ${
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              }`}
              data-tooltip={item.name}
              data-tooltip-position="right"
              aria-label={item.name}
            >
              <item.Icon
                size={item.size}
                color={isActive ? "#2563EB" : "#94A3B8"}
              />
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 mb-2">
        <button
          data-tooltip="설정"
          data-tooltip-position="right"
          aria-label="설정"
          onClick={() => navigate("/settings")}
          className={`group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all active:scale-95 ${
            isSettingsActive
              ? "bg-blue-100 text-blue-600"
              : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
          }`}
        >
          <SettingsIcon
            size={23}
            color={isSettingsActive ? "#2563EB" : "#94A3B8"}
          />
        </button>

        <button
          data-tooltip="도움말"
          data-tooltip-position="right"
          aria-label="도움말"
          onClick={() => navigate("/help")}
          className={`group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all active:scale-95 ${
            isHelpActive
              ? "bg-blue-100 text-blue-600"
              : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
          }`}
        >
          <HelpIcon size={23} color={isHelpActive ? "#2563EB" : "#94A3B8"} />
        </button>
      </div>
    </nav>
  );
}
