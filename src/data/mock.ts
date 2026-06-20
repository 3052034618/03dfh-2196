import type { Task, Comment, ChatMessage, CommentTemplate } from '@/types';

const now = Date.now();
const dayMs = 24 * 60 * 60 * 1000;

export const mockTasks: Task[] = [
  {
    id: 'task-001',
    title: '《剑影星河》第12话审稿',
    workName: '剑影星河',
    episode: 12,
    pageCount: 24,
    deadline: new Date(now + 2 * dayMs).toISOString(),
    focusAreas: ['fight', 'story', 'vertical'],
    status: 'pending',
    authorName: '墨白',
    createdAt: new Date(now - 1 * dayMs).toISOString(),
    description: '本话为高潮打斗章节，重点关注打斗分镜的流畅度和竖屏阅读体验，以及剧情转折是否自然。',
    coverImage: 'https://picsum.photos/id/1/750/500',
    panelImages: [
      'https://picsum.photos/id/1015/750/1200',
      'https://picsum.photos/id/1018/750/1200',
      'https://picsum.photos/id/1036/750/1200',
      'https://picsum.photos/id/1039/750/1200',
      'https://picsum.photos/id/1044/750/1200',
      'https://picsum.photos/id/10/750/1200',
      'https://picsum.photos/id/119/750/1200',
      'https://picsum.photos/id/160/750/1200'
    ]
  },
  {
    id: 'task-002',
    title: '《樱花季节》第8话审稿',
    workName: '樱花季节',
    episode: 8,
    pageCount: 18,
    deadline: new Date(now + 1 * dayMs).toISOString(),
    focusAreas: ['romance', 'gag'],
    status: 'inProgress',
    authorName: '小樱',
    reviewerName: '资深顾问·林老师',
    createdAt: new Date(now - 2 * dayMs).toISOString(),
    description: '校园恋爱日常，重点关注情绪表达和笑点节奏把控。',
    coverImage: 'https://picsum.photos/id/1027/750/500',
    panelImages: [
      'https://picsum.photos/id/64/750/1200',
      'https://picsum.photos/id/91/750/1200',
      'https://picsum.photos/id/177/750/1200',
      'https://picsum.photos/id/338/750/1200',
      'https://picsum.photos/id/1027/750/1200',
      'https://picsum.photos/id/237/750/1200'
    ]
  },
  {
    id: 'task-003',
    title: '《异星调查局》试读短篇审稿',
    workName: '异星调查局',
    episode: 1,
    pageCount: 12,
    deadline: new Date(now + 3 * dayMs).toISOString(),
    focusAreas: ['story', 'art', 'vertical'],
    status: 'pending',
    authorName: '星河画师',
    createdAt: new Date(now - 5 * 3600 * 1000).toISOString(),
    description: '平台赛稿参赛作品短篇试读，希望快速把关整体质量。',
    coverImage: 'https://picsum.photos/id/201/750/500',
    panelImages: [
      'https://picsum.photos/id/1/750/1200',
      'https://picsum.photos/id/2/750/1200',
      'https://picsum.photos/id/3/750/1200',
      'https://picsum.photos/id/6/750/1200',
      'https://picsum.photos/id/8/750/1200'
    ]
  },
  {
    id: 'task-004',
    title: '《江湖客栈》第20话审稿',
    workName: '江湖客栈',
    episode: 20,
    pageCount: 20,
    deadline: new Date(now - 1 * dayMs).toISOString(),
    focusAreas: ['gag', 'story'],
    status: 'completed',
    authorName: '老江湖',
    reviewerName: '资深顾问·陈老师',
    createdAt: new Date(now - 5 * dayMs).toISOString(),
    description: '武侠喜剧题材，重点关注包袱节奏和剧情推进。',
    coverImage: 'https://picsum.photos/id/1082/750/500',
    panelImages: [
      'https://picsum.photos/id/787/750/1200',
      'https://picsum.photos/id/1082/750/1200',
      'https://picsum.photos/id/3/750/1200',
      'https://picsum.photos/id/10/750/1200'
    ]
  },
  {
    id: 'task-005',
    title: '《机甲纪元》第5话审稿',
    workName: '机甲纪元',
    episode: 5,
    pageCount: 22,
    deadline: new Date(now + 5 * dayMs).toISOString(),
    focusAreas: ['fight', 'art'],
    status: 'pending',
    authorName: '铁甲工程师',
    createdAt: new Date(now - 3 * 3600 * 1000).toISOString(),
    description: '科幻机甲战斗场景，重点关注机械打斗的分镜表现和画面冲击力。',
    coverImage: 'https://picsum.photos/id/119/750/500',
    panelImages: [
      'https://picsum.photos/id/119/750/1200',
      'https://picsum.photos/id/160/750/1200',
      'https://picsum.photos/id/201/750/1200'
    ]
  },
  {
    id: 'task-006',
    title: '《灵宠日记》第15话审稿',
    workName: '灵宠日记',
    episode: 15,
    pageCount: 16,
    deadline: new Date(now + 4 * dayMs).toISOString(),
    focusAreas: ['gag', 'romance', 'art'],
    status: 'inProgress',
    authorName: '萌萌子',
    reviewerName: '顾问·小鹿',
    createdAt: new Date(now - 1 * dayMs).toISOString(),
    description: '治愈系萌宠日常，审稿时关注可爱度和笑点表现。',
    coverImage: 'https://picsum.photos/id/237/750/500',
    panelImages: [
      'https://picsum.photos/id/237/750/1200',
      'https://picsum.photos/id/659/750/1200',
      'https://picsum.photos/id/718/750/1200'
    ]
  }
];

