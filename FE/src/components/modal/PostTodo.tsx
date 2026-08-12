import React, { useState } from "react";
import { createPortal } from "react-dom";
import { type Application } from "../../types/application";

interface PostTodoProps {
  onClose: () => void;
  application?: Application;
  applications?: Application[];
  onConfirm: (data: {
    title: string;
    dueDateTime?: string;
    applicationId: string;
    memo: string;
  }) => void;
}

export default function PostTodo({
  onClose,
  onConfirm,
  application,
  applications,
}: PostTodoProps) {
  const [formData, setFormData] = useState({
    title: "",
    dueDate: "",
    dueTime: "",
    applicationId: application ? String(application.id) : "",
    memo: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleConfirm = () => {
    console.log("confirm clicked");
    if (!formData.title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    onConfirm({
      title: formData.title,
      dueDateTime: formData.dueDate
        ? formData.dueTime
          ? `${formData.dueDate}T${formData.dueTime}`
          : `${formData.dueDate}T00:00`
        : undefined,

      applicationId: formData.applicationId,

      memo: formData.memo,
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm pointer-events-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[24px] p-6 w-[400px] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 text-[#0F172A]">할 일 추가</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-[14px] font-bold text-[#94A3B8] mb-1">
              제목
            </label>
            <input
              name="title"
              type="text"
              placeholder="제목을 입력하세요"
              value={formData.title}
              onChange={handleChange}
              className="w-full border p-2 rounded-xl outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[14px] font-bold text-[#94A3B8] mb-1">
              마감일
            </label>
            <input
              name="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={handleChange}
              className="w-full border p-2 rounded-xl outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[14px] font-bold text-[#94A3B8] mb-1">
              마감시간
            </label>
            <input
              name="dueTime"
              type="time"
              value={formData.dueTime}
              onChange={handleChange}
              className="w-full border p-2 rounded-xl outline-none focus:border-blue-500"
            />
          </div>
          {!application && applications && (
            <div>
              <label className="block text-[14px] font-bold text-[#94A3B8] mb-1">
                연결 공고
              </label>

              <select
                name="applicationId"
                value={formData.applicationId}
                onChange={handleChange}
                className="w-full border p-2 rounded-xl outline-none focus:border-blue-500 bg-white cursor-pointer"
              >
                <option value="">연결할 공고를 선택하세요</option>

                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.company}
                  </option>
                ))}
              </select>
            </div>
          )}

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
            className="px-7 py-2 bg-gray-200 rounded-xl hover:bg-gray-300 transition"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            className="px-7 py-2 bg-black text-white rounded-xl hover:bg-gray-700 transition"
          >
            확인
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
