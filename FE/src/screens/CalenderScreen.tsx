import { useState, useEffect } from "react";
import MainCalendar from "../components/dashboard/calender/MainCalender";
import SideDetailPanel from "../components/dashboard/calender/SideDetail/SideDetailPanel";
import { Icon } from "@iconify/react";
import { useApplication } from "../context/ApplicationContext";

const CalendarScreen = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { applications, loadData } = useApplication();

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return (
    <div className="relative flex h-screen w-full bg-gray-50 overflow-hidden">
      <div className="flex-1 overflow-auto">
        <MainCalendar
          applications={applications}
          selectedDate={selectedDate}
          onSelectedDateChange={setSelectedDate}
        />
      </div>

      {isSidebarOpen && (
        <div
          className="absolute inset-0 bg-transparent z-20"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div
        className={`absolute top-0 right-0 h-full w-[400px] bg-white shadow-xl z-30 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-1/3 left-0 -translate-x-full -translate-y-1/2 flex items-center justify-center w-6 h-16 bg-white border border-r-0 border-gray-200 rounded-l-xl shadow-md hover:bg-gray-50 text-gray-500 transition-all group z-40"
        >
          <Icon
            icon={
              isSidebarOpen ? "lucide:chevron-right" : "lucide:chevron-left"
            }
            className={`w-4 h-4 transition-transform ${
              isSidebarOpen
                ? "group-hover:translate-x-0.5"
                : "group-hover:-translate-x-0.5"
            }`}
          />
        </button>

        <div className="flex-1 overflow-y-auto">
          <SideDetailPanel
            applications={applications}
            selectedDate={selectedDate}
          />
        </div>
      </div>
    </div>
  );
};

export default CalendarScreen;