import React, { useState, useMemo, useRef } from 'react';
import { View, Text, Input, Swiper, SwiperItem, Image, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import TaskCard from '@/components/TaskCard';
import CommentTemplate from '@/components/CommentTemplate';
import { mockTasks, mockTemplates, mockComments } from '@/data/mock';
import type { Task, FeedbackLevel, Comment } from '@/types';
import { LEVEL_TEXT, LEVEL_COLOR } from '@/utils';

const ReviewPage: React.FC = () => {
  const inProgressTasks = useMemo(() => mockTasks.filter(t => t.status === 'inProgress'), []);
  const [currentTask, setCurrentTask] = useState<Task | null>(inProgressTasks[0] || null);
  const [currentPage, setCurrentPage] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<FeedbackLevel>('suggest');
  const [isRecording, setIsRecording] = useState(false);
  const [submittedComments, setSubmittedComments] = useState<Comment[]>(mockComments);

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
      setCommentText(prev => prev + '（语音识别完成的评论内容会出现在这里）');
      Taro.showToast({
        title: '语音转文字完成',
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
    if (!commentText.trim()) {
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
      content: commentText,
      level: selectedLevel,
      reviewerName: '我',
      createdAt: new Date().toISOString(),
      isRead: true
    };

    setSubmittedComments(prev => [...prev, newComment]);
    setShowPanel(false);
    setCommentText('');
    setIsRecording(false);

    Taro.showToast({
      title: '评论已提交',
      icon: 'success'
    });
    console.log('[Review] 提交评论', newComment);
  };

  const handleFinish = () => {
    const taskComments = submittedComments.filter(c => c.taskId === currentTask?.id);
    Taro.showModal({
      title: '确认完成审稿',
      content: `您已提交 ${taskComments.length} 条评论，确认完成本次审稿？`,
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
  const taskCommentsCount = submittedComments.filter(c => c.taskId === currentTask.id).length;

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
