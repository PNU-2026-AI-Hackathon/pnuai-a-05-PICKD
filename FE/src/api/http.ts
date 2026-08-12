export type ApiRequestOptions = RequestInit & {
  skipJsonContentType?: boolean;
  skipReissue?: boolean;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const OAUTH_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"
).replace(/\/$/, "");
const REISSUE_PATH = "/api/auth/reissue";

export const CALENDAR_CONSENT_REQUIRED = "CALENDAR_CONSENT_REQUIRED";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export const isCalendarConsentError = (error: unknown): boolean =>
  error instanceof ApiError && error.code === CALENDAR_CONSENT_REQUIRED;

/** 구글 캘린더 스코프 재동의 페이지로 이동 (동의 후 returnTo 경로로 복귀) */
export const redirectToCalendarConsent = (returnTo?: string) => {
  const path = returnTo ?? window.location.pathname;
  window.location.href = `${OAUTH_BASE_URL}/oauth2/authorization/google?prompt=consent&returnTo=${encodeURIComponent(path)}`;
};

// 캘린더 API 여러 개가 동시에 실패해도 재동의 안내는 한 번만 띄운다
let consentPromptShown = false;

const promptCalendarReconsent = () => {
  if (consentPromptShown) return;
  consentPromptShown = true;

  const confirmed = window.confirm(
    "구글 캘린더 접근 권한이 없어 일정 기능을 사용할 수 없습니다.\n권한 동의 페이지로 이동할까요?",
  );

  if (confirmed) {
    redirectToCalendarConsent();
  }
};

let reissuePromise: Promise<boolean> | null = null;

const buildUrl = (path: string) => {
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

const shouldUseJsonContentType = (
  skipJsonContentType?: boolean,
  body?: BodyInit | null,
) => {
  if (skipJsonContentType) return false;
  if (body instanceof FormData) return false;
  return true;
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  const text = await response.text();

  if (!response.ok) {
    let code: string | undefined;
    try {
      code = (JSON.parse(text) as { code?: string }).code ?? undefined;
    } catch {
      // 본문이 JSON이 아니면 code 없음
    }

    if (response.status === 403 && code === CALENDAR_CONSENT_REQUIRED) {
      promptCalendarReconsent();
    }

    throw new ApiError(
      response.status,
      text || `${response.status} ${response.statusText}`,
      code,
    );
  }

  if (!text) return undefined as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
};

const reissueAccessToken = async () => {
  if (!reissuePromise) {
    reissuePromise = fetch(buildUrl(REISSUE_PATH), {
      method: "POST",
      credentials: "include",
    })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        reissuePromise = null;
      });
  }

  return reissuePromise;
};

export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { skipJsonContentType, skipReissue, headers, ...rest } = options;

  const requestOptions: RequestInit = {
    credentials: "include",
    ...rest,
    headers: {
      ...(shouldUseJsonContentType(skipJsonContentType, rest.body)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(headers ?? {}),
    },
  };

  let response = await fetch(buildUrl(path), requestOptions);

  if (response.status === 401 && !skipReissue && path !== REISSUE_PATH) {
    const reissued = await reissueAccessToken();

    if (reissued) {
      response = await fetch(buildUrl(path), requestOptions);
    }
  }

  return parseResponse<T>(response);
}
