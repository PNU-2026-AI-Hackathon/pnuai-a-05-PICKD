import { apiRequest } from "./http";
import type {
  DocumentItem,
  DocumentStatus,
  DocumentType,
} from "../types/document";

export type DocumentPayload = Partial<DocumentItem> & {
  content?: string;
};

const DOCUMENT_TYPE_TO_BACKEND: Record<
  string,
  "이력서" | "포트폴리오" | "기타"
> = {
  이력서: "이력서",
  포트폴리오: "포트폴리오",
  자소서: "기타",
  자기소개서: "기타",
  기타: "기타",
};

const DOCUMENT_STATUS_TO_BACKEND: Record<string, "작성중" | "완료"> = {
  작성중: "작성중",
  검토중: "작성중",
  "수정 필요": "작성중",
  "제출 완료": "완료",
  완료: "완료",
};

export function normalizeDocumentType(type?: string | null): DocumentType {
  return DOCUMENT_TYPE_TO_BACKEND[type ?? ""] ?? "기타";
}

export function normalizeDocumentStatus(
  status?: string | null,
): DocumentStatus {
  return DOCUMENT_STATUS_TO_BACKEND[status ?? ""] ?? "작성중";
}

const toDocumentRequest = (document: DocumentPayload) => ({
  title: document.title ?? "",
  company: document.company ?? "",
  type: normalizeDocumentType(document.type),
  status: normalizeDocumentStatus(document.status),
  progress: document.progress ?? 0,
  content: document.content ?? "",
});

export async function getAllDocuments() {
  return apiRequest<DocumentItem[]>("/api/document", {
    method: "GET",
    skipJsonContentType: true,
  });
}

export async function getDocuments(applicationId: number) {
  return apiRequest<DocumentItem[]>(`/api/document/${applicationId}`, {
    method: "GET",
    skipJsonContentType: true,
  });
}

export async function addDocument(
  applicationId: number,
  document: DocumentPayload,
) {
  const createdDocument = await apiRequest<DocumentItem>(
    `/api/document/${applicationId}`,
    {
      method: "POST",
      body: JSON.stringify(toDocumentRequest(document)),
    },
  );

  window.dispatchEvent(new Event("documentUpdated"));
  window.dispatchEvent(new Event("applicationUpdated"));

  return createdDocument;
}

export async function updateDocument(
  documentId: number,
  document: DocumentPayload,
) {
  const updatedDocument = await apiRequest<DocumentItem>(
    `/api/document/${documentId}`,
    {
      method: "PUT",
      body: JSON.stringify(toDocumentRequest(document)),
    },
  );

  window.dispatchEvent(new Event("documentUpdated"));
  window.dispatchEvent(new Event("applicationUpdated"));

  return updatedDocument;
}

export async function deleteDocument(documentId: number) {
  await apiRequest<void>(`/api/document/${documentId}`, {
    method: "DELETE",
    skipJsonContentType: true,
  });

  window.dispatchEvent(new Event("documentUpdated"));
  window.dispatchEvent(new Event("applicationUpdated"));
}
