export type TaskStatus = 'pending' | 'inProgress' | 'completed';

export type FeedbackLevel = 'urgent' | 'suggest' | 'reference';

export type FocusArea = 'fight' | 'romance' | 'gag' | 'vertical' | 'story' | 'art';

export interface FocusTag {
  key: FocusArea;
  label: string;
}

export interface Task {
  id: string;
  title: string;
  workName: string;
  episode: number;
  pageCount: number;
  deadline: string;
  focusAreas: FocusArea[];
  status: TaskStatus;
  authorName: string;
  reviewerName?: string;
  createdAt: string;
  description: string;
  coverImage: string;
  panelImages: string[];
}

export interface Comment {
  id: string;
  taskId: string;
  pageIndex: number;
  content: string;
  level: FeedbackLevel;
  reviewerName: string;
  createdAt: string;
  isRead: boolean;
}

export interface ChatMessage {
  id: string;
  commentId: string;
  senderName: string;
  senderRole: 'author' | 'reviewer';
  content: string;
  createdAt: string;
}

export interface CommentTemplate {
  id: string;
  category: string;
  content: string;
  level: FeedbackLevel;
}
