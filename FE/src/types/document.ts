export type DocumentStatus = "작성중" | "검토중" | "수정 필요" | "제출 완료";

export interface DocumentItem {
  id: number;
  title: string;
  company: string;
  type: string;
  progress: number;
  status: DocumentStatus;
  updatedAt: string;
  content?: string;
  application?: {
    id: number;
    applyDate?: string;
  };
}
