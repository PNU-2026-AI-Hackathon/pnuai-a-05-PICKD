import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import {
  CalendarIcon,
  DashboardIcon,
  DocumentIcon,
  PortfolioIcon,
} from "../assets";

const FEATURES = [
  {
    icon: DashboardIcon,
    size: 16,
    color: "#2563EB",
    bg: "#EFF6FF",
    title: "공고 관리",
    description:
      "지원할 공고를 등록하고 전형 단계, 마감일, 메모를 한곳에서 관리할 수 있어요.",
  },
  {
    icon: PortfolioIcon,
    size: 20,
    color: "#2563EB",
    bg: "#EFF6FF",
    title: "경험 관리",
    description:
      "활동, 자격증, 수상 경력을 정리해두면 자기소개서를 쓸 때 바로 꺼내 쓸 수 있어요.",
  },
  {
    icon: CalendarIcon,
    size: 16,
    color: "#2563EB",
    bg: "#EFF6FF",
    title: "캘린더 연동",
    description:
      "공고의 마감일과 면접 일정이 캘린더에 자동으로 표시되고, 구글 캘린더와도 연동돼요.",
  },
  {
    icon: DocumentIcon,
    size: 20,
    color: "#2563EB",
    bg: "#EFF6FF",
    title: "AI 자소서",
    description:
      "정리해 둔 경험을 바탕으로 자기소개서 문항에 맞는 답변 초안을 AI가 제안해줘요.",
  },
];

const FAQS = [
  {
    question: "공고는 어떻게 등록하나요?",
    answer:
      "지원 대시보드 우측 상단의 '+ 공고 등록' 버튼을 눌러 회사명, 직무, 마감일 등을 입력하면 바로 등록돼요.",
  },
  {
    question: "완료된 공고는 어디서 확인하나요?",
    answer:
      "대시보드 하단의 '완료된 공고' 섹션에서 전형이 완료된 공고만 모아 파일함형 또는 카드형으로 볼 수 있어요.",
  },
  {
    question: "경험 관리는 어떻게 사용하나요?",
    answer:
      "개인경험 정리 탭에서 활동, 자격증, 수상 경력 등을 등록해두면 자기소개서 작성 시 자동으로 활용돼요.",
  },
  {
    question: "캘린더는 자동으로 연동되나요?",
    answer:
      "네, 공고에 등록한 마감일과 면접일이 캘린더에 자동으로 표시되며, 구글 계정을 연결하면 구글 캘린더와도 동기화돼요.",
  },
  {
    question: "AI 자소서 기능은 어떻게 작동하나요?",
    answer:
      "등록해 둔 경험 데이터를 바탕으로 자기소개서 문항에 맞는 답변 초안을 생성해줘서, 처음부터 쓰는 부담을 줄여줘요.",
  },
];

function FaqItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-[#E2E8F0] last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="text-[15px] font-semibold text-[#0F172A]">
          {question}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-[#94A3B8] transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`grid transition-all duration-200 ease-out ${
          isOpen ? "grid-rows-[1fr] pb-4" : "grid-rows-[0fr]"
        }`}
        style={{ display: "grid" }}
      >
        <div className="overflow-hidden">
          <p className="text-[14px] leading-relaxed text-[#64748B]">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HelpScreen() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="min-h-full bg-[#F8FAFC] px-10 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white">
            <HelpCircle size={22} className="text-[#64748B]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">
              Pickd 사용 가이드
            </h1>
            <p className="mt-0.5 text-sm text-[#64748B]">
              Pickd의 핵심 기능과 자주 묻는 질문을 확인해보세요.
            </p>
          </div>
        </div>

        <section className="mt-8">
          <h2 className="mb-3 px-1 text-[13px] font-semibold tracking-wide text-[#94A3B8]">
            주요 기능
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: feature.bg }}
                >
                  <feature.icon size={feature.size} color={feature.color} />
                </div>

                <h3 className="mt-3 text-base font-semibold text-[#0F172A]">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[#64748B]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 px-1 text-[13px] font-semibold tracking-wide text-[#94A3B8]">
            자주 묻는 질문
          </h2>

          <div className="rounded-2xl border border-[#E2E8F0] bg-white px-6 shadow-sm">
            {FAQS.map((faq, index) => (
              <FaqItem
                key={faq.question}
                question={faq.question}
                answer={faq.answer}
                isOpen={openIndex === index}
                onToggle={() =>
                  setOpenIndex((prev) => (prev === index ? null : index))
                }
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
