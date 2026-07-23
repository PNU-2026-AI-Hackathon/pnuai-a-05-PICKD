import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  FileText,
  Layers,
  Loader2,
  RotateCcw,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

import {
  confirmExperienceStep3,
  extractExperienceStep1,
  extractExperienceStep2,
  fromBackendExperience,
  fromBackendExperienceGroup,
  fromBackendExperienceType,
  fromSnapshotExperience,
  getPendingDuplicateBatches,
  type DuplicateGroupResponse,
  type ExperiencePendingBatch,
  type ExperienceStep2Response,
  type ExperienceTempResponse,
} from "../../../api/experience";
import type { ExperienceItem } from "../../../types/experience";

interface Props {
  open: boolean;
  mode?: "extract" | "pending";
  focusItemId?: string | number | null;
  onClose: () => void;
  onCompleted: (items: ExperienceItem[]) => void;
  onPendingChanged?: () => void;
}

type WizardStep = "upload" | "candidates" | "result" | "duplicates";
type SourceMode = "file" | "text";

export default function ExperienceExtractWizardModal({
  open,
  mode = "extract",
  focusItemId,
  onClose,
  onCompleted,
  onPendingChanged,
}: Props) {
  const [step, setStep] = useState<WizardStep>("upload");
  const [sourceMode, setSourceMode] = useState<SourceMode>("file");
  const [file, setFile] = useState<File | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [candidates, setCandidates] = useState<ExperienceTempResponse[]>([]);
  const [selectedTempIds, setSelectedTempIds] = useState<number[]>([]);
  const [step2Result, setStep2Result] =
    useState<ExperienceStep2Response | null>(null);
  const [duplicateBatchId, setDuplicateBatchId] = useState<string | null>(null);
  const [duplicateGroups, setDuplicateGroups] = useState<
    DuplicateGroupResponse[]
  >([]);
  const [pendingBatches, setPendingBatches] = useState<
    ExperiencePendingBatch[]
  >([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [selectedItemsByGroup, setSelectedItemsByGroup] = useState<
    Record<string, string[]>
  >({});
  const [loading, setLoading] = useState(false);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setStep(mode === "pending" ? "duplicates" : "upload");
    setSourceMode("file");
    setFile(null);
    setQuestionText("");
    setPastedText("");
    setCandidates([]);
    setSelectedTempIds([]);
    setStep2Result(null);
    setDuplicateBatchId(null);
    setDuplicateGroups([]);
    setSelectedBatchId(null);
    setSelectedItemsByGroup({});
    setError("");
    void loadPendingBatches(mode === "pending");
  }, [open, mode, focusItemId]);

  if (!open) return null;

  async function loadPendingBatches(activateAfterLoad = false) {
    setPendingLoading(true);
    try {
      const response = await getPendingDuplicateBatches();
      const batches = response.batches ?? [];
      setPendingBatches(batches);
      if (activateAfterLoad && batches.length) {
        const focusedBatch = findBatchByItemId(batches, focusItemId);
        activateDuplicateBatch(focusedBatch ?? batches[0]);
      }
    } catch (err) {
      if (activateAfterLoad) setError(getErrorMessage(err));
    } finally {
      setPendingLoading(false);
    }
  }

  function activateDuplicateBatch(batch: ExperiencePendingBatch) {
    setSelectedBatchId(batch.duplicateBatchId);
    setDuplicateBatchId(batch.duplicateBatchId);
    setDuplicateGroups(batch.duplicateGroups ?? []);
    setSelectedItemsByGroup(makeDefaultSelections(batch.duplicateGroups ?? []));
    setStep("duplicates");
    setError("");
  }

  function toggleTempId(id: number) {
    setSelectedTempIds((previous) =>
      previous.includes(id)
        ? previous.filter((candidateId) => candidateId !== id)
        : [...previous, id],
    );
  }

  function toggleDuplicateItem(groupId: string, itemId: string) {
    setSelectedItemsByGroup((previous) => {
      const current = previous[groupId] ?? [];
      return {
        ...previous,
        [groupId]: current.includes(itemId)
          ? current.filter((id) => id !== itemId)
          : [...current, itemId],
      };
    });
  }

  async function handleStep1() {
    const sourceFile =
      sourceMode === "file"
        ? file
        : pastedText.trim()
          ? new File(
              [
                questionText.trim()
                  ? `${questionText.trim()}\n\n${pastedText.trim()}`
                  : pastedText.trim(),
              ],
              `cover-letter-${Date.now()}.txt`,
              { type: "text/plain" },
            )
          : null;

    if (!sourceFile) {
      setError(
        sourceMode === "file"
          ? "자소서 파일을 먼저 선택해 주세요."
          : "자소서 답변을 붙여 넣어 주세요.",
      );
      return;
    }

    setError("");
    setLoading(true);
    try {
      const result = await extractExperienceStep1(sourceFile);
      setCandidates(result ?? []);
      setSelectedTempIds((result ?? []).map((candidate) => candidate.id));
      setStep("candidates");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleStep2() {
    if (selectedTempIds.length === 0) {
      setError("저장할 경험 후보를 하나 이상 선택해 주세요.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const result = await extractExperienceStep2(selectedTempIds);
      setStep2Result(result);

      const savedItems = (result.savedExperiences ?? []).map((experience) =>
        fromBackendExperience(experience),
      );
      if (savedItems.length) onCompleted(savedItems);

      setDuplicateBatchId(result.duplicateBatchId);
      setDuplicateGroups(result.duplicateGroups ?? []);
      setSelectedItemsByGroup(
        makeDefaultSelections(result.duplicateGroups ?? []),
      );
      setStep("result");
      await loadPendingBatches(false);
      onPendingChanged?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleStep3() {
    if (!duplicateBatchId) return;

    const groups = duplicateGroups.map((group) => ({
      groupId: group.groupId,
      selectedItemIds: selectedItemsByGroup[group.groupId] ?? [],
    }));

    if (groups.some((group) => group.selectedItemIds.length === 0)) {
      setError("각 중복 그룹에서 남길 경험을 하나 이상 선택해 주세요.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const result = await confirmExperienceStep3({ duplicateBatchId, groups });
      onCompleted(
        (result.selectedExperiences ?? []).map((experience) =>
          fromBackendExperience(experience),
        ),
      );
      await loadPendingBatches(false);
      onPendingChanged?.();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const modalWidth =
    step === "duplicates"
      ? "max-w-[920px]"
      : step === "upload"
        ? "max-w-[560px]"
        : "max-w-[720px]";

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/35 px-4 py-6 backdrop-blur-[1px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onClose();
      }}
    >
      <section
        className={`flex max-h-[94vh] w-full ${modalWidth} flex-col overflow-hidden rounded-xl border border-[#E3E8EF] bg-white shadow-[0_24px_60px_-16px_rgba(15,23,42,0.34)]`}
      >
        <header className="flex items-start justify-between border-b border-[#E3E8EF] px-6 py-4">
          <div>
            <h2 className="text-[16px] font-[700] text-[#161C26]">
              {mode === "pending" ? "비슷한 경험 정리" : "자소서 파일 불러오기"}
            </h2>
            <p className="mt-1 text-[13px] text-[#79859A]">
              {mode === "pending"
                ? "중복으로 분류된 경험에서 최종적으로 남길 내용을 선택하세요."
                : "파일이나 텍스트를 불러오면 AI가 경험 후보를 정리해요."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#79859A] hover:bg-[#EFF2F6] hover:text-[#28303D] disabled:opacity-40"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <ProgressBar step={step} />

        <main className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-[#F7D2D4] bg-[#FCEBEC] px-3 py-2.5 text-[12px] text-[#B5343A]">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p className="whitespace-pre-line">{error}</p>
            </div>
          )}

          {mode === "pending" && (
            <PendingDuplicatePanel
              batches={pendingBatches}
              loading={pendingLoading}
              selectedBatchId={selectedBatchId}
              onRefresh={() => void loadPendingBatches(false)}
              onSelect={activateDuplicateBatch}
            />
          )}

          {step === "upload" && (
            <UploadStep
              sourceMode={sourceMode}
              file={file}
              questionText={questionText}
              pastedText={pastedText}
              loading={loading}
              onChangeSourceMode={setSourceMode}
              onFileChange={setFile}
              onQuestionChange={setQuestionText}
              onTextChange={setPastedText}
              onCancel={onClose}
              onSubmit={() => void handleStep1()}
            />
          )}

          {step === "candidates" && (
            <CandidateStep
              candidates={candidates}
              selectedIds={selectedTempIds}
              loading={loading}
              onBack={() => setStep("upload")}
              onToggle={toggleTempId}
              onToggleAll={() =>
                setSelectedTempIds((previous) =>
                  previous.length === candidates.length
                    ? []
                    : candidates.map((candidate) => candidate.id),
                )
              }
              onSubmit={() => void handleStep2()}
              onDone={onClose}
            />
          )}

          {step === "result" && step2Result && (
            <Step2ResultStep
              result={step2Result}
              onGoDuplicates={() => setStep("duplicates")}
              onDone={onClose}
            />
          )}

          {step === "duplicates" && (
            <DuplicateStep
              groups={duplicateGroups}
              selectedItemsByGroup={selectedItemsByGroup}
              loading={loading}
              onToggle={toggleDuplicateItem}
              onSubmit={() => void handleStep3()}
            />
          )}
        </main>
      </section>
    </div>,
    document.body,
  );
}

function ProgressBar({ step }: { step: WizardStep }) {
  const current =
    step === "upload" || step === "candidates" ? 1 : step === "result" ? 2 : 3;
  const labels = ["후보 선택", "저장·분류", "중복 선택"];

  return (
    <div className="border-b border-[#E3E8EF] px-6 py-3">
      <div className="flex items-center">
        {labels.map((label, index) => {
          const no = index + 1;
          const completed = current > no;
          const active = current === no;
          return (
            <div
              key={label}
              className="flex min-w-0 flex-1 items-center last:flex-none"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-[700] ${completed || active ? "bg-[#2563EB] text-white" : "bg-[#EFF2F6] text-[#A4AEBE]"}`}
                >
                  {completed ? <Check className="h-3 w-3" /> : no}
                </span>
                <span
                  className={`whitespace-nowrap text-[11px] ${active ? "font-[600] text-[#28303D]" : "text-[#79859A]"}`}
                >
                  {label}
                </span>
              </div>
              {index < labels.length - 1 && (
                <span
                  className={`mx-3 h-px min-w-6 flex-1 ${current > no ? "bg-[#93C5FD]" : "bg-[#E3E8EF]"}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UploadStep({
  sourceMode,
  file,
  questionText,
  pastedText,
  loading,
  onChangeSourceMode,
  onFileChange,
  onQuestionChange,
  onTextChange,
  onCancel,
  onSubmit,
}: {
  sourceMode: SourceMode;
  file: File | null;
  questionText: string;
  pastedText: string;
  loading: boolean;
  onChangeSourceMode: (mode: SourceMode) => void;
  onFileChange: (file: File | null) => void;
  onQuestionChange: (value: string) => void;
  onTextChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const setDroppedFile = (list: FileList | null) => {
    const nextFile = list?.[0] ?? null;
    if (nextFile) onFileChange(nextFile);
  };

  return (
    <section>
      <div className="grid h-9 grid-cols-2 rounded-md bg-[#EFF2F6] p-1">
        <button
          type="button"
          onClick={() => onChangeSourceMode("file")}
          className={`rounded text-[12px] font-[500] transition-colors ${sourceMode === "file" ? "bg-white text-[#28303D] shadow-sm" : "text-[#79859A] hover:text-[#3E4859]"}`}
        >
          파일 업로드
        </button>
        <button
          type="button"
          onClick={() => onChangeSourceMode("text")}
          className={`rounded text-[12px] font-[500] transition-colors ${sourceMode === "text" ? "bg-white text-[#28303D] shadow-sm" : "text-[#79859A] hover:text-[#3E4859]"}`}
        >
          텍스트 붙여넣기
        </button>
      </div>

      {sourceMode === "file" ? (
        <div className="mt-4">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx,.hwp,.txt,application/pdf,text/plain"
            className="hidden"
            onChange={(event) => setDroppedFile(event.target.files)}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragEnter={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              setDroppedFile(event.dataTransfer.files);
            }}
            className={`flex min-h-[190px] w-full flex-col items-center justify-center rounded-lg border border-dashed px-6 text-center transition-colors ${dragging ? "border-[#2563EB] bg-[#EFF6FF]" : "border-[#CDD5E0] hover:bg-[#F6F8FB]"}`}
          >
            <Upload className="h-5 w-5 text-[#79859A]" />
            <p className="mt-2 text-[14px] text-[#28303D]">
              파일을 끌어다 놓거나 클릭하여 업로드
            </p>
            <p className="mt-1 text-[11px] text-[#79859A]">
              PDF, DOCX, HWP, TXT
            </p>
          </button>

          {file && (
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-[#E3E8EF] bg-[#F6F8FB] px-3 py-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-[#5A6678]">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-[600] text-[#28303D]">
                  {file.name}
                </p>
                <p className="mt-0.5 text-[10px] text-[#79859A]">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onFileChange(null)}
                className="flex h-6 w-6 items-center justify-center rounded text-[#79859A] hover:bg-white hover:text-[#28303D]"
                aria-label="파일 제거"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <input
            value={questionText}
            onChange={(event) => onQuestionChange(event.target.value)}
            placeholder="자소서 문항 (선택)"
            className="h-9 w-full rounded-md border border-[#E3E8EF] px-3 text-[13px] text-[#28303D] outline-none placeholder:text-[#A4AEBE] focus:border-[#93C5FD]"
          />
          <textarea
            value={pastedText}
            onChange={(event) => onTextChange(event.target.value)}
            placeholder="자소서 답변을 붙여넣어 주세요."
            className="min-h-[180px] w-full resize-none rounded-md border border-[#E3E8EF] px-3 py-2.5 text-[13px] leading-6 text-[#28303D] outline-none placeholder:text-[#A4AEBE] focus:border-[#93C5FD]"
          />
        </div>
      )}

      <div className="mt-5 flex items-center justify-end gap-2 border-t border-[#E3E8EF] pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="h-8 rounded-md border border-[#E3E8EF] px-3 text-[12px] font-[500] text-[#5A6678] hover:bg-[#F6F8FB] disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#2563EB] px-4 text-[12px] font-[600] text-white hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:bg-[#A4AEBE]"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          업로드하고 추출하기
        </button>
      </div>
    </section>
  );
}

function CandidateStep({
  candidates,
  selectedIds,
  loading,
  onBack,
  onToggle,
  onToggleAll,
  onSubmit,
  onDone,
}: {
  candidates: ExperienceTempResponse[];
  selectedIds: number[];
  loading: boolean;
  onBack: () => void;
  onToggle: (id: number) => void;
  onToggleAll: () => void;
  onSubmit: () => void;
  onDone: () => void;
}) {
  const allChecked =
    candidates.length > 0 && selectedIds.length === candidates.length;

  return (
    <section>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[15px] font-[600] text-[#28303D]">
            추출된 경험 후보
          </h3>
          <p className="mt-1 text-[12px] text-[#79859A]">
            자소서에서 {candidates.length}개의 경험을 찾았어요. 저장할 항목을
            선택하세요.
          </p>
        </div>
        {candidates.length > 0 && (
          <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-[#79859A]">
            <CheckBox checked={allChecked} />
            <input
              type="checkbox"
              checked={allChecked}
              onChange={onToggleAll}
              className="sr-only"
            />
            전체 선택
          </label>
        )}
      </div>

      {candidates.length === 0 ? (
        <EmptyBox text="추출된 경험 후보가 없습니다." />
      ) : (
        <div className="mt-4 space-y-2">
          {candidates.map((candidate) => {
            const checked = selectedIds.includes(candidate.id);
            return (
              <button
                key={candidate.id}
                type="button"
                onClick={() => onToggle(candidate.id)}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${checked ? "border-[#93C5FD] bg-[#EFF6FF]" : "border-[#E3E8EF] hover:bg-[#F6F8FB]"}`}
              >
                <CheckBox checked={checked} />
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 rounded bg-[#EFF2F6] px-1.5 py-0.5 text-[10px] text-[#5A6678]">
                      {fromBackendExperienceType(candidate.experienceType)}
                    </span>
                    <span className="truncate text-[13px] font-[600] text-[#28303D]">
                      {candidate.experienceName}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#79859A]">
                    {fromBackendExperienceGroup(candidate.experienceGroup)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between border-t border-[#E3E8EF] pt-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-[12px] text-[#79859A] hover:bg-[#F6F8FB] hover:text-[#28303D]"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> 파일 다시 선택
        </button>
        {candidates.length === 0 ? (
          <button
            type="button"
            onClick={onDone}
            className="h-8 rounded-md bg-[#2563EB] px-4 text-[12px] font-[600] text-white"
          >
            완료
          </button>
        ) : (
          <button
            type="button"
            disabled={loading || selectedIds.length === 0}
            onClick={onSubmit}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#2563EB] px-4 text-[12px] font-[600] text-white hover:bg-[#1D4ED8] disabled:bg-[#A4AEBE]"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            선택한 {selectedIds.length}개 정리하기
          </button>
        )}
      </div>
    </section>
  );
}

function Step2ResultStep({
  result,
  onGoDuplicates,
  onDone,
}: {
  result: ExperienceStep2Response;
  onGoDuplicates: () => void;
  onDone: () => void;
}) {
  const saved = result.savedExperiences ?? [];
  const groups = result.duplicateGroups ?? [];

  return (
    <section>
      <h3 className="text-[15px] font-[600] text-[#28303D]">경험 저장 결과</h3>
      <p className="mt-1 text-[12px] text-[#79859A]">
        새 경험은 바로 저장하고, 비슷한 경험은 확인할 수 있도록 분류했어요.
      </p>

      <div className="mt-4 rounded-lg border border-[#E3E8EF]">
        <div className="flex items-center justify-between border-b border-[#E3E8EF] px-4 py-3">
          <span className="text-[13px] font-[600] text-[#28303D]">
            새로 저장된 경험
          </span>
          <span className="rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[11px] font-[600] text-[#2563EB]">
            {saved.length}
          </span>
        </div>
        {saved.length === 0 ? (
          <p className="px-4 py-5 text-center text-[12px] text-[#A4AEBE]">
            새로 저장된 경험이 없습니다.
          </p>
        ) : (
          <div className="divide-y divide-[#E3E8EF]">
            {saved.map((rawItem) => {
              const item = fromBackendExperience(rawItem);
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <span className="rounded bg-[#EFF2F6] px-1.5 py-0.5 text-[10px] text-[#5A6678]">
                    {item.type}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-[500] text-[#28303D]">
                    {item.name}
                  </span>
                  <Check className="h-3.5 w-3.5 text-[#15926A]" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-3 rounded-lg border border-[#F8E4BD]">
        <div className="flex items-center justify-between border-b border-[#F8E4BD] px-4 py-3">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-[600] text-[#28303D]">
            <Layers className="h-3.5 w-3.5 text-[#C5860E]" /> 비슷한 경험
          </span>
          <span className="rounded-full bg-[#FCF3E2] px-2 py-0.5 text-[11px] font-[600] text-[#A56F08]">
            {groups.length}
          </span>
        </div>
        <p className="px-4 py-3 text-[12px] text-[#79859A]">
          {groups.length > 0
            ? "기존 경험과 비슷한 항목이 있어 최종 선택이 필요해요."
            : "비슷한 경험이 없어 모든 항목을 저장했어요."}
        </p>
      </div>

      <div className="mt-5 flex justify-end gap-2 border-t border-[#E3E8EF] pt-4">
        {groups.length === 0 ? (
          <button
            type="button"
            onClick={onDone}
            className="h-8 rounded-md bg-[#2563EB] px-4 text-[12px] font-[600] text-white"
          >
            완료
          </button>
        ) : (
          <button
            type="button"
            onClick={onGoDuplicates}
            className="h-8 rounded-md bg-[#2563EB] px-4 text-[12px] font-[600] text-white hover:bg-[#1D4ED8]"
          >
            비슷한 경험 확인하기
          </button>
        )}
      </div>
    </section>
  );
}

function DuplicateStep({
  groups,
  selectedItemsByGroup,
  loading,
  onToggle,
  onSubmit,
}: {
  groups: DuplicateGroupResponse[];
  selectedItemsByGroup: Record<string, string[]>;
  loading: boolean;
  onToggle: (groupId: string, itemId: string) => void;
  onSubmit: () => void;
}) {
  if (groups.length === 0)
    return <EmptyBox text="선택할 비슷한 경험이 없습니다." />;

  return (
    <section>
      <h3 className="text-[15px] font-[600] text-[#28303D]">
        비슷한 경험 최종 선택
      </h3>
      <p className="mt-1 text-[12px] text-[#79859A]">
        각 그룹에서 남길 경험을 선택하세요. 여러 개를 선택하면 모두 유지됩니다.
      </p>

      <div className="mt-4 space-y-4">
        {groups.map((group, index) => (
          <section
            key={group.groupId}
            className="overflow-hidden rounded-lg border border-[#E3E8EF]"
          >
            <header className="flex items-center justify-between bg-[#F6F8FB] px-4 py-2.5">
              <span className="text-[12px] font-[600] text-[#3E4859]">
                비슷한 경험 {index + 1}
              </span>
              <span className="text-[11px] text-[#79859A]">
                선택 {(selectedItemsByGroup[group.groupId] ?? []).length}개
              </span>
            </header>
            <div className="grid gap-3 p-3 md:grid-cols-2">
              {group.items.map((duplicateItem) => {
                const checked = (
                  selectedItemsByGroup[group.groupId] ?? []
                ).includes(duplicateItem.itemId);
                const item = fromSnapshotExperience(
                  duplicateItem.itemId,
                  duplicateItem.experience,
                );
                return (
                  <button
                    key={duplicateItem.itemId}
                    type="button"
                    onClick={() =>
                      onToggle(group.groupId, duplicateItem.itemId)
                    }
                    className={`relative min-h-[150px] rounded-lg border p-4 text-left transition-colors ${checked ? "border-[#93C5FD] bg-[#EFF6FF]" : "border-[#E3E8EF] hover:bg-[#F6F8FB]"}`}
                  >
                    <span className="absolute right-3 top-3">
                      <CheckBox checked={checked} />
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 pr-7">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] ${duplicateItem.source === "EXISTING" ? "bg-[#EFF2F6] text-[#5A6678]" : "bg-[#DBEAFE] text-[#2563EB]"}`}
                      >
                        {duplicateItem.source === "EXISTING"
                          ? "기존 경험"
                          : "새로 추출"}
                      </span>
                      {typeof duplicateItem.similarity === "number" && (
                        <span className="rounded bg-[#FCF3E2] px-1.5 py-0.5 text-[10px] text-[#A56F08]">
                          유사도 {Math.round(duplicateItem.similarity * 100)}%
                        </span>
                      )}
                    </div>
                    <p className="mt-3 line-clamp-1 text-[14px] font-[600] text-[#28303D]">
                      {item.name}
                    </p>
                    <p className="mt-1 text-[11px] text-[#79859A]">
                      {item.type} · {item.status}
                    </p>
                    {item.fields.__body && (
                      <p className="mt-3 line-clamp-3 whitespace-pre-line text-[11px] leading-5 text-[#5A6678]">
                        {item.fields.__body}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-5 flex justify-end border-t border-[#E3E8EF] pt-4">
        <button
          type="button"
          disabled={loading}
          onClick={onSubmit}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#2563EB] px-4 text-[12px] font-[600] text-white hover:bg-[#1D4ED8] disabled:bg-[#A4AEBE]"
        >
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          선택 반영하기
        </button>
      </div>
    </section>
  );
}

function PendingDuplicatePanel({
  batches,
  loading,
  selectedBatchId,
  onRefresh,
  onSelect,
}: {
  batches: ExperiencePendingBatch[];
  loading: boolean;
  selectedBatchId: string | null;
  onRefresh: () => void;
  onSelect: (batch: ExperiencePendingBatch) => void;
}) {
  return (
    <div className="mb-4 rounded-lg border border-[#E3E8EF] bg-[#F6F8FB] p-3">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[12px] font-[600] text-[#3E4859]">
          <Layers className="h-3.5 w-3.5" /> 미처리 중복 경험
        </span>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex h-6 items-center gap-1 rounded px-2 text-[10px] text-[#79859A] hover:bg-white"
        >
          <RotateCcw className="h-3 w-3" /> 새로고침
        </button>
      </div>
      {loading ? (
        <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-[#79859A]">
          <Loader2 className="h-3 w-3 animate-spin" /> 조회 중
        </p>
      ) : batches.length === 0 ? (
        <p className="mt-2 text-[11px] text-[#A4AEBE]">
          현재 미처리 항목이 없습니다.
        </p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {batches.map((batch, index) => (
            <button
              key={batch.duplicateBatchId}
              type="button"
              onClick={() => onSelect(batch)}
              className={`rounded-md border px-2 py-1 text-[10px] ${selectedBatchId === batch.duplicateBatchId ? "border-[#93C5FD] bg-white text-[#2563EB]" : "border-[#E3E8EF] bg-white text-[#5A6678]"}`}
            >
              Batch {index + 1} · {batch.duplicateGroups.length}그룹
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border ${checked ? "border-[#2563EB] bg-[#2563EB]" : "border-[#CDD5E0] bg-white"}`}
    >
      {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
    </span>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="mt-4 rounded-lg border border-dashed border-[#CDD5E0] bg-[#F6F8FB] py-10 text-center text-[12px] text-[#A4AEBE]">
      {text}
    </div>
  );
}

function makeDefaultSelections(groups: DuplicateGroupResponse[]) {
  const result: Record<string, string[]> = {};
  groups.forEach((group) => {
    const existing = group.items.find((item) => item.source === "EXISTING");
    result[group.groupId] = existing
      ? [existing.itemId]
      : group.items.slice(0, 1).map((item) => item.itemId);
  });
  return result;
}

function findBatchByItemId(
  batches: ExperiencePendingBatch[],
  itemId?: string | number | null,
) {
  if (itemId == null) return null;
  const normalizedId = String(itemId);
  return (
    batches.find((batch) =>
      batch.duplicateGroups.some((group) =>
        group.items.some((item) => item.itemId === normalizedId),
      ),
    ) ?? null
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message) as {
        message?: string;
        error?: string;
      };
      return parsed.message ?? parsed.error ?? error.message;
    } catch {
      return error.message;
    }
  }
  return "요청 처리 중 오류가 발생했습니다.";
}
