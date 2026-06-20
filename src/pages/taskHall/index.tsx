import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import TaskCard from '@/components/TaskCard';
import { useAppStore } from '@/store';
import type { Task, TaskStatus } from '@/types';
import { STATUS_TEXT, formatDate } from '@/utils';

type TabType = 'all' | TaskStatus;
type RoleType = 'reviewer' | 'author';

const TABS: { key: TabType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待接单' },
  { key: 'inProgress', label: '审稿中' },
  { key: 'completed', label: '已完成' }
];

const MY_PUBLISH_FILTERS: { key: TabType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待接单' },
  { key: 'inProgress', label: '审稿中' },
  { key: 'completed', label: '已完成' }
];

const TaskHallPage: React.FC = () => {
  const tasks = useAppStore(s => s.tasks);
  const takeTask = useAppStore(s => s.takeTask);
  const getMyPublishedTasks = useAppStore(s => s.getMyPublishedTasks);
  const getCommentSummaryByTaskId = useAppStore(s => s.getCommentSummaryByTaskId);

  const [activeRole, setActiveRole] = useState<RoleType>('reviewer');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [myPublishFilter, setMyPublishFilter] = useState<TabType>('all');

  const filteredReviewTasks = useMemo(() => {
    if (activeTab === 'all') return tasks;
    return tasks.filter(t => t.status === activeTab);
  }, [tasks, activeTab]);

  const myPublishedTasks = useMemo(() => getMyPublishedTasks(), [tasks]);
  const filteredMyPublishTasks = useMemo(() => {
    if (myPublishFilter === 'all') return myPublishedTasks;
    return myPublishedTasks.filter(t => t.status === myPublishFilter);
  }, [myPublishedTasks, myPublishFilter]);

  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const inProgressCount = tasks.filter(t => t.status === 'inProgress').length;

  const handleTake = (taskId: string) => {
    Taro.showModal({
      title: '确认接单',
      content: '确定要接这个审稿任务吗？接单后请在截止时间前完成。',
      confirmText: '确认接单',
      confirmColor: '#7B5CFF',
      success: (res) => {
        if (res.confirm) {
          takeTask(taskId);
          Taro.showToast({
            title: '接单成功',
            icon: 'success'
          });
          console.log('[TaskHall] 接单成功', taskId);
        }
      }
    });
  };

  const handlePublish = () => {
    Taro.navigateTo({
      url: '/pages/publishTask/index'
    });
  };

  const handleClickTask = (taskId: string) => {
    Taro.navigateTo({
      url: `/pages/taskDetail/index?id=${taskId}`
    });
  };

  const handleRefresh = () => {
    console.log('[TaskHall] 下拉刷新');
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 800);
  };

  const getProgress = (task: Task) => {
    const readCount = task.progress?.readPages?.length || 0;
    const total = task.pageCount;
    return total > 0 ? Math.round((readCount / total) * 100) : 0;
  };

  const renderReviewerView = () => (
    <>
      <View className={styles.tabs}>
        {TABS.map(tab => (
          <View
            key={tab.key}
            className={classnames(styles.tabItem, {
              [styles.tabActive]: activeTab === tab.key
            })}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.key === 'pending' && pendingCount > 0 && (
              <Text className={styles.tabBadge}>{pendingCount}</Text>
            )}
            {tab.key === 'inProgress' && inProgressCount > 0 && (
              <Text className={styles.tabBadge}>{inProgressCount}</Text>
            )}
          </View>
        ))}
      </View>

      <ScrollView
        scrollY
        className={styles.taskList}
        onScrollToLower={() => console.log('[TaskHall] 加载更多')}
        refresherEnabled
        onRefresherRefresh={handleRefresh}
      >
        {filteredReviewTasks.length > 0 ? (
          filteredReviewTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              showTakeButton
              onTake={handleTake}
            />
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📭</Text>
            <Text className={styles.emptyText}>暂无任务</Text>
          </View>
        )}
      </ScrollView>
    </>
  );

  const renderAuthorView = () => {
    return (
      <>
        <View className={styles.quickFilter}>
          {MY_PUBLISH_FILTERS.map(filter => (
            <View
              key={filter.key}
              className={classnames(styles.quickFilterItem, {
                [styles.quickFilterActive]: myPublishFilter === filter.key
              })}
              onClick={() => setMyPublishFilter(filter.key)}
            >
              {filter.label}
              {filter.key !== 'all' && (
                <Text style={{ marginLeft: 6 }}>
                  ({myPublishedTasks.filter(t => t.status === filter.key).length})
                </Text>
              )}
            </View>
          ))}
        </View>

        <ScrollView
          scrollY
          className={styles.taskList}
          refresherEnabled
          onRefresherRefresh={handleRefresh}
        >
          {filteredMyPublishTasks.length > 0 ? (
            filteredMyPublishTasks.map(task => {
              const summary = getCommentSummaryByTaskId(task.id);
              const progress = getProgress(task);
              const statusClass = classnames({
                [styles.publishStatusPending]: task.status === 'pending',
                [styles.publishStatusProgress]: task.status === 'inProgress',
                [styles.publishStatusCompleted]: task.status === 'completed'
              });

              return (
                <View
                  key={task.id}
                  className={styles.myPublishCard}
                  onClick={() => handleClickTask(task.id)}
                >
                  <Image className={styles.publishCover} src={task.coverImage} mode='aspectFill' />
                  <View className={styles.publishContent}>
                    <View className={styles.publishHeader}>
                      <Text className={styles.publishTitle}>{task.title}</Text>
                      <View className={classnames(styles.publishStatus, statusClass)}>
                        {STATUS_TEXT[task.status]}
                      </View>
                    </View>

                    <View className={styles.publishMeta}>
                      <Text className={styles.publishMetaText}>第{task.episode}话</Text>
                      <Text className={styles.publishMetaDot}>·</Text>
                      <Text className={styles.publishMetaText}>
                        {task.reviewerName || '待接单'}
                      </Text>
                      <Text className={styles.publishMetaDot}>·</Text>
                      <Text className={styles.publishMetaText} style={{ color: '#F53F3F', fontWeight: 500 }}>
                        {formatDate(task.deadline)}
                      </Text>
                    </View>

                    {task.status === 'inProgress' && (
                      <View className={styles.publishProgress}>
                        <View className={styles.progressBar}>
                          <View
                            className={styles.progressFill}
                            style={{ width: `${progress}%` }}
                          />
                        </View>
                        <View className={styles.progressText}>
                          <Text>审稿进度</Text>
                          <Text>
                            {task.progress?.readPages?.length || 0}/{task.pageCount}页 · {progress}%
                          </Text>
                        </View>
                      </View>
                    )}

                    {task.progress?.completedAt && (
                      <View className={styles.publishProgress}>
                        <View className={styles.progressText}>
                          <Text>完成时间</Text>
                          <Text>{new Date(task.progress.completedAt).toLocaleDateString()}</Text>
                        </View>
                      </View>
                    )}

                    <View className={styles.publishStats}>
                      <View className={styles.statItem}>
                        <Text className={classnames(styles.statNum, styles.statNumUrgent)}>
                          {summary.urgent}
                        </Text>
                        <Text className={styles.statLabel}>必须修改</Text>
                      </View>
                      <View className={styles.statItem}>
                        <Text className={classnames(styles.statNum, styles.statNumSuggest)}>
                          {summary.suggest}
                        </Text>
                        <Text className={styles.statLabel}>建议优化</Text>
                      </View>
                      <View className={styles.statItem}>
                        <Text className={classnames(styles.statNum, styles.statNumReference)}>
                          {summary.reference}
                        </Text>
                        <Text className={styles.statLabel}>仅供参考</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>📝</Text>
              <Text className={styles.emptyText}>暂无发布的任务</Text>
              <Text style={{ fontSize: 24, color: '#86909C', marginTop: 8 }}>
                点击右下角 + 发布第一个审稿任务
              </Text>
            </View>
          )}
        </ScrollView>
      </>
    );
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.greeting}>
          {activeRole === 'reviewer' ? '你好，审稿人' : '你好，创作者'}
        </Text>
        <Text className={styles.subTitle}>
          {activeRole === 'reviewer'
            ? `今天有 ${pendingCount} 个新任务等你来审`
            : `已发布 ${myPublishedTasks.length} 个审稿任务`
          }
        </Text>
      </View>

      <View className={styles.roleSwitcher}>
        <View
          className={classnames(styles.roleTab, {
            [styles.roleTabActive]: activeRole === 'reviewer'
          })}
          onClick={() => setActiveRole('reviewer')}
        >
          <Text className={styles.roleIcon}>🎨</Text>
          顾问视角
        </View>
        <View
          className={classnames(styles.roleTab, {
            [styles.roleTabActive]: activeRole === 'author'
          })}
          onClick={() => setActiveRole('author')}
        >
          <Text className={styles.roleIcon}>✍️</Text>
          作者视角
        </View>
      </View>

      {activeRole === 'reviewer' ? renderReviewerView() : renderAuthorView()}

      <View className={styles.publishBtn} onClick={handlePublish}>
        <Text className={styles.publishBtnText}>+</Text>
      </View>
    </View>
  );
};

export default TaskHallPage;
