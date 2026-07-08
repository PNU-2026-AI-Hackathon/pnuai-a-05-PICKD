import { useNavigate, useLocation } from "react-router-dom";
import {PickdLogoIcon, DashboardIcon, PortfolioIcon, DocumentIcon, SettingsIcon, HelpIcon, CalendarIcon } from "../assets";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isSettingsActive = location.pathname === "/settings";
  const isHelpActive = location.pathname === "/help";

  const menuItems = [
    { name: "지원 대시보드", path: "/main", Icon: DashboardIcon, size: 21 },
    { name: "개인경험 정리", path: "/experience", Icon: PortfolioIcon, size: 24 },
    { name: "AI 자소서", path: "/ai", Icon: DocumentIcon, size: 22 },
    { name: "캘린더", path: "/calendar", Icon: CalendarIcon, size: 21 },
  ];

  return (
    <nav className="w-[60px] min-h-screen bg-white border-r border-gray-200 flex flex-col items-center py-6 sticky top-0 h-screen">
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
              title={item.name}
            >
              <item.Icon
                size={item.size}
                color={isActive ? "#2563EB" : "#94A3B8"}
              />

              <span className="absolute left-16 scale-0 group-hover:scale-100 transition-all bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
                {item.name}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 mb-2">
        <button
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
          <span className="absolute left-16 scale-0 group-hover:scale-100 transition-all bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">설정</span>
        </button>

        <button
          onClick={() => navigate("/help")}
          className={`group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all active:scale-95 ${
            isHelpActive
              ? "bg-blue-100 text-blue-600"
              : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
          }`}
          title="도움말"
        >
          <HelpIcon
            size={23}
            color={isHelpActive ? "#2563EB" : "#94A3B8"}
          />
          <span className="absolute left-16 scale-0 group-hover:scale-100 transition-all bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">도움말</span>
        </button>
      </div>
    </nav>
  );
}


