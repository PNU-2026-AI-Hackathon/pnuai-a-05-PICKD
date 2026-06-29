import { useState } from "react";
import { Icon } from "@iconify/react";

interface CompletedSectionProps {
  applications?: any[];
  onCompanyClick?: (application: any) => void;
}

const MOCK_COMPLETED_DATA = [
  {
    id: "mock-1",
    company: "쿠팡",
    status: "불합격",
    jobType: "데이터 경력",
    jobTitle: "데이터 분석가",
    resultDate: "2026-04-10",
    fileName: "2026_쿠팡_데이터_경력", 
  }
];

export default function CompletedSection({ 
  applications = [], 
  onCompanyClick = () => {} 
}: CompletedSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  
  const [viewMode, setViewMode] = useState<"file" | "grid">("grid");

  const realCompletedApps = applications.filter(
    (app) => app.status === "COMPLETED" || app.status === "완료" || app.status === "불합격"
  );

  const displayApps = realCompletedApps.length > 0 ? realCompletedApps : MOCK_COMPLETED_DATA;

  return (
    <div className="mt-6 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className={`flex justify-between items-center px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors select-none ${
          isOpen ? "border-b border-gray-100" : ""
        }`}
      >
        <div className="flex items-center space-x-3">
          <Icon
            icon="lucide:chevron-right"
            className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
              isOpen ? "rotate-90" : "rotate-0"
            }`}
          />
          <h2 className="text-base font-bold text-gray-800">완료된 공고</h2>
          <span className="text-sm font-medium text-gray-400">
            {displayApps.length}건
          </span>
        </div>

        <div 
          className="flex items-center space-x-1 bg-gray-50 p-1 rounded-lg border border-gray-100" 
          onClick={(e) => e.stopPropagation()} 
        >
          <button 
            onClick={() => setViewMode("file")}
            className={`p-1.5 rounded transition-all ${
              viewMode === "file" 
                ? "text-gray-700 bg-white shadow-sm border border-gray-100" 
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Icon icon="lucide:folder" className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded transition-all ${
              viewMode === "grid" 
                ? "text-gray-700 bg-white shadow-sm border border-gray-100" 
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Icon icon="lucide:layout-grid" className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-6 bg-gray-50/40 min-h-[180px] transition-all">
          {displayApps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Icon icon="lucide:archive" className="w-8 h-8 mb-2 opacity-60" />
              <p className="text-sm">완료된 공고가 없습니다.</p>
            </div>
          ) : viewMode === "grid" ? (
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fadeIn pl-4">
              {displayApps.map((app) => (
                <div
                  key={app.id}
                  onClick={() => onCompanyClick(app)}
                  className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-40 group"
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-gray-800 text-base truncate pr-2 max-w-[70%] group-hover:text-blue-600 transition-colors">
                        {app.company}
                      </h3>
                      <span 
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          app.status === "합격" ? "text-green-600 bg-green-50" : "text-red-500 bg-red-50"
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 font-medium truncate">{app.jobType}</p>
                    <p className="text-sm text-gray-400 truncate">{app.jobTitle}</p>
                  </div>
                  <div className="text-xs text-gray-400 font-medium">
                    결과 확인일 {app.resultDate}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-5 animate-fadeIn pl-4">
              {displayApps.map((app) => (
                <div
                  key={app.id}
                  onClick={() => onCompanyClick(app)}
                  className="flex flex-col items-center text-center cursor-pointer group max-w-[100px]"
                >
                  <div className="w-16 h-16 flex items-center justify-center bg-transparent rounded-xl transition-transform group-hover:-translate-y-1">
                    <Icon 
                      icon="lucide:file-text" 
                      className="w-12 h-12 text-gray-400 opacity-80 group-hover:text-gray-600 transition-colors" 
                    />
                  </div>
                  
                  <span className="mt-2 text-xs text-gray-500 font-medium leading-tight line-clamp-2 break-all group-hover:text-gray-800 transition-colors">
                    {app.fileName || `${app.resultDate.split('-')[0]}_${app.company}_${app.jobType}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}