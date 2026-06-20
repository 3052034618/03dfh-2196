import React, { useState, useMemo } from 'react';
import { View, Text, Input, Swiper, SwiperItem, Image, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import TaskCard from '@/components/TaskCard';
import CommentTemplate from '@/components/CommentTemplate';
import { useAppStore } from '@/store';
import { mockTemplates } from '@/data/mock';
import type { Task, FeedbackLevel, Comment } from '@/types';
import { LEVEL_TEXT, getFocusLabel } from '@/utils';

const SIMULATED_VOICE_TEXTS = [
  '这页的分镜节奏不错，视觉引导很清晰，读者能自然地跟随画面阅读',
  '这一格的构图稍显拥挤，角色表情和背景元素有点冲突，建议适当留白',
  '翻页到这里情绪转折很自然，但下一页的衔接稍显突兀，可以加一格过渡',
  '打斗动作的连贯性很好，冲击力十足，但最后一击的定格格可以再大一些',
  '对话气泡位置不太理想，遮住了角色关键表情，建议调整到画面空白区域',
  '包袱抖得不错，前后的节奏感很好，读者应该能在这个位置笑出来',
  '这一页竖屏翻页体验还行，但中缝位置刚好切在了角色脸上，需要注意',
  '整体画面质量很高，色彩和线条都很精致，继续保持这个水准'
];

const ReviewPage: React.FC = () => {
  const tasks = useAppStore(s => s.tasks);
  const addComment = useAppStore(s => s.addComment);
  const comments = useAppStore(s => s.comments);

  const inProgressTasks = useMemo(() => tasks.filter(t => t.status === 'inProgress'), [tasks]);
  const [currentTask, setCurrentTask] = useState<Task | null>(inProgressTasks[0] || null);
  const [currentPage, setCurrentPage] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<FeedbackLevel>('suggest');
  const [isRecording, setIsRecording] = useState(false);

  const handleSelectTask = (task: Task) => {
    setCurrentTask(task);
    setCurrentPage(0);
    console.log('[Review] 选择审稿任务', task.id);
  };

  const handleSwiperChange = (e: any) => {
    setCurrentPage(e.detail.current);
  };

  const handleOpenComment = () => {
    setShowPanel(true);
    setCommentText('');
    setSelectedLevel('suggest');
    setIsRecording(false);
  };

  const handleClosePanel = () => {
    setShowPanel(false);
    setIsRecording(false);
  };

  const handleTemplateSelect = (content: string, level: FeedbackLevel) => {
    setCommentText(content);
    setSelectedLevel(level);
  };

  const handleVoiceToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      const idx = Math.floor(Math.random() * SIMULATED_VOICE_TEXTS.length);
      const simulated = SIMULATED_VOICE_TEXTS[idx];
      setCommentText(prev => {
        if (prev.trim()) return prev + '，' + simulated;
        return simulated;
      });
      Taro.showToast({
        title: '语音识别完成',
        icon: 'success'
      });
      console.log('[Review] 语音转文字完成');
    } else {
      setIsRecording(true);
      Taro.showToast({
        title: '正在录音...',
        icon: 'none',
        duration: 2000
      });
      console.log('[Review] 开始录音');
    }
  };

  const handleSubmit = () => {
    const trimmedText = commentText.trim();
    if (!trimmedText) {
      Taro.showToast({
        title: '请输入评论内容',
        icon: 'none'
      });
      return;
    }

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      taskId: currentTask?.id || '',
      pageIndex: currentPage + 1,
      content: trimmedText,
      level: selectedLevel,
      reviewerName: '我',
      createdAt: new Date().toISOString(),
      isRead: true
    };

    addComment(newComment);
    setShowPanel(false);
    setCommentText('');
    setIsRecording(false);

    Taro.showToast({
      title: '评论已提交',
      icon: 'success'
    });
    console.log('[Review] 提交评论', newComment.id);
  };

  const handleFinish = () => {
    const taskCommentsCount = comments.filter(c => c.taskId === currentTask?.id).length;
    Taro.showModal({
      title: '确认完成审稿',
      content: `您已提交 ${taskCommentsCount} 条评论，确认完成本次审稿？`,
      confirmText: '确认完成',
      confirmColor: '#7B5CFF',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({
            title: '审稿完成',
            icon: 'success'
          });
          console.log('[Review] 完成审稿', currentTask?.id);
        }
      }
    });
  };

  if (!currentTask) {
    return (
      <View className={styles.emptyState}>
        <Text className={styles.emptyIcon}>🎨</Text>
        <Text className={styles.emptyText}>暂无进行中的审稿任务</Text>
        <Text className={styles.emptyDesc}>请先前往任务大厅接单</Text>
      </View>
    );
  }

  const totalPages = currentTask.panelImages.length;
  const taskCommentsCount = comments.filter(c => c.taskId === currentTask.id).length;

  return (
    <View className={styles.page}>
      {inProgressTasks.length > 1 && (
        <View className={styles.taskSelector}>
          <Text className={styles.selectorTitle}>选择审稿任务</Text>
          <ScrollView scrollX className='task-scroll'>
            {inProgressTasks.map(task => (
              <View key={task.id} onClick={() => handleSelectTask(task)}>
                <TaskCard task={task} />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View className={styles.header}>
        <View className={styles.taskInfo}>
          <Text className={styles.taskTitle}>{currentTask.title}</Text>
          <Text className={styles.taskMeta}>已提交 {taskCommentsCount} 条评论</Text>
        </View>
        <View className={styles.pageIndicator}>
          {currentPage + 1} / {totalPages}
        </View>
      </View>

      <View className={styles.readerContainer}>
        <Swiper
          className={styles.panelSwiper}
          vertical
          current={currentPage}
          onChange={handleSwiperChange}
          indicatorDots={false}
        >
          {currentTask.panelImages.map((img, index) => (
            <SwiperItem key={index}>
              <View className={styles.panelItem}>
                <Image
                  className={styles.panelImage}
                  src={img}
                  mode='widthFix'
                  onError={(e) => console.error('[Review] 图片加载失败', e)}
                />
              </View>
            </SwiperItem>
          ))}
        </Swiper>
      </View>

      {!showPanel && (
        <View className={styles.bottomBar}>
          <Button className={styles.commentBtn} onClick={handleOpenComment}>
            ✏️ 写评论
          </Button>
          <Button className={styles.finishBtn} onClick={handleFinish}>
            ✓ 完成审稿
          </Button>
        </View>
      )}

      {showPanel && (
        <View className={styles.commentPanel}>
          <View className={styles.panelHeader}>
            <Text className={styles.panelTitle}>对第 {currentPage + 1} 页发表评论</Text>
            <Text className={styles.panelClose} onClick={handleClosePanel}>✕</Text>
          </View>

          <View className={styles.levelSelector}>
            {(['urgent', 'suggest', 'reference'] as FeedbackLevel[]).map(level => (
              <View
                key={level}
                className={classnames(styles.levelBtn, {
                  [styles.levelActive]: selectedLevel === level,
                  [styles.levelUrgent]: level === 'urgent' && selectedLevel === level,
                  [styles.levelSuggest]: level === 'suggest' && selectedLevel === level,
                  [styles.levelReference]: level === 'reference' && selectedLevel === level
                })}
                onClick={() => setSelectedLevel(level)}
              >
                {LEVEL_TEXT[level]}
              </View>
            ))}
          </View>

          <View className={styles.templateSection}>
            <CommentTemplate
              templates={mockTemplates}
              onSelect={handleTemplateSelect}
            />
          </View>

          <View className={styles.inputArea}>
            <View className={styles.inputRow}>
              <Input
                className={styles.textInput}
                placeholder='输入你的评论，或点击麦克风语音输入'
                value={commentText}
                onInput={(e) => setCommentText(e.detail.value)}
              />
              <Button
                className={classnames(styles.voiceBtn, {
                  [styles.voiceBtnActive]: isRecording
                })}
                onClick={handleVoiceToggle}
              >
                <Text className={styles.voiceIcon}>🎤</Text>
              </Button>
            </View>
            {isRecording && (
              <Text className={styles.recordingTip}>正在录音，点击麦克风结束...</Text>
            )}
          </View>

          <View className={styles.submitRow}>
            <Button className={styles.cancelBtn} onClick={handleClosePanel}>
              取消
            </Button>
            <Button className={styles.submitBtn} onClick={handleSubmit}>
              提交评论
            </Button>
          </View>
        </View>
      )}
    </View>
  );
};

export default ReviewPage;
