import {
  AppstoreOutlined,
  BookOutlined,
  BulbOutlined,
  CodeOutlined,
  FileTextOutlined,
  GlobalOutlined,
  MenuOutlined,
  ProjectOutlined,
  SolutionOutlined,
  TrophyOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Switch } from 'antd';
import type { SectionKey } from '../../types/resume';
import { DEFAULT_SECTION_ORDER, DEFAULT_SECTION_VISIBILITY } from '../../types/resume';
import { useResumeStore } from '../../stores/resumeStore';

const SECTION_META: Record<SectionKey, { label: string; icon: React.ReactNode }> = {
  summary: { label: '个人简介', icon: <UserOutlined /> },
  work: { label: '工作经历', icon: <SolutionOutlined /> },
  projects: { label: '项目经验', icon: <ProjectOutlined /> },
  education: { label: '教育背景', icon: <BookOutlined /> },
  skills: { label: '技能', icon: <CodeOutlined /> },
  awards: { label: '荣誉奖项', icon: <TrophyOutlined /> },
  languages: { label: '语言能力', icon: <GlobalOutlined /> },
  interests: { label: '兴趣爱好', icon: <BulbOutlined /> },
};

export default function SectionToggleEditor() {
  const resume = useResumeStore((s) => s.resumes.find((r) => r.id === s.activeResumeId) ?? null);
  const { toggleSectionVisibility, reorderSections } = useResumeStore();

  if (!resume) return null;

  const visibility = resume.section_visibility ?? DEFAULT_SECTION_VISIBILITY;
  const order: string[] = resume.section_order ?? DEFAULT_SECTION_ORDER;

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (fromIndex !== targetIndex) {
      reorderSections(fromIndex, targetIndex);
    }
  };

  const getItemMeta = (key: string): { label: string; icon: React.ReactNode } => {
    // Built-in section
    if (key in SECTION_META) {
      return SECTION_META[key as SectionKey];
    }
    // Custom section
    if (key.startsWith('custom_')) {
      const sectionId = key.replace('custom_', '');
      const cs = resume.custom_sections.find((s) => s.id === sectionId);
      return {
        label: cs?.title ?? '自定义模块',
        icon: <AppstoreOutlined />,
      };
    }
    return { label: key, icon: <AppstoreOutlined /> };
  };

  const isVisible = (key: string): boolean => {
    return (visibility as Record<string, boolean>)[key] ?? true;
  };

  return (
    <div style={{ padding: '16px' }}>
      <div className="section-label">
        <AppstoreOutlined /> 模块管理
      </div>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
        开关控制模块显隐，拖拽调整顺序
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {order.map((key, index) => {
          const meta = getItemMeta(key);

          return (
            <div
              key={key}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                background: isVisible(key) ? 'rgba(0, 240, 255, 0.03)' : 'transparent',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'grab',
                transition: 'background 0.15s',
                opacity: isVisible(key) ? 1 : 0.5,
              }}
            >
              <MenuOutlined
                style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  cursor: 'grab',
                }}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {meta.icon}
              </span>
              <span
                style={{
                  flex: 1,
                  fontSize: '12px',
                  fontWeight: 500,
                  color: isVisible(key) ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                {meta.label}
                {key.startsWith('custom_') && (
                  <span style={{ fontSize: '9px', color: 'var(--neon-purple)', marginLeft: '6px' }}>自定义</span>
                )}
              </span>
              <Switch
                size="small"
                checked={isVisible(key)}
                onChange={() => {
                  if (key in SECTION_META) {
                    toggleSectionVisibility(key as SectionKey);
                  } else {
                    // For custom sections, toggle via setSectionVisibility
                    const newVis = { ...visibility, [key]: !isVisible(key) };
                    useResumeStore.getState().setSectionVisibility(newVis);
                  }
                }}
                style={{ flexShrink: 0 }}
              />
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: '16px',
          padding: '10px',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <FileTextOutlined style={{ fontSize: '11px', color: 'var(--neon-cyan)' }} />
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
            提示
          </span>
        </div>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
          关闭的模块不会在简历中显示，但数据仍然保留。
          拖拽各模块可以调整它们在简历中的排列顺序。
        </p>
      </div>
    </div>
  );
}
