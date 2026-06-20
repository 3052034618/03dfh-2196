import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import FeedbackItem from '@/components/FeedbackItem';
import ChatBubble from '@/components/ChatBubble';
import { useAppStore } from '@/store';
import type { Comment, FeedbackLevel, ChatMessage, Task, CommentStatus, StatusFilterType } from '@/types';
import { LEVEL_TEXT, LEVEL_COLOR } from '@/utils';
import { STATUS_FILTER_TABS } from '@/types';

type FilterType = 'all' | FeedbackLevel;

const LEVEL_TABS: { key: FilterType; label: string; styleKey: string }[] = [
  { key: 'all', label: '全部', styleKey: 'All' },
  { key: 'urgent', label: '必须修改', styleKey: 'Urgent' },
  { key: 'suggest', label: '建议优化', styleKey: 'Suggest' },
  { key: 'reference', label: '仅供参考', styleKey: 'Reference' }
];

const SIMULATED_REPLIES = [
  '好的，我收到你的问题了，让我再仔细看一下这一页~',
  '确实，这个地方我也考虑到了，主要是担心调整后影响整体节奏',
  '你说得对，我再想想有没有更好的处理方式',
  '没问题，这个建议很实用，我会在修改时注意的',
  '了解，我重新审视一下这个分镜的布局，看看能否优化'
];

interface WorkGroup {
  workName: string;
  episodes: {
    task: Task;
    episode: number;
    comments: Comment[];
    summary: { urgent: number; suggest: number; reference: number };
  }[];
  totalComments: number;
}

