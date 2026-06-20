import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { ChatMessage } from '@/types';
import { formatTime } from '@/utils';

interface ChatBubbleProps {
  message: ChatMessage;
  isMine: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isMine }) => {
  return (
    <View className={classnames(styles.wrapper, { [styles.mine]: isMine })}>
      {!isMine && (
        <View className={styles.avatar}>
          {message.senderName.charAt(0)}
        </View>
      )}
      <View className={styles.contentWrapper}>
        {!isMine && (
          <Text className={styles.senderName}>{message.senderName}</Text>
        )}
        <View className={classnames(styles.bubble, { [styles.bubbleMine]: isMine })}>
          <Text className={styles.text}>{message.content}</Text>
        </View>
        <Text className={styles.time}>{formatTime(message.createdAt)}</Text>
      </View>
      {isMine && (
        <View className={classnames(styles.avatar, styles.avatarMine)}>
          我
        </View>
      )}
    </View>
  );
};

export default ChatBubble;
