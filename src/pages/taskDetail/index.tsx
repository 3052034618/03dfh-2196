import React, { useMemo, useState } from 'react';
import { View, Text, Image, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useAppStore } from '@/store';
import { STATUS_TEXT, formatDate, getFocusLabel, formatDateTime, LEVEL_TEXT, LEVEL_COLOR } from '@/utils';
import type { CommentSummary, CommentStatus, Comment, DeliveryRecord, ReworkItem } from '@/types';
import { COMMENT_STATUS_TEXT, COMMENT_STATUS_COLOR } from '@/types';

const TaskDetailPage: React.FC = () => {
  const router = useRouter();
  const taskId = router.params.id;

  const tasks = useAppStore(s => s.tasks);
  const comments = useAppStore(s => s.comments);
  const takeTask = useAppStore(s => s.takeTask);
  const getCommentSummaryByTaskId = useAppStore(s => s.getCommentSummaryByTaskId);
  const updateCommentStatus = useAppStore(s => s.updateCommentStatus);
  const getCommentCountByTaskAndPage = useAppStore(s => s.getCommentCountByTaskAndPage);
  const getReworkList = useAppStore(s => s.getReworkList);
  const getSafePanelImages = useAppStore(s => s.getSafePanelImages);

  const [selectedPage, setSelectedPage] = useState<number | null>(null);
  const [showAcceptance, setShowAcceptance] = useState(false);
  const [showRework, setShowRework] = useState(false);
  const [selectedDeliveryIdx, setSelectedDeliveryIdx] = useState<number | null>(null);
  const [showDeliveryHistory, setShowDeliveryHistory] = useState(false);

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
  const totalPages = task.pageCount;
  const progressPercent = totalPages > 0 ? Math.round((readCount / totalPages) * 100) : 0;
  const readPages = task.progress?.readPages || [];
  const completedAt = task.progress?.completedAt;

  const pageCommentCount = useMemo(() => {
    if (!taskId) return {};
    return getCommentCountByTaskAndPage(taskId);
  }, [taskId, comments]);

  const safePanels = useMemo(() => {
    if (!taskId) return [];
    return getSafePanelImages(taskId);
  }, [taskId, tasks]);

  const reworkList: ReworkItem[] = useMemo(() => {
    if (!taskId) return [];
    return getReworkList(taskId);
  }, [taskId, comments]);

  const deliveries: DeliveryRecord[] = useMemo(() => {
    return task?.deliveries || [];
  }, [task]);

  const activeDelivery: DeliveryRecord | null = useMemo(() => {
    if (selectedDeliveryIdx !== null && deliveries[selectedDeliveryIdx]) {
      return deliveries[selectedDeliveryIdx];
    }
    return deliveries.length > 0 ? deliveries[deliveries.length - 1] : null;
  }, [deliveries, selectedDeliveryIdx]);

  const reworkStats = useMemo(() => {
    let totalPending = 0, totalAccepted = 0, totalRejected = 0, totalComments = 0;
    reworkList.forEach(item => {
      totalPending += item.pendingCount;
      totalAccepted += item.acceptedCount;
      totalRejected += item.rejectedCount;
      totalComments += item.totalCount;
    });
    return { totalPending, totalAccepted, totalRejected, totalComments,
      donePercent: totalComments > 0 ? Math.round(((totalAccepted + totalRejected) / totalComments) * 100) : 0
    };
  }, [reworkList]);

  const selectedPageComments = useMemo(() => {
    if (selectedPage === null) return [];
    return taskComments.filter(c => c.pageIndex === selectedPage + 1);
  }, [selectedPage, taskComments]);

  const getPageStatus = (page: number): CommentStatus => {
    const pageComms = taskComments.filter(c => c.pageIndex === page + 1);
    if (pageComms.length === 0) return 'accepted';
    const allAccepted = pageComms.every(c => c.status === 'accepted');
    const allRejected = pageComms.every(c => c.status === 'rejected');
    const anyPending = pageComms.some(c => c.status === 'pending');
    if (anyPending) return 'pending';
    if (allAccepted) return 'accepted';
    if (allRejected) return 'rejected';
    return 'pending';
  };

  const handleUpdateStatus = (commentId: string, status: CommentStatus) => {
    updateCommentStatus(commentId, status);
    Taro.showToast({
      title: '已更新状态',
      icon: 'success',
      duration: 1000
    });
  };

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

        {deliveries.length > 0 && (
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>交付记录</Text>
              <Text
                className={styles.toggleText}
                onClick={() => setShowDeliveryHistory(!showDeliveryHistory)}
              >
                共 {deliveries.length} 版
              </Text>
            </View>

            {deliveries.length > 1 && (
              <ScrollView scrollX className={styles.versionTabs}>
                {deliveries.map((dlv, idx) => (
                  <View
                    key={dlv.id}
                    className={classnames(styles.versionTab, {
                      [styles.versionTabActive]: (selectedDeliveryIdx === null && idx === deliveries.length - 1) || selectedDeliveryIdx === idx
                    })}
                    onClick={() => setSelectedDeliveryIdx(idx)}
                  >
                    <Text className={styles.versionNum}>V{dlv.version}</Text>
                    <Text className={styles.versionDate}>{formatDateTime(dlv.deliveredAt).slice(5, 16)}</Text>
                  </View>
                ))}
              </ScrollView>
            )}

            {activeDelivery && (
              <View className={styles.reviewSummary}>
                <View className={styles.deliveryHeader}>
                  <View>
                    <Text className={styles.deliveryTitle}>第 {activeDelivery.version} 版交付</Text>
                    <Text className={styles.deliverySubtitle}>
                      {activeDelivery.readPageCount}/{activeDelivery.pageCount}页 · {activeDelivery.commentCount}条意见 · {formatDateTime(activeDelivery.deliveredAt)}
                    </Text>
                  </View>
                  <View className={styles.deliveryCoverage}>
                    {Math.round(activeDelivery.summary.coverageRatio * 100)}%
                  </View>
                </View>

                {activeDelivery.summary.mainIssues.length > 0 && (
                  <View className={styles.summaryBlock}>
                    <Text className={styles.summaryBlockTitle}>🔴 主要问题</Text>
                    {activeDelivery.summary.mainIssues.map((issue, i) => (
                      <Text key={i} className={styles.summaryItem}>• {issue}</Text>
                    ))}
                  </View>
                )}
                {activeDelivery.summary.priorityPages.length > 0 && (
                  <View className={styles.summaryBlock}>
                    <Text className={styles.summaryBlockTitle}>🔥 优先修改页</Text>
                    <View className={styles.priorityPages}>
                      {activeDelivery.summary.priorityPages.map((page, i) => (
                        <Text key={i} className={styles.priorityPageBadge}>第{page}页</Text>
                      ))}
                    </View>
                  </View>
                )}
                <View className={styles.summaryBlock}>
                  <Text className={styles.summaryBlockTitle}>💡 整体建议</Text>
                  <Text className={styles.summaryAdvice}>{activeDelivery.summary.overallAdvice}</Text>
                </View>
                {activeDelivery.summary.focusCoverage.length > 0 && (
                  <View className={styles.summaryBlock}>
                    <Text className={styles.summaryBlockTitle}>✅ 已覆盖重点</Text>
                    <View className={styles.focusRow}>
                      {activeDelivery.summary.focusCoverage.map((tag, i) => (
                        <Text key={i} className={styles.coveredTag}>{tag}</Text>
                      ))}
                    </View>
                  </View>
                )}
                {activeDelivery.summary.focusMissed.length > 0 && (
                  <View className={styles.summaryBlock}>
                    <Text className={styles.summaryBlockTitle}>⚠️ 未覆盖重点</Text>
                    <View className={styles.focusRow}>
                      {activeDelivery.summary.focusMissed.map((tag, i) => (
                        <Text key={i} className={styles.missedTag}>{tag}</Text>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {task.status === 'completed' && reworkList.length > 0 && (
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>返修清单</Text>
              <Text
                className={styles.toggleText}
                onClick={() => setShowRework(!showRework)}
              >
                {showRework ? '收起' : '展开'} · {reworkStats.donePercent}%完成
              </Text>
            </View>

            <View className={styles.reworkProgressBar}>
              <View className={styles.reworkProgressFill} style={{ width: `${reworkStats.donePercent}%` }} />
            </View>
            <View className={styles.reworkProgressLabels}>
              <Text className={styles.reworkProgressLabel}>
                🟠 待处理 <Text style={{ fontWeight: 700, color: '#FF7D00' }}>{reworkStats.totalPending}</Text>
              </Text>
              <Text className={styles.reworkProgressLabel}>
                🟢 已采纳 <Text style={{ fontWeight: 700, color: '#00B42A' }}>{reworkStats.totalAccepted}</Text>
              </Text>
              <Text className={styles.reworkProgressLabel}>
                ⚪ 暂不采纳 <Text style={{ fontWeight: 700, color: '#86909C' }}>{reworkStats.totalRejected}</Text>
              </Text>
            </View>

            {showRework && (
              <View className={styles.reworkList}>
                {reworkList.map((item, idx) => (
                  <View key={idx} className={styles.reworkItem}>
                    <View className={styles.reworkItemHeader}>
                      <View className={styles.reworkPageInfo}>
                        <Image
                          className={styles.reworkThumb}
                          src={safePanels[item.pageIndex - 1] || safePanels[(item.pageIndex - 1) % safePanels.length]}
                          mode='aspectFill'
                        />
                        <View>
                          <Text className={styles.reworkPageNum}>第{item.pageIndex}页</Text>
                          <Text className={styles.reworkCount}>共{item.totalCount}条意见</Text>
                        </View>
                      </View>
                      <View className={styles.reworkStatusBadges}>
                        {item.pendingCount > 0 && (
                          <View className={classnames(styles.reworkBadge, styles.reworkBadgePending)}>
                            {item.pendingCount}待
                          </View>
                        )}
                        {item.acceptedCount > 0 && (
                          <View className={classnames(styles.reworkBadge, styles.reworkBadgeAccepted)}>
                            {item.acceptedCount}采
                          </View>
                        )}
                        {item.rejectedCount > 0 && (
                          <View className={classnames(styles.reworkBadge, styles.reworkBadgeRejected)}>
                            {item.rejectedCount}拒
                          </View>
                        )}
                      </View>
                    </View>
                    <View className={styles.reworkComments}>
                      {item.comments.map(comment => (
                        <View key={comment.id} className={styles.reworkComment}>
                          <View className={styles.reworkCommentHeader}>
                            <View
                              className={styles.commentLevel}
                              style={{
                                background: `rgba(${LEVEL_COLOR[comment.level] === '#F53F3F' ? '245,63,63' : LEVEL_COLOR[comment.level] === '#FF7D00' ? '255,125,0' : '134,144,156'}, 0.1)`,
                                color: LEVEL_COLOR[comment.level]
                              }}
                            >
                              {LEVEL_TEXT[comment.level]}
                            </View>
                            <View
                              className={styles.commentStatusTag}
                              style={{
                                background: `${COMMENT_STATUS_COLOR[comment.status]}15`,
                                color: COMMENT_STATUS_COLOR[comment.status]
                              }}
                            >
                              {COMMENT_STATUS_TEXT[comment.status]}
                            </View>
                          </View>
                          <Text className={styles.commentContent}>{comment.content}</Text>
                          <View className={styles.statusActions}>
                            <Text
                              className={classnames(styles.statusBtn, {
                                [styles.statusBtnActive]: comment.status === 'pending'
                              })}
                              onClick={() => handleUpdateStatus(comment.id, 'pending')}
                            >
                              待处理
                            </Text>
                            <Text
                              className={classnames(styles.statusBtn, {
                                [styles.statusBtnActive]: comment.status === 'accepted'
                              })}
                              onClick={() => handleUpdateStatus(comment.id, 'accepted')}
                            >
                              已采纳
                            </Text>
                            <Text
                              className={classnames(styles.statusBtn, {
                                [styles.statusBtnActive]: comment.status === 'rejected'
                              })}
                              onClick={() => handleUpdateStatus(comment.id, 'rejected')}
                            >
                              暂不采纳
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {task.status === 'completed' && (
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>逐页验收</Text>
              <Text
                className={styles.toggleText}
                onClick={() => setShowAcceptance(!showAcceptance)}
              >
                {showAcceptance ? '收起' : '展开'}
              </Text>
            </View>

            {showAcceptance && (
              <>
                <View className={styles.acceptanceGrid}>
                  {Array.from({ length: totalPages }, (_, i) => i).map(page => {
                    const count = pageCommentCount[page + 1] || 0;
                    const pageStatus = getPageStatus(page);
                    const isSelected = selectedPage === page;
                    return (
                      <View
                        key={page}
                        className={classnames(styles.pageThumb, {
                          [styles.pageThumbSelected]: isSelected
                        })}
                        onClick={() => setSelectedPage(isSelected ? null : page)}
                      >
                        <Image
                          className={styles.pageThumbImg}
                          src={safePanels[page] || safePanels[page % safePanels.length]}
                          mode='aspectFill'
                        />
                        <View className={styles.pageThumbInfo}>
                          <Text className={styles.pageThumbNum}>第{page + 1}页</Text>
                          {count > 0 ? (
                            <View
                              className={styles.pageThumbCount}
                              style={{ background: COMMENT_STATUS_COLOR[pageStatus] }}
                            >
                              {count}条
                            </View>
                          ) : (
                            <View className={styles.pageThumbNoComment}>无意见</View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>

                {selectedPage !== null && (
                  <View className={styles.selectedPageDetail}>
                    <View className={styles.selectedPageHeader}>
                      <Text className={styles.selectedPageTitle}>
                        第{selectedPage + 1}页意见
                      </Text>
                      <Text
                        className={styles.selectedPageStatus}
                        style={{ color: COMMENT_STATUS_COLOR[getPageStatus(selectedPage)] }}
                      >
                        {COMMENT_STATUS_TEXT[getPageStatus(selectedPage)]}
                      </Text>
                    </View>
                    {selectedPageComments.length > 0 ? (
                      <View className={styles.selectedCommentList}>
                        {selectedPageComments.map(comment => (
                          <View key={comment.id} className={styles.selectedCommentItem}>
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
                              <View
                                className={styles.commentStatusTag}
                                style={{
                                  background: `${COMMENT_STATUS_COLOR[comment.status]}15`,
                                  color: COMMENT_STATUS_COLOR[comment.status]
                                }}
                              >
                                {COMMENT_STATUS_TEXT[comment.status]}
                              </View>
                            </View>
                            <Text className={styles.commentContent}>{comment.content}</Text>
                            <View className={styles.statusActions}>
                              <Text
                                className={classnames(styles.statusBtn, {
                                  [styles.statusBtnActive]: comment.status === 'pending'
                                })}
                                onClick={() => handleUpdateStatus(comment.id, 'pending')}
                              >
                                待处理
                              </Text>
                              <Text
                                className={classnames(styles.statusBtn, {
                                  [styles.statusBtnActive]: comment.status === 'accepted'
                                })}
                                onClick={() => handleUpdateStatus(comment.id, 'accepted')}
                              >
                                已采纳
                              </Text>
                              <Text
                                className={classnames(styles.statusBtn, {
                                  [styles.statusBtnActive]: comment.status === 'rejected'
                                })}
                                onClick={() => handleUpdateStatus(comment.id, 'rejected')}
                              >
                                暂不采纳
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text className={styles.emptyComment}>本页暂无意见</Text>
                    )}
                  </View>
                )}
              </>
            )}
          </View>
        )}

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