const FeedbackPage: React.FC = () => {
  const tasks = useAppStore(s => s.tasks);
  const comments = useAppStore(s => s.comments);
  const chatMessages = useAppStore(s => s.chatMessages);
  const addChatMessage = useAppStore(s => s.addChatMessage);
  const updateCommentStatus = useAppStore(s => s.updateCommentStatus);
  const getTaskById = useAppStore(s => s.getTaskById);
  const getCommentSummaryAll = useAppStore(s => s.getCommentSummaryAll);

  const [viewMode, setViewMode] = useState<'group' | 'detail'>('group');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');
  const [showChat, setShowChat] = useState(false);
  const [activeComment, setActiveComment] = useState<Comment | null>(null);
  const [inputText, setInputText] = useState('');

  const summary = useMemo(() => getCommentSummaryAll(), [comments]);

  const workGroups = useMemo((): WorkGroup[] => {
    const taskMap = new Map<string, WorkGroup>();

    tasks.forEach(task => {
      const taskComments = comments.filter(c => c.taskId === task.id);
      if (taskComments.length === 0) return;

      const taskSummary = {
        urgent: taskComments.filter(c => c.level === 'urgent').length,
        suggest: taskComments.filter(c => c.level === 'suggest').length,
        reference: taskComments.filter(c => c.level === 'reference').length
      };

      if (!taskMap.has(task.workName)) {
        taskMap.set(task.workName, {
          workName: task.workName,
          episodes: [],
          totalComments: 0
        });
      }

      const group = taskMap.get(task.workName)!;
      group.episodes.push({
        task,
        episode: task.episode,
        comments: taskComments,
        summary: taskSummary
      });
      group.totalComments += taskComments.length;
    });

    return Array.from(taskMap.values()).sort((a, b) => b.totalComments - a.totalComments);
  }, [tasks, comments]);

  const filteredComments = useMemo(() => {
    if (!selectedTask) return [];
    const taskComments = comments.filter(c => c.taskId === selectedTask.id);
    let list = activeFilter === 'all' ? taskComments : taskComments.filter(c => c.level === activeFilter);
    list = statusFilter === 'all' ? list : list.filter(c => c.status === statusFilter);
    return list.sort((a, b) => {
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [selectedTask, comments, activeFilter, statusFilter]);

  const currentTaskSummary = useMemo(() => {
    if (!selectedTask) return { urgent: 0, suggest: 0, reference: 0 };
    const taskComments = comments.filter(c => c.taskId === selectedTask.id);
    return {
      urgent: taskComments.filter(c => c.level === 'urgent').length,
      suggest: taskComments.filter(c => c.level === 'suggest').length,
      reference: taskComments.filter(c => c.level === 'reference').length
    };
  }, [selectedTask, comments]);

  const handleClickEpisode = (task: Task) => {
    setSelectedTask(task);
    setViewMode('detail');
    setActiveFilter('all');
    console.log('[Feedback] 进入话数详情', task.id);
  };

  const handleBackToGroup = () => {
    setViewMode('group');
    setSelectedTask(null);
    console.log('[Feedback] 返回作品分组');
  };

  const handleAsk = (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      setActiveComment(comment);
      setShowChat(true);
      console.log('[Feedback] 打开追问对话', commentId);
    }
  };

  const handleCloseChat = () => {
    setShowChat(false);
    setActiveComment(null);
  };

  const handleSend = () => {
    if (!inputText.trim() || !activeComment) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      commentId: activeComment.id,
      senderName: '我',
      senderRole: 'author',
      content: inputText.trim(),
      createdAt: new Date().toISOString()
    };

    addChatMessage(newMsg);
    setInputText('');
    Taro.showToast({
      title: '发送成功',
      icon: 'success'
    });
    console.log('[Feedback] 发送追问消息', newMsg.id);

    const replyIdx = Math.floor(Math.random() * SIMULATED_REPLIES.length);
    const replyContent = SIMULATED_REPLIES[replyIdx];
    setTimeout(() => {
      const replyMsg: ChatMessage = {
        id: `msg-${Date.now()}-reply`,
        commentId: activeComment.id,
        senderName: activeComment.reviewerName,
        senderRole: 'reviewer',
        content: replyContent,
        createdAt: new Date().toISOString()
      };
      addChatMessage(replyMsg);
      console.log('[Feedback] 收到顾问回复', replyMsg.id);
    }, 1500);
  };

  const handleRefresh = () => {
    console.log('[Feedback] 下拉刷新');
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 800);
  };

  const handleUpdateStatus = (commentId: string, status: CommentStatus) => {
    updateCommentStatus(commentId, status);
    Taro.showToast({
      title: '已更新状态',
      icon: 'success',
      duration: 1000
    });
  };

  const activeMessages = useMemo(() => {
    return activeComment
      ? chatMessages.filter(m => m.commentId === activeComment.id)
      : [];
  }, [chatMessages, activeComment]);

  const activeCommentTask = useMemo(() => {
    return activeComment ? getTaskById(activeComment.taskId) : null;
  }, [activeComment, tasks]);

  const renderGroupView = () => (
    <>
      <View className={styles.header}>
        <Text className={styles.title}>意见反馈</Text>
        <Text className={styles.subTitle}>按作品查看审稿顾问给出的修改意见</Text>
      </View>

      <View className={styles.statsRow}>
        <View className={classnames(styles.statCard, styles.statCardUrgent)}>
          <Text className={classnames(styles.statNum, styles.statNumUrgent)}>{summary.urgent}</Text>
          <Text className={styles.statLabel}>必须修改</Text>
        </View>
        <View className={classnames(styles.statCard, styles.statCardSuggest)}>
          <Text className={classnames(styles.statNum, styles.statNumSuggest)}>{summary.suggest}</Text>
          <Text className={styles.statLabel}>建议优化</Text>
        </View>
        <View className={classnames(styles.statCard, styles.statCardReference)}>
          <Text className={classnames(styles.statNum, styles.statNumReference)}>{summary.reference}</Text>
          <Text className={styles.statLabel}>仅供参考</Text>
        </View>
      </View>

      <ScrollView
        scrollY
        className={styles.commentList}
        refresherEnabled
        onRefresherRefresh={handleRefresh}
      >
        {workGroups.length > 0 ? (
          workGroups.map(group => (
            <View key={group.workName} className={styles.workGroupCard}>
              <View className={styles.workGroupHeader}>
                <Text className={styles.workGroupIcon}>📚</Text>
                <Text className={styles.workGroupTitle}>{group.workName}</Text>
                <Text className={styles.workGroupCount}>
                  {group.totalComments} 条意见
                </Text>
              </View>
              <View className={styles.workGroupEpisodes}>
                {group.episodes
                  .sort((a, b) => a.episode - b.episode)
                  .map(ep => (
                    <View
                      key={ep.task.id}
                      className={styles.episodeItem}
                      onClick={() => handleClickEpisode(ep.task)}
                    >
                      <View className={styles.episodeInfo}>
                        <Text className={styles.episodeName}>第{ep.episode}话</Text>
                        <Text className={styles.episodeMeta}>
                          {ep.task.reviewerName || '待接单'}
                        </Text>
                      </View>
                      <View className={styles.episodeStats}>
                        {ep.summary.urgent > 0 && (
                          <Text className={classnames(styles.episodeStat, styles.episodeStatUrgent)}>
                            {ep.summary.urgent}
                          </Text>
                        )}
                        {ep.summary.suggest > 0 && (
                          <Text className={classnames(styles.episodeStat, styles.episodeStatSuggest)}>
                            {ep.summary.suggest}
                          </Text>
                        )}
                        {ep.summary.reference > 0 && (
                          <Text className={classnames(styles.episodeStat, styles.episodeStatReference)}>
                            {ep.summary.reference}
                          </Text>
                        )}
                        <Text className={styles.episodeArrow}>›</Text>
                      </View>
                    </View>
                  ))}
              </View>
            </View>
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>💬</Text>
            <Text className={styles.emptyText}>暂无审稿意见</Text>
          </View>
        )}
      </ScrollView>
    </>
  );

  const renderDetailView = () => (
    <>
      <View className={styles.detailHeader}>
        <View className={styles.detailBack} onClick={handleBackToGroup}>
          <Text>←</Text>
          <Text>返回作品列表</Text>
        </View>
        <Text className={styles.detailTitle}>{selectedTask?.title}</Text>
        <Text className={styles.detailSub}>
          共 {selectedTask ? comments.filter(c => c.taskId === selectedTask.id).length : 0} 条意见
        </Text>
      </View>

      <View className={styles.statsRow} style={{ paddingTop: 24, paddingBottom: 12 }}>
        <View className={classnames(styles.statCard, styles.statCardUrgent)}>
          <Text className={classnames(styles.statNum, styles.statNumUrgent)}>{currentTaskSummary.urgent}</Text>
          <Text className={styles.statLabel}>必须修改</Text>
        </View>
        <View className={classnames(styles.statCard, styles.statCardSuggest)}>
          <Text className={classnames(styles.statNum, styles.statNumSuggest)}>{currentTaskSummary.suggest}</Text>
          <Text className={styles.statLabel}>建议优化</Text>
        </View>
        <View className={classnames(styles.statCard, styles.statCardReference)}>
          <Text className={classnames(styles.statNum, styles.statNumReference)}>{currentTaskSummary.reference}</Text>
          <Text className={styles.statLabel}>仅供参考</Text>
        </View>
      </View>

      <View className={styles.levelTabs}>
        {LEVEL_TABS.map(tab => {
          const isActive = activeFilter === tab.key;
          const count =
            tab.key === 'urgent' ? currentTaskSummary.urgent :
            tab.key === 'suggest' ? currentTaskSummary.suggest :
            tab.key === 'reference' ? currentTaskSummary.reference : 0;
          return (
            <View
              key={tab.key}
              className={classnames(
                styles.levelTab,
                styles[`levelTab${tab.styleKey}`],
                { [styles.levelTabActive]: isActive }
              )}
              onClick={() => setActiveFilter(tab.key)}
            >
              {tab.label}
              {count > 0 && (
                <Text className={styles.levelTabBadge}>{count}</Text>
              )}
            </View>
          );
        })}
      </View>

      <ScrollView scrollX className={styles.statusScrollTab}>
        <View className={styles.statusTabs}>
          {STATUS_FILTER_TABS.map(tab => {
            const isActive = statusFilter === tab.key;
            return (
              <View
                key={tab.key}
                className={classnames(styles.statusTab, {
                  [styles.statusTabActive]: isActive
                })}
                onClick={() => setStatusFilter(tab.key)}
              >
                {tab.label}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <ScrollView
        scrollY
        className={styles.commentList}
        refresherEnabled
        onRefresherRefresh={handleRefresh}
      >
        {filteredComments.length > 0 ? (
          filteredComments.map(comment => (
            <FeedbackItem
              key={comment.id}
              comment={comment}
              task={selectedTask || undefined}
              onAsk={handleAsk}
              onUpdateStatus={handleUpdateStatus}
            />
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>💬</Text>
            <Text className={styles.emptyText}>暂无此类意见</Text>
          </View>
        )}
      </ScrollView>
    </>
  );

  return (
    <View className={styles.page}>
      {!showChat ? (
        viewMode === 'group' ? renderGroupView() : renderDetailView()
      ) : (
        <View className={styles.chatModal}>
          <View className={styles.chatHeader}>
            <Text className={styles.chatBack} onClick={handleCloseChat}>←</Text>
            <Text className={styles.chatTitle}>
              {activeComment ? activeComment.reviewerName : ''}
            </Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView scrollY className={styles.chatContent}>
            {activeComment && (
              <View className={styles.originalComment}>
                <View className={styles.originalMeta}>
                  <Text className={styles.originalTask}>
                    📄 {activeCommentTask?.title || '未知任务'}
                  </Text>
                  <Text className={styles.originalPage}>
                    第{activeComment.pageIndex}页
                  </Text>
                </View>
                <View className={styles.originalHeader}>
                  <View
                    className={styles.originalLevel}
                    style={{
                      background: `rgba(${LEVEL_COLOR[activeComment.level] === '#F53F3F' ? '245,63,63' : LEVEL_COLOR[activeComment.level] === '#FF7D00' ? '255,125,0' : '134,144,156'}, 0.1)`,
                      color: LEVEL_COLOR[activeComment.level]
                    }}
                  >
                    {LEVEL_TEXT[activeComment.level]}
                  </View>
                </View>
                <Text className={styles.originalText}>{activeComment.content}</Text>
              </View>
            )}

            <View className={styles.chatMessages}>
              {activeMessages.map(msg => (
                <ChatBubble
                  key={msg.id}
                  message={msg}
                  isMine={msg.senderRole === 'author'}
                />
              ))}
            </View>
          </ScrollView>

          <View className={styles.chatInputArea}>
            <Input
              className={styles.chatInput}
              placeholder='输入你的追问...'
              value={inputText}
              onInput={(e) => setInputText(e.detail.value)}
              onConfirm={handleSend}
            />
            <Button className={styles.chatSendBtn} onClick={handleSend}>
              发送
            </Button>
          </View>
        </View>
      )}
    </View>
  );
};

export default FeedbackPage;
