import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input } from 'antd';
import type { InterestItem } from '../../types/resume';
import { useResumeStore } from '../../stores/resumeStore';
import DelimitedInput from './DelimitedInput';

const emptyInterest: InterestItem = {
  name: '',
  keywords: [],
};

export default function InterestsEditor() {
  const resume = useResumeStore((s) => s.resumes.find((r) => r.id === s.activeResumeId) ?? null);
  const { addInterest, removeInterest, updateInterest } = useResumeStore();

  if (!resume) return null;
  const { interests } = resume;

  return (
    <div style={{ padding: '12px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {interests.map((item, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-start',
              padding: '8px',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <Form layout="vertical" size="small" style={{ flex: 1 }}>
              <Form.Item label="兴趣名称" style={{ marginBottom: '6px' }}>
                <Input
                  value={item.name}
                  onChange={(e) => updateInterest(index, { ...item, name: e.target.value })}
                  placeholder="例: 开源贡献"
                />
              </Form.Item>
              <Form.Item label="关键词（逗号分隔）" style={{ margin: 0 }}>
                <DelimitedInput
                  value={item.keywords}
                  onChange={(keywords) =>
                    updateInterest(index, { ...item, keywords })
                  }
                  displaySeparator=", "
                  splitPattern={/[,，]/}
                  placeholder="编程, 摄影, 阅读"
                />
              </Form.Item>
            </Form>
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => removeInterest(index)}
              style={{ flexShrink: 0, marginTop: '4px' }}
            />
          </div>
        ))}
      </div>
      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={() => addInterest({ ...emptyInterest })}
        block
        style={{ marginTop: '12px' }}
      >
        添加兴趣
      </Button>
    </div>
  );
}
