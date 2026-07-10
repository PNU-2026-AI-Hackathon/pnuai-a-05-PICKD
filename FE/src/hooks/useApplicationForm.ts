import { useRef, useState } from "react";
import type { RegistrationTab, Application } from "../types/application";
import { toDateInputValue } from "../utils/date";

type ApplicationFormData = Partial<Application> & {
  url?: string;
};

export const useApplicationForm = (initialData?: any) => {
  const [activeTab, setActiveTab] = useState<RegistrationTab>(
    initialData ? "MANUAL" : "PDF",
  );

  const [formData, setFormData] = useState<ApplicationFormData>({
    noticeId: initialData?.noticeId ?? null,
    company: initialData?.company || "",
    jobTitle: initialData?.jobTitle || "",
    position: initialData?.position || "",
    industry: initialData?.industry || "",
    status: initialData?.status ?? "작성중",
    finalResult: initialData?.finalResult ?? null,
    applyDate: toDateInputValue(initialData?.applyDate),
    interviewDate: toDateInputValue(initialData?.interviewDate),
    deadlineDate: toDateInputValue(initialData?.deadlineDate),
    memo: initialData?.memo || "",
    important: Boolean(initialData?.important),
    manualRegistration: Boolean(initialData?.manualRegistration ?? !initialData?.noticeId),
    documents: initialData?.documents || [],
    url: "",
  });

  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    if (activeTab === "PDF") {
      pdfInputRef.current?.click();
      return;
    }

    if (activeTab === "IMAGE") {
      imageInputRef.current?.click();
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "PDF" | "IMAGE",
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (type === "PDF") {
      const file = files[0];

      const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");

      if (!isPdf) {
        alert("PDF 파일만 업로드할 수 있습니다.");
        e.target.value = "";
        return;
      }

      console.log("PDF 선택됨:", file.name);
      setSelectedPdfFile(file);
      return;
    }

    if (type === "IMAGE") {
      const imageFiles = Array.from(files).filter((file) =>
        file.type.startsWith("image/"),
      );

      if (imageFiles.length === 0) {
        alert("이미지 파일만 업로드할 수 있습니다.");
        e.target.value = "";
        return;
      }

      console.log(
        "이미지 선택됨:",
        imageFiles.map((file) => file.name),
      );

      setSelectedImageFiles(imageFiles);
    }
  };

  const handleFileDrop = (files: FileList | File[], type: "PDF" | "IMAGE") => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    if (type === "PDF") {
      const file = fileArray[0];

      const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");

      if (!isPdf) {
        alert("PDF 파일만 업로드할 수 있습니다.");
        return;
      }

      console.log("PDF 드롭됨:", file.name);
      setSelectedPdfFile(file);
      return;
    }

    if (type === "IMAGE") {
      const imageFiles = fileArray.filter((file) =>
        file.type.startsWith("image/"),
      );

      if (imageFiles.length === 0) {
        alert("이미지 파일만 업로드할 수 있습니다.");
        return;
      }

      console.log(
        "이미지 드롭됨:",
        imageFiles.map((file) => file.name),
      );

      setSelectedImageFiles(imageFiles);
    }
  };

  const removeSelectedPdfFile = () => {
    setSelectedPdfFile(null);

    if (pdfInputRef.current) {
      pdfInputRef.current.value = "";
    }
  };

  const removeSelectedImageFile = (fileName: string) => {
    setSelectedImageFiles((prev) =>
      prev.filter((file) => file.name !== fileName),
    );

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const clearSelectedFiles = () => {
    setSelectedPdfFile(null);
    setSelectedImageFiles([]);

    if (pdfInputRef.current) {
      pdfInputRef.current.value = "";
    }

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const updateField = <K extends keyof ApplicationFormData>(
    field: K,
    value: ApplicationFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return {
    activeTab,
    setActiveTab,
    formData,
    updateField,

    pdfInputRef,
    imageInputRef,
    handleUploadClick,
    handleFileChange,
    handleFileDrop,

    selectedPdfFile,
    selectedImageFiles,
    removeSelectedPdfFile,
    removeSelectedImageFile,
    clearSelectedFiles,
  };
};