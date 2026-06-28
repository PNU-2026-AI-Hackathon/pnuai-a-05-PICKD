import { useState } from "react";
import { Icon } from "@iconify/react";
import { formatDate, getDDay } from "../../utils/date";
import PostTodo from "./PostTodo";
import { useApplication } from "../../context/ApplicationContext";

interface Props {
  open: boolean;
  onClose: () => void;
  application: any;
}

const flow = [
  "지원 예정",
  "작성중",
  "제출 완료",
  "서류 결과 대기",
  "서류 합격",
  "필기 전형",
  "면접 전형",
  "최종 결과",
];

export default function ApplicationDetailModal({
  open,
  onClose,
  application,
}: Props) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [todoModalOpen, setTodoModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const { addTodo, applications } = useApplication();
  if (!open || !application) return null;
  const currentApplication =
    applications.find((app) => app.id === application.id) || application;

  return (
    <>
      <div className="fixed inset-0 z-[99] flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
        <div className="relative w-[1100px] min-h-[600px] max-h-[90vh] overflow-y-auto rounded-[20px] bg-[#F8FAFC] shadow-[0_10px_40px_rgba(15,23,42,0.12)]">
          <div className="border-b border-[#EEF2F6] px-8 pt-5 pb-3 bg-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-[13px] text-[#94A3B8]">
                  <span>지원 대시보드</span>
                  <Icon icon="mdi:chevron-right" className="text-[14px]" />
                  <span>상태 관리</span>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                    <Icon
                      icon="ep:office-building"
                      className="text-[22px] text-[#64748B]"
                    />
                  </div>

                  <div>
                    <h1 className="text-[25px] font-bold leading-none text-[#0F172A]">
                      {application.company}
                    </h1>
                    <p className="mt-1 text-[14px] text-[#64748B]">
                      {application.jobTitle} · {application.position}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="rounded-lg p-2 transition-colors hover:bg-[#F8FAFC]"
              >
                <Icon icon="mdi:close" className="text-[22px] text-[#64748B]" />
              </button>
            </div>
          </div>

          <div className="space-y-6 px-8 mt-5">
            <Section title="공고 기본 정보">
              <div className="rounded-2xl border border-[#E9EEF5] bg-white px-6 py-3 mb-7">
                <div className="flex flex-col gap-4">
                  <InfoRow label="기업명" value={currentApplication.company} />
                  <InfoRow label="공고명" value={currentApplication.jobTitle} />
                  <InfoRow label="직무" value={currentApplication.position} />
                  <InfoRow
                    label="마감일"
                    value={
                      currentApplication.deadlineDate ? (
                        <div className="flex items-center gap-20">
                          <span>
                            {currentApplication.deadlineDate.split("T")[0]}
                          </span>

                          <span className="text-[#94A3B8]">
                            {getDDay(currentApplication.deadlineDate)}
                          </span>
                        </div>
                      ) : (
                        "-"
                      )
                    }
                  />
                </div>
              </div>
            </Section>

            <Section title="전형 흐름">
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#E2E8F0] px-5 py-3 bg-white">
                {flow.map((step, index) => {
                  const active = step === currentApplication.status;

                  return (
                    <div key={step} className="flex items-center gap-2">
                      <div
                        className={`
                        rounded-lg px-3 py-2 text-sm font-medium transition-colors
                        ${
                          active
                            ? "bg-[#DBEAFE] text-[#2563EB]"
                            : "bg-[#F8FAFC] text-[#64748B]"
                        }
                      `}
                      >
                        {step}
                      </div>

                      {index !== flow.length - 1 && (
                        <Icon
                          icon="mdi:chevron-right"
                          className="text-[#CBD5E1]"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>
            <Section
              title="일정 · 할 일"
              right={
                <div className="relative">
                  <button
                    onClick={() => setShowAddMenu((prev) => !prev)}
                    className="flex items-center gap-1 text-[14px] font-medium text-[#64748B] hover:text-[#2563EB]"
                  >
                    <Icon icon="mdi:plus" className="text-[16px]" />
                    추가
                  </button>

                  {showAddMenu && (
                    <div className="absolute right-0 top-8 z-50 w-[160px] overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
                      <button
                        className="flex w-full items-center px-4 py-3 text-left text-[14px] text-[#0F172A] transition-colors hover:bg-[#F8FAFC]"
                        onClick={() => {
                          setShowAddMenu(false);
                          setScheduleModalOpen(true);
                        }}
                      >
                        일정 추가
                      </button>

                      <button
                        className="flex w-full items-center px-4 py-3 text-left text-[14px] text-[#0F172A] transition-colors hover:bg-[#F8FAFC]"
                        onClick={() => {
                          setShowAddMenu(false);
                          setTodoModalOpen(true);
                        }}
                      >
                        할 일 추가
                      </button>
                    </div>
                  )}
                </div>
              }
            >
              <div className="overflow-hidden rounded-2xl border border-[#E9EEF5] bg-white">
                <table className="w-full">
                  <thead className="bg-[#FAFBFC]">
                    <tr className="border-b border-[#EEF2F6] text-left">
                      <th className="px-5 py-3 text-[13px] font-semibold text-[#64748B]">
                        유형
                      </th>
                      <th className="px-5 py- text-[13px] font-semibold text-[#64748B]">
                        제목
                      </th>
                      <th className="px-5 py-3 text-[13px] font-semibold text-[#64748B]">
                        날짜
                      </th>
                      <th className="px-5 py-3 text-[13px] font-semibold text-[#64748B]">
                        상태
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ...(currentApplication.applyDate
                        ? [
                            {
                              id: "apply",
                              type: "일정",
                              title: "지원 예정",
                              date: formatDate(
                                currentApplication.applyDate,
                                "기한 없음",
                              ),
                              status: "예정",
                            },
                          ]
                        : []),

                      ...(currentApplication.deadlineDate
                        ? [
                            {
                              id: "deadline",
                              type: "일정",
                              title: "서류 마감",
                              date: formatDate(
                                currentApplication.deadlineDate,
                                "기한 없음",
                              ),
                              status: "예정",
                            },
                          ]
                        : []),

                      ...(currentApplication.interviewDate
                        ? [
                            {
                              id: "interview",
                              type: "일정",
                              title: "면접 예정",
                              date: formatDate(
                                currentApplication.interviewDate,
                                "기한 없음",
                              ),
                              status: "예정",
                            },
                          ]
                        : []),

                      ...(currentApplication.todos || []).map((todo: any) => ({
                        id: todo.id,
                        type: "할 일",
                        title: todo.title,
                        date: formatDate(todo.dueDateTime, "기한 없음"),
                        status: todo.completed ? "완료" : "진행 중",
                      })),
                    ].map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-[#F1F5F9] last:border-b-0"
                      >
                        <td className="px-5 py-2 text-[14px] text-[#64748B]">
                          {item.type}
                        </td>

                        <td className="px-5 py-2 text-[14px] font-medium text-[#0F172A]">
                          {item.title}
                        </td>

                        <td className="px-5 py-2 text-[14px] text-[#64748B]">
                          {item.date}
                        </td>

                        <td className="px-5 py-2">
                          <span
                            className={`rounded-md px-2 py-[5px] text-[12px] font-semibold
                                  ${
                                    item.status === "진행 중"
                                      ? "bg-[#DBEAFE] text-[#2563EB]"
                                      : item.status === "완료"
                                        ? "bg-[#DCFCE7] text-[#16A34A]"
                                        : "bg-[#F1F5F9] text-[#64748B]"
                                  }
                                `}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="메모">
              <textarea
                defaultValue={currentApplication.memo}
                placeholder="메모를 입력하세요"
                className=" min-h-[120px] w-full resize-none rounded-2xl border border-[#E2E8F0] bg-[#FCFDFE] px-5 py-4 mb-2 text-[15px] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#2563EB]"
              />
            </Section>
          </div>
        </div>
      </div>
      {todoModalOpen && (
        <PostTodo
          application={currentApplication}
          applications={[currentApplication]}
          onClose={() => setTodoModalOpen(false)}
          onConfirm={async (data) => {
            await addTodo({
              ...data,
              applicationId: currentApplication.id,
            });

            setTodoModalOpen(false);
          }}
        />
      )}
    </>
  );
}

function Section({ title, right, children }: any) {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-[17px] font-semibold text-[#334155] mb-2">
          {title}
        </h2>
        {right}
      </div>

      {children}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center">
      <span className="w-[110px] text-[13px] font-medium text-[#94A3B8]">
        {label}
      </span>
      <span className="text-[15px] font-medium text-[#0F172A]">
        {value || "-"}
      </span>
    </div>
  );
}
