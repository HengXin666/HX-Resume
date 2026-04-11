import { DeleteOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Collapse, Form, Input, Upload } from 'antd';
import type { WorkItem } from '../../types/resume';
import { useResumeStore } from '../../stores/resumeStore';
import MarkdownEditor from '../MarkdownEditor';

const emptyWork: WorkItem = {
  company: '',
  department: '',
  position: '',
  website: '',
  start_date: '',
  end_date: '',
  description: '',
  logo: '',
};

export default function WorkEditor() {
  const resume = useResumeStore((s) => s.resumes.find((r) => r.id === s.activeResumeId) ?? null);
  const { addWork, removeWork, updateWork } = useResumeStore();

  if (!resume) return null;
  const { work } = resume;

  const updateField = (index: number, field: keyof WorkItem, value: unknown) => {
    updateWork(index, { ...work[index], [field]: value });
  };

  const handleLogoUpload = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      updateField(index, 'logo', dataUrl);
    };
    reader.readAsDataURL(file);
    return false; // prevent default upload
  };

  const items = work.map((w, index) => ({
    key: String(index),
    label: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', paddingRight: '8px' }}>
        {w.logo && (
          <img src={w.logo} alt="" style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'contain' }} />
        )}
        <span>{w.company || w.position || '(未填写)'}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>
          {w.start_date}
        </span>
      </div>
    ),
    extra: (
      <Button
        type="text"
        danger
        size="small"
        icon={<DeleteOutlined />}
        onClick={(e) => {
          e.stopPropagation();
          removeWork(index);
        }}
      />
    ),
    children: (
      <Form layout="vertical" size="small">
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div style={{ flexShrink: 0 }}>
            <Form.Item label="公司 Logo" style={{ marginBottom: 0 }}>
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={(file) => handleLogoUpload(index, file)}
              >
                {w.logo ? (
                  <div style={{ width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', border: '1px solid var(--border-subtle)' }}>
                    <img src={w.logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
                  </div>
                ) : (
                  <Button icon={<UploadOutlined />} size="small">上传</Button>
                )}
              </Upload>
              {w.logo && (
                <Button
                  type="link"
                  danger
                  size="small"
                  onClick={() => updateField(index, 'logo', '')}
                  style={{ padding: 0, fontSize: '10px', marginTop: '2px' }}
                >
                  移除
                </Button>
              )}
            </Form.Item>
          </div>
          <div style={{ flex: 1 }}>
            <Form.Item label="公司" style={{ marginBottom: '8px' }}>
              <Input
                value={w.company}
                onChange={(e) => updateField(index, 'company', e.target.value)}
                placeholder="公司名称"
              />
            </Form.Item>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <Form.Item label="部门">
            <Input
              value={w.department}
              onChange={(e) => updateField(index, 'department', e.target.value)}
              placeholder="部门名称"
            />
          </Form.Item>
          <Form.Item label="岗位">
            <Input
              value={w.position}
              onChange={(e) => updateField(index, 'position', e.target.value)}
              placeholder="岗位名称"
            />
          </Form.Item>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <Form.Item label="开始时间">
            <Input
              value={w.start_date}
              onChange={(e) => updateField(index, 'start_date', e.target.value)}
              placeholder="2020-06"
            />
          </Form.Item>
          <Form.Item label="结束时间">
            <Input
              value={w.end_date}
              onChange={(e) => updateField(index, 'end_date', e.target.value)}
              placeholder="2023-08 或留空表示至今"
            />
          </Form.Item>
        </div>
        <Form.Item label="工作详情">
          <MarkdownEditor
            value={w.description}
            onChange={(val) => updateField(index, 'description', val)}
            rows={6}
            placeholder={"工作内容、业绩亮点...（支持 Markdown）\n例：\n- 负责核心系统架构设计\n- 带领团队完成 **关键项目**，提升效率 50%"}
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
        onClick={() => addWork({ ...emptyWork })}
        block
        style={{ marginTop: '12px' }}
      >
        添加工作经历
      </Button>
    </div>
  );
}
