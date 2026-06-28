import ModalLayout from "./ModalLayout";

// MainScreen의 데이터 구조에 맞춘 인터페이스 정의
// '개인화 맞춤 정보' 가 직접입력이 아닌 URL/PDF/이미지 등으로 확장될 수 있도록 tier2Content로 통합
interface CompanyData {
  company: string;
  deadlineDate?: string;
  position?: string;
  industry?: string;
  jobTitle?: string;
  scale?: string;        
  tier2Content?: string; 
}

interface CompanyInfoProps {
  isOpen: boolean;
  onClose: () => void;
  data: CompanyData; 
}

export default function CompanyInfo({ isOpen, onClose, data }: CompanyInfoProps) {
  return (
    <ModalLayout isOpen={isOpen} onClose={onClose} title={`${data.company} 공고 정보`}>
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        
        {/* TIER 1 섹션: 필수 정보 */}
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 relative">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-900">TIER 1: 무조건 보는 정보</h3>
            <button className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
              <span>✏️</span> 수정
            </button>
          </div>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• 공고명: <span className="font-medium text-gray-800">{data.jobTitle || "정보 없음"}</span></li>
            <li>• 지원 일정 마감: <span className="font-medium text-gray-800">{data.deadlineDate ? data.deadlineDate.split('T')[0] : "정보 없음"}</span></li>
            <li>• 지원 직무: <span className="font-medium text-gray-800">{data.jobTitle || "정보 없음"} ({data.position || "정보 없음"})</span></li>
            <li>• 산업군: <span className="font-medium text-gray-800">{data.industry || "정보 없음"}</span></li>
          </ul>
        </div>

        {/* TIER 2 섹션: 개인화 맞춤 핵심 정보 */}
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-900">TIER 2: 개인화 맞춤 핵심 정보</h3>
            <button className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
              <span>✏️</span> 수정
            </button>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            {data.tier2Content || "등록된 맞춤 정보가 없습니다. 본인이 궁금한 정보를 직접 메모해 보세요."}
          </p>
        </div>

        {/* 하단 푸터 문구 */}
        <p className="text-[11px] text-gray-300 text-center mt-4">
          공고에 명시되지 않았지만 궁금한 점은 직접 채워 넣을 수 있습니다.
        </p>
      </div>
    </ModalLayout>
  );
}