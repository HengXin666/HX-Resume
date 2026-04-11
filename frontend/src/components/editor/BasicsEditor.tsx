import { Input, Form } from 'antd';
import { useResumeStore } from '../../stores/resumeStore';
import MarkdownEditor from '../MarkdownEditor';

export default function BasicsEditor() {
  const resume = useResumeStore((s) => s.resumes.find((r) => r.id === s.activeResumeId) ?? null);
  const { updateBasics, setTitle } = useResumeStore();

  if (!resume) return null;
  const { basics } = resume;

  return (
    <div style={{ padding: '12px' }}>
      <Form layout="vertical" size="small">
        <Form.Item label="简历标题">
          <Input
            value={resume.title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: 我的简历 - 2026"
          />
        </Form.Item>

        <Form.Item label="姓名">
          <Input
            value={basics.name}
            onChange={(e) => updateBasics({ name: e.target.value })}
            placeholder="例: 张三"
          />
        </Form.Item>

        <Form.Item label="职位/头衔">
          <Input
            value={basics.label}
            onChange={(e) => updateBasics({ label: e.target.value })}
            placeholder="例: 高级前端工程师"
          />
        </Form.Item>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <Form.Item label="邮箱">
            <Input
              value={basics.email}
              onChange={(e) => updateBasics({ email: e.target.value })}
              placeholder="email@example.com"
            />
          </Form.Item>
          <Form.Item label="电话">
            <Input
              value={basics.phone}
              onChange={(e) => updateBasics({ phone: e.target.value })}
              placeholder="+86 xxx xxxx xxxx"
            />
          </Form.Item>
        </div>

        <Form.Item label="个人网站">
          <Input
            value={basics.url}
            onChange={(e) => updateBasics({ url: e.target.value })}
            placeholder="https://yoursite.com"
          />
        </Form.Item>

        <Form.Item label="所在城市">
          <Input
            value={basics.location?.city || ''}
            onChange={(e) =>
              updateBasics({ location: { ...basics.location, city: e.target.value } })
            }
            placeholder="例: 深圳"
          />
        </Form.Item>

        <Form.Item label="个人简介">
          <MarkdownEditor
            value={basics.summary}
            onChange={(val) => updateBasics({ summary: val })}
            rows={5}
            placeholder="简要介绍自己...（支持 Markdown 语法）"
          />
        </Form.Item>
      </Form>
    </div>
  );
}
