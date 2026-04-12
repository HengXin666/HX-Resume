import { SwapOutlined, RollbackOutlined, CloseOutlined } from '@ant-design/icons';
import { Button, Select, Tooltip, Tag, message } from 'antd';
import { useMemo, useState } from 'react';
import type { ResumeData, ResumeVersion } from '../types/resume';
import { getTemplate } from '../templates';
import PagedPreview from './PagedPreview';
import { useThemeStore } from '../stores/themeStore';
import { useResumeStore } from '../stores/resumeStore';

/** Page heights in mm */
const PAGE_HEIGHTS: Record<string, number> = {
  A4: 297,
  Letter: 279,
};

/** 对比两个简历数据，返回变更的字段列表 */
function diffFields(a: ResumeData, b: ResumeData): string[] {
  const fields: (keyof ResumeData)[] = [
    'title', 'template_id', 'basics', 'education', 'work',
    'skills_text', 'projects', 'awards', 'languages', 'interests',
    'custom_sections', 'style_config', 'section_visibility', 'section_order',
  ];
  const changed: string[] = [];
  for (const f of fields) {
    if (JSON.stringify(a[f]) !== JSON.stringify(b[f])) {
      changed.push(fieldLabel(f));
    }
  }
  return changed;
}

const FIELD_LABELS: Record<string, string> = {
  title: '标题',
  template_id: '模板',
  basics: '基本信息',
  education: '教育经历',
  work: '工作经历',
  skills_text: '技能',
  projects: '项目经历',
  awards: '获奖荣誉',
  languages: '语言能力',
  interests: '兴趣爱好',
  custom_sections: '自定义板块',
  style_config: '样式配置',
  section_visibility: '板块显隐',
  section_order: '板块排序',
};

function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key;
}

/** Mini preview — render a resume snapshot read-only */
function MiniPreview({ resume, isDark }: { resume: ResumeData; isDark: boolean }) {
  const template = getTemplate(resume.template_id);
  const Template = template.component;
  const pageSize = resume.style_config.page_size ?? 'A4';
  const pageWidthMM = pageSize === 'Letter' ? 216 : 210;
  const pageHeightMM = PAGE_HEIGHTS[pageSize] ?? 297;

  return (
    <div
      className={`version-diff__preview ${isDark ? 'resume-preview-dark' : ''}`}
      style={{ pointerEvents: 'none' }}
    >
      <PagedPreview pageWidthMM={pageWidthMM} pageHeightMM={pageHeightMM}>
        <Template resume={resume} />
      </PagedPreview>
    </div>
  );
}

interface VersionDiffModalProps {
  open: boolean;
  onClose: () => void;
  resume: ResumeData;
  /** 初始选中的版本 ID（从版本列表点进来时传入） */
  initialVersionId?: string;
}

