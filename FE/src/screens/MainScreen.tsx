import { useEffect, useState } from "react";
import type { Application } from "../types/application";
import Header from "../components/dashboard/main/Header";
import CompanyInfo from "../components/modal/CompanyInfo";
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

export default function MainScreen() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
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
    fetch("/api/user", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setUser(data))
      .catch(() => setUser(null));
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

  const handleCompanyClick = (application: any) => {
    setSelectedApplication(application);
    setIsCompanyModalOpen(true);
  };

  return (
    <div className="relative flex px-[150px] min-h-full overflow-hidden bg-gray-50">
      <div className="flex-1 min-w-0 p-6">
        {user && (
          <>
            <div className="relative flex justify-between items-center">
              <Header user={user} />
            </div>

            <div className="mt-6 space-y-4">
              <ApplyInput onAdd={() => setIsModalOpen(true)} />

              <ApplicationTable
                onAdd={() => {
                  setSelectedApplication(null);
                  setIsModalOpen(true);
                }}
                onEdit={(row: Application) => {
                  setEditData(row);
                  setIsModalOpen(true);
                }}
                onDelete={() => {}}
                onChange={handleAfterChange}
                onCompanyClick={handleCompanyClick}
                focusedApplication={focusedApplication}
                setFocusedApplication={setFocusedApplication}
                setIsDetailModalOpen={setIsDetailModalOpen}
                calendarEvents={googleEvents}
              />
            </div>

            <DocumentSection documents={documents} />

            <CompletedSection
              applications={applications}
              onCompanyClick={handleCompanyClick}
            />
          </>
        )}
      </div>

      {user && isSidebarOpen && (
        <div
          className="absolute inset-0 bg-transparent z-20"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {user && (
        <div
          className={`fixed top-0 right-0 h-screen w-[350px] bg-white shadow-xl z-30 flex flex-col transform transition-transform duration-300 ease-in-out ${
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

          <div className="flex-1 p-6 overflow-y-auto">
            <RightTab
              todoData={allTodos}
              googleEvents={googleEvents}
              setGoogleEvents={setGoogleEvents}
              focusedApplication={focusedApplication}
            />
          </div>
        </div>
      )}

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
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

      {isCompanyModalOpen && selectedApplication && (
        <CompanyInfo
          isOpen={isCompanyModalOpen}
          onClose={() => setIsCompanyModalOpen(false)}
          data={selectedApplication}
        />
      )}
    </div>
  );
}
