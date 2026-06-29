import { LinkIcon } from "../../../assets";

export default function ApplyInput({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-2 flex items-center justify-between">
      <LinkIcon size={25} className="ml-7 mr-5 text-[#94A3B8]" />
      <input
        placeholder="채용 공고 URL을 붙여넣으세요"
        className="flex-1 outline-none text-base text-[#94A3B8] font-regular"
      />
      <button
        onClick={onAdd}
        className="ml-4 px-4 py-2 bg-[#2563EB] text-[#FFFFFC] rounded-lg text-[14px] font-[600] mr-5 hover:bg-blue-700"
      >
        + 공고등록
      </button>
    </div>
  );
}
