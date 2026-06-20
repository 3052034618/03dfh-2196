import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import FeedbackItem from '@/components/FeedbackItem';
import ChatBubble from '@/components/ChatBubble';
import { useAppStore } from '@/store';
import type { Comment, FeedbackLevel, ChatMessage } from '@/types';
import { LEVEL_TEXT, LEVEL_COLOR } from '@/utils';

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

const FeedbackPage: React.FC = () => {
  const comments = useAppStore(s => s.comments);
  const tasks = useAppStore(s => s.tasks);
  const chatMessages = useAppStore(s => s.chatMessages);
  const addChatMessage = useAppStore(s => s.addChatMessage);
  const getTaskById = useAppStore(s => s.getTaskById);

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showChat, setShowChat] = useState(false);
  const [activeComment, setActiveComment] = useState<Comment | null>(null);
  const [inputText, setInputText] = useState('');

  const urgentCount = comments.filter(c => c.level === 'urgent' && !c.isRead).length;
  const suggestCount = comments.filter(c => c.level === 'suggest').length;
  const referenceCount = comments.filter(c => c.level === 'reference').length;

  const filteredComments = useMemo(() => {
    let list = activeFilter === 'all' ? comments : comments.filter(c => c.level === activeFilter);
    return list.sort((a, b) => {
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [comments, activeFilter]);

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

  const activeMessages = useMemo(() => {
    return activeComment
      ? chatMessages.filter(m => m.commentId === activeComment.id)
      : [];
  }, [chatMessages, activeComment]);

  return (
    <View className={styles.page}>
      {!showChat ? (
        <>
          <View className={styles.header}>
            <Text className={styles.title}>意见反馈</Text>
            <Text className={styles.subTitle}>查看审稿顾问给出的修改意见</Text>
          </View>

          <View className={styles.statsRow}>
            <View className={classnames(styles.statCard, styles.statCardUrgent)}>
              <Text className={classnames(styles.statNum, styles.statNumUrgent)}>{urgentCount}</Text>
              <Text className={styles.statLabel}>必须修改</Text>
            </View>
            <View className={classnames(styles.statCard, styles.statCardSuggest)}>
              <Text className={classnames(styles.statNum, styles.statNumSuggest)}>{suggestCount}</Text>
              <Text className={styles.statLabel}>建议优化</Text>
            </View>
            <View className={classnames(styles.statCard, styles.statCardReference)}>
              <Text className={classnames(styles.statNum, styles.statNumReference)}>{referenceCount}</Text>
              <Text className={styles.statLabel}>仅供参考</Text>
            </View>
          </View>

          <View className={styles.levelTabs}>
            {LEVEL_TABS.map(tab => {
              const isActive = activeFilter === tab.key;
              const count =
                tab.key === 'urgent' ? urgentCount :
                tab.key === 'suggest' ? suggestCount :
                tab.key === 'reference' ? referenceCount : 0;
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
                  task={getTaskById(comment.taskId)}
                  onAsk={handleAsk}
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
                  <Text className={styles.originalPage}>第{activeComment.pageIndex}页</Text>
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
