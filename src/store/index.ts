import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, Comment, ChatMessage, TaskStatus, CommentSummary } from '@/types';
import { mockTasks, mockComments, mockChatMessages } from '@/data/mock';

interface AppStore {
  tasks: Task[];
  comments: Comment[];
  chatMessages: ChatMessage[];
  lastTakenTaskId: string | null;

  addTask: (task: Task) => void;
  takeTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  markPageRead: (taskId: string, pageIndex: number) => void;
  addComment: (comment: Comment) => void;
  addChatMessage: (message: ChatMessage) => void;
  markCommentRead: (commentId: string) => void;
  getTaskById: (taskId: string) => Task | undefined;
  getCommentsByTaskId: (taskId: string) => Comment[];
  getChatMessagesByCommentId: (commentId: string) => ChatMessage[];
  getMyPublishedTasks: () => Task[];
  getMyReviewTasks: () => Task[];
  getCommentSummaryByTaskId: (taskId: string) => CommentSummary;
  getCommentSummaryAll: () => CommentSummary;
  setLastTakenTaskId: (taskId: string | null) => void;
}

const STORAGE_KEY = 'comic-review-app-store';

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      tasks: [...mockTasks],
      comments: [...mockComments],
      chatMessages: [...mockChatMessages],
      lastTakenTaskId: null,

      addTask: (task: Task) => {
        set(state => ({
          tasks: [task, ...state.tasks]
        }));
        console.log('[Store] 新增任务', task.id);
      },

      takeTask: (taskId: string) => {
        set(state => ({
          tasks: state.tasks.map(t =>
            t.id === taskId
              ? {
                  ...t,
                  status: 'inProgress' as TaskStatus,
                  reviewerName: '我',
                  progress: {
                    readPages: [],
                    lastViewedPage: 0
                  }
                }
              : t
          ),
          lastTakenTaskId: taskId
        }));
        console.log('[Store] 接单', taskId);
      },

      completeTask: (taskId: string) => {
        set(state => ({
          tasks: state.tasks.map(t =>
            t.id === taskId
              ? {
                  ...t,
                  status: 'completed' as TaskStatus,
                  progress: {
                    ...t.progress,
                    completedAt: new Date().toISOString()
                  }
                }
              : t
          ),
          lastTakenTaskId: null
        }));
        console.log('[Store] 完成审稿', taskId);
      },

      markPageRead: (taskId: string, pageIndex: number) => {
        set(state => ({
          tasks: state.tasks.map(t => {
            if (t.id !== taskId) return t;
            const currentRead = t.progress?.readPages || [];
            const pageNum = pageIndex + 1;
            if (currentRead.includes(pageNum)) return t;
            return {
              ...t,
              progress: {
                ...t.progress,
                readPages: [...currentRead, pageNum].sort((a, b) => a - b),
                lastViewedPage: pageIndex
              }
            };
          })
        }));
        console.log('[Store] 标记已读', taskId, '第', pageIndex + 1, '页');
      },

      addComment: (comment: Comment) => {
        set(state => ({
          comments: [comment, ...state.comments]
        }));
        console.log('[Store] 新增评论', comment.id);
      },

      addChatMessage: (message: ChatMessage) => {
        set(state => ({
          chatMessages: [...state.chatMessages, message]
        }));
        console.log('[Store] 新增对话消息', message.id);
      },

      markCommentRead: (commentId: string) => {
        set(state => ({
          comments: state.comments.map(c =>
            c.id === commentId ? { ...c, isRead: true } : c
          )
        }));
      },

      getTaskById: (taskId: string) => {
        return get().tasks.find(t => t.id === taskId);
      },

      getCommentsByTaskId: (taskId: string) => {
        return get().comments.filter(c => c.taskId === taskId);
      },

      getChatMessagesByCommentId: (commentId: string) => {
        return get().chatMessages.filter(m => m.commentId === commentId);
      },

      getMyPublishedTasks: () => {
        return get().tasks.filter(t => t.authorName === '我');
      },

      getMyReviewTasks: () => {
        return get().tasks.filter(t => t.reviewerName === '我');
      },

      getCommentSummaryByTaskId: (taskId: string) => {
        const taskComments = get().comments.filter(c => c.taskId === taskId);
        return {
          urgent: taskComments.filter(c => c.level === 'urgent').length,
          suggest: taskComments.filter(c => c.level === 'suggest').length,
          reference: taskComments.filter(c => c.level === 'reference').length
        };
      },

      getCommentSummaryAll: () => {
        const allComments = get().comments;
        return {
          urgent: allComments.filter(c => c.level === 'urgent' && !c.isRead).length,
          suggest: allComments.filter(c => c.level === 'suggest').length,
          reference: allComments.filter(c => c.level === 'reference').length
        };
      },

      setLastTakenTaskId: (taskId: string | null) => {
        set({ lastTakenTaskId: taskId });
      }
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        tasks: state.tasks,
        comments: state.comments,
        chatMessages: state.chatMessages,
        lastTakenTaskId: state.lastTakenTaskId
      })
    }
  )
);
