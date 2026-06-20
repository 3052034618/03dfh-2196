import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import TaskCard from '@/components/TaskCard';
import { mockTasks } from '@/data/mock';
import type { Task, TaskStatus } from '@/types';

type TabType = 'all' | TaskStatus;

const TABS: { key: TabType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待接单' },
  { key: 'inProgress', label: '审稿中' },
  { key: 'completed', label: '已完成' }
];

const TaskHallPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const filteredTasks = useMemo(() => {
    if (activeTab === 'all') return tasks;
    return tasks.filter(t => t.status === activeTab);
  }, [tasks, activeTab]);

  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const inProgressCount = tasks.filter(t => t.status === 'inProgress').length;

  const handleTabClick = (key: TabType) => {
    setActiveTab(key);
  };

  const handleTake = (taskId: string) => {
    Taro.showModal({
      title: '确认接单',
      content: '确定要接这个审稿任务吗？接单后请在截止时间前完成。',
      confirmText: '确认接单',
      confirmColor: '#7B5CFF',
      success: (res) => {
        if (res.confirm) {
          setTasks(prev => prev.map(t =>
            t.id === taskId
              ? { ...t, status: 'inProgress' as TaskStatus, reviewerName: '我' }
              : t
          ));
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

  const handleRefresh = () => {
    console.log('[TaskHall] 下拉刷新');
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 800);
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.greeting}>你好，审稿人</Text>
        <Text className={styles.subTitle}>今天有 {pendingCount} 个新任务等你来审</Text>
      </View>

      <View className={styles.tabs}>
        {TABS.map(tab => (
          <View
            key={tab.key}
            className={classnames(styles.tabItem, {
              [styles.tabActive]: activeTab === tab.key
            })}
            onClick={() => handleTabClick(tab.key)}
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
        {filteredTasks.length > 0 ? (
          filteredTasks.map(task => (
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

      <View className={styles.publishBtn} onClick={handlePublish}>
        <Text className={styles.publishBtnText}>+</Text>
      </View>
    </View>
  );
};

export default TaskHallPage;
