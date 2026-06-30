import { useState, useEffect } from "react";
import MainCalendar from "../components/dashboard/calender/MainCalender";
import SideDetailPanel from "../components/dashboard/calender/SideDetail/SideDetailPanel";
import { Icon } from "@iconify/react";
import { useApplication } from "../context/ApplicationContext";

const CalendarScreen = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { applications, loadData } = useApplication();

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return (
    <div className="relative flex h-screen w-full bg-gray-50 overflow-hidden">
      <div className="flex-1 overflow-auto">
        <MainCalendar applications={applications} />

        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-4 right-4 z-10 p-2 bg-white rounded-md shadow-md border border-gray-200 hover:bg-gray-50 text-gray-600 transition-all"
          >
            <Icon icon="lucide:sidebar-open" className="w-5 h-5" />
          </button>
        )}
      </div>

      {isSidebarOpen && (
        <div
          className="absolute inset-0 bg-black/20 z-20 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div
        className={`absolute top-0 right-0 h-full w-[400px] bg-white shadow-xl z-30 flex flex-col overflow-y-auto transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <span className="font-medium text-gray-700">상세 정보</span>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <Icon icon="lucide:x" className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1">
          <SideDetailPanel applications={applications} />
        </div>
      </div>
    </div>
  );
};

export default CalendarScreen;
