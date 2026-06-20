import React from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { Task } from '@/types';
import { STATUS_TEXT, formatDate, getFocusLabel } from '@/utils';

interface TaskCardProps {
  task: Task;
  showTakeButton?: boolean;
  onTake?: (taskId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, showTakeButton, onTake }) => {
  const handleClick = () => {
    Taro.navigateTo({
      url: `/pages/taskDetail/index?id=${task.id}`
    });
  };

  const handleTake = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTake) {
      onTake(task.id);
    }
  };

  const statusClass = classnames({
    [styles.statusPending]: task.status === 'pending',
    [styles.statusProgress]: task.status === 'inProgress',
    [styles.statusCompleted]: task.status === 'completed'
  });

  return (
    <View className={styles.card} onClick={handleClick}>
      <Image className={styles.cover} src={task.coverImage} mode='aspectFill' />
      <View className={styles.content}>
        <View className={styles.header}>
          <Text className={styles.title}>{task.title}</Text>
          <View className={classnames(styles.status, statusClass)}>
            {STATUS_TEXT[task.status]}
          </View>
        </View>
        <View className={styles.meta}>
          <Text className={styles.metaText}>第{task.episode}话 · {task.pageCount}页</Text>
          <Text className={styles.metaDot}>·</Text>
          <Text className={styles.metaText}>{task.authorName}</Text>
        </View>
        <View className={styles.focusTags}>
          {task.focusAreas.slice(0, 3).map(area => (
            <View key={area} className={styles.focusTag}>
              {getFocusLabel(area)}
            </View>
          ))}
          {task.focusAreas.length > 3 && (
            <View className={styles.focusTag}>+{task.focusAreas.length - 3}</View>
          )}
        </View>
        <View className={styles.footer}>
          <Text className={styles.deadline}>{formatDate(task.deadline)}</Text>
          {showTakeButton && task.status === 'pending' && (
            <Button className={styles.takeBtn} onClick={handleTake}>
              立即接单
            </Button>
          )}
        </View>
      </View>
    </View>
  );
};

export default TaskCard;
