import { apiRequest } from "./http";

export interface CoverLetterItem {
  id: number;
  noticeId?: number | null;
  applicationId?: number | null;
  question: string;
  answer?: string | null;
  maxLength?: number | null;
  orderIndex?: number | null;
  aiGenerated?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CoverLetterItemPayload {
  question: string;
  answer?: string | null;
  maxLength?: number | null;
  orderIndex?: number | null;
  aiGenerated?: boolean;
  noticeId?: number | null;
  applicationId?: number | null;
}

export async function getCoverLetters(params: {
  noticeId?: number | null;
  applicationId?: number | null;
}) {
  const searchParams = new URLSearchParams();

  if (params.noticeId != null) {
    searchParams.set("noticeId", String(params.noticeId));
  }

  if (params.applicationId != null) {
    searchParams.set("applicationId", String(params.applicationId));
  }

  return apiRequest<CoverLetterItem[]>(
    `/api/cover-letter?${searchParams.toString()}`,
    {
      method: "GET",
      skipJsonContentType: true,
    },
  );
}

export async function createCoverLetterItem(payload: CoverLetterItemPayload) {
  const created = await apiRequest<CoverLetterItem>("/api/cover-letter", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  window.dispatchEvent(new Event("coverLetterUpdated"));
  window.dispatchEvent(new Event("applicationUpdated"));

  return created;
}

export async function updateCoverLetterItem(
  id: number,
  payload: CoverLetterItemPayload,
) {
  const updated = await apiRequest<CoverLetterItem>(`/api/cover-letter/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  window.dispatchEvent(new Event("coverLetterUpdated"));
  window.dispatchEvent(new Event("applicationUpdated"));

  return updated;
}

export async function deleteCoverLetterItem(id: number) {
  await apiRequest<void>(`/api/cover-letter/${id}`, {
    method: "DELETE",
    skipJsonContentType: true,
  });

  window.dispatchEvent(new Event("coverLetterUpdated"));
  window.dispatchEvent(new Event("applicationUpdated"));
}
