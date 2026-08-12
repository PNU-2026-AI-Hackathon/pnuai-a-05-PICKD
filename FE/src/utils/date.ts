const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const pad = (value: number) => String(value).padStart(2, "0");

export function parseLocalDateTime(value?: string | Date | null): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const raw = String(value);
  if (!raw) return null;

  if (DATE_ONLY_PATTERN.test(raw)) {
    const [year, month, day] = raw.split("-").map(Number);
    return new Date(year, month - 1, day, 0, 0, 0);
  }

  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toDateInputValue(value?: string | Date | null) {
  if (!value) return "";
  if (typeof value === "string") {
    if (DATE_ONLY_PATTERN.test(value)) return value;
    if (value.includes("T")) return value.split("T")[0];
    if (value.includes(" ")) return value.split(" ")[0];
  }

  const date = parseLocalDateTime(value);
  if (!date) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toBackendLocalDateTime(value?: string | Date | null) {
  if (!value) return undefined;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return undefined;
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
  }

  const raw = String(value).trim();
  if (!raw) return undefined;

  if (DATE_ONLY_PATTERN.test(raw)) return `${raw}T00:00:00`;

  const withoutZone = raw.replace(/Z$/, "").replace(/([+-]\d{2}:?\d{2})$/, "");
  const normalized = withoutZone.includes("T") ? withoutZone : withoutZone.replace(" ", "T");

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) {
    return `${normalized}:00`;
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(normalized)) {
    return normalized.slice(0, 19);
  }

  const parsed = parseLocalDateTime(raw);
  if (!parsed) return undefined;
  return toBackendLocalDateTime(parsed);
}

export function getGoogleEventDate(e: any): Date | null {
  if (!e?.start) return null;

  const start = e.start;
  const dateTime = start.dateTime;
  const date = start.date;

  if (dateTime?.value != null) {
    const value = Number(dateTime.value);
    if (!Number.isNaN(value)) return new Date(value);
  }

  if (typeof dateTime === "string") {
    return parseLocalDateTime(dateTime);
  }

  if (date?.value != null) {
    const value = Number(date.value);
    if (!Number.isNaN(value)) return new Date(value);
  }

  if (typeof date === "string") {
    return parseLocalDateTime(date);
  }

  return null;
}

export function formatDate(
  dateInput?: string | Date | null,
  emptyText: string = "-",
) {
  if (!dateInput) return emptyText;
  const d = parseLocalDateTime(dateInput);
  if (!d) return emptyText;

  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const hasTime = !(hours === 0 && minutes === 0);

  if (!hasTime) {
    return `${month}/${day}`;
  }
  return `${month}/${day} ${pad(hours)}:${pad(minutes)}`;
}

export const extractDateString = (value: any) => {
  if (!value) return "";

  if (typeof value === "string") return value;

  if (value?.value != null) {
    const date = new Date(Number(value.value));
    if (Number.isNaN(date.getTime())) return "";
    return toBackendLocalDateTime(date) ?? "";
  }

  return "";
};

export const getDDay = (deadline?: string | Date | null) => {
  if (!deadline) return "-";
  const end = parseLocalDateTime(deadline);
  if (!end) return "-";

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

export const formatApplicationDate = (date?: string | Date | null) => {
  const dateInputValue = toDateInputValue(date);
  return dateInputValue || "-";
};

export function getEventDateInput(e: any): string | Date | null {
  const date = getGoogleEventDate(e);
  if (date) return date;
  return null;
}
