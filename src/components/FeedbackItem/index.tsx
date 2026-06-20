import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { Comment, Task, CommentStatus } from '@/types';
import { COMMENT_STATUS_TEXT, COMMENT_STATUS_COLOR } from '@/types';
import { LEVEL_TEXT, LEVEL_COLOR, formatDateTime } from '@/utils';

interface FeedbackItemProps {
  comment: Comment;
  task?: Task;
  onAsk?: (commentId: string) => void;
  showStatus?: boolean;
  onUpdateStatus?: (commentId: string, status: CommentStatus) => void;
}

const FeedbackItem: React.FC<FeedbackItemProps> = ({
  comment,
  task,
  onAsk,
  showStatus = true,
  onUpdateStatus
}) => {
  const handleAsk = () => {
    if (onAsk) {
      onAsk(comment.id);
    }
  };

  const handleStatus = (status: CommentStatus) => {
    if (onUpdateStatus) {
      onUpdateStatus(comment.id, status);
    }
  };

  return (
    <View className={styles.card}>
      <View className={styles.header}>
        <View className={styles.leftInfo}>
          {task && (
            <Text className={styles.taskTitle}>{task.title}</Text>
          )}
          <Text className={styles.pageInfo}>第{comment.pageIndex}页</Text>
        </View>
        <View style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {showStatus && (
            <View
              className={styles.statusTag}
              style={{
                background: `${COMMENT_STATUS_COLOR[comment.status]}15`,
                color: COMMENT_STATUS_COLOR[comment.status]
              }}
            >
              {COMMENT_STATUS_TEXT[comment.status]}
            </View>
          )}
          <View
            className={styles.levelTag}
            style={{ background: `rgba(${LEVEL_COLOR[comment.level] === '#F53F3F' ? '245,63,63' : LEVEL_COLOR[comment.level] === '#FF7D00' ? '255,125,0' : '134,144,156'}, 0.1)`, color: LEVEL_COLOR[comment.level] }}
          >
            {LEVEL_TEXT[comment.level]}
          </View>
        </View>
      </View>
      <View className={styles.content}>
        <Text className={styles.commentText}>{comment.content}</Text>
      </View>
      {onUpdateStatus && (
        <View className={styles.statusRow}>
          <Text
            className={classnames(styles.statusBtn, {
              [styles.statusBtnActive]: comment.status === 'pending'
            })}
            onClick={() => handleStatus('pending')}
          >
            待处理
          </Text>
          <Text
            className={classnames(styles.statusBtn, {
              [styles.statusBtnActive]: comment.status === 'accepted'
            })}
            onClick={() => handleStatus('accepted')}
          >
            已采纳
          </Text>
          <Text
            className={classnames(styles.statusBtn, {
              [styles.statusBtnActive]: comment.status === 'rejected'
            })}
            onClick={() => handleStatus('rejected')}
          >
            暂不采纳
          </Text>
        </View>
      )}
      <View className={styles.footer}>
        <View className={styles.meta}>
          <Text className={styles.reviewer}>{comment.reviewerName}</Text>
          <Text className={styles.time}>{formatDateTime(comment.createdAt)}</Text>
        </View>
        {onAsk && (
          <Button className={styles.askBtn} onClick={handleAsk}>
            追问
          </Button>
        )}
      </View>
      {!comment.isRead && (
        <View className={styles.unreadDot} />
      )}
    </View>
  );
};

export default FeedbackItem;
