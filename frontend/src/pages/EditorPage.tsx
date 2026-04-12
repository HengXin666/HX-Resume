import {
  AppstoreOutlined,
  BookOutlined,
  BulbOutlined,
  CodeOutlined,
  DeleteOutlined,
  DownOutlined,
  EyeOutlined,
  FormatPainterOutlined,
  GlobalOutlined,
  HolderOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  ProjectOutlined,
  RightOutlined,
  SettingOutlined,
  SolutionOutlined,
  TrophyOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Empty, Switch, message, Popconfirm } from 'antd';
import { Component, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import ResumePreview from '../components/ResumePreview';
import RedactedPreview from '../components/RedactedPreview';
import AwardsEditor from '../components/editor/AwardsEditor';
import BasicsEditor from '../components/editor/BasicsEditor';
import CustomSectionEditor from '../components/editor/CustomSectionEditor';
import EducationEditor from '../components/editor/EducationEditor';
import InterestsEditor from '../components/editor/InterestsEditor';
import LanguagesEditor from '../components/editor/LanguagesEditor';
import ProjectsEditor from '../components/editor/ProjectsEditor';
import PublicModeEditor from '../components/editor/PublicModeEditor';
import SkillsEditor from '../components/editor/SkillsEditor';
import StyleEditor from '../components/editor/StyleEditor';
import WorkEditor from '../components/editor/WorkEditor';
import { useResumeStore } from '../stores/resumeStore';
import { usePublicResumeStore } from '../stores/publicResumeStore';
import type { ResumeData, SectionKey } from '../types/resume';
import { DEFAULT_SECTION_ORDER, DEFAULT_SECTION_VISIBILITY } from '../types/resume';
import { exportToHTML, exportToPDF } from '../utils/exporters';
import { getPageWidthMM } from '../templates/useSectionRenderer';

/** Inline error boundary for individual editor sections */
class SectionErrorBoundary extends Component<
  { name: string; children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[SectionError] ${this.props.name}:`, error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '12px', color: 'var(--neon-magenta)', fontSize: '12px' }}>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>⚠ {this.props.name} 渲染出错</div>
          <pre style={{ fontSize: '10px', whiteSpace: 'pre-wrap', opacity: 0.7 }}>
            {this.state.error.message}
          </pre>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            style={{ marginTop: '6px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer',
              background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)', borderRadius: '3px' }}
          >
            重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

type FillStatus = 'filled' | 'partial' | 'empty';

function getSectionFillStatus(resume: ResumeData, key: string): FillStatus {
  const { basics, work, education, projects, awards, languages, interests } = resume;

  switch (key) {
    case 'basics': {
      const fields = [basics.name, basics.email, basics.phone, basics.summary];
      const filled = fields.filter(Boolean).length;
      if (filled === 0) return 'empty';
      return filled >= 3 ? 'filled' : 'partial';
    }
    case 'work':
      return work.length === 0 ? 'empty' : work.some(w => w.position && w.company) ? 'filled' : 'partial';
    case 'education':
      return education.length === 0 ? 'empty' : education.some(e => e.institution) ? 'filled' : 'partial';
    case 'skills':
      return !resume.skills_text ? 'empty' : 'filled';
    case 'projects':
      return projects.length === 0 ? 'empty' : projects.some(p => p.name) ? 'filled' : 'partial';
    case 'awards':
      return awards.length === 0 ? 'empty' : 'filled';
    case 'languages':
      return languages.length === 0 ? 'empty' : 'filled';
    case 'interests':
      return interests.length === 0 ? 'empty' : 'filled';
    default: {
      if (key.startsWith('custom_')) {
        const sectionId = key.replace('custom_', '');
        const cs = resume.custom_sections.find(s => s.id === sectionId);
        if (!cs || cs.items.length === 0) return 'empty';
        return cs.items.some(item => item.title) ? 'filled' : 'partial';
      }
      return 'empty';
    }
  }
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  basics: <UserOutlined />,
  work: <SolutionOutlined />,
  education: <BookOutlined />,
  skills: <CodeOutlined />,
  projects: <ProjectOutlined />,
  awards: <TrophyOutlined />,
  languages: <GlobalOutlined />,
  interests: <BulbOutlined />,
};

const SECTION_LABELS: Record<string, string> = {
  basics: '基本信息',
  work: '工作经历',
  education: '教育背景',
  skills: '技能',
  projects: '项目经验',
  awards: '荣誉奖项',
  languages: '语言能力',
  interests: '兴趣爱好',
};

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const previewRef = useRef<HTMLDivElement>(null);
  const publicPreviewRef = useRef<HTMLDivElement>(null);
  const previewPanelRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0.55);
  const {
    resumes, setActiveResume, addCustomSection, reorderSections,
    toggleSectionVisibility, setSectionVisibility, removeCustomSection,
  } = useResumeStore();
  const resume = useResumeStore((s) => s.resumes.find((r) => r.id === s.activeResumeId) ?? null);
  const isPublicMode = usePublicResumeStore((s) => s.config.enabled);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set(['basics']));
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const dragItemRef = useRef<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activePanel, setActivePanel] = useState<'editor' | 'style' | 'public'>('editor');

  // Wait for zustand persist hydration before doing anything (both stores)
  useEffect(() => {
    let resumeHydrated = useResumeStore.persist.hasHydrated();
    let publicHydrated = usePublicResumeStore.persist.hasHydrated();

    const checkReady = () => {
      if (resumeHydrated && publicHydrated) {
        setHydrated(true);
      }
    };

    const unsub1 = useResumeStore.persist.onFinishHydration(() => {
      resumeHydrated = true;
      checkReady();
    });
    const unsub2 = usePublicResumeStore.persist.onFinishHydration(() => {
      publicHydrated = true;
      checkReady();
    });

    checkReady();

    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  // Dynamic preview scaling — recalculate when preview panel resizes
  const pageWidthMM = resume ? getPageWidthMM(resume.style_config.page_size) : 210;
  useEffect(() => {
    const panel = previewPanelRef.current;
    if (!panel) return;
    const calcScale = () => {
      const panelWidth = panel.clientWidth;
      const PAGE_WIDTH_PX = pageWidthMM * (96 / 25.4); // mm to px at 96dpi
      const padding = 48; // 24px each side
      const available = panelWidth - padding;
      const scale = Math.min(available / PAGE_WIDTH_PX, 1);
      setPreviewScale(Math.max(scale, 0.3));
    };
    calcScale();
    const ro = new ResizeObserver(calcScale);
    ro.observe(panel);
    return () => ro.disconnect();
  }, [pageWidthMM]);

  useEffect(() => {
    if (!id || !hydrated) return;
    const found = resumes.find((r) => r.id === id);
    if (found) {
      // 保存前一个简历的打码配置
      const prevId = useResumeStore.getState().activeResumeId;
      if (prevId && prevId !== id) {
        usePublicResumeStore.getState().saveCurrentToMap(prevId);
      }
      setActiveResume(id);
      // 加载目标简历的打码配置
      usePublicResumeStore.getState().switchResume(id);
    } else {
      message.error('简历不存在');
      navigate('/', { replace: true });
    }
  }, [id, resumes, setActiveResume, navigate, hydrated]);

  const handleExportPDF = useCallback(async () => {
    const el = previewRef.current?.querySelector('.resume-page') as HTMLElement;
    if (!el) {
      message.error('无法获取预览内容');
      return;
    }
    message.info({ content: '正在打开打印对话框，请选择"另存为 PDF"...', key: 'pdf', duration: 3 });
    try {
      await exportToPDF(el, `${resume?.title ?? 'resume'}.pdf`);
      message.success({ content: 'PDF 导出完成', key: 'pdf' });
    } catch {
      message.error({ content: 'PDF 导出失败', key: 'pdf' });
    }
  }, [resume?.title]);

  const handleExportHTML = useCallback(() => {
    const el = previewRef.current?.querySelector('.resume-page') as HTMLElement;
    if (!el) {
      message.error('无法获取预览内容');
      return;
    }
    exportToHTML(el, resume?.title ?? 'resume');
    message.success('HTML 已导出');
  }, [resume?.title]);

  /** 公开版 PDF 导出（从打码预览面板抓取） */
  const handlePublicExportPDF = useCallback(async () => {
    const container = publicPreviewRef.current ?? previewRef.current;
    const el = container?.querySelector('.resume-page') as HTMLElement;
    if (!el) {
      message.error('无法获取公开版预览内容');
      return;
    }
    message.info({ content: '正在打开打印对话框，请选择"另存为 PDF"...', key: 'pdf', duration: 3 });
    try {
      await exportToPDF(el, `${resume?.title ?? 'resume'}_公开版.pdf`);
      message.success({ content: '公开版 PDF 导出完成', key: 'pdf' });
    } catch {
      message.error({ content: '公开版 PDF 导出失败', key: 'pdf' });
    }
  }, [resume?.title]);

  /** 公开版 HTML 导出 */
  const handlePublicExportHTML = useCallback(() => {
    const container = publicPreviewRef.current ?? previewRef.current;
    const el = container?.querySelector('.resume-page') as HTMLElement;
    if (!el) {
      message.error('无法获取公开版预览内容');
      return;
    }
    exportToHTML(el, `${resume?.title ?? 'resume'}_公开版`);
    message.success('公开版 HTML 已导出');
  }, [resume?.title]);

  const toggleExpand = (key: string) => {
    setExpandedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Build ordered section list
  const orderedSections = useMemo(() => {
    if (!resume) return [];
    const order: string[] = resume.section_order ?? DEFAULT_SECTION_ORDER;
    const sections: string[] = ['basics'];
    for (const key of order) {
      if (key === 'summary') continue;
      if (sections.includes(key)) continue;
      sections.push(key);
    }
    for (const cs of resume.custom_sections) {
      const key = `custom_${cs.id}`;
      if (!sections.includes(key)) sections.push(key);
    }
    return sections;
  }, [resume]);

  const isVisible = useCallback((key: string): boolean => {
    if (!resume) return true;
    if (key === 'basics') return true;
    const visibility = resume.section_visibility ?? DEFAULT_SECTION_VISIBILITY;
    return (visibility as Record<string, boolean>)[key] ?? true;
  }, [resume]);

  const handleToggleVisibility = (key: string) => {
    if (key === 'basics') return;
    if (key in SECTION_LABELS) {
      toggleSectionVisibility(key as SectionKey);
    } else {
      const visibility = resume?.section_visibility ?? DEFAULT_SECTION_VISIBILITY;
      setSectionVisibility({ ...visibility, [key]: !isVisible(key) });
    }
  };

  // Drag & drop for sidebar reordering
  const handleDragStart = (key: string) => {
    dragItemRef.current = key;
  };

  const handleDragOver = (e: React.DragEvent, key: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverKey(key);
  };

  const handleDragLeave = () => {
    setDragOverKey(null);
  };

  const handleDrop = (targetKey: string) => {
    setDragOverKey(null);
    const sourceKey = dragItemRef.current;
    dragItemRef.current = null;
    if (!sourceKey || sourceKey === targetKey || !resume) return;

    const order: string[] = resume.section_order ?? [...DEFAULT_SECTION_ORDER];
    const srcOrderKey = sourceKey === 'basics' ? 'summary' : sourceKey;
    const tgtOrderKey = targetKey === 'basics' ? 'summary' : targetKey;
    const fromIndex = order.indexOf(srcOrderKey);
    const toIndex = order.indexOf(tgtOrderKey);
    if (fromIndex >= 0 && toIndex >= 0) {
      reorderSections(fromIndex, toIndex);
    }
  };

  const handleAddCustomSection = () => {
    const sectionId = addCustomSection('自定义模块');
    setExpandedKeys(prev => new Set(prev).add(`custom_${sectionId}`));
  };

  // Scroll to a section in the editor when sidebar item is clicked
  // Supports "section:index" format for precise item navigation
  const scrollToSection = (key: string) => {
    let sectionKey = key;
    let itemIndex: string | null = null;

    // Parse "section:index" format
    if (key.includes(':')) {
      const [sec, idx] = key.split(':');
      sectionKey = sec;
      itemIndex = idx;
    }

    // Expand the section if not already expanded
    setExpandedKeys(prev => {
      const next = new Set(prev);
      next.add(sectionKey);
      return next;
    });
    // Switch to editor panel if on style panel
    setActivePanel('editor');
    // Scroll the module card into view, then expand the precise Collapse item
    requestAnimationFrame(() => {
      const el = document.getElementById(`module-${sectionKey}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // If we have a specific item index, click the corresponding Collapse panel
      if (itemIndex !== null) {
        setTimeout(() => {
          const moduleBody = el?.querySelector('.module-card__body');
          if (!moduleBody) return;
          // Ant Design Collapse panels use .ant-collapse-item with index-based keys
          const collapseItems = moduleBody.querySelectorAll('.ant-collapse-item');
          const idx = parseInt(itemIndex!, 10);
          if (idx >= 0 && idx < collapseItems.length) {
            const targetPanel = collapseItems[idx];
            // If not already active, click its header to expand it
            if (!targetPanel.classList.contains('ant-collapse-item-active')) {
              const header = targetPanel.querySelector('.ant-collapse-header') as HTMLElement;
              header?.click();
            }
            // Scroll the panel into view
            targetPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 200);
      }
    });
  };

  const renderSectionEditor = (key: string) => {
    let content: ReactNode = null;
    let label = key;
    switch (key) {
      case 'basics': content = <BasicsEditor />; label = '基本信息'; break;
      case 'work': content = <WorkEditor />; label = '工作经历'; break;
      case 'education': content = <EducationEditor />; label = '教育背景'; break;
      case 'skills': content = <SkillsEditor />; label = '技能'; break;
      case 'projects': content = <ProjectsEditor />; label = '项目经验'; break;
      case 'awards': content = <AwardsEditor />; label = '荣誉奖项'; break;
      case 'languages': content = <LanguagesEditor />; label = '语言能力'; break;
      case 'interests': content = <InterestsEditor />; label = '兴趣爱好'; break;
      default: {
        if (key.startsWith('custom_')) {
          const sectionId = key.replace('custom_', '');
          const section = resume?.custom_sections.find((cs) => cs.id === sectionId);
          if (section) { content = <CustomSectionEditor section={section} />; label = section.title; }
        }
      }
    }
    if (!content) return null;
    return <SectionErrorBoundary name={label}>{content}</SectionErrorBoundary>;
  };

  const getSectionLabel = (key: string) => {
    if (key in SECTION_LABELS) return SECTION_LABELS[key];
    if (key.startsWith('custom_')) {
      const sectionId = key.replace('custom_', '');
      const cs = resume?.custom_sections.find(s => s.id === sectionId);
      return cs?.title ?? '自定义模块';
    }
    return key;
  };

  const getSectionIcon = (key: string) => {
    if (key in SECTION_ICONS) return SECTION_ICONS[key];
    return <AppstoreOutlined />;
  };

  // Completion progress
  const completionInfo = useMemo(() => {
    if (!resume) return { filled: 0, total: 0, percent: 0 };
    const allKeys = orderedSections;
    const statuses = allKeys.map(k => getSectionFillStatus(resume, k));
    const filled = statuses.filter(s => s === 'filled').length;
    const partial = statuses.filter(s => s === 'partial').length;
    const total = allKeys.length;
    const score = filled + partial * 0.5;
    return { filled, total, percent: total > 0 ? Math.round((score / total) * 100) : 0 };
  }, [resume, orderedSections]);

  if (!resume) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <Empty description={hydrated ? '简历加载失败' : '加载中...'} />
        {hydrated && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
            <p>URL ID: {id}</p>
            <p>Store 中简历数: {resumes.length}</p>
            <p>当前激活 ID: {useResumeStore.getState().activeResumeId ?? '无'}</p>
            <Button type="primary" onClick={() => navigate('/')} style={{ marginTop: '12px' }}>
              返回首页
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        onExportPDF={handleExportPDF}
        onExportHTML={handleExportHTML}
        onPublicExportPDF={handlePublicExportPDF}
        onPublicExportHTML={handlePublicExportHTML}
        onTogglePublicMode={() => {
          const next = !isPublicMode;
          usePublicResumeStore.getState().setEnabled(next);
          setActivePanel(next ? 'public' : 'editor');
        }}
      />

      {/* ── Three Panel Layout ── */}
      <div className="editor-layout">
        {/* Panel 1: Left Module Sidebar */}
        <div className={`module-sidebar ${sidebarCollapsed ? 'module-sidebar--collapsed' : ''}`}>
          <div className="module-sidebar__header">
            {!sidebarCollapsed && (
              <span className="module-sidebar__title">模块选择</span>
            )}
            <button
              type="button"
              className="module-sidebar__toggle"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </button>
          </div>

          {!sidebarCollapsed && (
            <div className="module-sidebar__list">
              {orderedSections.map((key) => {
                const visible = isVisible(key);
                const status = getSectionFillStatus(resume, key);
                const isDragOver = dragOverKey === key;

                return (
                  <div
                    key={key}
                    className={`module-sidebar__item ${isDragOver ? 'module-sidebar__item--drag-over' : ''}`}
                    draggable={key !== 'basics'}
                    onDragStart={() => handleDragStart(key)}
                    onDragOver={(e) => handleDragOver(e, key)}
                    onDragLeave={handleDragLeave}
                    onDrop={() => handleDrop(key)}
                    onDragEnd={() => { dragItemRef.current = null; setDragOverKey(null); }}
                  >
                    <div
                      className="module-sidebar__item-left"
                      onClick={() => scrollToSection(key)}
                    >
                      {key !== 'basics' && (
                        <HolderOutlined className="module-sidebar__drag" />
                      )}
                      <span className={`module-sidebar__icon ${status === 'filled' ? 'module-sidebar__icon--filled' : ''}`}>
                        {getSectionIcon(key)}
                      </span>
                      <span className={`module-sidebar__label ${!visible ? 'module-sidebar__label--hidden' : ''}`}>
                        {getSectionLabel(key)}
                      </span>
                    </div>
                    <div className="module-sidebar__item-right">
                      {status === 'filled' && <span className="module-sidebar__dot module-sidebar__dot--filled" />}
                      {status === 'partial' && <span className="module-sidebar__dot module-sidebar__dot--partial" />}
                      {key !== 'basics' && (
                        <Switch
                          size="small"
                          checked={visible}
                          onChange={() => handleToggleVisibility(key)}
                        />
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add custom section */}
              <div className="module-sidebar__add">
                <Button
                  type="primary"
                  shape="round"
                  icon={<PlusOutlined />}
                  onClick={handleAddCustomSection}
                  size="small"
                >
                  添加模块
                </Button>
              </div>

              {/* Style shortcut */}
              <div
                className={`module-sidebar__item module-sidebar__item--style ${activePanel === 'style' ? 'module-sidebar__item--active' : ''}`}
                onClick={() => setActivePanel(activePanel === 'style' ? 'editor' : 'style')}
              >
                <div className="module-sidebar__item-left">
                  <span className="module-sidebar__icon"><SettingOutlined /></span>
                  <span className="module-sidebar__label">样式设置</span>
                </div>
              </div>

              {/* Public resume mode shortcut */}
              <div
                className={`module-sidebar__item module-sidebar__item--style ${activePanel === 'public' ? 'module-sidebar__item--active' : ''}`}
                onClick={() => {
                  if (isPublicMode) {
                    // 已开启 → 关闭公开模式，切回编辑面板
                    usePublicResumeStore.getState().setEnabled(false);
                    setActivePanel('editor');
                  } else {
                    // 未开启 → 开启公开模式，切到公开面板
                    usePublicResumeStore.getState().setEnabled(true);
                    setActivePanel('public');
                  }
                }}
                style={isPublicMode ? { borderLeft: '2px solid var(--neon-magenta)' } : undefined}
              >
                <div className="module-sidebar__item-left">
                  <span className="module-sidebar__icon" style={isPublicMode ? { color: 'var(--neon-magenta)' } : undefined}>
                    <EyeOutlined />
                  </span>
                  <span className="module-sidebar__label">公开简历</span>
                </div>
                {isPublicMode && (
                  <div className="module-sidebar__item-right">
                    <span className="module-sidebar__dot module-sidebar__dot--filled" style={{ background: 'var(--neon-magenta)' }} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Panel 2: Center Form Editor */}
        <div className="form-editor-panel">
          {/* Progress bar / mode indicator */}
          {activePanel === 'public' ? (
            <div className="form-editor__progress" style={{ background: 'rgba(255,0,128,0.08)', borderBottom: '1px solid rgba(255,0,128,0.2)' }}>
              <span className="form-editor__progress-text" style={{ color: 'var(--neon-magenta)', fontWeight: 600 }}>
                🔒 打码模式 · 在右侧预览区选中文本即可打码
              </span>
            </div>
          ) : (
            <div className="form-editor__progress">
              <div className="form-editor__progress-bar">
                <div className="form-editor__progress-fill" style={{ width: `${completionInfo.percent}%` }} />
              </div>
              <span className="form-editor__progress-text">{completionInfo.percent}% 完成</span>
            </div>
          )}

          <div className="form-editor__scroll">
            {activePanel === 'editor' ? (
              <>
                {orderedSections.map((key) => {
                  const isExpanded = expandedKeys.has(key);
                  const visible = isVisible(key);
                  const isCustom = key.startsWith('custom_');

                  return (
                    <div
                      key={key}
                      id={`module-${key}`}
                      className={`module-card ${!visible ? 'module-card--hidden' : ''}`}
                    >
                      {/* Module Header */}
                      <div
                        className={`module-card__header ${isExpanded ? 'module-card__header--active' : ''}`}
                        onClick={() => toggleExpand(key)}
                      >
                        <span className="module-card__arrow">
                          {isExpanded ? <DownOutlined /> : <RightOutlined />}
                        </span>
                        <span className="module-card__icon">{getSectionIcon(key)}</span>
                        <span className="module-card__title">{getSectionLabel(key)}</span>

                        <div className="module-card__actions">
                          {isCustom && (
                            <Popconfirm
                              title="确定删除此自定义模块？"
                              onConfirm={(e) => {
                                e?.stopPropagation();
                                removeCustomSection(key.replace('custom_', ''));
                              }}
                              onCancel={(e) => e?.stopPropagation()}
                            >
                              <button
                                type="button"
                                className="module-card__del-btn"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <DeleteOutlined />
                              </button>
                            </Popconfirm>
                          )}
                        </div>
                      </div>

                      {/* Module Body (collapsible) */}
                      {isExpanded && (
                        <div className="module-card__body">
                          {renderSectionEditor(key)}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add custom section in editor area too */}
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={handleAddCustomSection}
                  block
                  style={{ margin: '12px 0' }}
                  size="small"
                >
                  添加自定义模块
                </Button>
              </>
            ) : activePanel === 'style' ? (
              /* Style / Template Settings panel */
              <div className="module-card">
                <div className="module-card__header module-card__header--active">
                  <span className="module-card__icon"><FormatPainterOutlined /></span>
                  <span className="module-card__title">样式与模板</span>
                </div>
                <div className="module-card__body">
                  <SectionErrorBoundary name="样式与模板">
                    <StyleEditor />
                  </SectionErrorBoundary>
                </div>
              </div>
            ) : (
              /* Public Resume / Redact Settings panel */
              <div className="module-card">
                <div className="module-card__header module-card__header--active"
                  style={{ borderLeft: '3px solid var(--neon-magenta)' }}
                >
                  <span className="module-card__icon" style={{ color: 'var(--neon-magenta)' }}>
                    <EyeOutlined />
                  </span>
                  <span className="module-card__title">公开简历 · 打码设置</span>
                </div>
                <div className="module-card__body">
                  <SectionErrorBoundary name="公开简历设置">
                    <PublicModeEditor />
                  </SectionErrorBoundary>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Panel 3: Right Preview Area */}
        <div className="preview-panel" ref={previewPanelRef}>
          <div
            className="preview-panel__scaler"
            style={{
              transform: `scale(${previewScale})`,
              width: `${pageWidthMM}mm`,
            }}
          >
            <SectionErrorBoundary name="简历预览">
              {isPublicMode ? (
                <RedactedPreview ref={publicPreviewRef} />
              ) : (
                <ResumePreview ref={previewRef} onSectionClick={scrollToSection} />
              )}
            </SectionErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
