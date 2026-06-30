export interface Schedule {
  id: string;
  summary: string;
  location?: string;
  description?: string;
  start: {
    dateTime?: string | { value?: string | number };
    date?: string | { value?: string | number };
    timeZone?: string;
  };
  end?: {
    dateTime?: string | { value?: string | number };
    date?: string | { value?: string | number };
    timeZone?: string;
  };
  category?: "면접" | "마감" | "제출" | "할 일" | "일반";
}