export const mockComments: Comment[] = [
  {
    id: 'comment-001',
    taskId: 'task-002',
    pageIndex: 2,
    content: '这个特写镜头非常好，女主脸红的表情捕捉到位，恋爱情绪感拉满！',
    level: 'reference',
    reviewerName: '资深顾问·林老师',
    createdAt: new Date(now - 2 * 3600 * 1000).toISOString(),
    isRead: true
  },
  {
    id: 'comment-002',
    taskId: 'task-002',
    pageIndex: 4,
    content: '第4页的笑点铺垫略显拖沓，建议缩减1-2格，让包袱抖得更干脆。',
    level: 'suggest',
    reviewerName: '资深顾问·林老师',
    createdAt: new Date(now - 1.5 * 3600 * 1000).toISOString(),
    isRead: true
  },
  {
    id: 'comment-003',
    taskId: 'task-002',
    pageIndex: 6,
    content: '最后一格的对话气泡位置挡住了男主的关键表情，必须调整位置或重新排版。',
    level: 'urgent',
    reviewerName: '资深顾问·林老师',
    createdAt: new Date(now - 1 * 3600 * 1000).toISOString(),
    isRead: false
  },
  {
    id: 'comment-004',
    taskId: 'task-004',
    pageIndex: 1,
    content: '开篇的场景交代很清晰，读者能快速进入情境。',
    level: 'reference',
    reviewerName: '资深顾问·陈老师',
    createdAt: new Date(now - 3 * dayMs).toISOString(),
    isRead: true
  },
  {
    id: 'comment-005',
    taskId: 'task-004',
    pageIndex: 3,
    content: '第三页的转场有些突兀，建议加一格过渡画面，让读者理解时间流逝。',
    level: 'suggest',
    reviewerName: '资深顾问·陈老师',
    createdAt: new Date(now - 3 * dayMs + 1800 * 1000).toISOString(),
    isRead: true
  },
  {
    id: 'comment-006',
    taskId: 'task-006',
    pageIndex: 1,
    content: '灵宠出场很可爱，这一页的构图很棒！',
    level: 'reference',
    reviewerName: '顾问·小鹿',
    createdAt: new Date(now - 30 * 60 * 1000).toISOString(),
    isRead: false
  }
];

export const mockChatMessages: ChatMessage[] = [
  {
    id: 'msg-001',
    commentId: 'comment-003',
    senderName: '资深顾问·林老师',
    senderRole: 'reviewer',
    content: '这里挡住了男主惊讶的表情，读者会错过重要的情绪反馈。',
    createdAt: new Date(now - 1 * 3600 * 1000).toISOString()
  },
  {
    id: 'msg-002',
    commentId: 'comment-003',
    senderName: '小樱',
    senderRole: 'author',
    content: '好的林老师，我把气泡移到右上角可以吗？这样会不会挡住背景？',
    createdAt: new Date(now - 45 * 60 * 1000).toISOString()
  },
  {
    id: 'msg-003',
    commentId: 'comment-003',
    senderName: '资深顾问·林老师',
    senderRole: 'reviewer',
    content: '右上角没问题，那里留白比较多，不会影响阅读。',
    createdAt: new Date(now - 30 * 60 * 1000).toISOString()
  },
  {
    id: 'msg-004',
    commentId: 'comment-002',
    senderName: '资深顾问·林老师',
    senderRole: 'reviewer',
    content: '前面铺垫了4格才抖包袱，读者耐心会被消耗。',
    createdAt: new Date(now - 1.5 * 3600 * 1000).toISOString()
  },
  {
    id: 'msg-005',
    commentId: 'comment-002',
    senderName: '小樱',
    senderRole: 'author',
    content: '收到，我试着删掉中间两格铺垫，直接从铺垫跳到笑点。',
    createdAt: new Date(now - 1 * 3600 * 1000).toISOString()
  }
];

export const mockTemplates: CommentTemplate[] = [
  { id: 'tpl-001', category: '构图', content: '这一页构图很棒，视觉焦点明确', level: 'reference' },
  { id: 'tpl-002', category: '构图', content: '画面元素有点拥挤，建议简化一下', level: 'suggest' },
  { id: 'tpl-003', category: '分镜', content: '分镜流畅，阅读体验很好', level: 'reference' },
  { id: 'tpl-004', category: '分镜', content: '转场有点突兀，建议加过渡格', level: 'suggest' },
  { id: 'tpl-005', category: '分镜', content: '竖屏翻页节奏感稍弱，注意格与格之间的引导', level: 'suggest' },
  { id: 'tpl-006', category: '对话', content: '对话自然，符合角色性格', level: 'reference' },
  { id: 'tpl-007', category: '对话', content: '对话气泡挡住了重要画面，请调整位置', level: 'urgent' },
  { id: 'tpl-008', category: '情绪', content: '情绪表达到位，很有感染力', level: 'reference' },
  { id: 'tpl-009', category: '情绪', content: '情绪转折稍显生硬，可以再铺垫一下', level: 'suggest' },
  { id: 'tpl-010', category: '节奏', content: '这个笑点包袱抖得很漂亮', level: 'reference' },
  { id: 'tpl-011', category: '节奏', content: '节奏可以再紧凑一些', level: 'suggest' },
  { id: 'tpl-012', category: '剧情', content: '剧情推进清晰，读者容易理解', level: 'reference' },
  { id: 'tpl-013', category: '剧情', content: '这里的逻辑需要再梳理一下', level: 'urgent' }
];
