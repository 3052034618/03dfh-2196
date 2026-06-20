import React, { useState } from 'react';
import { View, Text, Input, Textarea, Button, Picker } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { FOCUS_TAGS } from '@/utils';
import type { FocusArea } from '@/types';

const PublishTaskPage: React.FC = () => {
  const [workName, setWorkName] = useState('');
  const [episode, setEpisode] = useState('');
  const [pageCount, setPageCount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFocus, setSelectedFocus] = useState<FocusArea[]>([]);

  const toggleFocus = (key: FocusArea) => {
    setSelectedFocus(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  const handleDateChange = (e: any) => {
    const date = e.detail.value;
    setDeadlineDate(date);
    const formatted = date.replace(/-/g, '/');
    setDeadline(formatted);
    console.log('[PublishTask] 选择截止日期', date);
  };

  const handleSubmit = () => {
    if (!workName.trim()) {
      Taro.showToast({ title: '请输入作品名称', icon: 'none' });
      return;
    }
    if (!episode.trim()) {
      Taro.showToast({ title: '请输入话数', icon: 'none' });
      return;
    }
    if (selectedFocus.length === 0) {
      Taro.showToast({ title: '请至少选择一个重点查看内容', icon: 'none' });
      return;
    }

    Taro.showModal({
      title: '确认发布',
      content: '确认发布此审稿任务？',
      confirmText: '确认发布',
      confirmColor: '#7B5CFF',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({
            title: '发布成功',
            icon: 'success'
          });
          console.log('[PublishTask] 任务发布成功', {
            workName,
            episode,
            pageCount,
            deadline,
            selectedFocus,
            description
          });
          setTimeout(() => {
            Taro.navigateBack();
          }, 1500);
        }
      }
    });
  };

  const handleCancel = () => {
    Taro.navigateBack();
  };

  return (
    <View className={styles.page}>
      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>基本信息</Text>

        <View className={styles.formItem}>
          <Text className={styles.label}>
            <Text className={styles.required}>*</Text>作品名称
          </Text>
          <Input
            className={styles.textInput}
            placeholder='例如：剑影星河'
            value={workName}
            onInput={(e) => setWorkName(e.detail.value)}
          />
        </View>

        <View className={styles.formItem}>
          <View className={styles.rowInput}>
            <View className={styles.halfInput}>
              <Text className={styles.label}>
                <Text className={styles.required}>*</Text>话数
              </Text>
              <Input
                className={styles.textInput}
                type='number'
                placeholder='第X话'
                value={episode}
                onInput={(e) => setEpisode(e.detail.value)}
              />
            </View>
            <View className={styles.halfInput}>
              <Text className={styles.label}>页数</Text>
              <Input
                className={styles.textInput}
                type='number'
                placeholder='共X页'
                value={pageCount}
                onInput={(e) => setPageCount(e.detail.value)}
              />
            </View>
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.label}>
            <Text className={styles.required}>*</Text>截止时间
          </Text>
          <Picker
            mode='date'
            value={deadlineDate}
            onChange={handleDateChange}
          >
            <View className={styles.datePicker}>
              <Text className={deadline ? styles.dateText : styles.datePlaceholder}>
                {deadline || '请选择截止日期'}
              </Text>
              <Text className={styles.dateArrow}>›</Text>
            </View>
          </Picker>
        </View>
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>审稿重点</Text>
        <View className={styles.formItem}>
          <Text className={styles.label}>
            <Text className={styles.required}>*</Text>希望顾问重点查看内容
          </Text>
          <View className={styles.focusTags}>
            {FOCUS_TAGS.map(tag => (
            <View
              key={tag.key}
              className={classnames(styles.focusTag, {
                [styles.focusTagActive]: selectedFocus.includes(tag.key)
              })}
              onClick={() => toggleFocus(tag.key)}
            >
              {tag.label}
            </View>
          ))}
        </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.label}>补充说明（选填）</Text>
          <Textarea
            className={styles.textareaInput}
            placeholder='描述一下本次审稿的特殊要求或注意事项...'
            value={description}
            onInput={(e) => setDescription(e.detail.value)}
          />
        </View>
      </View>

      <View className={styles.footer}>
        <Button className={styles.cancelBtn} onClick={handleCancel}>
          取消
        </Button>
        <Button className={styles.submitBtn} onClick={handleSubmit}>
          发布任务
        </Button>
      </View>
    </View>
  );
};

export default PublishTaskPage;
