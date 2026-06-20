import type { FeedbackLevel, FocusArea, TaskStatus } from '@/types';

export const FOCUS_TAGS: { key: FocusArea; label: string }[] = [
  { key: 'fight', label: '打斗流畅度' },
  { key: 'romance', label: '恋爱情绪' },
  { key: 'gag', label: '包袱节奏' },
  { key: 'vertical', label: '竖屏翻页体验' },
  { key: 'story', label: '剧情连贯' },
  { key: 'art', label: '画面构图' }
];

export const STATUS_TEXT: Record<TaskStatus, string> = {
  pending: '待接单',
  inProgress: '审稿中',
  completed: '已完成'
};

export const LEVEL_TEXT: Record<FeedbackLevel, string> = {
  urgent: '必须修改',
  suggest: '建议优化',
  reference: '仅供参考'
};

export const LEVEL_COLOR: Record<FeedbackLevel, string> = {
  urgent: '#F53F3F',
  suggest: '#FF7D00',
  reference: '#86909C'
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  if (days < 0) return '已截止';
  if (days === 0) return '今天截止';
  if (days === 1) return '明天截止';
  if (days <= 7) return `${days}天后截止`;
  
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日截止`;
};

export const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month}月${day}日 ${hours}:${minutes}`;
};

export const getFocusLabel = (key: FocusArea): string => {
  const tag = FOCUS_TAGS.find(t => t.key === key);
  return tag ? tag.label : key;
};
