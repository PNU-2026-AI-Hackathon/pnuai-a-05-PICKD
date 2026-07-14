import { useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  CalendarDays,
  HelpCircle,
  LayoutDashboard,
  Settings,
  Sparkles,
} from "lucide-react";
import { PickdLogoIcon } from "../assets";

const navItems = [
  {
    name: "지원 대시보드",
    path: "/main",
    Icon: LayoutDashboard,
  },
  {
    name: "개인경험 정리",
    path: "/experience",
    Icon: BookOpen,
  },
  {
    name: "AI 자소서",
    path: "/ai",
    Icon: Sparkles,
  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/main") {
      return (
        location.pathname === "/main" ||
        location.pathname.startsWith("/applications/")
      );
    }

    return (
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`)
    );
  };

  const itemClass = (active: boolean) =>
    `group relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors active:scale-95 ${
      active
        ? "bg-[#EFF6FF] text-[#1D4ED8]"
        : "text-[#79859A] hover:bg-[#F6F8FB] hover:text-[#28303D]"
    }`;

  return (
    <aside className="sticky top-0 z-40 flex h-screen w-[60px] shrink-0 flex-col items-center border-r border-[#E3E8EF] bg-white py-4">
      <button
        type="button"
        onClick={() => navigate("/main")}
        className="mb-6 flex h-7 w-7 items-center justify-center"
        aria-label="Pickd 홈"
      >
        <PickdLogoIcon size={28} />
      </button>

      <nav className="flex min-h-0 flex-1 flex-col gap-1">
        {navItems.map(({ name, path, Icon }) => {
          const active = isActive(path);

          return (
            <button
              key={path}
              type="button"
              onClick={() => navigate(path)}
              className={itemClass(active)}
              data-tooltip={name}
              data-tooltip-position="right"
              aria-label={name}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
            </button>
          );
        })}

        <div className="mt-auto">
          <button
            type="button"
            onClick={() => navigate("/calendar")}
            className={itemClass(isActive("/calendar"))}
            data-tooltip="캘린더"
            data-tooltip-position="right"
            aria-label="캘린더"
          >
            <CalendarDays className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
        </div>
      </nav>

      <div className="flex flex-col gap-1 border-t border-[#E3E8EF] pt-2">
        <button
          type="button"
          onClick={() => navigate("/settings")}
          className={itemClass(isActive("/settings"))}
          data-tooltip="설정"
          data-tooltip-position="right"
          aria-label="설정"
        >
          <Settings className="h-[18px] w-[18px]" strokeWidth={2} />
        </button>

        <button
          type="button"
          onClick={() => navigate("/help")}
          className={itemClass(isActive("/help"))}
          data-tooltip="도움말"
          data-tooltip-position="right"
          aria-label="도움말"
        >
          <HelpCircle className="h-[18px] w-[18px]" strokeWidth={2} />
        </button>
      </div>
    </aside>
  );
}