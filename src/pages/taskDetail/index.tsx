import React, { useMemo } from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useAppStore } from '@/store';
import { STATUS_TEXT, formatDate, getFocusLabel, formatDateTime, LEVEL_TEXT, LEVEL_COLOR } from '@/utils';
import type { CommentSummary } from '@/types';

const TaskDetailPage: React.FC = () => {
  const router = useRouter();
  const taskId = router.params.id;

  const tasks = useAppStore(s => s.tasks);
  const comments = useAppStore(s => s.comments);
  const takeTask = useAppStore(s => s.takeTask);
  const getCommentSummaryByTaskId = useAppStore(s => s.getCommentSummaryByTaskId);

  const task = useMemo(() => tasks.find(t => t.id === taskId), [tasks, taskId]);
  const taskComments = useMemo(() => comments.filter(c => c.taskId === taskId), [comments, taskId]);
  const summary: CommentSummary = useMemo(() =>
    taskId ? getCommentSummaryByTaskId(taskId) : { urgent: 0, suggest: 0, reference: 0 },
    [taskId, comments]
  );

  if (!task) {
    return (
      <View className={styles.page}>
        <View style={{ padding: 200, textAlign: 'center' }}>
          <Text>任务不存在</Text>
        </View>
      </View>
    );
  }

  const statusClass = classnames({
    [styles.statusPending]: task.status === 'pending',
    [styles.statusProgress]: task.status === 'inProgress',
    [styles.statusCompleted]: task.status === 'completed'
  });

  const readCount = task.progress?.readPages?.length || 0;
  const totalPages = task.panelImages.length;
  const progressPercent = totalPages > 0 ? Math.round((readCount / totalPages) * 100) : 0;
  const readPages = task.progress?.readPages || [];
  const completedAt = task.progress?.completedAt;

  const handleStartReview = () => {
    Taro.switchTab({
      url: '/pages/review/index'
    });
  };

  const handleTakeTask = () => {
    Taro.showModal({
      title: '确认接单',
      content: '确定要接这个审稿任务吗？',
      confirmText: '确认接单',
      confirmColor: '#7B5CFF',
      success: (res) => {
        if (res.confirm) {
          takeTask(taskId);
          Taro.showToast({
            title: '接单成功',
            icon: 'success'
          });
          console.log('[TaskDetail] 接单成功', taskId);
        }
      }
    });
  };

  const handleViewFeedback = () => {
    Taro.switchTab({
      url: '/pages/feedback/index'
    });
  };

  return (
    <View className={styles.page}>
      <Image className={styles.cover} src={task.coverImage} mode='aspectFill' />

      <View className={styles.content}>
        <View className={styles.header}>
          <View className={styles.titleRow}>
            <Text className={styles.title}>{task.title}</Text>
            <View className={classnames(styles.status, statusClass)}>
              {STATUS_TEXT[task.status]}
            </View>
          </View>
          <View className={styles.meta}>
            <Text className={styles.metaText}>第{task.episode}话</Text>
            <Text className={styles.metaDot}>·</Text>
            <Text className={styles.metaText}>{task.pageCount}页</Text>
            <Text className={styles.metaDot}>·</Text>
            <Text className={styles.metaText}>{task.authorName}</Text>
          </View>
          <Text className={styles.description}>{task.description}</Text>
        </View>

        {completedAt && (
          <View className={styles.completedInfo}>
            <Text className={styles.completedIcon}>✅</Text>
            <View>
              <Text className={styles.completedText}>审稿已完成</Text>
              <Text className={styles.completedTime}>
                完成时间：{formatDateTime(completedAt)}
              </Text>
            </View>
          </View>
        )}

        {task.status !== 'pending' && (
          <View className={styles.progressSection}>
            <View className={styles.progressLabelRow}>
              <Text className={styles.progressLabel}>审稿进度</Text>
              <Text className={styles.progressValue}>
                {readCount}/{totalPages}页 · {progressPercent}%
              </Text>
            </View>
            <View className={styles.progressBar}>
              <View
                className={styles.progressFill}
                style={{ width: `${progressPercent}%` }}
              />
            </View>
            {totalPages <= 24 && (
              <View className={styles.readPagesIndicator}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <View
                    key={page}
                    className={classnames(styles.readPageDot, {
                      [styles.unreadPageDot]: !readPages.includes(page)
                    })}
                  >
                    {page}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>审稿意见汇总</Text>
          <View className={styles.summaryCards}>
            <View className={classnames(styles.summaryCard, styles.summaryCardUrgent)}>
              <Text className={classnames(styles.summaryNum, styles.summaryNumUrgent)}>
                {summary.urgent}
              </Text>
              <Text className={styles.summaryLabel}>必须修改</Text>
            </View>
            <View className={classnames(styles.summaryCard, styles.summaryCardSuggest)}>
              <Text className={classnames(styles.summaryNum, styles.summaryNumSuggest)}>
                {summary.suggest}
              </Text>
              <Text className={styles.summaryLabel}>建议优化</Text>
            </View>
            <View className={classnames(styles.summaryCard, styles.summaryCardReference)}>
              <Text className={classnames(styles.summaryNum, styles.summaryNumReference)}>
                {summary.reference}
              </Text>
              <Text className={styles.summaryLabel}>仅供参考</Text>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>任务信息</Text>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>作品名称</Text>
            <Text className={styles.infoValue}>{task.workName}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>截止时间</Text>
            <Text className={classnames(styles.infoValue, styles.deadlineValue)}>
              {formatDate(task.deadline)}
            </Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>审稿顾问</Text>
            <Text className={styles.infoValue}>
              {task.reviewerName || '待接单'}
            </Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>发布时间</Text>
            <Text className={styles.infoValue}>
              {formatDateTime(task.createdAt)}
            </Text>
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>重点关注</Text>
          <View className={styles.focusTags}>
            {task.focusAreas.map(area => (
              <View key={area} className={styles.focusTag}>
                {getFocusLabel(area)}
              </View>
            ))}
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>
            审稿意见（{taskComments.length}）
          </Text>
          {taskComments.length > 0 ? (
            <View className={styles.commentList}>
              {taskComments.map(comment => (
                <View key={comment.id} className={styles.commentItem}>
                  <View className={styles.commentHeader}>
                    <View
                      className={styles.commentLevel}
                      style={{
                        background: `rgba(${LEVEL_COLOR[comment.level] === '#F53F3F' ? '245,63,63' : LEVEL_COLOR[comment.level] === '#FF7D00' ? '255,125,0' : '134,144,156'}, 0.1)`,
                        color: LEVEL_COLOR[comment.level]
                      }}
                    >
                      {LEVEL_TEXT[comment.level]}
                    </View>
                    <Text className={styles.commentPage}>第{comment.pageIndex}页</Text>
                  </View>
                  <Text className={styles.commentContent}>{comment.content}</Text>
                  <View className={styles.commentMeta}>
                    <Text className={styles.commentReviewer}>{comment.reviewerName}</Text>
                    <Text className={styles.commentTime}>
                      {formatDateTime(comment.createdAt)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text className={styles.emptyComment}>暂无审稿意见</Text>
          )}
        </View>
      </View>

      {task.status === 'pending' && (
        <View className={styles.actionRow}>
          <Button className={styles.primaryBtn} onClick={handleTakeTask}>
            立即接单
          </Button>
        </View>
      )}

      {task.status === 'inProgress' && (
        <View className={styles.actionRow}>
          <Button className={styles.secondaryBtn} onClick={handleViewFeedback}>
            查看意见
          </Button>
          <Button className={styles.primaryBtn} onClick={handleStartReview}>
            开始审稿
          </Button>
        </View>
      )}

      {task.status === 'completed' && (
        <View className={styles.actionRow}>
          <Button className={styles.primaryBtn} onClick={handleViewFeedback}>
            查看审稿意见
          </Button>
        </View>
      )}
    </View>
  );
};

export default TaskDetailPage;
