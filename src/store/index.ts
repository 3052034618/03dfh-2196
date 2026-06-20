import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Task,
  Comment,
  ChatMessage,
  TaskStatus,
  CommentSummary,
  CommentStatus,
  ReviewSummary,
  FocusArea
} from '@/types';
import { mockTasks, mockComments, mockChatMessages, FOCUS_TAGS } from '@/data/mock';

interface AppStore {
  tasks: Task[];
  comments: Comment[];
  chatMessages: ChatMessage[];
  lastTakenTaskId: string | null;

  addTask: (task: Task) => void;
  takeTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  completeTaskWithSummary: (taskId: string, summary: ReviewSummary) => void;
  markPageRead: (taskId: string, pageIndex: number) => void;
  addComment: (comment: Comment) => void;
  addChatMessage: (message: ChatMessage) => void;
  markCommentRead: (commentId: string) => void;
  updateCommentStatus: (commentId: string, status: CommentStatus) => void;
  getTaskById: (taskId: string) => Task | undefined;
  getCommentsByTaskId: (taskId: string) => Comment[];
  getCommentsByTaskAndPage: (taskId: string, pageIndex: number) => Comment[];
  getCommentCountByTaskAndPage: (taskId: string) => Record<number, number>;
  getChatMessagesByCommentId: (commentId: string) => ChatMessage[];
  getMyPublishedTasks: () => Task[];
  getMyReviewTasks: () => Task[];
  getCommentSummaryByTaskId: (taskId: string) => CommentSummary;
  getCommentSummaryAll: () => CommentSummary;
  getCoverageInfo: (taskId: string) => {
    pagesWithoutComments: number[];
    focusCoverage: string[];
    focusMissed: string[];
    coverageRatio: number;
  };
  setLastTakenTaskId: (taskId: string | null) => void;
  generatePanelImages: (pageCount: number) => string[];
}

const STORAGE_KEY = 'comic-review-app-store';

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?w=750&h=1334&fit=crop',
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=750&h=1334&fit=crop',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=750&h=1334&fit=crop',
  'https://images.unsplash.com/photo-1560972550-aba3456b5564?w=750&h=1334&fit=crop',
  'https://images.unsplash.com/photo-1531258576872-18b7362e70ea?w=750&h=1334&fit=crop'
];

const getFocusLabel = (key: FocusArea): string => {
  const found = FOCUS_TAGS.find(f => f.key === key);
  return found ? found.label : key;
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      tasks: [...mockTasks],
      comments: [...mockComments],
      chatMessages: [...mockChatMessages],
      lastTakenTaskId: null,

      generatePanelImages: (pageCount: number) => {
        const images: string[] = [];
        for (let i = 0; i < pageCount; i++) {
          images.push(PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length]);
        }
        return images;
      },

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

      completeTaskWithSummary: (taskId: string, summary: ReviewSummary) => {
        set(state => ({
          tasks: state.tasks.map(t =>
            t.id === taskId
              ? {
                  ...t,
                  status: 'completed' as TaskStatus,
                  progress: {
                    ...t.progress,
                    completedAt: new Date().toISOString()
                  },
                  reviewSummary: summary
                }
              : t
          ),
          lastTakenTaskId: null
        }));
        console.log('[Store] 完成审稿（带总结）', taskId);
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

      updateCommentStatus: (commentId: string, status: CommentStatus) => {
        set(state => ({
          comments: state.comments.map(c =>
            c.id === commentId ? { ...c, status } : c
          )
        }));
        console.log('[Store] 更新评论状态', commentId, status);
      },

      getTaskById: (taskId: string) => {
        return get().tasks.find(t => t.id === taskId);
      },

      getCommentsByTaskId: (taskId: string) => {
        return get().comments.filter(c => c.taskId === taskId);
      },

      getCommentsByTaskAndPage: (taskId: string, pageIndex: number) => {
        return get().comments.filter(
          c => c.taskId === taskId && c.pageIndex === pageIndex
        );
      },

      getCommentCountByTaskAndPage: (taskId: string) => {
        const taskComments = get().comments.filter(c => c.taskId === taskId);
        const countMap: Record<number, number> = {};
        taskComments.forEach(c => {
          const page = c.pageIndex;
          countMap[page] = (countMap[page] || 0) + 1;
        });
        return countMap;
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
          urgent: allComments.filter(c => c.level === 'urgent').length,
          suggest: allComments.filter(c => c.level === 'suggest').length,
          reference: allComments.filter(c => c.level === 'reference').length
        };
      },

      getCoverageInfo: (taskId: string) => {
        const task = get().tasks.find(t => t.id === taskId);
        if (!task) {
          return {
            pagesWithoutComments: [],
            focusCoverage: [],
            focusMissed: [],
            coverageRatio: 0
          };
        }

        const taskComments = get().comments.filter(c => c.taskId === taskId);
        const pagesWithComments = new Set(taskComments.map(c => c.pageIndex));
        const pagesWithoutComments: number[] = [];

        for (let i = 1; i <= task.pageCount; i++) {
          if (!pagesWithComments.has(i)) {
            pagesWithoutComments.push(i);
          }
        }

        const commentPages = pagesWithComments.size;
        const totalPages = task.pageCount;
        const coverageRatio = totalPages > 0 ? commentPages / totalPages : 0;

        const commentFocus = new Set<FocusArea>();
        taskComments.forEach(c => {
          if (c.pageIndex >= 0) {
            commentFocus.add(c.level as FocusArea);
          }
        });

        const focusCoverage: string[] = [];
        const focusMissed: string[] = [];

        task.focusAreas.forEach(focus => {
          const hasComment = taskComments.some(c => {
            if (focus === 'fight') return /打鬥|动作|战斗|分镜|武打/i.test(c.content);
            if (focus === 'romance') return /感情|恋爱|互动|CP|暧昧/i.test(c.content);
            if (focus === 'gag') return /搞笑|笑点|幽默|梗|趣味/i.test(c.content);
            if (focus === 'vertical') return /竖屏|阅读|节奏|分镜|滚动/i.test(c.content);
            if (focus === 'story') return /剧情|故事|节奏|铺垫|转折/i.test(c.content);
            if (focus === 'art') return /画风|画面|美术|构图|透视/i.test(c.content);
            return false;
          });

          if (hasComment) {
            focusCoverage.push(getFocusLabel(focus));
          } else {
            focusMissed.push(getFocusLabel(focus));
          }
        });

        return {
          pagesWithoutComments,
          focusCoverage,
          focusMissed,
          coverageRatio
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
