import React, { useState } from "react";
import { createPortal } from "react-dom";
import { addDocument } from "../../api/document";
import type { Application } from "../../types/application";
import type { DocumentItem, DocumentStatus } from "../../types/document";

interface PostDocumentProps {
  onClose: () => void;
  application: Application;
  onSubmit: (document: DocumentItem) => void;
}

export default function PostDocument({
  onClose,
  onSubmit,
  application,
}: PostDocumentProps) {
  const [formData, setFormData] = useState<{
    title: string;
    type: string;
    status: DocumentStatus;
    memo: string;
  }>({
    title: "",
    type: "기타",
    status: "작성중",
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

  const handleSubmit = async () => {
    try {
      const newDocument = await addDocument(application.id, {
        title: formData.title,
        company: application.company,
        type: formData.type,
        progress: 0,
        status: formData.status,
        content: formData.memo,
      });

      onSubmit(newDocument);

      onClose();
    } catch (e) {
      console.error(e);
      alert("서류 추가 실패");
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[420px] rounded-[24px] bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-5 text-xl font-bold text-[#0F172A]">서류 추가</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-[14px] font-bold text-[#94A3B8]">
              연결 공고
            </label>

            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-[14px] text-[#334155]">
              {application.company}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[14px] font-bold text-[#94A3B8]">
              서류 제목
            </label>

            <input
              name="title"
              type="text"
              placeholder="서류 제목을 입력하세요"
              value={formData.title}
              onChange={handleChange}
              className="w-full rounded-xl border p-2 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-[14px] font-bold text-[#94A3B8]">
              서류 종류
            </label>

            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full cursor-pointer rounded-xl border bg-white p-2 outline-none focus:border-blue-500"
            >
              <option value="기타">기타</option>
              <option value="포트폴리오">포트폴리오</option>
              <option value="이력서">이력서</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[14px] font-bold text-[#94A3B8]">
              상태
            </label>

            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full cursor-pointer rounded-xl border bg-white p-2 outline-none focus:border-blue-500"
            >
              <option value="작성중">작성중</option>
              <option value="완료">완료</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[14px] font-bold text-[#94A3B8]">
              메모
            </label>
            <textarea
              name="memo"
              placeholder="메모를 입력하세요"
              value={formData.memo}
              onChange={handleChange}
              className="h-24 w-full resize-none rounded-xl border p-2 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl bg-gray-200 px-7 py-2 transition hover:bg-gray-300"
          >
            취소
          </button>

          <button
            onClick={handleSubmit}
            className="rounded-xl bg-black px-7 py-2 text-white transition hover:bg-gray-700"
          >
            확인
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
