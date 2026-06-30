export type DocumentStatus = "작성중" | "완료";
export type DocumentType = "이력서" | "포트폴리오" | "기타";

export interface DocumentItem {
  id: number;
  applicationId?: number;
  title: string;
  company: string;
  type: DocumentType | string;
  progress: number;
  status: DocumentStatus;
  updatedAt?: string;
  createdAt?: string;
  content?: string;
  application?: {
    id: number;
    applyDate?: string;
    deadlineDate?: string;
    company?: string;
    jobTitle?: string;
  };
}
