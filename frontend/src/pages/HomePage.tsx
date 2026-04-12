import {
  ClockCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  FileTextOutlined,
  GithubOutlined,
  HolderOutlined,
  ImportOutlined,
  MoonOutlined,
  PlusOutlined,
  SunOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Empty, Popconfirm, Tooltip, message } from 'antd';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ResumeData } from '../types/resume';
import { useResumeStore } from '../stores/resumeStore';
import { useThemeStore } from '../stores/themeStore';
import { downloadFile, exportToMarkdown } from '../utils/exporters';
import SyncSettings from '../components/SyncSettings';

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return new Date(date).toLocaleDateString('zh-CN');
}

function SortableResumeCard({ resume }: { resume: ResumeData }) {
  const navigate = useNavigate();
  const { duplicateResume, deleteResume, resumes } = useResumeStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: resume.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const templateLabels: Record<string, string> = {
    classic: '经典',
    modern: '现代',
    minimal: '极简',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="home-resume-card"
    >
      {/* Drag handle */}
      <div className="home-resume-card__drag" {...attributes} {...listeners}>
        <HolderOutlined />
      </div>

      {/* Card content — click to navigate */}
      <div
        className="home-resume-card__content"
        onClick={() => {
          useResumeStore.getState().setActiveResume(resume.id);
          navigate(`/resume/${resume.id}`);
        }}
      >
        {/* Thumbnail placeholder */}
        <div className="home-resume-card__thumb">
          <FileTextOutlined style={{ fontSize: 28, color: 'var(--neon-cyan)' }} />
        </div>

        {/* Info */}
        <div className="home-resume-card__info">
          <div className="home-resume-card__title">
            {resume.title || '未命名简历'}
          </div>
          <div className="home-resume-card__meta">
            {resume.basics.name || '—'}
            {resume.basics.label && (
              <span style={{ color: 'var(--text-muted)' }}> · {resume.basics.label}</span>
            )}
          </div>
          <div className="home-resume-card__footer">
            <span className="home-resume-card__tag">
              {templateLabels[resume.template_id] ?? resume.template_id}
            </span>
            {resume.versions.length > 0 && (
              <span className="home-resume-card__tag home-resume-card__tag--version">
                <ClockCircleOutlined style={{ fontSize: 10 }} /> {resume.versions.length} 版本
              </span>
            )}
            <span className="home-resume-card__time">
              {timeAgo(resume.updated_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="home-resume-card__actions">
        <Tooltip title="编辑">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              useResumeStore.getState().setActiveResume(resume.id);
              navigate(`/resume/${resume.id}`);
            }}
          />
        </Tooltip>
        <Tooltip title="导出 JSON">
          <Button
            type="text"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => {
              const json = JSON.stringify(resume, null, 2);
              downloadFile(json, `${resume.slug}.json`, 'application/json');
              message.success('JSON 已导出');
            }}
          />
        </Tooltip>
        <Tooltip title="复制">
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => {
              duplicateResume(resume.id);
              message.success('已复制简历');
            }}
          />
        </Tooltip>
        {resumes.length > 1 && (
          <Popconfirm
            title="确定删除此简历？"
            description="删除后无法恢复"
            onConfirm={() => {
              deleteResume(resume.id);
              message.success('已删除');
            }}
            okText="删除"
            cancelText="取消"
          >
            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { resumes, createResume, importResume, reorderResumes } = useResumeStore();
  const { mode, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const sorted = [...resumes].sort((a, b) => a.sort_order - b.sort_order);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sorted.findIndex((r) => r.id === active.id);
    const newIndex = sorted.findIndex((r) => r.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    reorderResumes(oldIndex, newIndex);
  };

  const handleCreateResume = () => {
    const id = createResume();
    navigate(`/resume/${id}`);
  };

  const handleImportJSON = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const id = importResume(data);
        message.success('简历已导入');
        navigate(`/resume/${id}`);
      } catch {
        message.error('文件格式错误，请导入有效的 JSON 文件');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="home-page">
      {/* Header */}
      <header className="home-header">
        <div className="home-header__brand">
          <div
            className="home-header__logo neon-text"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/')}
            title="返回主页"
          >
            HX::RESUME
          </div>
          <span
            className="home-header__version"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/about')}
            title="关于 HX-Resume"
          >
            v0.4.0
          </span>
        </div>
        <div className="home-header__actions">
          <SyncSettings />
          <Tooltip title={mode === 'dark' ? '切换亮色' : '切换暗色'}>
            <Button
              type="text"
              icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleTheme}
              style={{ color: 'var(--neon-yellow)', fontSize: '16px' }}
            />
          </Tooltip>
          <Tooltip title="GitHub">
            <Button
              type="text"
              icon={<GithubOutlined />}
              onClick={() => window.open('https://github.com/HengXin666/HX-Resume', '_blank')}
              style={{ color: 'var(--text-secondary)', fontSize: '16px' }}
            />
          </Tooltip>
        </div>
      </header>

      {/* Hero section */}
      <div className="home-hero">
        <h1 className="home-hero__title">
          <span className="neon-text">简历</span>管理中心
        </h1>
        <p className="home-hero__desc">
          创建、编辑、管理你的所有简历。支持多模板、版本快照、拖拽排序。
        </p>
        <div className="home-hero__actions">
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={handleCreateResume}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '12px',
              letterSpacing: '1.5px',
              height: '44px',
              paddingInline: '28px',
            }}
          >
            新建简历
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <Button
            size="large"
            icon={<ImportOutlined />}
            onClick={handleImportJSON}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '11px',
              letterSpacing: '1px',
              height: '44px',
              paddingInline: '24px',
              borderColor: 'var(--border-glow)',
              color: 'var(--text-primary)',
            }}
          >
            导入 JSON
          </Button>
        </div>
      </div>

      {/* Resume grid */}
      <div className="home-content">
        {sorted.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <Empty
              description={
                <span style={{ color: 'var(--text-muted)' }}>
                  还没有简历，创建你的第一份吧
                </span>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateResume}>
                创建简历
              </Button>
            </Empty>
          </div>
        ) : (
          <>
            <div className="home-content__header">
              <span className="section-label" style={{ margin: 0 }}>
                全部简历 ({resumes.length})
              </span>
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sorted.map((r) => r.id)}
                strategy={rectSortingStrategy}
              >
                <div className="home-resume-grid">
                  {sorted.map((r) => (
                    <SortableResumeCard key={r.id} resume={r} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </>
        )}
      </div>
    </div>
  );
}
