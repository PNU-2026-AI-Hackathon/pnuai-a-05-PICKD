import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout() {
  return (
    <div className="flex h-screen bg-[#FBFCFE] font-sans text-[#28303D]">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
