import type { DocumentItem } from "../types/document";

export async function getDocuments(applicationId: number) {
  const response = await fetch(`/api/document/${applicationId}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("서류 조회 실패");
  }
  return response.json();
}

export async function addDocument(
  applicationId: number,
  document: Partial<DocumentItem>,
) {
  const response = await fetch(`/api/document/${applicationId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(document),
  });

  if (!response.ok) {
    throw new Error("서류 추가 실패");
  }
  return response.json();
}

export async function deleteDocument(documentId: number) {
  const response = await fetch(`/api/document/${documentId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("서류 삭제 실패");
  }
}
