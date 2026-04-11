import {
  CopyOutlined,
  DeleteOutlined,
  HistoryOutlined,
  HolderOutlined,
  PlusOutlined,
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Dropdown, Empty, Modal, Popconfirm, Tooltip } from 'antd';
import { useState } from 'react';
import type { ResumeData } from '../types/resume';
import { useResumeStore } from '../stores/resumeStore';

function SortableResumeCard({ resume }: { resume: ResumeData }) {
  const {
    activeResumeId,
    setActiveResume,
    duplicateResume,
    deleteResume,
    saveVersion,
    restoreVersion,
    deleteVersion,
    resumes,
  } = useResumeStore();

  const [showVersions, setShowVersions] = useState(false);
  const isActive = activeResumeId === resume.id;

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

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins}分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    return `${days}天前`;
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`resume-list-card ${isActive ? 'resume-list-card--active' : ''}`}
        onClick={() => setActiveResume(resume.id)}
      >
        <div className="resume-list-card__drag" {...attributes} {...listeners}>
          <HolderOutlined />
        </div>
        <div className="resume-list-card__body">
          <div className="resume-list-card__title">
            {resume.title || '未命名'}
          </div>
          <div className="resume-list-card__meta">
            {resume.basics.name || '—'} · {timeAgo(resume.updated_at)}
            {resume.versions.length > 0 && (
              <span className="resume-list-card__version-badge">
                {resume.versions.length} 版本
              </span>
            )}
          </div>
        </div>
        <div className="resume-list-card__actions" onClick={(e) => e.stopPropagation()}>
          <Tooltip title="版本历史">
            <Button
              type="text"
              size="small"
              icon={<HistoryOutlined />}
              onClick={() => {
                saveVersion();
                setShowVersions(true);
              }}
            />
          </Tooltip>
          <Tooltip title="复制">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => duplicateResume(resume.id)}
            />
          </Tooltip>
          {resumes.length > 1 && (
            <Popconfirm
              title="确定删除此简历？"
              onConfirm={() => deleteResume(resume.id)}
              okText="删除"
              cancelText="取消"
            >
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          )}
        </div>
      </div>

      <Modal
        title={
          <span style={{ fontFamily: 'var(--font-display)', letterSpacing: '1px' }}>
            版本历史 — {resume.title}
          </span>
        }
        open={showVersions}
        onCancel={() => setShowVersions(false)}
        footer={null}
        width={480}
      >
        {resume.versions.length === 0 ? (
          <Empty description="暂无历史版本" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[...resume.versions].reverse().map((ver) => (
              <div
                key={ver.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>
                    {ver.label}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {new Date(ver.timestamp).toLocaleString('zh-CN')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: 'restore',
                          label: '恢复此版本',
                          onClick: () => {
                            restoreVersion(resume.id, ver.id);
                            setShowVersions(false);
                          },
                        },
                        {
                          key: 'delete',
                          label: '删除版本',
                          danger: true,
                          onClick: () => deleteVersion(resume.id, ver.id),
                        },
                      ],
                    }}
                    trigger={['click']}
                  >
                    <Button size="small" type="text">
                      操作
                    </Button>
                  </Dropdown>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}

export default function ResumeList() {
  const { resumes, createResume } = useResumeStore();
  const { reorderResumes } = useResumeStore();

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

  return (
    <div className="resume-list">
      <div className="resume-list__header">
        <span className="section-label" style={{ margin: 0 }}>简历列表</span>
        <Tooltip title="新建简历">
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={createResume}
            style={{ fontFamily: 'var(--font-display)', fontSize: '10px', letterSpacing: '1px' }}
          >
            新建
          </Button>
        </Tooltip>
      </div>

      {sorted.length === 0 ? (
        <div style={{ padding: '32px 16px', textAlign: 'center' }}>
          <Empty
            description="还没有简历"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={createResume} icon={<PlusOutlined />}>
              创建第一份简历
            </Button>
          </Empty>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sorted.map((r) => r.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="resume-list__items">
              {sorted.map((r) => (
                <SortableResumeCard key={r.id} resume={r} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
