export interface Schedule {
  id: string;
  summary: string;
  start: any;
  category?: "면접" | "마감" | "제출" | "일반";
}
