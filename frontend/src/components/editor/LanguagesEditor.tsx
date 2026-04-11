import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, Select } from 'antd';
import type { LanguageItem } from '../../types/resume';
import { useResumeStore } from '../../stores/resumeStore';

const emptyLanguage: LanguageItem = {
  language: '',
  fluency: '',
};

export default function LanguagesEditor() {
  const resume = useResumeStore((s) => s.resumes.find((r) => r.id === s.activeResumeId) ?? null);
  const { addLanguage, removeLanguage, updateLanguage } = useResumeStore();

  if (!resume) return null;
  const { languages } = resume;

  return (
    <div style={{ padding: '12px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {languages.map((lang, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              padding: '8px',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <Form layout="vertical" size="small" style={{ flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <Form.Item label="语言" style={{ margin: 0 }}>
                  <Input
                    value={lang.language}
                    onChange={(e) => updateLanguage(index, { ...lang, language: e.target.value })}
                    placeholder="例: 英语"
                  />
                </Form.Item>
                <Form.Item label="水平" style={{ margin: 0 }}>
                  <Select
                    value={lang.fluency || undefined}
                    onChange={(value) => updateLanguage(index, { ...lang, fluency: value })}
                    placeholder="选择水平"
                    options={[
                      { value: '母语', label: '母语' },
                      { value: '流利', label: '流利' },
                      { value: '熟练', label: '熟练' },
                      { value: '中级', label: '中级' },
                      { value: '初级', label: '初级' },
                    ]}
                  />
                </Form.Item>
              </div>
            </Form>
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => removeLanguage(index)}
              style={{ flexShrink: 0 }}
            />
          </div>
        ))}
      </div>
      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={() => addLanguage({ ...emptyLanguage })}
        block
        style={{ marginTop: '12px' }}
      >
        添加语言
      </Button>
    </div>
  );
}
