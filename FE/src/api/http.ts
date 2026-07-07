export type ApiRequestOptions = RequestInit & {
  skipJsonContentType?: boolean;
  skipReissue?: boolean;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const REISSUE_PATH = "/api/auth/reissue";

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
    throw new Error(text || `${response.status} ${response.statusText}`);
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
