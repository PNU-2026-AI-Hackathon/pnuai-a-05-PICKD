import { apiRequest } from "./http";

export async function reissueAccessToken() {
  return apiRequest<void>("/api/auth/reissue", {
    method: "POST",
    skipJsonContentType: true,
    skipReissue: true,
  });
}

export async function logout() {
  await apiRequest<void>("/api/auth/logout", {
    method: "POST",
    skipJsonContentType: true,
    skipReissue: true,
  });

  window.dispatchEvent(new Event("authLoggedOut"));
}
