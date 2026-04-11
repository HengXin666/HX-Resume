import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Collapse, Form, Input } from 'antd';
import type { ProjectItem } from '../../types/resume';
import { useResumeStore } from '../../stores/resumeStore';
import MarkdownEditor from '../MarkdownEditor';

const emptyProject: ProjectItem = {
  name: '',
  description: '',
  url: '',
  highlights: [],
  keywords: [],
  start_date: '',
  end_date: '',
};

export default function ProjectsEditor() {
  const resume = useResumeStore((s) => s.resumes.find((r) => r.id === s.activeResumeId) ?? null);
  const { addProject, removeProject, updateProject } = useResumeStore();

  if (!resume) return null;
  const { projects } = resume;

  const updateField = (index: number, field: keyof ProjectItem, value: unknown) => {
    updateProject(index, { ...projects[index], [field]: value });
  };

  const items = projects.map((p, index) => ({
    key: String(index),
    label: (
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', paddingRight: '8px' }}>
        <span>{p.name || '(未填写)'}</span>
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
          removeProject(index);
        }}
      />
    ),
    children: (
      <Form layout="vertical" size="small">
        <Form.Item label="项目名称">
          <Input
            value={p.name}
            onChange={(e) => updateField(index, 'name', e.target.value)}
            placeholder="项目名称"
          />
        </Form.Item>
        <Form.Item label="项目链接">
          <Input
            value={p.url}
            onChange={(e) => updateField(index, 'url', e.target.value)}
            placeholder="https://github.com/..."
          />
        </Form.Item>
        <Form.Item label="技术栈（用逗号或空格分隔）">
          <Input
            value={p.keywords.join(' / ')}
            onChange={(e) => {
              const raw = e.target.value;
              // 支持中英文逗号、分号、斜杠分隔
              const keywords = raw.split(/[,，;；/]/).map((k) => k.trim()).filter(Boolean);
              updateField(index, 'keywords', keywords);
            }}
            placeholder="React / FastAPI / PostgreSQL"
          />
        </Form.Item>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <Form.Item label="开始时间">
            <Input
              value={p.start_date}
              onChange={(e) => updateField(index, 'start_date', e.target.value)}
              placeholder="2022-01"
            />
          </Form.Item>
          <Form.Item label="结束时间">
            <Input
              value={p.end_date}
              onChange={(e) => updateField(index, 'end_date', e.target.value)}
              placeholder="2023-06"
            />
          </Form.Item>
        </div>
        <Form.Item label="项目描述">
          <MarkdownEditor
            value={p.description}
            onChange={(val) => updateField(index, 'description', val)}
            rows={5}
            placeholder={"简要描述项目...（支持 Markdown）\n例：\n- 设计并实现了 **高并发** 处理架构\n- 优化系统性能提升 *50%*"}
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
        onClick={() => addProject({ ...emptyProject })}
        block
        style={{ marginTop: '12px' }}
      >
        添加项目
      </Button>
    </div>
  );
}
