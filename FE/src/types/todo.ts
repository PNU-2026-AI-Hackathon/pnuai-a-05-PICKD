export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  dueDateTime?: string;
  memo?: string;

  applicationId?: number;
  company?: string;
  jobTitle?: string;

  application?: {
    id: number;
    company?: string;
    jobTitle?: string;
  };
}
