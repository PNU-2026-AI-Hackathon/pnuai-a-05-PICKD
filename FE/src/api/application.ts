export async function createApplication(data: any) {
  await fetch("/api/application", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
}

export async function updateApplication(id: number, data: any) {
  await fetch(`/api/application/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
}

export async function deleteApplication(id: number) {
  await fetch(`/api/application/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
}
