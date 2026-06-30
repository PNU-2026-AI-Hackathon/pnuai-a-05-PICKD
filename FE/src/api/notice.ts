import { apiRequest } from "./http";
import type { CoverLetterItem } from "./coverLetter";

export interface AnalyzeNoticeResponse {
  noticeId: number;
}

export interface NoticeSectionQualification {
  id: number;
  generalQualification?: string | null;
  mandatoryQualification?: string | null;
}

export interface NoticeSectionPreference {
  id: number;
  generalPreference?: string | null;
  additionalPoints?: string | null;
  veteranPreference?: string | null;
  disabilityPreference?: string | null;
  certificatePreference?: string | null;
}

export interface NoticeSection {
  id: number;
  sectionName?: string | null;
  jobTitle?: string | null;
  responsibilities?: string | null;
  headcount?: string | null;
  workplace?: string | null;
  qualifications?: NoticeSectionQualification[];
  preferences?: NoticeSectionPreference[];
}

export interface NoticeProcess {
  id: number;
  processName?: string | null;
  documentScreenSchedule?: string | null;
  writtenExamSchedule?: string | null;
  interviewSchedule?: string | null;
  joinDate?: string | null;
  applicationPeriod?: string | null;
  scheduleNotes?: string | null;
}

export interface NoticeDocument {
  id: number;
  mandatoryDocuments?: string | null;
  proofDocuments?: string | null;
  applyMethod?: string | null;
  applyUrlOrEmail?: string | null;
  submissionNotes?: string | null;
}

export interface NoticeDetail {
  id: number;
  companyName?: string | null;
  noticeName?: string | null;
  category?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  employmentType?: string | null;
  headcount?: string | null;
  region1depth?: string | null;
  workplaceAddress?: string | null;
  noticeUrl?: string | null;
  sections?: NoticeSection[];
  processes?: NoticeProcess[];
  documents?: NoticeDocument[];
  coverLetterItems?: CoverLetterItem[];
}

export const analyzeNoticeByUrl = async (url: string) => {
  return apiRequest<AnalyzeNoticeResponse>("/api/notices/analyze/url", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
};

export const analyzeNoticeByPdf = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<AnalyzeNoticeResponse>("/api/notices/analyze/pdf", {
    method: "POST",
    body: formData,
    skipJsonContentType: true,
  });
};

export const analyzeNoticeByImages = async (files: File[]) => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  return apiRequest<AnalyzeNoticeResponse>("/api/notices/analyze/image", {
    method: "POST",
    body: formData,
    skipJsonContentType: true,
  });
};

export const getNotices = async () => {
  return apiRequest("/api/notices", {
    method: "GET",
    skipJsonContentType: true,
  });
};

export const getNoticeDetail = async (id: number) => {
  return apiRequest<NoticeDetail>(`/api/notices/${id}`, {
    method: "GET",
    skipJsonContentType: true,
  });
};
