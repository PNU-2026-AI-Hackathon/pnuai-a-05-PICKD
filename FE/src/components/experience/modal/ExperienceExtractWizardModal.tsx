import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  Check,
  ChevronRight,
  FileUp,
  Layers,
  Loader2,
  RotateCcw,
  Sparkles,
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

export default function ExperienceExtractWizardModal({
  open,
  mode = "extract",
  focusItemId,
  onClose,
  onCompleted,
  onPendingChanged,
}: Props) {
  const [step, setStep] = useState<WizardStep>("upload");
  const [file, setFile] = useState<File | null>(null);
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
    setFile(null);
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

  const hasDuplicates = duplicateBatchId && duplicateGroups.length > 0;

  if (!open) return null;

  async function loadPendingBatches(activateAfterLoad = false) {
    setPendingLoading(true);
    try {
      const response = await getPendingDuplicateBatches();
      setPendingBatches(response.batches ?? []);
      if (activateAfterLoad && response.batches?.length) {
        const focusedBatch = findBatchByItemId(response.batches, focusItemId);
        activateDuplicateBatch(focusedBatch ?? response.batches[0]);
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
  }

  function toggleTempId(id: number) {
    setSelectedTempIds((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id],
    );
  }

  function toggleDuplicateItem(groupId: string, itemId: string) {
    setSelectedItemsByGroup((prev) => {
      const current = prev[groupId] ?? [];
      const next = current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId];

      return {
        ...prev,
        [groupId]: next,
      };
    });
  }

  async function handleStep1() {
    if (!file) {
      setError("자소서 PDF/문서 파일을 먼저 선택해 주세요.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const result = await extractExperienceStep1(file);
      setCandidates(result ?? []);
      setSelectedTempIds((result ?? []).map((item) => item.id));
      setStep("candidates");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleStep2() {
    if (selectedTempIds.length === 0) {
      setError("상세 추출할 경험 후보를 하나 이상 선택해 주세요.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const result = await extractExperienceStep2(selectedTempIds);
      setStep2Result(result);

      const savedItems = (result.savedExperiences ?? []).map((item) =>
        fromBackendExperience(item),
      );
      if (savedItems.length > 0) onCompleted(savedItems);

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
      setError("각 중복 그룹마다 남길 경험을 하나 이상 선택해 주세요.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const result = await confirmExperienceStep3({ duplicateBatchId, groups });
      onCompleted(
        (result.selectedExperiences ?? []).map((item) =>
          fromBackendExperience(item),
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

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 px-4 py-8"
      onClick={onClose}
    >
      <section
        className="flex max-h-[92vh] w-full max-w-[1080px] flex-col overflow-hidden rounded-[22px] border border-[#D8E4F5] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.28)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-5 border-b border-[#E2E8F0] px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#EFF6FF] text-[#2563EB]">
                <Sparkles size={18} />
              </span>
              <div>
                <h2 className="text-[20px] font-[900] text-[#0F172A]">
                  자소서에서 경험 추출
                </h2>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#64748B] transition hover:bg-[#F8FAFC]"
          >
            <X size={20} />
          </button>
        </header>

        <div className="border-b border-[#E2E8F0] px-6 py-4">
          <ProgressBar step={step} hasDuplicates={Boolean(hasDuplicates)} />
        </div>

        <main className="min-h-0 flex-1 overflow-y-auto bg-[#F8FAFC] px-6 py-5">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-[14px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] font-[700] text-[#B91C1C]">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <p className="whitespace-pre-line">{error}</p>
            </div>
          )}

          <PendingDuplicatePanel
            batches={pendingBatches}
            loading={pendingLoading}
            selectedBatchId={selectedBatchId}
            onRefresh={() => loadPendingBatches(false)}
            onSelect={activateDuplicateBatch}
          />

          {step === "upload" && (
            <UploadStep
              file={file}
              loading={loading}
              onFileChange={setFile}
              onSubmit={handleStep1}
            />
          )}

          {step === "candidates" && (
            <CandidateStep
              candidates={candidates}
              selectedIds={selectedTempIds}
              loading={loading}
              onBack={() => setStep("upload")}
              onToggle={toggleTempId}
              onSubmit={handleStep2}
              onDone={() => {
                onCompleted([]);
                onClose();
              }}
            />
          )}

          {step === "result" && step2Result && (
            <Step2ResultStep
              result={step2Result}
              loading={loading}
              onGoDuplicates={() => setStep("duplicates")}
              onDone={onClose}
            />
          )}

          {step === "duplicates" && (
            <DuplicateStep
              duplicateBatchId={duplicateBatchId}
              groups={duplicateGroups}
              selectedItemsByGroup={selectedItemsByGroup}
              loading={loading}
              onToggle={toggleDuplicateItem}
              onSubmit={handleStep3}
            />
          )}
        </main>
      </section>
    </div>,
    document.body,
  );
}

function ProgressBar({
  step,
  hasDuplicates,
}: {
  step: WizardStep;
  hasDuplicates: boolean;
}) {
  const current =
    step === "upload"
      ? 1
      : step === "candidates"
        ? 1
        : step === "result"
          ? 2
          : 3;
  const steps = [
    { no: 1, label: "후보 추출" },
    { no: 2, label: "저장/중복 분류" },
    { no: 3, label: hasDuplicates ? "중복 최종 선택" : "중복 없음" },
  ];

  return (
    <div className="flex items-center gap-2">
      {steps.map((item, index) => {
        const active = current >= item.no;
        return (
          <div key={item.no} className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-[900] ${
                active
                  ? "bg-[#2563EB] text-white"
                  : "bg-[#E2E8F0] text-[#64748B]"
              }`}
            >
              {active && current > item.no ? <Check size={14} /> : item.no}
            </span>
            <span
              className={`text-[13px] font-[800] ${
                active ? "text-[#0F172A]" : "text-[#94A3B8]"
              }`}
            >
              {item.label}
            </span>
            {index < steps.length - 1 && (
              <ChevronRight size={16} className="text-[#CBD5E1]" />
            )}
          </div>
        );
      })}
    </div>
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
    <section className="mb-5 rounded-[18px] border border-[#D8E4F5] bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[15px] font-[900] text-[#0F172A]">
            <Layers size={17} className="text-[#2563EB]" />
            미처리 중복 경험
          </p>
          <p className="mt-1 text-[12px] font-[600] text-[#64748B]">
            Step3 선택 화면을 닫거나 새로고침했을 때 여기서 다시 복구할 수
            있어요.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#E2E8F0] px-3 text-[12px] font-[800] text-[#64748B] hover:bg-[#F8FAFC]"
        >
          <RotateCcw size={13} />
          새로고침
        </button>
      </div>

      {loading ? (
        <div className="mt-3 flex items-center gap-2 text-[13px] font-[700] text-[#64748B]">
          <Loader2 size={15} className="animate-spin" /> 조회 중...
        </div>
      ) : batches.length === 0 ? (
        <p className="mt-3 rounded-[12px] bg-[#F8FAFC] px-3 py-2 text-[13px] font-[700] text-[#94A3B8]">
          현재 미처리 중복 경험이 없습니다.
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {batches.map((batch, index) => (
            <button
              key={batch.duplicateBatchId}
              type="button"
              onClick={() => onSelect(batch)}
              className={`rounded-[12px] border px-3 py-2 text-left transition ${
                selectedBatchId === batch.duplicateBatchId
                  ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                  : "border-[#E2E8F0] bg-white text-[#334155] hover:border-[#BFDBFE]"
              }`}
            >
              <p className="text-[12px] font-[900]">Batch {index + 1}</p>
              <p className="mt-1 text-[11px] font-[700] opacity-80">
                중복 그룹 {batch.duplicateGroups.length}개 ·{" "}
                {formatDate(batch.createdAt)}
              </p>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function UploadStep({
  file,
  loading,
  onFileChange,
  onSubmit,
}: {
  file: File | null;
  loading: boolean;
  onFileChange: (file: File | null) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="rounded-[20px] border border-[#E2E8F0] bg-white p-6">
      <p className="text-[17px] font-[900] text-[#0F172A]">
        Step1. 자소서 파일 업로드
      </p>
      <p className="mt-2 text-[14px] font-[600] leading-6 text-[#64748B]">
        자소서 PDF/문서 파일을 올리면 AI가 경험 후보 목록을 추출합니다.
      </p>

      <label className="mt-6 flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-[18px] border-2 border-dashed border-[#BFDBFE] bg-[#EFF6FF]/45 px-6 text-center transition hover:bg-[#EFF6FF]">
        <FileUp size={40} className="text-[#2563EB]" />
        <p className="mt-4 text-[15px] text-[#0F172A]">
          {file ? file.name : "자소서 파일을 선택해 주세요"}
        </p>
        <input
          type="file"
          accept=".pdf,.doc,.docx,.hwp,.txt,application/pdf"
          className="sr-only"
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        />
      </label>

      <button
        type="button"
        disabled={loading}
        onClick={onSubmit}
        className="mt-5 inline-flex h-11 items-center gap-2 rounded-[12px] bg-[#2563EB] px-5 text-[14px] font-[900] text-white transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:bg-[#94A3B8]"
      >
        {loading ? (
          <Loader2 size={17} className="animate-spin" />
        ) : (
          <Sparkles size={17} />
        )}
        AI 후보 추출하기
      </button>
    </div>
  );
}

function CandidateStep({
  candidates,
  selectedIds,
  loading,
  onBack,
  onToggle,
  onSubmit,
  onDone,
}: {
  candidates: ExperienceTempResponse[];
  selectedIds: number[];
  loading: boolean;
  onBack: () => void;
  onToggle: (id: number) => void;
  onSubmit: () => void;
  onDone: () => void;
}) {
  return (
    <section className="rounded-[20px] border border-[#E2E8F0] bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[17px] font-[900] text-[#0F172A]">
            Step1 결과. 경험 후보 선택
          </p>
        </div>
        <div className="text-right text-[12px] font-[800] text-[#2563EB]">
          선택 {selectedIds.length}개 / 전체 {candidates.length}개
        </div>
      </div>

      {candidates.length === 0 ? (
        <div>
          <EmptyBox text="추출된 경험 후보가 없습니다." />
          <p className="mt-3 text-center text-[13px] font-[700] text-[#64748B]">
            저장할 경험 후보가 없어서 상세 추출 단계는 건너뜁니다.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          {candidates.map((candidate) => {
            const selectedIndex = selectedIds.indexOf(candidate.id);
            const checked = selectedIndex >= 0;
            return (
              <button
                key={candidate.id}
                type="button"
                onClick={() => onToggle(candidate.id)}
                className={`rounded-[16px] border p-4 text-left transition ${
                  checked
                    ? "border-[#2563EB] bg-[#EFF6FF]"
                    : "border-[#E2E8F0] bg-white hover:border-[#BFDBFE]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border ${
                      checked
                        ? "border-[#2563EB] bg-[#2563EB]"
                        : "border-[#CBD5E1] bg-white"
                    }`}
                  >
                    {checked && (
                      <Check size={13} strokeWidth={3} className="text-white" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="mt-3 text-[15px] font-[900] text-[#0F172A]">
                      {candidate.experienceName}
                    </p>
                    <p className="mt-2 text-[12px] font-[800] text-[#64748B]">
                      {fromBackendExperienceType(candidate.experienceType)} ·{" "}
                      {fromBackendExperienceGroup(candidate.experienceGroup)}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
      <div className="mt-5 flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="h-10 rounded-[10px] border border-[#E2E8F0] px-4 text-[13px] font-[900] text-[#64748B] hover:bg-[#F8FAFC]"
        >
          파일 다시 선택
        </button>

        {candidates.length === 0 ? (
          <button
            type="button"
            onClick={onDone}
            className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[#2563EB] px-4 text-[13px] font-[900] text-white hover:bg-[#1D4ED8]"
          >
            완료
          </button>
        ) : (
          <button
            type="button"
            disabled={loading || selectedIds.length === 0}
            onClick={onSubmit}
            className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[#2563EB] px-4 text-[13px] font-[900] text-white hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:bg-[#94A3B8]"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            선택 후보 상세 추출
          </button>
        )}
      </div>
    </section>
  );
}

function Step2ResultStep({
  result,
  loading,
  onGoDuplicates,
  onDone,
}: {
  result: ExperienceStep2Response;
  loading: boolean;
  onGoDuplicates: () => void;
  onDone: () => void;
}) {
  const saved = result.savedExperiences ?? [];
  const groups = result.duplicateGroups ?? [];

  return (
    <section className="space-y-5">
      <div className="rounded-[20px] border border-[#BFDBFE] bg-white p-5">
        <p className="text-[17px] font-[900] text-[#0F172A]">
          Step2 결과. 저장 / 중복 분류
        </p>
      </div>

      <section className="rounded-[18px] border border-[#D8E4F5] bg-white p-5">
        <div className="flex items-center justify-between">
          <p className="text-[15px] font-[900] text-[#0F172A]">
            비중복 경험은 바로 저장되었습니다.
          </p>
          <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-[12px] font-[900] text-[#2563EB]">
            {saved.length}개
          </span>
        </div>
        {saved.length === 0 ? (
          <EmptyBox text="즉시 저장된 경험이 없습니다." />
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {saved.map((item) => (
              <SmallExperienceCard
                key={item.id}
                item={fromBackendExperience(item)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[18px] border border-[#FED7AA] bg-white p-5">
        <div className="flex items-center justify-between">
          <p className="text-[15px] font-[900] text-[#0F172A]">
            중복 후보 그룹
          </p>
          <span className="rounded-full bg-[#FFF7ED] px-3 py-1 text-[12px] font-[900] text-[#EA580C]">
            {groups.length}개
          </span>
        </div>

        {groups.length === 0 ? (
          <div className="mt-4 rounded-[14px] border border-[#DCFCE7] bg-[#F0FDF4] p-4 text-[13px] font-[800] text-[#15803D]">
            중복 후보가 없어 Step2에서 완료되었습니다.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {groups.map((group) => (
              <div
                key={group.groupId}
                className="rounded-[14px] border border-[#FED7AA] bg-[#FFF7ED] p-4"
              >
                <p className="mt-1 text-[12px] font-[700] text-[#C2410C]">
                  선택 가능 항목 {group.items.length}개
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex justify-end gap-2">
        {groups.length === 0 ? (
          <button
            type="button"
            onClick={onDone}
            className="h-10 rounded-[10px] bg-[#2563EB] px-5 text-[13px] font-[900] text-white hover:bg-[#1D4ED8]"
          >
            완료
          </button>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={onGoDuplicates}
            className="h-10 rounded-[10px] bg-[#EA580C] px-5 text-[13px] font-[900] text-white hover:bg-[#C2410C] disabled:bg-[#FDBA74]"
          >
            중복 최종 선택으로 이동
          </button>
        )}
      </div>
    </section>
  );
}

function DuplicateStep({
  duplicateBatchId,
  groups,
  selectedItemsByGroup,
  loading,
  onToggle,
  onSubmit,
}: {
  duplicateBatchId: string | null;
  groups: DuplicateGroupResponse[];
  selectedItemsByGroup: Record<string, string[]>;
  loading: boolean;
  onToggle: (groupId: string, itemId: string) => void;
  onSubmit: () => void;
}) {
  if (!duplicateBatchId || groups.length === 0) {
    return <EmptyBox text="선택할 중복 경험 batch가 없습니다." />;
  }

  return (
    <section className="space-y-5">
      <div className="rounded-[20px] border border-[#FED7AA] bg-white p-5">
        <p className="text-[17px] font-[900] text-[#0F172A]">
          Step3. 중복 경험 최종 선택
        </p>
        <p className="mt-2 text-[13px] font-[600] text-[#64748B]">
          duplicateBatchId:{" "}
          <span className="font-[900] text-[#EA580C]">{duplicateBatchId}</span>
        </p>
        <p className="mt-1 text-[13px] font-[600] text-[#64748B]">
          각 그룹에서 최종적으로 남길 경험을 선택하세요. 여러 개 선택하면 모두 유지됩니다.
        </p>
      </div>

      {groups.map((group, index) => (
        <section
          key={group.groupId}
          className="rounded-[18px] border border-[#E2E8F0] bg-white p-5"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[15px] font-[900] text-[#0F172A]">
                중복 그룹 {index + 1}
              </p>
            </div>
            <span className="rounded-full bg-[#F8FAFC] px-3 py-1 text-[12px] font-[900] text-[#64748B]">
              선택 {(selectedItemsByGroup[group.groupId] ?? []).length}개
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {group.items.map((item) => {
              const checked = (
                selectedItemsByGroup[group.groupId] ?? []
              ).includes(item.itemId);
              const snapshotItem = fromSnapshotExperience(
                item.itemId,
                item.experience,
              );
              return (
                <button
                  key={item.itemId}
                  type="button"
                  onClick={() => onToggle(group.groupId, item.itemId)}
                  className={`rounded-[16px] border p-4 text-left transition ${
                    checked
                      ? "border-[#2563EB] bg-[#EFF6FF]"
                      : "border-[#E2E8F0] bg-white hover:border-[#BFDBFE]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border ${
                        checked
                          ? "border-[#2563EB] bg-[#2563EB]"
                          : "border-[#CBD5E1] bg-white"
                      }`}
                    >
                      {checked && (
                        <Check
                          size={13}
                          strokeWidth={3}
                          className="text-white"
                        />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-[900] ${
                            item.source === "EXISTING"
                              ? "bg-[#F1F5F9] text-[#475569]"
                              : "bg-[#DBEAFE] text-[#2563EB]"
                          }`}
                        >
                          {item.source === "EXISTING"
                            ? "기존 경험"
                            : "추출 draft"}
                        </span>
                        {typeof item.similarity === "number" && (
                          <span className="rounded-full bg-[#FFF7ED] px-2 py-1 text-[11px] font-[900] text-[#EA580C]">
                            유사도 {Math.round(item.similarity * 100)}%
                          </span>
                        )}
                      </div>

                      <p className="mt-3 break-all text-[11px] font-[800] text-[#94A3B8]">
                        itemId: {item.itemId}
                      </p>
                      <p className="mt-2 text-[15px] font-[900] text-[#0F172A]">
                        {snapshotItem.name}
                      </p>
                      <p className="mt-1 text-[12px] font-[800] text-[#64748B]">
                        {snapshotItem.type} · {snapshotItem.status}
                      </p>

                      {snapshotItem.keywords.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {snapshotItem.keywords.slice(0, 5).map((keyword) => (
                            <span
                              key={keyword}
                              className="rounded-full bg-white px-2 py-1 text-[11px] font-[800] text-[#475569]"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}

                      {snapshotItem.fields.__body && (
                        <p className="mt-3 line-clamp-4 whitespace-pre-line rounded-[12px] bg-white/70 p-3 text-[12px] font-[600] leading-5 text-[#475569]">
                          {snapshotItem.fields.__body}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      <div className="flex justify-end">
        <button
          type="button"
          disabled={loading}
          onClick={onSubmit}
          className="inline-flex h-11 items-center gap-2 rounded-[12px] bg-[#2563EB] px-5 text-[14px] font-[900] text-white hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:bg-[#94A3B8]"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          선택 반영하기
        </button>
      </div>
    </section>
  );
}

function SmallExperienceCard({ item }: { item: ExperienceItem }) {
  return (
    <article className="rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] p-4">
      <p className="text-[12px] font-[900] text-[#2563EB]">{item.type}</p>
      <p className="mt-1 text-[15px] font-[900] text-[#0F172A]">{item.name}</p>
      <p className="mt-1 text-[12px] font-[700] text-[#64748B]">
        {[item.org || item.fields.org, item.period || item.fields.period]
          .filter(Boolean)
          .join(" · ") || "상세 정보 없음"}
      </p>
      {item.keywords.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.keywords.slice(0, 4).map((keyword) => (
            <span
              key={keyword}
              className="rounded-full bg-white px-2 py-1 text-[11px] font-[800] text-[#475569]"
            >
              {keyword}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="mt-4 rounded-[14px] border border-dashed border-[#CBD5E1] bg-[#F8FAFC] py-10 text-center text-[13px] font-[800] text-[#94A3B8]">
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

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
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
