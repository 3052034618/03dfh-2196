import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { CommentTemplate as CommentTemplateType, FeedbackLevel } from '@/types';
import { LEVEL_TEXT, LEVEL_COLOR } from '@/utils';

interface CommentTemplateProps {
  templates: CommentTemplateType[];
  onSelect: (content: string, level: FeedbackLevel) => void;
}

const CommentTemplate: React.FC<CommentTemplateProps> = ({ templates, onSelect }) => {
  const categories = Array.from(new Set(templates.map(t => t.category)));
  const [activeCategory, setActiveCategory] = useState(categories[0]);

  const filteredTemplates = templates.filter(t => t.category === activeCategory);

  const handleSelect = (template: CommentTemplateType) => {
    onSelect(template.content, template.level);
  };

  return (
    <View className={styles.wrapper}>
      <View className={styles.categoryList}>
        <ScrollView scrollX className={styles.categoryScroll}>
          {categories.map(cat => (
            <View
              key={cat}
              className={classnames(styles.categoryItem, {
                [styles.categoryActive]: cat === activeCategory
              })}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </View>
          ))}
        </ScrollView>
      </View>
      <View className={styles.templateList}>
        {filteredTemplates.map(tpl => (
          <View
            key={tpl.id}
            className={styles.templateItem}
            onClick={() => handleSelect(tpl)}
          >
            <View
              className={styles.levelTag}
              style={{ background: `rgba(${LEVEL_COLOR[tpl.level] === '#F53F3F' ? '245,63,63' : LEVEL_COLOR[tpl.level] === '#FF7D00' ? '255,125,0' : '134,144,156'}, 0.1)`, color: LEVEL_COLOR[tpl.level] }}
            >
              {LEVEL_TEXT[tpl.level]}
            </View>
            <Text className={styles.templateContent}>{tpl.content}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default CommentTemplate;
