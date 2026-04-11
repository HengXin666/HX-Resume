import { useResumeStore } from '../../stores/resumeStore';
import MarkdownEditor from '../MarkdownEditor';

export default function SkillsEditor() {
  const resume = useResumeStore((s) => s.resumes.find((r) => r.id === s.activeResumeId) ?? null);
  const { updateSkillsText } = useResumeStore();

  if (!resume) return null;

  return (
    <div style={{ padding: '12px' }}>
      <MarkdownEditor
        value={resume.skills_text ?? ''}
        onChange={(val) => updateSkillsText(val)}
        rows={8}
        placeholder={"自由编写专业技能（支持 Markdown）\n例：\n- **前端开发**：React, Vue, TypeScript\n- **后端开发**：Node.js, Python, Go\n- **数据库**：PostgreSQL, Redis, MongoDB"}
      />
    </div>
  );
}
