import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Collapse, Form, Input } from 'antd';
import type { AwardItem } from '../../types/resume';
import { useResumeStore } from '../../stores/resumeStore';

const { TextArea } = Input;

const emptyAward: AwardItem = {
  title: '',
  date: '',
  awarder: '',
  summary: '',
};

export default function AwardsEditor() {
  const resume = useResumeStore((s) => s.resumes.find((r) => r.id === s.activeResumeId) ?? null);
  const { addAward, removeAward, updateAward } = useResumeStore();

  if (!resume) return null;
  const { awards } = resume;

  const updateField = (index: number, field: keyof AwardItem, value: string) => {
    updateAward(index, { ...awards[index], [field]: value });
  };

  const items = awards.map((a, index) => ({
    key: String(index),
    label: a.title || '(未填写)',
    extra: (
      <Button
        type="text"
        danger
        size="small"
        icon={<DeleteOutlined />}
        onClick={(e) => { e.stopPropagation(); removeAward(index); }}
      />
    ),
    children: (
      <Form layout="vertical" size="small">
        <Form.Item label="奖项名称">
          <Input
            value={a.title}
            onChange={(e) => updateField(index, 'title', e.target.value)}
            placeholder="例: 优秀员工奖"
          />
        </Form.Item>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <Form.Item label="颁发机构">
            <Input
              value={a.awarder}
              onChange={(e) => updateField(index, 'awarder', e.target.value)}
              placeholder="例: 公司/学校"
            />
          </Form.Item>
          <Form.Item label="获奖时间">
            <Input
              value={a.date}
              onChange={(e) => updateField(index, 'date', e.target.value)}
              placeholder="2023-06"
            />
          </Form.Item>
        </div>
        <Form.Item label="描述">
          <TextArea
            value={a.summary}
            onChange={(e) => updateField(index, 'summary', e.target.value)}
            rows={2}
            placeholder="简要描述..."
          />
        </Form.Item>
      </Form>
    ),
  }));

  return (
    <div style={{ padding: '12px' }}>
      <Collapse items={items} accordion size="small" />
      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={() => addAward({ ...emptyAward })}
        block
        style={{ marginTop: '12px' }}
      >
        添加奖项
      </Button>
    </div>
  );
}
