export function formatDate(
  dateInput?: string | Date | null,
  emptyText: string = "-",
) {
  if (!dateInput) return emptyText;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return emptyText;

  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const hasTime = !(hours === 0 && minutes === 0);

  if (!hasTime) {
    return `${month}/${day}`;
  }
  return `${month}/${day} ${String(hours).padStart(2, "0")}:${String(
    minutes,
  ).padStart(2, "0")}`;
}

export const extractDateString = (value: any) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value?.value) {
    return new Date(Number(value.value)).toISOString();
  }

  return "";
};

export const getDDay = (deadline?: string) => {
  if (!deadline) return "-";
  const end = new Date(deadline.replace("T", " "));
  if (isNaN(end.getTime())) return "-";

  const today = new Date();

  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diff = Math.ceil(
    (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diff < 0) return `D+${Math.abs(diff)}`;
  if (diff === 0) return "D-Day";
  return `D-${diff}`;
};

export const formatApplicationDate = (date?: string) => {
  if (!date) return "-";
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function getEventDateInput(e: any): string | Date | null {
  if (!e.start) return null;

  if (e.start.dateTime?.value) {
    return new Date(Number(e.start.dateTime.value));
  }

  if (typeof e.start.dateTime === "string") {
    return e.start.dateTime;
  }

  if (e.start.date) {
    return e.start.date;
  }

  return null;
}
