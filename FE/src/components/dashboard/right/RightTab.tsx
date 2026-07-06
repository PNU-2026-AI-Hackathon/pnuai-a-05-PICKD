import { useState } from "react";
import CalendarBox from "./CalendarBox";
import TodoSection from "./TodoSection";
import TodoList from "../../modal/TodoList";
import ScheduleSection from "./ScheduleSection";
import ModalLayout from "../../modal/ModalLayout";
import ScheduleList from "../../modal/ScheduleList";

export default function RightTab({
  todoData,
  googleEvents,
  setGoogleEvents,
  focusedApplication,
}: any) {
  const [modalType, setModalType] = useState<"schedule" | "todo" | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [weeklyEvents, setWeeklyEvents] = useState<any[]>([]);

  return (
    <div className="w-[95%] bg-[F8FAFC]">
      <div>
        <CalendarBox
          defaultEvents={googleEvents}
          setDefaultEvents={setGoogleEvents}
          setWeeklyEvents={setWeeklyEvents}
          setSelectedDate={setSelectedDate}
          setSelectedEvents={setSelectedEvents}
        />
      </div>

      <ScheduleSection
        weeklyEvents={weeklyEvents}
        selectedEvents={selectedEvents}
        selectedDate={selectedDate}
        onClick={() => setModalType("schedule")}
      />

      <TodoSection
        todos={todoData}
        focusedApplication={focusedApplication}
        onClick={() => setModalType("todo")}
      />

      {(modalType === "schedule" || modalType === "todo") && (
        <ModalLayout
          isOpen={true}
          onClose={() => setModalType(null)}
          title={modalType === "schedule" ? "이번주 일정" : "할 일"}
        >
          {modalType === "schedule" && (
            <ScheduleList
              schedules={weeklyEvents}
              onClose={() => setModalType(null)}
            />
          )}
          {modalType === "todo" && (
            <TodoList todos={todoData} onClose={() => setModalType(null)} />
          )}
        </ModalLayout>
      )}
    </div>
  );
}
