import { create } from 'zustand';
import type { Task, Comment, ChatMessage, TaskStatus, FeedbackLevel, FocusArea } from '@/types';
import { mockTasks, mockComments, mockChatMessages } from '@/data/mock';

interface AppStore {
  tasks: Task[];
  comments: Comment[];
  chatMessages: ChatMessage[];

  addTask: (task: Task) => void;
  takeTask: (taskId: string) => void;
  addComment: (comment: Comment) => void;
  addChatMessage: (message: ChatMessage) => void;
  markCommentRead: (commentId: string) => void;
  getTaskById: (taskId: string) => Task | undefined;
  getCommentsByTaskId: (taskId: string) => Comment[];
  getChatMessagesByCommentId: (commentId: string) => ChatMessage[];
}

export const useAppStore = create<AppStore>((set, get) => ({
  tasks: [...mockTasks],
  comments: [...mockComments],
  chatMessages: [...mockChatMessages],

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
          ? { ...t, status: 'inProgress' as TaskStatus, reviewerName: '我' }
          : t
      )
    }));
    console.log('[Store] 接单', taskId);
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
  }
}));
