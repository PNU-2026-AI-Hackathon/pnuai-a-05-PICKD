import { useEffect } from "react";
import type { RegistrationTab } from "../../types/application";
import { useApplicationForm } from "../../hooks/useApplicationForm";
import { LinkIcon, PdfIcon, ImageIcon, ManualIcon } from "../../assets";
import { createApplication, updateApplication } from "../../api/application";
interface PostRegistrationProps {
  initialData?: any;
  onClose: () => void;
  editData?: any;
  onSuccess?: () => Promise<void>;
}

export default function PostRegistration({
  onClose,
  onSuccess,
  editData,
}: PostRegistrationProps) {
  const {
    activeTab,
    setActiveTab,
    formData,
    updateField,
    pdfInputRef,
    imageInputRef,
    handleUploadClick,
    handleFileChange,
  } = useApplicationForm(editData);

  const tabs: { id: RegistrationTab; label: string; icon: React.ReactNode }[] =
    [
      {
        id: "URL",
        label: "URL 입력",
        icon: <LinkIcon size={14} color="currentColor" />,
      },
      {
        id: "PDF",
        label: "PDF 업로드",
        icon: <PdfIcon size={14} color="currentColor" />,
      },
      {
        id: "IMAGE",
        label: "이미지 업로드",
        icon: <ImageIcon size={14} color="currentColor" />,
      },
      {
        id: "MANUAL",
        label: "직접 입력",
        icon: <ManualIcon size={14} color="currentColor" />,
      },
    ];
  useEffect(() => {
    if (editData) {
      Object.entries(editData).forEach(([key, value]) => {
        if (
          key === "applyDate" ||
          key === "deadlineDate" ||
          key === "interviewDate"
        ) {
          const date = value ? String(value).split("T")[0] : "";
          updateField(key as any, date);
        } else {
          updateField(key as any, value as string);
        }
      });
    }
  }, [editData]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
      <div className="w-full max-w-[500px] bg-white rounded-[24px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-7 pt-6 pb-4">
          <h2 className="text-[20px] font-extrabold text-[#0F172A] tracking-tight">
            공고등록
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <span className="text-[18px] text-[#94A3B8] font-light">✕</span>
          </button>
        </div>

        <div className="px-7">
          <div className="h-[1px] bg-[#E2E8F0] w-full" />
        </div>

        <div className="p-7">
          {/* 탭 메뉴 */}
          <div className="flex bg-[#F8F9FB] p-1 rounded-xl mb-6">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[13px] font-bold transition-all ${
                    isActive
                      ? "bg-white shadow-sm text-[#0F172A]"
                      : "text-[#94A3B8] hover:text-gray-500"
                  }`}
                >
                  {tab.icon}
                  <span className="whitespace-nowrap leading-none">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          <input
            type="file"
            ref={pdfInputRef}
            onChange={(e) => handleFileChange(e, "PDF")}
            accept=".pdf"
            className="hidden"
          />
          <input
            type="file"
            ref={imageInputRef}
            onChange={(e) => handleFileChange(e, "IMAGE")}
            accept="image/*"
            className="hidden"
          />

          {/* 컨텐츠 영역: 내부 스크롤 적용 */}
          <div className="max-h-[360px] overflow-y-auto mb-8 pr-1 custom-scrollbar">
            {activeTab === "URL" && (
              <div className="space-y-4 animate-in fade-in duration-300 py-1">
                <div className="flex items-center gap-2 px-1 text-[#64748B]">
                  <LinkIcon size={20} />
                  <p className="text-[14px] font-semibold tracking-tight">
                    채용 공고 URL을 입력하세요.
                  </p>
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors">
                    <LinkIcon size={20} />
                  </div>
                  <input
                    type="text"
                    placeholder="공고 상세 페이지의 URL을 붙여넣어 주세요"
                    className="w-full py-3.5 pl-11 pr-4 border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-300 text-[14px]"
                    value={(formData as any).url || ""}
                    onChange={(e) => updateField("url" as any, e.target.value)}
                  />
                </div>
                <p className="text-[12px] text-[#94A3B8] font-medium leading-relaxed px-1">
                  * AI가 공고 내용을 자동으로 분석하여 가져옵니다.
                </p>
              </div>
            )}

            {(activeTab === "PDF" || activeTab === "IMAGE") && (
              <div
                onClick={handleUploadClick}
                className="border-2 border-dashed border-[#E2E8F0] rounded-[16px] flex flex-col items-center justify-center py-12 px-6 hover:border-[#0F172A] hover:bg-blue-50/10 transition-all cursor-pointer group"
              >
                <div className="mb-3 text-[#94A3B8] group-hover:text-blue-500 transition-all group-hover:scale-105">
                  {activeTab === "PDF" ? (
                    <PdfIcon size={36} color="#64748B" />
                  ) : (
                    <ImageIcon size={34} />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-[#475569] text-[15px] font-bold">
                    {activeTab === "PDF"
                      ? "PDF 파일을 드래그 하거나 클릭"
                      : "이미지 파일을 드래그 하거나 클릭"}
                  </p>
                  <p className="text-[#94A3B8] text-[12px] mt-1 font-medium">
                    최대 {activeTab === "PDF" ? "10MB" : "5MB"} 지원
                  </p>
                </div>
              </div>
            )}

            {activeTab === "MANUAL" && (
              <div className="flex flex-col gap-3 animate-in fade-in duration-300 py-1">
                <input
                  type="text"
                  placeholder="회사명"
                  className="w-full py-3 px-4 border border-[#E2E8F0] rounded-xl text-[14px] outline-none"
                  value={formData.company}
                  onChange={(e) => updateField("company", e.target.value)}
                />
                <input
                  type="text"
                  placeholder="공고명 (예: 2026 하반기 SW 엔지니어 채용)"
                  className="w-full py-3 px-4 border border-[#E2E8F0] rounded-xl text-[14px] outline-none"
                  value={formData.jobTitle || ""}
                  onChange={(e) => updateField("jobTitle", e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="직무 (예: 서비스 기획자)"
                    className="w-full py-3 px-4 border border-[#E2E8F0] rounded-xl text-[14px] outline-none"
                    value={formData.position}
                    onChange={(e) => updateField("position", e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="산업 (예: IT/테크)"
                    className="w-full py-3 px-4 border border-[#E2E8F0] rounded-xl text-[14px] outline-none"
                    value={formData.industry || ""}
                    onChange={(e) => updateField("industry", e.target.value)}
                  />
                </div>
                <select
                  className="w-full py-3 px-4 border border-[#E2E8F0] rounded-xl text-[14px] outline-none bg-white text-[#0F172A]"
                  value={formData.status}
                  onChange={(e) => updateField("status", e.target.value)}
                >
                  <option value="">현재 상태 선택</option>
                  <option value="지원 예정">지원 예정</option>
                  <option value="작성중">작성중</option>
                  <option value="제출 완료">제출 완료</option>
                  <option value="결과 대기">결과 대기</option>
                  <option value="면접 전형">면접 전형</option>
                  <option value="최종 결과">최종 결과</option>
                </select>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#94A3B8] ml-1">
                      지원일
                    </label>
                    <input
                      type="date"
                      className="w-full py-2.5 px-4 border border-[#E2E8F0] rounded-xl text-[14px] outline-none text-[#475569]"
                      value={formData.applyDate}
                      onChange={(e) => updateField("applyDate", e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#94A3B8] ml-1">
                      면접일
                    </label>
                    <input
                      type="date"
                      className="w-full py-2.5 px-4 border border-[#E2E8F0] rounded-xl text-[14px] outline-none text-[#475569]"
                      value={formData.interviewDate}
                      onChange={(e) =>
                        updateField("interviewDate", e.target.value)
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#94A3B8] ml-1">
                      마감일
                    </label>
                    <input
                      type="date"
                      className="w-full py-2.5 px-4 border border-[#E2E8F0] rounded-xl text-[14px] outline-none text-[#475569]"
                      value={formData.deadlineDate}
                      onChange={(e) =>
                        updateField("deadlineDate", e.target.value)
                      }
                    />
                  </div>
                </div>

                <textarea
                  placeholder="메모를 입력하세요 (전형 특징 등)"
                  rows={3}
                  className="w-full py-3 px-4 border border-[#E2E8F0] rounded-xl text-[14px] outline-none resize-none"
                  value={formData.memo}
                  onChange={(e) => updateField("memo", e.target.value)}
                />
              </div>
            )}
          </div>
          <button
            onClick={async () => {
              const data = {
                company: formData.company,
                jobTitle: formData.jobTitle,
                position: formData.position,
                industry: formData.industry,
                status: formData.status || "지원 예정",
                memo: formData.memo,

                applyDate: formData.applyDate
                  ? formData.applyDate + "T00:00:00"
                  : null,
                interviewDate: formData.interviewDate
                  ? formData.interviewDate + "T00:00:00"
                  : null,
                deadlineDate: formData.deadlineDate
                  ? formData.deadlineDate + "T00:00:00"
                  : null,
              };

              if (editData) {
                await updateApplication(editData.id, data); // 수정
              } else {
                await createApplication(data); // 생성
              }
              await onSuccess?.();

              onClose();
            }}
            className="w-full bg-black text-white py-3 rounded-xl"
          >
            {editData ? "수정하기" : "등록하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
