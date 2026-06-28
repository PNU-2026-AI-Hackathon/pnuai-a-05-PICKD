export async function updateOnboarding(data: any) {
  const res = await fetch("/api/onboarding", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("온보딩 실패");

  return res.json();
}
