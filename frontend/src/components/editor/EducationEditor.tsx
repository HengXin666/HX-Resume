import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Collapse, Form, Input } from 'antd';
import type { EducationItem } from '../../types/resume';
import { useResumeStore } from '../../stores/resumeStore';
import MarkdownEditor from '../MarkdownEditor';

const emptyEducation: EducationItem = {
  institution: '',
  area: '',
  study_type: '',
  start_date: '',
  end_date: '',
  score: '',
  courses: [],
  description: '',
};

export default function EducationEditor() {
  const resume = useResumeStore((s) => s.resumes.find((r) => r.id === s.activeResumeId) ?? null);
  const { addEducation, removeEducation, updateEducation } = useResumeStore();

  if (!resume) return null;
  const { education } = resume;

  const updateField = (index: number, field: keyof EducationItem, value: unknown) => {
    updateEducation(index, { ...education[index], [field]: value });
  };

  const items = education.map((e, index) => ({
    key: String(index),
    label: (
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', paddingRight: '8px' }}>
        <span>{e.institution || '(未填写)'}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{e.area}</span>
      </div>
    ),
    extra: (
      <Button
        type="text"
        danger
        size="small"
        icon={<DeleteOutlined />}
        onClick={(ev) => {
          ev.stopPropagation();
          removeEducation(index);
        }}
      />
    ),
    children: (
      <Form layout="vertical" size="small">
        <Form.Item label="学校">
          <Input
            value={e.institution}
            onChange={(ev) => updateField(index, 'institution', ev.target.value)}
            placeholder="学校名称"
          />
        </Form.Item>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <Form.Item label="专业">
            <Input
              value={e.area}
              onChange={(ev) => updateField(index, 'area', ev.target.value)}
              placeholder="计算机科学"
            />
          </Form.Item>
          <Form.Item label="学历">
            <Input
              value={e.study_type}
              onChange={(ev) => updateField(index, 'study_type', ev.target.value)}
              placeholder="本科 / 硕士"
            />
          </Form.Item>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <Form.Item label="开始时间">
            <Input
              value={e.start_date}
              onChange={(ev) => updateField(index, 'start_date', ev.target.value)}
              placeholder="2016-09"
            />
          </Form.Item>
          <Form.Item label="结束时间">
            <Input
              value={e.end_date}
              onChange={(ev) => updateField(index, 'end_date', ev.target.value)}
              placeholder="2020-06"
            />
          </Form.Item>
        </div>
        <Form.Item label="详情描述">
          <MarkdownEditor
            value={e.description ?? ''}
            onChange={(val) => updateField(index, 'description', val)}
            rows={4}
            placeholder="在校经历、主修课程、获得荣誉等...（支持 Markdown）"
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
        onClick={() => addEducation({ ...emptyEducation })}
        block
        style={{ marginTop: '12px' }}
      >
        添加教育经历
      </Button>
    </div>
  );
}
