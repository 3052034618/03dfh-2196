import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Input, Swiper, SwiperItem, Image, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import CommentTemplate from '@/components/CommentTemplate';
import { useAppStore } from '@/store';
import { mockTemplates } from '@/data/mock';
import type { Task, FeedbackLevel, Comment, CommentSummary, ReviewSummary } from '@/types';
import { LEVEL_TEXT } from '@/utils';

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
  const comments = useAppStore(s => s.comments);
  const addComment = useAppStore(s => s.addComment);
  const completeTask = useAppStore(s => s.completeTask);
  const completeTaskWithSummary = useAppStore(s => s.completeTaskWithSummary);
  const deliverNewVersion = useAppStore(s => s.deliverNewVersion);
  const markPageRead = useAppStore(s => s.markPageRead);
  const getCommentSummaryByTaskId = useAppStore(s => s.getCommentSummaryByTaskId);
  const getCoverageInfo = useAppStore(s => s.getCoverageInfo);
  const getSafePanelImages = useAppStore(s => s.getSafePanelImages);
  const lastTakenTaskId = useAppStore(s => s.lastTakenTaskId);

  const inProgressTasks = useMemo(() => tasks.filter(t => t.status === 'inProgress'), [tasks]);

  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<FeedbackLevel>('suggest');
  const [isRecording, setIsRecording] = useState(false);
  const [showFinishSummary, setShowFinishSummary] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [generatedSummary, setGeneratedSummary] = useState<ReviewSummary | null>(null);

  useEffect(() => {
    if (inProgressTasks.length === 0) return;

    let targetTask: Task | null = null;
    let startPage = 0;

    if (lastTakenTaskId) {
      const lastTask = inProgressTasks.find(t => t.id === lastTakenTaskId);
      if (lastTask) {
        targetTask = lastTask;
        startPage = lastTask.progress?.lastViewedPage || 0;
      }
    }

    if (!targetTask && currentTask) {
      const existing = inProgressTasks.find(t => t.id === currentTask.id);
      if (existing) {
        targetTask = existing;
        startPage = existing.progress?.lastViewedPage || currentPage;
      }
    }

    if (!targetTask) {
      targetTask = inProgressTasks[0];
      startPage = targetTask.progress?.lastViewedPage || 0;
    }

    setCurrentTask(targetTask);
    setCurrentPage(startPage);

    if (targetTask && targetTask.progress?.lastViewedPage === undefined) {
      markPageRead(targetTask.id, startPage);
    }

    console.log('[Review] 页面进入，选中任务', targetTask.id, '从第', startPage + 1, '页开始');
  }, [lastTakenTaskId, inProgressTasks]);

  const handleSelectTask = (task: Task) => {
    setCurrentTask(task);
    const startPage = task.progress?.lastViewedPage || 0;
    setCurrentPage(startPage);
    if (!task.progress?.readPages?.includes(startPage + 1)) {
      markPageRead(task.id, startPage);
    }
    console.log('[Review] 手动切换任务', task.id);
  };

  const handleSwiperChange = (e: any) => {
    const pageIndex = e.detail.current;
    setCurrentPage(pageIndex);
    if (currentTask) {
      markPageRead(currentTask.id, pageIndex);
    }
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
      isRead: true,
      status: 'pending'
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
    if (!currentTask) return;
    const summary = getCommentSummaryByTaskId(currentTask.id);
    const totalComments = summary.urgent + summary.suggest + summary.reference;
    const totalPages = currentTask.pageCount;
    const readPages = currentTask.progress?.readPages?.length || 0;
    const coverage = getCoverageInfo(currentTask.id);

    const taskComments = comments.filter(c => c.taskId === currentTask.id);
    const urgentComments = taskComments.filter(c => c.level === 'urgent');
    const mainIssues = urgentComments.slice(0, 5).map(c => `第${c.pageIndex}页：${c.content.slice(0, 30)}...`);
    const priorityPages = Array.from(new Set(urgentComments.map(c => c.pageIndex))).sort((a, b) => a - b);

    const overallAdvice = `本次审稿共审阅 ${readPages}/${totalPages} 页，提交 ${totalComments} 条意见。其中必须修改 ${summary.urgent} 条，建议优化 ${summary.suggest} 条，仅供参考 ${summary.reference} 条。建议优先处理必须修改的问题，再逐步优化其他建议。`;

    const reviewSummary: ReviewSummary = {
      mainIssues: mainIssues.length > 0 ? mainIssues : ['暂无必须修改的问题'],
      priorityPages,
      overallAdvice,
      coverageRatio: coverage.coverageRatio,
      focusCoverage: coverage.focusCoverage,
      focusMissed: coverage.focusMissed,
      pagesWithoutComments: coverage.pagesWithoutComments
    };

    setGeneratedSummary(reviewSummary);
    setSummaryText(overallAdvice);

    if (readPages < totalPages) {
      Taro.showModal({
        title: '尚未审阅完成',
        content: `还有 ${totalPages - readPages} 页未阅读，确定要结束审稿吗？`,
        confirmText: '继续审稿',
        cancelText: '结束审稿',
        confirmColor: '#7B5CFF',
        success: (res) => {
          if (res.cancel) {
            setShowFinishSummary(true);
          }
        }
      });
      return;
    }

    setShowFinishSummary(true);
  };

  const handleConfirmFinish = () => {
    if (!currentTask || !generatedSummary) return;

    const finalSummary: ReviewSummary = {
      ...generatedSummary,
      overallAdvice: summaryText || generatedSummary.overallAdvice
    };

    if (hasExistingDeliveries) {
      deliverNewVersion(currentTask.id, finalSummary);
    } else {
      completeTaskWithSummary(currentTask.id, finalSummary);
    }
    setShowFinishSummary(false);
    setGeneratedSummary(null);

    Taro.showToast({
      title: hasExistingDeliveries ? '已提交新版' : '审稿完成',
      icon: 'success'
    });
    console.log('[Review] 确认完成审稿（', hasExistingDeliveries ? '补充' : '首次', '交付）', currentTask.id);
  };

  const handleCancelFinish = () => {
    setShowFinishSummary(false);
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

  const totalPages = currentTask.pageCount;
  const taskComments = comments.filter(c => c.taskId === currentTask.id);
  const taskCommentsCount = taskComments.length;
  const pageCommentsCount = taskComments.filter(c => c.pageIndex === currentPage + 1).length;
  const readCount = currentTask.progress?.readPages?.length || 0;
  const progressPercent = Math.round((readCount / totalPages) * 100);
  const isCurrentPageRead = currentTask.progress?.readPages?.includes(currentPage + 1);
  const summary: CommentSummary = getCommentSummaryByTaskId(currentTask.id);
  const hasExistingDeliveries = currentTask.deliveries && currentTask.deliveries.length > 0;
  const safePanels = currentTask ? getSafePanelImages(currentTask.id) : [];

  return (
    <View className={styles.page}>
      {showFinishSummary ? (
        <View className={styles.emptyState} style={{ justifyContent: 'flex-start', paddingTop: 20, paddingBottom: 40 }}>
          <ScrollView scrollY style={{ width: '100%', height: '100%' }}>
            <View className={styles.finishSummary}>
              <Text className={styles.finishTitle}>
                {hasExistingDeliveries ? '补充新版交付' : '审稿交付确认'}
              </Text>
              <View style={{ fontSize: 28, color: '#4E5969', marginBottom: 24 }}>
                {currentTask.title}
              </View>

              <View className={styles.finishStats}>
                <View className={styles.finishStat}>
                  <Text className={styles.finishStatNum} style={{ color: '#00B42A' }}>{readCount}/{totalPages}</Text>
                  <Text className={styles.finishStatLabel}>已读页数</Text>
                </View>
                <View className={styles.finishStat}>
                  <Text className={styles.finishStatNum} style={{ color: '#7B5CFF' }}>{taskCommentsCount}</Text>
                  <Text className={styles.finishStatLabel}>总评论数</Text>
                </View>
                <View className={styles.finishStat}>
                  <Text className={styles.finishStatNum} style={{ color: '#FF7D00' }}>
                    {generatedSummary ? Math.round(generatedSummary.coverageRatio * 100) : 0}%
                  </Text>
                  <Text className={styles.finishStatLabel}>评论覆盖率</Text>
                </View>
              </View>

              <View className={styles.finishStats}>
                <View className={styles.finishStat}>
                  <Text className={styles.finishStatNum} style={{ color: '#F53F3F' }}>{summary.urgent}</Text>
                  <Text className={styles.finishStatLabel}>必须修改</Text>
                </View>
                <View className={styles.finishStat}>
                  <Text className={styles.finishStatNum} style={{ color: '#FF7D00' }}>{summary.suggest}</Text>
                  <Text className={styles.finishStatLabel}>建议优化</Text>
                </View>
                <View className={styles.finishStat}>
                  <Text className={styles.finishStatNum} style={{ color: '#86909C' }}>{summary.reference}</Text>
                  <Text className={styles.finishStatLabel}>仅供参考</Text>
                </View>
              </View>

              {generatedSummary && generatedSummary.focusMissed.length > 0 && (
                <View className={styles.checkSection}>
                  <Text className={styles.checkTitle}>⚠️ 未覆盖的重点标签</Text>
                  <View className={styles.checkTags}>
                    {generatedSummary.focusMissed.map((tag, i) => (
                      <Text key={i} className={styles.missedTag}>{tag}</Text>
                    ))}
                  </View>
                </View>
              )}

              {generatedSummary && generatedSummary.pagesWithoutComments && generatedSummary.pagesWithoutComments.length > 0 && (
                <View className={styles.checkSection}>
                  <Text className={styles.checkTitle}>📄 未写评论的页面</Text>
                  <View className={styles.checkPages}>
                    {generatedSummary.pagesWithoutComments.slice(0, 10).map((page, i) => (
                      <Text key={i} className={styles.pageBadge}>第{page}页</Text>
                    ))}
                    {generatedSummary.pagesWithoutComments.length > 10 && (
                      <Text className={styles.pageMore}>+{generatedSummary.pagesWithoutComments.length - 10}页</Text>
                    )}
                  </View>
                </View>
              )}

              {generatedSummary && generatedSummary.priorityPages.length > 0 && (
                <View className={styles.checkSection}>
                  <Text className={styles.checkTitle}>🔥 优先修改页</Text>
                  <View className={styles.checkPages}>
                    {generatedSummary.priorityPages.slice(0, 6).map((page, i) => (
                      <Text key={i} className={styles.priorityPageBadge}>第{page}页</Text>
                    ))}
                  </View>
                </View>
              )}

              <View className={styles.checkSection}>
                <Text className={styles.checkTitle}>📝 给作者的整体建议</Text>
                <View className={styles.summaryTextareaWrap}>
                  <Text
                    className={styles.summaryTextarea}
                    style={{ padding: 0 }}
                  >
                    {summaryText}
                  </Text>
                </View>
              </View>

              <View className={styles.finishBtnRow}>
                <Button className={styles.finishBackBtn} onClick={handleCancelFinish}>
                  返回继续
                </Button>
                <Button className={styles.finishConfirmBtn} onClick={handleConfirmFinish}>
                  提交交付
                </Button>
              </View>
            </View>
          </ScrollView>
        </View>
      ) : (
        <>
          {inProgressTasks.length > 1 && (
            <View className={styles.taskSelector}>
              <Text className={styles.selectorTitle}>选择审稿任务</Text>
              <ScrollView scrollY style={{ maxHeight: 400 }}>
                {inProgressTasks.map(task => {
                  const taskRead = task.progress?.readPages?.length || 0;
                  const taskTotal = task.pageCount;
                  const isActive = task.id === currentTask.id;
                  return (
                    <View
                      key={task.id}
                      className={classnames(styles.taskSelectorCard, {
                        [styles.taskSelectorActive]: isActive
                      })}
                      onClick={() => handleSelectTask(task)}
                    >
                      <View className={styles.selectorTaskInfo}>
                        <Text className={styles.selectorTaskTitle}>{task.title}</Text>
                        <Text className={styles.selectorTaskMeta}>
                          第{task.episode}话 · {taskTotal}页
                        </Text>
                      </View>
                      <Text className={styles.selectorProgress}>
                        {taskRead}/{taskTotal} · {Math.round(taskRead / taskTotal * 100)}%
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <View className={styles.progressBar}>
            <View
              className={styles.progressFill}
              style={{ width: `${progressPercent}%` }}
            />
          </View>

          <View className={styles.header}>
            <View className={styles.taskInfo}>
              <Text className={styles.taskTitle}>{currentTask.title}</Text>
              <Text className={styles.taskMeta}>
                已读 {readCount}/{totalPages} · 已提交 {taskCommentsCount} 条评论
              </Text>
            </View>
            <View className={styles.pageIndicator}>
              {currentPage + 1} / {totalPages}
            </View>
          </View>

          {isCurrentPageRead && (
            <View className={styles.readBadge}>
              <Text className={styles.readCheck}>✓</Text>
              已审阅
            </View>
          )}

          {pageCommentsCount > 0 && (
            <View className={styles.pageCommentCount}>
              💬 {pageCommentsCount} 条评论
            </View>
          )}

          <View className={styles.readerContainer}>
            <Swiper
              className={styles.panelSwiper}
              vertical
              current={currentPage}
              onChange={handleSwiperChange}
              indicatorDots={false}
            >
              {safePanels.map((img, index) => (
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
        </>
      )}
    </View>
  );
};

export default ReviewPage;
