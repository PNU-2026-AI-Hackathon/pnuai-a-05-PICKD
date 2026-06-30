import { useEffect, useState } from "react";
import type { Application, RegistrationTab } from "../../types/application";
import { useApplicationForm } from "../../hooks/useApplicationForm";
import { LinkIcon, PdfIcon, ImageIcon, ManualIcon } from "../../assets";
import { createApplication, updateApplication } from "../../api/application";
import {
  analyzeNoticeByUrl,
  analyzeNoticeByPdf,
  analyzeNoticeByImages,
} from "../../api/notice";
import { toBackendLocalDateTime, toDateInputValue } from "../../utils/date";

interface PostRegistrationProps {
  initialData?: any;
  onClose: () => void;
  editData?: any;
  onSuccess?: () => Promise<void>;
}

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "FULL_TIME", label: "정규직" },
  { value: "INTERN", label: "인턴" },
  { value: "EXPERIENTIAL_INTERN", label: "체험형 인턴" },
  { value: "CONTRACT", label: "계약직" },
  { value: "FREELANCER", label: "프리랜서" },
] as const;

export default function PostRegistration({
  onClose,
  onSuccess,
  editData,
}: PostRegistrationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    activeTab,
    setActiveTab,
    formData,
    updateField,
    pdfInputRef,
    imageInputRef,
    handleUploadClick,
    handleFileChange,
    handleFileDrop,
    selectedPdfFile,
    selectedImageFiles,
    removeSelectedPdfFile,
    removeSelectedImageFile,
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
          const date = toDateInputValue(value as any);
          updateField(key as any, date as any);
        } else {
          updateField(key as any, value as any);
        }
      });
    }
  }, [editData]);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      if (activeTab === "URL") {
        const url = String((formData as any).url || "").trim();

        if (!url) {
          alert("채용공고 URL을 입력해주세요.");
          return;
        }

        const result = await analyzeNoticeByUrl(url);
        console.log("URL 공고 분석 완료:", result.noticeId);

        await onSuccess?.();
        onClose();
        return;
      }

      if (activeTab === "PDF") {
        if (!selectedPdfFile) {
          alert("PDF 파일을 선택해주세요.");
          return;
        }

        const result = await analyzeNoticeByPdf(selectedPdfFile);
        console.log("PDF 공고 분석 완료:", result.noticeId);

        await onSuccess?.();
        onClose();
        return;
      }

      if (activeTab === "IMAGE") {
        if (!selectedImageFiles || selectedImageFiles.length === 0) {
          alert("이미지 파일을 선택해주세요.");
          return;
        }

        const result = await analyzeNoticeByImages(selectedImageFiles);
        console.log("이미지 공고 분석 완료:", result.noticeId);

        await onSuccess?.();
        onClose();
        return;
      }

      const employmentType =
        (formData as any).employmentType ||
        (formData as any).employType ||
        "FULL_TIME";

      const data = {
        company: formData.company,
        jobTitle: formData.jobTitle,
        position: formData.position,
        industry: formData.industry,
        employmentType,
        status: formData.status || "지원 예정",
        memo: formData.memo,

        noticeId: formData.noticeId ?? undefined,
        important: Boolean(formData.important),
        applyDate: toBackendLocalDateTime(formData.applyDate) ?? null,
        interviewDate: toBackendLocalDateTime(formData.interviewDate) ?? null,
        deadlineDate: toBackendLocalDateTime(formData.deadlineDate) ?? null,
      };

      if (editData) {
        await updateApplication(editData.id, data);
      } else {
        await createApplication(data);
      }

      await onSuccess?.();
      onClose();
    } catch (error) {
      console.error("공고 등록 실패:", error);
      alert("공고 등록에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[500px] animate-in zoom-in-95 overflow-hidden rounded-[24px] bg-white shadow-2xl duration-200"
        onClick={(event) => event.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-7 pb-2 pt-6">
          <h2 className="text-[20px] font-extrabold tracking-tight text-[#0F172A]">
            공고등록
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
          >
            <span className="text-[18px] font-light text-[#94A3B8]">✕</span>
          </button>
        </div>

        <div className="px-7">
          <div className="h-[1px] w-full bg-[#E2E8F0]" />
        </div>

        <div className="px-7 pb-5 pt-5">
          {/* 탭 메뉴 */}
          <div className="mb-7 flex rounded-xl bg-[#F1F5F9] px-1 py-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-[13px] font-bold transition-all ${
                    isActive
                      ? "bg-white text-[#0F172A] shadow-sm"
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
            accept=".pdf,application/pdf"
            className="hidden"
          />
          <input
            type="file"
            ref={imageInputRef}
            onChange={(e) => handleFileChange(e, "IMAGE")}
            accept="image/*"
            multiple
            className="hidden"
          />

          {/* 컨텐츠 영역: 내부 스크롤 적용 */}
          <div className="custom-scrollbar mb-8 max-h-[360px] overflow-y-auto px-1">
            {activeTab === "URL" && (
              <div className="space-y-4 py-1 animate-in fade-in duration-300">
                <div className="group relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-blue-500">
                    <LinkIcon size={20} />
                  </div>
                  <input
                    type="text"
                    placeholder="공고 상세 페이지의 URL을 붙여넣어 주세요"
                    className="w-full rounded-xl border border-[#E2E8F0] py-3.5 pl-11 pr-4 text-[14px] outline-none transition-all placeholder:text-gray-300 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    value={(formData as any).url || ""}
                    onChange={(e) => updateField("url" as any, e.target.value)}
                  />
                </div>
                <p className="px-1 text-[12px] font-medium leading-relaxed text-[#94A3B8]">
                  채용 공고 페이지의 URL을 입력하면, AI가 자동으로 정보를
                  분석합니다.
                </p>
              </div>
            )}

            {(activeTab === "PDF" || activeTab === "IMAGE") && (
              <div className="space-y-3">
                <div
                  onClick={handleUploadClick}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleFileDrop(event.dataTransfer.files, activeTab);
                  }}
                  className="group flex cursor-pointer flex-col items-center justify-center rounded-[16px] border-2 border-dashed border-[#E2E8F0] px-6 py-12 transition-all hover:border-[#0F172A] hover:bg-blue-50/10"
                >
                  <div className="mb-3 text-[#94A3B8] transition-all group-hover:scale-105 group-hover:text-blue-500">
                    {activeTab === "PDF" ? (
                      <PdfIcon size={36} color="#64748B" />
                    ) : (
                      <ImageIcon size={34} />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-[15px] font-bold text-[#475569]">
                      {activeTab === "PDF"
                        ? "PDF 파일을 드래그 하거나 클릭"
                        : "이미지 파일을 드래그 하거나 클릭"}
                    </p>
                    <p className="mt-1 text-[12px] font-medium text-[#94A3B8]">
                      최대 {activeTab === "PDF" ? "10MB" : "5MB"} 지원
                    </p>
                  </div>
                </div>

                {activeTab === "PDF" && selectedPdfFile && (
                  <div className="flex items-center justify-between rounded-xl bg-[#F8FAFC] px-4 py-3 text-[13px] text-[#334155]">
                    <span className="truncate">{selectedPdfFile.name}</span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeSelectedPdfFile?.();
                      }}
                      className="ml-3 shrink-0 text-[#94A3B8] hover:text-[#334155]"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {activeTab === "IMAGE" && selectedImageFiles.length > 0 && (
                  <div className="space-y-2">
                    {selectedImageFiles.map((file) => (
                      <div
                        key={`${file.name}-${file.lastModified}`}
                        className="flex items-center justify-between rounded-xl bg-[#F8FAFC] px-4 py-3 text-[13px] text-[#334155]"
                      >
                        <span className="truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            removeSelectedImageFile?.(file.name);
                          }}
                          className="ml-3 shrink-0 text-[#94A3B8] hover:text-[#334155]"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "MANUAL" && (
              <div className="flex flex-col gap-3 py-1 animate-in fade-in duration-300">
                <input
                  type="text"
                  placeholder="회사명"
                  className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-[14px] outline-none"
                  value={formData.company || ""}
                  onChange={(e) => updateField("company", e.target.value)}
                />
                <input
                  type="text"
                  placeholder="공고명 (예: 2026 하반기 SW 엔지니어 채용)"
                  className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-[14px] outline-none"
                  value={formData.jobTitle || ""}
                  onChange={(e) => updateField("jobTitle", e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="직무 (예: 서비스 기획자)"
                    className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-[14px] outline-none"
                    value={formData.position || ""}
                    onChange={(e) => updateField("position", e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="산업 (예: IT/테크)"
                    className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-[14px] outline-none"
                    value={formData.industry || ""}
                    onChange={(e) => updateField("industry", e.target.value)}
                  />
                </div>

                <select
                  className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-[14px] text-[#0F172A] outline-none"
                  value={formData.status ?? ""}
                  onChange={(e) =>
                    updateField(
                      "status",
                      e.target.value as Application["status"],
                    )
                  }
                >
                  <option value="">현재 상태 선택</option>
                  <option value="지원 예정">지원 예정</option>
                  <option value="작성중">작성중</option>
                  <option value="제출 완료">제출 완료</option>
                  <option value="결과 대기">결과 대기</option>
                  <option value="면접 전형">면접 전형</option>
                  <option value="최종 결과">최종 결과</option>
                </select>

                <select
                  className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-[14px] text-[#0F172A] outline-none"
                  value={(formData as any).employmentType || "FULL_TIME"}
                  onChange={(e) =>
                    updateField("employmentType" as any, e.target.value)
                  }
                >
                  {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="ml-1 text-[11px] font-bold text-[#94A3B8]">
                      지원일
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-xl border border-[#E2E8F0] px-4 py-2.5 text-[14px] text-[#475569] outline-none"
                      value={String(formData.applyDate || "")}
                      onChange={(e) => updateField("applyDate", e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="ml-1 text-[11px] font-bold text-[#94A3B8]">
                      면접일
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-xl border border-[#E2E8F0] px-4 py-2.5 text-[14px] text-[#475569] outline-none"
                      value={String(formData.interviewDate || "")}
                      onChange={(e) =>
                        updateField("interviewDate", e.target.value)
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="ml-1 text-[11px] font-bold text-[#94A3B8]">
                      마감일
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-xl border border-[#E2E8F0] px-4 py-2.5 text-[14px] text-[#475569] outline-none"
                      value={String(formData.deadlineDate || "")}
                      onChange={(e) =>
                        updateField("deadlineDate", e.target.value)
                      }
                    />
                  </div>
                </div>

                <textarea
                  placeholder="메모를 입력하세요 (전형 특징 등)"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-[#E2E8F0] px-4 py-3 text-[14px] outline-none"
                  value={formData.memo || ""}
                  onChange={(e) => updateField("memo", e.target.value)}
                />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full rounded-xl bg-black py-3 text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? activeTab === "MANUAL"
                ? editData
                  ? "수정 중..."
                  : "등록 중..."
                : "분석 중..."
              : activeTab === "MANUAL"
                ? editData
                  ? "수정하기"
                  : "등록하기"
                : "분석하기"}
          </button>
        </div>
      </div>
    </div>
  );
}