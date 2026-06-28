export async function createEvent(data: any) {
  const res = await fetch("/api/calendar/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      summary: data.summary,
      location: "",
      description: `category:${data.category}`,
      start: {
        dateTime: data.start.dateTime,
        timeZone: "Asia/Seoul",
      },
      end: {
        dateTime: data.start.dateTime,
        timeZone: "Asia/Seoul",
      },
    }),
  });

  if (!res.ok) throw new Error("생성 실패");
}

export async function deleteEvent(id: string) {
  const res = await fetch(`/api/calendar/events/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) throw new Error("삭제 실패");
}

export async function getTodayEvents() {
  const now = new Date();
  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
  ).toISOString();
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
  ).toISOString();

  const res = await fetch(
    `/api/calendar/events?timeMin=${startOfDay}&timeMax=${endOfDay}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!res.ok) throw new Error("오늘의 일정을 가져오지 못했습니다.");

  const data = await res.json();
  return data.items; // 구글 캘린더 이벤트 배열 반환
}
