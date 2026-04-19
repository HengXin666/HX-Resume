import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Collapse, Form, Input, Popconfirm } from 'antd';
import { useState } from 'react';
import type { CustomSection, CustomSectionItem } from '../../types/resume';
import { useResumeStore } from '../../stores/resumeStore';
import MarkdownEditor from '../MarkdownEditor';
import HighlightsEditor from './HighlightsEditor';

const emptyItem: CustomSectionItem = {
  title: '',
  subtitle: '',
  date: '',
  description: '',
  highlights: [],
};

interface Props {
  section: CustomSection;
}

export default function CustomSectionEditor({ section }: Props) {
  const {
    updateCustomSectionTitle,
    addCustomSectionItem,
    removeCustomSectionItem,
    updateCustomSectionItem,
    removeCustomSection,
  } = useResumeStore();

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(section.title);

  const commitTitle = () => {
    if (titleDraft.trim()) {
      updateCustomSectionTitle(section.id, titleDraft.trim());
    }
    setEditingTitle(false);
  };

  const updateField = (itemIndex: number, field: keyof CustomSectionItem, value: unknown) => {
    updateCustomSectionItem(section.id, itemIndex, {
      ...section.items[itemIndex],
      [field]: value,
    });
  };

  const collapseItems = section.items.map((item, index) => ({
    key: String(index),
    label: item.title || '(未填写)',
    extra: (
      <Button
        type="text"
        danger
        size="small"
        icon={<DeleteOutlined />}
        onClick={(e) => { e.stopPropagation(); removeCustomSectionItem(section.id, index); }}
      />
    ),
    children: (
      <Form layout="vertical" size="small">
        <Form.Item label="标题">
          <Input
            value={item.title}
            onChange={(e) => updateField(index, 'title', e.target.value)}
            placeholder="条目标题"
          />
        </Form.Item>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <Form.Item label="副标题">
            <Input
              value={item.subtitle}
              onChange={(e) => updateField(index, 'subtitle', e.target.value)}
              placeholder="副标题/机构"
            />
          </Form.Item>
          <Form.Item label="时间">
            <Input
              value={item.date}
              onChange={(e) => updateField(index, 'date', e.target.value)}
              placeholder="2023-06"
            />
          </Form.Item>
        </div>
        <Form.Item label="描述">
          <MarkdownEditor
            value={item.description}
            onChange={(val) => updateField(index, 'description', val)}
            rows={3}
            placeholder="描述内容...（支持 Markdown）"
          />
        </Form.Item>
        <Form.Item label="要点（每行一条，支持 Markdown）">
          <HighlightsEditor
            value={item.highlights}
            onChange={(highlights) => updateField(index, 'highlights', highlights)}
            rows={4}
            placeholder="每行一个要点..."
          />
        </Form.Item>
      </Form>
    ),
  }));

  return (
    <div style={{ padding: '16px' }}>
      {/* Section title with inline edit */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        {editingTitle ? (
          <Input
            size="small"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onPressEnter={commitTitle}
            autoFocus
            style={{ maxWidth: '200px' }}
          />
        ) : (
          <div className="section-label" style={{ margin: 0, flex: 1 }}>
            {section.title}
          </div>
        )}
        <Button
          type="text"
          size="small"
          icon={<EditOutlined />}
          onClick={() => { setTitleDraft(section.title); setEditingTitle(true); }}
        />
        <Popconfirm
          title="确定删除此自定义模块？"
          description="模块数据将被永久移除"
          onConfirm={() => removeCustomSection(section.id)}
          okText="删除"
          cancelText="取消"
        >
          <Button type="text" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      </div>

      <Collapse items={collapseItems} accordion size="small" />
      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={() => addCustomSectionItem(section.id, { ...emptyItem })}
        block
        style={{ marginTop: '12px' }}
      >
        添加条目
      </Button>
    </div>
  );
}