export default function VersionDiffModal({
  open,
  onClose,
  resume,
  initialVersionId,
}: VersionDiffModalProps) {
  const isDark = useThemeStore((s) => s.mode === 'dark');
  const restoreVersion = useResumeStore((s) => s.restoreVersion);

  // "当前版本" 作为一个虚拟选项
  const CURRENT_ID = '__current__';

  const versions = resume.versions;

  // 左右两侧选中的版本ID
  const [leftId, setLeftId] = useState<string>(() => {
    if (initialVersionId) return initialVersionId;
    if (versions.length > 0) return versions[versions.length - 1].id;
    return CURRENT_ID;
  });
  const [rightId, setRightId] = useState<string>(CURRENT_ID);

  // 根据 ID 获取简历数据
  const resolveVersion = (id: string): ResumeData => {
    if (id === CURRENT_ID) return resume;
    const ver = versions.find((v) => v.id === id);
    return ver ? ver.data : resume;
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const leftData = useMemo(() => resolveVersion(leftId), [leftId, resume, versions]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rightData = useMemo(() => resolveVersion(rightId), [rightId, resume, versions]);

  // 变更字段
  const changedFields = useMemo(
    () => diffFields(leftData, rightData),
    [leftData, rightData],
  );

  // 下拉选项
  const versionOptions = useMemo(() => {
    const opts = [
      { value: CURRENT_ID, label: '📌 当前版本' },
      ...([...versions].reverse().map((v) => ({
        value: v.id,
        label: `${v.label} — ${new Date(v.timestamp).toLocaleString('zh-CN')}`,
      }))),
    ];
    return opts;
  }, [versions]);

  // 交换左右
  const handleSwap = () => {
    setLeftId(rightId);
    setRightId(leftId);
  };

  // 恢复某个版本
  const handleRestore = (verId: string) => {
    if (verId === CURRENT_ID) return;
    restoreVersion(resume.id, verId);
    message.success('版本已恢复');
    onClose();
  };

  const getVersionLabel = (id: string): string => {
    if (id === CURRENT_ID) return '当前版本';
    const ver = versions.find((v) => v.id === id);
    return ver ? ver.label : '未知版本';
  };

  if (!open) return null;

  return (
    <div className="version-diff__overlay" onClick={onClose}>
      <div className="version-diff__container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="version-diff__header">
          <div className="version-diff__header-title">
            <SwapOutlined style={{ color: 'var(--neon-cyan)' }} />
            <span>版本对比 — {resume.title}</span>
          </div>
          <div className="version-diff__header-actions">
            {changedFields.length > 0 ? (
              <div className="version-diff__changes">
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '6px' }}>
                  变更:
                </span>
                {changedFields.map((f) => (
                  <Tag
                    key={f}
                    color="cyan"
                    style={{
                      fontSize: '10px',
                      lineHeight: '18px',
                      margin: '0 2px',
                      borderRadius: '3px',
                    }}
                  >
                    {f}
                  </Tag>
                ))}
              </div>
            ) : (
              <Tag color="green" style={{ fontSize: '11px' }}>
                两个版本内容完全一致
              </Tag>
            )}
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={onClose}
              style={{ color: 'var(--text-secondary)' }}
            />
          </div>
        </div>

        {/* Selectors bar */}
        <div className="version-diff__selectors">
          <div className="version-diff__selector-side">
            <span className="version-diff__side-label" style={{ color: 'var(--neon-magenta)' }}>
              ◀ 旧版本
            </span>
            <Select
              size="small"
              value={leftId}
              onChange={setLeftId}
              options={versionOptions}
              style={{ width: '260px' }}
              popupMatchSelectWidth={false}
            />
            {leftId !== CURRENT_ID && (
              <Tooltip title="恢复此版本">
                <Button
                  size="small"
                  type="text"
                  icon={<RollbackOutlined />}
                  onClick={() => handleRestore(leftId)}
                  style={{ color: 'var(--neon-green)', fontSize: '12px' }}
                />
              </Tooltip>
            )}
          </div>

          <Tooltip title="交换左右">
            <Button
              type="text"
              icon={<SwapOutlined />}
              onClick={handleSwap}
              style={{ color: 'var(--neon-cyan)', fontSize: '16px' }}
            />
          </Tooltip>

          <div className="version-diff__selector-side">
            <span className="version-diff__side-label" style={{ color: 'var(--neon-green)' }}>
              新版本 ▶
            </span>
            <Select
              size="small"
              value={rightId}
              onChange={setRightId}
              options={versionOptions}
              style={{ width: '260px' }}
              popupMatchSelectWidth={false}
            />
            {rightId !== CURRENT_ID && (
              <Tooltip title="恢复此版本">
                <Button
                  size="small"
                  type="text"
                  icon={<RollbackOutlined />}
                  onClick={() => handleRestore(rightId)}
                  style={{ color: 'var(--neon-green)', fontSize: '12px' }}
                />
              </Tooltip>
            )}
          </div>
        </div>

        {/* Side-by-side previews */}
        <div className="version-diff__body">
          <div className="version-diff__pane version-diff__pane--left">
            <div className="version-diff__pane-label">
              <Tag color="magenta">{getVersionLabel(leftId)}</Tag>
            </div>
            <div className="version-diff__pane-scroll">
              <MiniPreview resume={leftData} isDark={isDark} />
            </div>
          </div>

          <div className="version-diff__divider" />

          <div className="version-diff__pane version-diff__pane--right">
            <div className="version-diff__pane-label">
              <Tag color="green">{getVersionLabel(rightId)}</Tag>
            </div>
            <div className="version-diff__pane-scroll">
              <MiniPreview resume={rightData} isDark={isDark} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
