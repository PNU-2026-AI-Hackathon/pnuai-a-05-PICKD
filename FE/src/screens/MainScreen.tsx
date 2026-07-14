import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Application } from "../types/application";
import Header from "../components/dashboard/main/Header";
import RightTab from "../components/dashboard/right/RightTab";
import { useApplication } from "../context/ApplicationContext";
import ApplyInput from "../components/dashboard/main/ApplyInput";
import PostRegistration from "../components/modal/PostRegistration";
import ApplicationDetailModal from "../components/modal/ApplicationDetailModal";
import DocumentSection from "../components/dashboard/main/document/DocumentSection";
import ApplicationTable from "../components/dashboard/main/applicationTable/ApplicationTable";
import CompletedSection from "../components/dashboard/main/CompleteSection";
import { Icon } from "@iconify/react";
import { getCalendarEvents } from "../api/calendar";
import { getUserProfile } from "../api/user";

export default function MainScreen() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [focusedApplication, setFocusedApplication] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  const { loadData, applications } = useApplication();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!focusedApplication) return;

    const latestApplication = applications.find(
      (application) => application.id === focusedApplication.id,
    );

    if (latestApplication && latestApplication !== focusedApplication) {
      setFocusedApplication(latestApplication);
    }
  }, [applications, focusedApplication]);

  const allTodos = applications.flatMap((app) =>
    (app.todos || []).map((todo) => ({
      ...todo,
      application: {
        id: app.id,
        company: app.company,
        jobTitle: app.jobTitle,
      },
    })),
  );

  const documents = applications.flatMap((app) =>
    (app.documents || []).map((doc) => ({
      ...doc,
      application: app,
    })),
  );

  useEffect(() => {
    let ignore = false;

    getUserProfile()
      .then((data) => {
        if (!ignore) setUser(data);
      })
      .catch(() => {
        if (!ignore) setUser(null);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const loadCalendarEvents = async () => {
    try {
      const data = await getCalendarEvents();
      setGoogleEvents(data ?? []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadCalendarEvents();
  }, []);

  useEffect(() => {
    const handleGoogleCalendarUpdated = () => {
      void loadCalendarEvents();
    };

    window.addEventListener(
      "googleCalendarUpdated",
      handleGoogleCalendarUpdated,
    );

    return () => {
      window.removeEventListener(
        "googleCalendarUpdated",
        handleGoogleCalendarUpdated,
      );
    };
  }, []);

  const handleAfterChange = async () => {
    await loadData();
    setTimeout(loadCalendarEvents, 300);
  };

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-[#FBFCFE]">
      {/* 패널이 열리면 flex-1 영역의 실제 너비가 줄어들어 대시보드가 왼쪽으로 재배치됩니다. */}
      <div className="min-w-0 flex-1 overflow-y-auto px-10 py-8 transition-[width] duration-300 ease-in-out">
        {user && (
          <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-6">
            <Header user={user} />

            <ApplyInput onAdd={() => setIsModalOpen(true)} />

            <div className="space-y-4">
              <ApplicationTable
                onAdd={() => {
                  setSelectedApplication(null);
                  setIsModalOpen(true);
                }}
                onEdit={(row: Application) => {
                  navigate(`/applications/${row.id}`);
                }}
                onDelete={() => {}}
                onChange={handleAfterChange}
                focusedApplication={focusedApplication}
                setFocusedApplication={setFocusedApplication}
                setIsDetailModalOpen={setIsDetailModalOpen}
                calendarEvents={googleEvents}
              />

              <DocumentSection documents={documents} />

              <CompletedSection applications={applications} />
            </div>
          </div>
        )}
      </div>

      {user && (
        <div className="relative flex shrink-0">
          <button
            type="button"
            onClick={() => setIsSidebarOpen((open) => !open)}
            aria-label={isSidebarOpen ? "오늘 패널 닫기" : "오늘 패널 열기"}
            className="group absolute left-0 top-1/2 z-20 flex h-14 w-5 -translate-x-full -translate-y-1/2 items-center justify-center rounded-l-lg border border-[#E3E8EF] bg-white text-[#79859A] shadow-sm transition-colors hover:bg-[#F6F8FB] hover:text-[#28303D]"
          >
            <Icon
              icon={
                isSidebarOpen ? "lucide:chevron-right" : "lucide:chevron-left"
              }
              className="h-3 w-3"
            />
          </button>

          <div
            className={`h-full overflow-hidden transition-[width] duration-300 ease-in-out ${
              isSidebarOpen ? "w-[400px]" : "w-0"
            }`}
          >
            <aside className="h-full w-[400px] overflow-y-auto border-l border-[#E3E8EF] bg-[#F8FAFC]">
              <RightTab
                todoData={allTodos}
                googleEvents={googleEvents}
                setGoogleEvents={setGoogleEvents}
                focusedApplication={focusedApplication}
              />
            </aside>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30"
          onClick={() => {
            setIsModalOpen(false);
            setSelectedApplication(null);
            setEditData(null);
          }}
        >
          <div onClick={(event) => event.stopPropagation()}>
            <PostRegistration
              initialData={selectedApplication}
              onClose={() => {
                setIsModalOpen(false);
                setSelectedApplication(null);
                setEditData(null);
              }}
              onSuccess={async () => {
                await loadData();
                setTimeout(async () => {
                  await loadCalendarEvents();
                }, 500);
                setIsModalOpen(false);
                setSelectedApplication(null);
                setEditData(null);
              }}
              editData={editData}
            />
          </div>
        </div>
      )}

      <ApplicationDetailModal
        open={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        application={focusedApplication}
        calendarEvents={googleEvents}
        onChange={handleAfterChange}
      />
    </div>
  );
}
