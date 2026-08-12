import { Plus, Search } from "lucide-react";

export default function ApplyInput({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#E3E8EF] bg-white px-4 py-2 shadow-[0_1px_2px_rgba(22,28,38,0.05)]">
      <Search className="h-3.5 w-3.5 shrink-0 text-[#79859A]" strokeWidth={2} />
      <input
        placeholder="채용공고 검색하기"
        className="h-7 flex-1 bg-transparent px-0 text-sm text-[#28303D] outline-none placeholder:text-[#A4AEBE]"
      />
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2563EB]"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.2} />
        공고 등록
      </button>
    </div>
  );
}
