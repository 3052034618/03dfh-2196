export type TaskStatus = 'pending' | 'inProgress' | 'completed';

export type FeedbackLevel = 'urgent' | 'suggest' | 'reference';

export type CommentStatus = 'pending' | 'accepted' | 'rejected';

export type StatusFilterType = 'all' | CommentStatus;

export type FocusArea = 'fight' | 'romance' | 'gag' | 'vertical' | 'story' | 'art';

export interface FocusTag {
  key: FocusArea;
  label: string;
}

export interface TaskProgress {
  readPages: number[];
  completedAt?: string;
  lastViewedPage?: number;
}

export interface ReviewSummary {
  mainIssues: string[];
  priorityPages: number[];
  overallAdvice: string;
  coverageRatio: number;
  focusCoverage: string[];
  focusMissed: string[];
  pagesWithoutComments: number[];
}

export interface DeliveryRecord {
  id: string;
  taskId: string;
  version: number;
  summary: ReviewSummary;
  commentIds: string[];
  commentCount: number;
  pageCount: number;
  readPageCount: number;
  deliveredAt: string;
  note?: string;
}

export interface ReworkItem {
  pageIndex: number;
  comments: Comment[];
  pendingCount: number;
  acceptedCount: number;
  rejectedCount: number;
  totalCount: number;
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
  progress?: TaskProgress;
  reviewSummary?: ReviewSummary;
  deliveries?: DeliveryRecord[];
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
  status: CommentStatus;
  deliveryId?: string;
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

export interface CommentSummary {
  urgent: number;
  suggest: number;
  reference: number;
}

export const COMMENT_STATUS_TEXT: Record<CommentStatus, string> = {
  pending: '待处理',
  accepted: '已采纳',
  rejected: '暂不采纳'
};

export const COMMENT_STATUS_COLOR: Record<CommentStatus, string> = {
  pending: '#FF7D00',
  accepted: '#00B42A',
  rejected: '#86909C'
};

export const STATUS_FILTER_TABS: { key: StatusFilterType; label: string }[] = [
  { key: 'all', label: '全部状态' },
  { key: 'pending', label: '待处理' },
  { key: 'accepted', label: '已采纳' },
  { key: 'rejected', label: '暂不采纳' }
];
