import React, { useState } from "react";
import { createPortal } from "react-dom";
import type { Application } from "../../types/application";
import { createEvent } from "../../api/calendar";
import { parseLocalDateTime, toBackendLocalDateTime } from "../../utils/date";
import { buildApplicationScheduleDescription } from "../../utils/calendarEvent";

interface PostScheduleProps {
  onClose: () => void;
  application?: Application;
  onSuccess?: () => void | Promise<void>;
}

export default function PostSchedule({
  onClose,
  application,
  onSuccess,
}: PostScheduleProps) {
  const [formData, setFormData] = useState({
    title: application ? `${application.company} ${application.jobTitle}` : "",
    category: application ? "기타" : "기타",
    date: "",
    time: "09:00",
    memo: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      alert("일정 제목을 입력해주세요.");
      return;
    }

    if (!formData.date) {
      alert("날짜를 선택해주세요.");
      return;
    }

    const selectedDateTime = parseLocalDateTime(
      `${formData.date}T${formData.time || "09:00"}`,
    );
    const startDateTime = toBackendLocalDateTime(selectedDateTime);
    const endDateTime = selectedDateTime
      ? toBackendLocalDateTime(
          new Date(selectedDateTime.getTime() + 60 * 60 * 1000),
        )
      : undefined;

    if (!startDateTime || !endDateTime) {
      alert("일정 시간을 확인해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createEvent({
        summary:
          formData.category === "기타"
            ? formData.title
            : `${formData.title} ${formData.category}`,
        category: formData.category,
        applicationId: application?.id,
        description: buildApplicationScheduleDescription(
          formData.memo,
          application,
        ),
        start: {
          dateTime: startDateTime,
          timeZone: "Asia/Seoul",
        },
        end: {
          dateTime: endDateTime,
          timeZone: "Asia/Seoul",
        },
      });

      await onSuccess?.();
      onClose();
    } catch (error) {
      console.error("일정 추가 실패:", error);
      alert("일정 추가에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm pointer-events-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[24px] p-6 w-[420px] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 text-[#0F172A]">일정 추가</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-[14px] font-bold text-[#94A3B8] mb-1">
              제목
            </label>
            <input
              name="title"
              type="text"
              placeholder="일정 제목을 입력하세요"
              value={formData.title}
              onChange={handleChange}
              className="w-full border p-2 rounded-xl outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[14px] font-bold text-[#94A3B8] mb-1">
              유형
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full border p-2 rounded-xl outline-none focus:border-blue-500 bg-white"
            >
              {application ? (
                <>
                  <option value="제출마감">제출마감</option>
                  <option value="서류발표">서류발표</option>
                  <option value="필기">필기</option>
                  <option value="면접">면접</option>
                  <option value="최종발표">최종발표</option>
                  <option value="기타">기타</option>
                </>
              ) : (
                <>
                  <option value="시험">시험</option>
                  <option value="모임">모임</option>
                  <option value="기타">기타</option>
                </>
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[14px] font-bold text-[#94A3B8] mb-1">
                날짜
              </label>
              <input
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full border p-2 rounded-xl outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[14px] font-bold text-[#94A3B8] mb-1">
                시간
              </label>
              <input
                name="time"
                type="time"
                value={formData.time}
                onChange={handleChange}
                className="w-full border p-2 rounded-xl outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[14px] font-bold text-[#94A3B8] mb-1">
              메모
            </label>
            <textarea
              name="memo"
              placeholder="메모를 입력하세요"
              value={formData.memo}
              onChange={handleChange}
              className="w-full border p-2 rounded-xl h-24 resize-none outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-7 py-2 bg-gray-200 rounded-xl hover:bg-gray-300 transition disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-7 py-2 bg-black text-white rounded-xl hover:bg-gray-700 transition disabled:opacity-50"
          >
            {isSubmitting ? "추가 중" : "확인"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
