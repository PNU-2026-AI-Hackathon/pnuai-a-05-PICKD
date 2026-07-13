import { useState, useEffect } from "react";
import MainCalendar from "../components/dashboard/calender/MainCalender";
import SideDetailPanel from "../components/dashboard/calender/SideDetail/SideDetailPanel";
import { useApplication } from "../context/ApplicationContext";

const CalendarScreen = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const { applications, loadData } = useApplication();

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      <div className="flex-1 overflow-auto">
        <MainCalendar
          applications={applications}
          selectedDate={selectedDate}
          onSelectedDateChange={setSelectedDate}
        />
      </div>

      <div className="w-[480px] shrink-0 h-full border-l border-gray-200 bg-gray-50 flex flex-col overflow-y-auto">
        <SideDetailPanel
          applications={applications}
          selectedDate={selectedDate}
        />
      </div>
    </div>
  );
};

export default CalendarScreen;
