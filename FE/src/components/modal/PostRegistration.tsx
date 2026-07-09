import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { Application, RegistrationTab } from "../../types/application";
import {
  APPLICATION_FINAL_RESULTS,
  APPLICATION_STATUSES,
} from "../../types/application";
import { useApplicationForm } from "../../hooks/useApplicationForm";
import { LinkIcon, PdfIcon, ImageIcon, ManualIcon } from "../../assets";
import {
  createApplication,
  updateApplication,
  type ApplicationPayload,
} from "../../api/application";
import {
  analyzeNoticeByUrl,
  analyzeNoticeByPdf,
  analyzeNoticeByImages,
  getNoticeDetail,
  type NoticeDetail,
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

const DEFAULT_CATEGORY = "FULL_TIME" as const;
const MEMO_MAX_LENGTH = 500;

type ReviewForm = {
  noticeId: number | null;
  company: string;
  jobTitle: string;
  position: string;
  industry: string;
  category: ApplicationPayload["category"];
  status: Application["status"];
  finalResult: Application["finalResult"];
  applyDate: string;
  interviewDate: string;
  deadlineDate: string;
  memo: string;
};

function getNoticePosition(notice: NoticeDetail) {
  return (
    notice.sections?.find((section) => section.jobTitle?.trim())?.jobTitle ?? ""
  );
}

function getFirstText(...values: Array<string | null | undefined>) {
  return values.find((value) => value && value.trim()) ?? "";
}

function buildNoticeMemo(notice: NoticeDetail) {
  const section = notice.sections?.[0];
  const qualification = section?.qualifications?.[0];
  const preference = section?.preferences?.[0];
  const document = notice.documents?.[0];
  const process = notice.processes?.[0];

  return [
    section?.responsibilities ? `직무요건: ${section.responsibilities}` : "",
    getFirstText(
      qualification?.mandatoryQualification,
      qualification?.generalQualification,
    )
      ? `지원자격: ${getFirstText(
          qualification?.mandatoryQualification,
          qualification?.generalQualification,
        )}`
      : "",
    getFirstText(
      preference?.generalPreference,
      preference?.additionalPoints,
      preference?.certificatePreference,
    )
      ? `우대사항: ${getFirstText(
          preference?.generalPreference,
          preference?.additionalPoints,
          preference?.certificatePreference,
        )}`
      : "",
    document?.mandatoryDocuments
      ? `제출서류: ${document.mandatoryDocuments}`
      : "",
    process?.applicationPeriod ? `접수기간: ${process.applicationPeriod}` : "",
    notice.noticeUrl ? `원문: ${notice.noticeUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, MEMO_MAX_LENGTH);
}

function toReviewForm(notice: NoticeDetail): ReviewForm {
  return {
    noticeId: notice.id,
    company: notice.companyName ?? "",
    jobTitle: notice.noticeName ?? "",
    position: getNoticePosition(notice),
    industry: notice.region1depth ?? "",
    category: (notice.category ??
      DEFAULT_CATEGORY) as ApplicationPayload["category"],
    status: "WRITING",
    finalResult: null,
    applyDate: "",
    interviewDate: "",
    deadlineDate: toDateInputValue(notice.endedAt),
    memo: buildNoticeMemo(notice),
  };
}

function toApplicationPayload(
  data: Partial<ReviewForm> & Partial<Application>,
) {
  const status = data.status ?? "WRITING";

  return {
    noticeId: data.noticeId ?? undefined,
    company: data.company ?? "",
    jobTitle: data.jobTitle ?? "",
    position: data.position ?? "",
    industry: data.industry ?? "",
    category:
      (data as any).category ??
      ((data as any).employmentType || DEFAULT_CATEGORY),
    status,
    finalResult: status === "COMPLETED" ? (data.finalResult ?? null) : null,
    memo: data.memo ?? "",
    important: Boolean(data.important),
    applyDate: toBackendLocalDateTime(data.applyDate) ?? null,
    interviewDate: toBackendLocalDateTime(data.interviewDate) ?? null,
    deadlineDate: toBackendLocalDateTime(data.deadlineDate) ?? null,
  } satisfies ApplicationPayload;
}

export default function PostRegistration({
  onClose,
  onSuccess,
  editData,
}: PostRegistrationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewNotice, setReviewNotice] = useState<NoticeDetail | null>(null);
  const [reviewForm, setReviewForm] = useState<ReviewForm | null>(null);

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

  const tabs: { id: RegistrationTab; label: string; icon: ReactNode }[] = [
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
      icon: <ImageIcon size={14} />,
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

  const noticeSummary = useMemo(() => {
    if (!reviewNotice) return [];

    const section = reviewNotice.sections?.[0];
    const qualification = section?.qualifications?.[0];
    const preference = section?.preferences?.[0];
    const document = reviewNotice.documents?.[0];

    return [
      ["기업명", reviewNotice.companyName],
      ["공고명", reviewNotice.noticeName],
      ["직무", section?.jobTitle],
      [
        "근무지",
        getFirstText(section?.workplace, reviewNotice.workplaceAddress),
      ],
      [
        "지원자격",
        getFirstText(
          qualification?.mandatoryQualification,
          qualification?.generalQualification,
        ),
      ],
      [
        "우대사항",
        getFirstText(
          preference?.generalPreference,
          preference?.additionalPoints,
        ),
      ],
      ["제출서류", document?.mandatoryDocuments],
      ["원문", reviewNotice.noticeUrl],
    ].filter(([, value]) => value && String(value).trim());
  }, [reviewNotice]);

  const startReview = async (noticeId: number) => {
    const notice = await getNoticeDetail(noticeId);
    setReviewNotice(notice);
    setReviewForm(toReviewForm(notice));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      if (reviewForm) {
        if (!reviewForm.company.trim()) return alert("기업명을 입력해주세요.");
        if (!reviewForm.jobTitle.trim()) return alert("공고명을 입력해주세요.");
        await createApplication(toApplicationPayload(reviewForm));
        await onSuccess?.();
        onClose();
        return;
      }

      if (activeTab === "URL") {
        const url = String((formData as any).url || "").trim();

        if (!url) {
          alert("채용공고 URL을 입력해주세요.");
          return;
        }

        const result = await analyzeNoticeByUrl(url);
        await startReview(result.noticeId);
        return;
      }

      if (activeTab === "PDF") {
        if (!selectedPdfFile) {
          alert("PDF 파일을 선택해주세요.");
          return;
        }

        const result = await analyzeNoticeByPdf(selectedPdfFile);
        await startReview(result.noticeId);
        return;
      }

      if (activeTab === "IMAGE") {
        if (!selectedImageFiles || selectedImageFiles.length === 0) {
          alert("이미지 파일을 선택해주세요.");
          return;
        }

        const result = await analyzeNoticeByImages(selectedImageFiles);
        await startReview(result.noticeId);
        return;
      }

      const data = toApplicationPayload({
        ...formData,
        category: ((formData as any).employmentType ||
          (formData as any).employType ||
          DEFAULT_CATEGORY) as ApplicationPayload["category"],
      });

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
        className="w-full max-w-[560px] animate-in zoom-in-95 overflow-hidden rounded-[24px] bg-white shadow-2xl duration-200"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-7 pb-2 pt-6">
          <div>
            <h2 className="text-[20px] font-extrabold tracking-tight text-[#0F172A]">
              {reviewForm
                ? "AI 추출 결과 검수"
                : editData
                  ? "공고 수정"
                  : "공고 등록"}
            </h2>
            {reviewForm && (
              <p className="mt-1 text-xs font-medium text-[#64748B]">
                빈 항목은 직접 채운 뒤 등록해주세요.
              </p>
            )}
          </div>
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
          {!reviewForm && !editData && (
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
          )}

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

          <div className="custom-scrollbar mb-8 max-h-[430px] overflow-y-auto px-1">
            {reviewForm ? (
              <div className="space-y-4 animate-in fade-in duration-300">
                {noticeSummary.length > 0 && (
                  <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                    <p className="mb-3 text-xs font-bold text-[#64748B]">
                      원문에서 추출한 핵심정보
                    </p>
                    <div className="space-y-2 text-[13px]">
                      {noticeSummary.map(([label, value]) => (
                        <div
                          key={String(label)}
                          className="grid grid-cols-[84px_1fr] gap-2"
                        >
                          <span className="font-semibold text-[#94A3B8]">
                            {label}
                          </span>
                          <span className="break-words text-[#334155]">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <NoticeReviewFields form={reviewForm} setForm={setReviewForm} />
              </div>
            ) : activeTab === "URL" && !editData ? (
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
                  URL을 분석한 뒤 바로 저장하지 않고, PICKD 전용 구조화 폼에서
                  검수합니다.
                </p>
              </div>
            ) : (activeTab === "PDF" || activeTab === "IMAGE") && !editData ? (
              <UploadArea
                activeTab={activeTab}
                handleUploadClick={handleUploadClick}
                handleFileDrop={handleFileDrop}
                selectedPdfFile={selectedPdfFile}
                selectedImageFiles={selectedImageFiles}
                removeSelectedPdfFile={removeSelectedPdfFile}
                removeSelectedImageFile={removeSelectedImageFile}
              />
            ) : (
              <ManualFields formData={formData} updateField={updateField} />
            )}
          </div>

          <div className="flex gap-2">
            {reviewForm && (
              <button
                type="button"
                onClick={() => {
                  setReviewNotice(null);
                  setReviewForm(null);
                }}
                className="w-[120px] rounded-xl border border-[#E2E8F0] bg-white py-3 text-[#64748B]"
              >
                이전
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-black py-3 text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? reviewForm
                  ? "등록 중..."
                  : activeTab === "MANUAL" || editData
                    ? editData
                      ? "수정 중..."
                      : "등록 중..."
                    : "분석 중..."
                : reviewForm
                  ? "검수 후 등록"
                  : activeTab === "MANUAL" || editData
                    ? editData
                      ? "수정하기"
                      : "등록하기"
                    : "분석하기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NoticeReviewFields({
  form,
  setForm,
}: {
  form: ReviewForm;
  setForm: Dispatch<SetStateAction<ReviewForm | null>>;
}) {
  const update = <K extends keyof ReviewForm>(key: K, value: ReviewForm[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        placeholder="기업명"
        className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-[14px] outline-none"
        value={form.company}
        onChange={(e) => update("company", e.target.value)}
      />
      <input
        type="text"
        placeholder="공고명"
        className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-[14px] outline-none"
        value={form.jobTitle}
        onChange={(e) => update("jobTitle", e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="직무"
          className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-[14px] outline-none"
          value={form.position}
          onChange={(e) => update("position", e.target.value)}
        />
        <input
          type="text"
          placeholder="지역/산업"
          className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-[14px] outline-none"
          value={form.industry}
          onChange={(e) => update("industry", e.target.value)}
        />
      </div>

      <SharedSelects
        status={form.status}
        finalResult={form.finalResult}
        category={form.category}
        onStatusChange={(status) => update("status", status)}
        onFinalResultChange={(result) => update("finalResult", result)}
        onCategoryChange={(category) => update("category", category)}
      />

      <DateFields
        applyDate={form.applyDate}
        interviewDate={form.interviewDate}
        deadlineDate={form.deadlineDate}
        onChange={(key, value) => update(key, value)}
      />

      <textarea
        placeholder="AI가 추출한 지원자격/우대사항/전형 메모를 검수하세요"
        rows={5}
        maxLength={MEMO_MAX_LENGTH}
        className="w-full resize-none rounded-xl border border-[#E2E8F0] px-4 py-3 text-[14px] outline-none"
        value={form.memo}
        onChange={(e) => update("memo", e.target.value)}
      />
    </div>
  );
}

function ManualFields({ formData, updateField }: any) {
  return (
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

      <SharedSelects
        status={formData.status || "WRITING"}
        finalResult={formData.finalResult ?? null}
        category={(formData as any).employmentType || DEFAULT_CATEGORY}
        onStatusChange={(status) => updateField("status", status)}
        onFinalResultChange={(result) => updateField("finalResult", result)}
        onCategoryChange={(category) => updateField("employmentType", category)}
      />

      <DateFields
        applyDate={String(formData.applyDate || "")}
        interviewDate={String(formData.interviewDate || "")}
        deadlineDate={String(formData.deadlineDate || "")}
        onChange={(key, value) => updateField(key, value)}
      />

      <textarea
        placeholder="메모를 입력하세요 (전형 특징 등)"
        rows={3}
        maxLength={MEMO_MAX_LENGTH}
        className="w-full resize-none rounded-xl border border-[#E2E8F0] px-4 py-3 text-[14px] outline-none"
        value={formData.memo || ""}
        onChange={(e) => updateField("memo", e.target.value)}
      />
    </div>
  );
}

function SharedSelects({
  status,
  finalResult,
  category,
  onStatusChange,
  onFinalResultChange,
  onCategoryChange,
}: {
  status: Application["status"];
  finalResult: Application["finalResult"];
  category: ApplicationPayload["category"];
  onStatusChange: (status: Application["status"]) => void;
  onFinalResultChange: (result: Application["finalResult"]) => void;
  onCategoryChange: (category: ApplicationPayload["category"]) => void;
}) {
  return (
    <>
      <select
        className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-[14px] text-[#0F172A] outline-none"
        value={status}
        onChange={(e) =>
          onStatusChange(e.target.value as Application["status"])
        }
      >
        {APPLICATION_STATUSES.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      {status === "COMPLETED" && (
        <select
          className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-[14px] text-[#0F172A] outline-none"
          value={finalResult ?? ""}
          onChange={(e) =>
            onFinalResultChange(
              e.target.value
                ? (e.target.value as Application["finalResult"])
                : null,
            )
          }
        >
          <option value="">세부 결과 선택</option>
          {APPLICATION_FINAL_RESULTS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      )}

      <select
        className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-[14px] text-[#0F172A] outline-none"
        value={category || DEFAULT_CATEGORY}
        onChange={(e) =>
          onCategoryChange(e.target.value as ApplicationPayload["category"])
        }
      >
        {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </>
  );
}

function DateFields({
  applyDate,
  interviewDate,
  deadlineDate,
  onChange,
}: {
  applyDate: string;
  interviewDate: string;
  deadlineDate: string;
  onChange: (
    key: "applyDate" | "interviewDate" | "deadlineDate",
    value: string,
  ) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="flex flex-col gap-1">
        <label className="ml-1 text-[11px] font-bold text-[#94A3B8]">
          서류제출일
        </label>
        <input
          type="date"
          className="w-full rounded-xl border border-[#E2E8F0] px-4 py-2.5 text-[14px] text-[#475569] outline-none"
          value={applyDate}
          onChange={(e) => onChange("applyDate", e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="ml-1 text-[11px] font-bold text-[#94A3B8]">
          면접일
        </label>
        <input
          type="date"
          className="w-full rounded-xl border border-[#E2E8F0] px-4 py-2.5 text-[14px] text-[#475569] outline-none"
          value={interviewDate}
          onChange={(e) => onChange("interviewDate", e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="ml-1 text-[11px] font-bold text-[#94A3B8]">
          지원마감일
        </label>
        <input
          type="date"
          className="w-full rounded-xl border border-[#E2E8F0] px-4 py-2.5 text-[14px] text-[#475569] outline-none"
          value={deadlineDate}
          onChange={(e) => onChange("deadlineDate", e.target.value)}
        />
      </div>
    </div>
  );
}

function UploadArea({
  activeTab,
  handleUploadClick,
  handleFileDrop,
  selectedPdfFile,
  selectedImageFiles,
  removeSelectedPdfFile,
  removeSelectedImageFile,
}: any) {
  return (
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
            업로드 후 AI 추출 결과를 검수합니다.
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
          {selectedImageFiles.map((file: File) => (
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
  );
}
