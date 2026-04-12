import { Input, Form, Upload, message, Switch } from 'antd';
import { CameraOutlined, DeleteOutlined, ScissorOutlined } from '@ant-design/icons';
import { useResumeStore } from '../../stores/resumeStore';
import MarkdownEditor from '../MarkdownEditor';
import { HEADER_LAYOUTS, AVATAR_RATIOS } from '../../types/resume';
import type { HeaderLayout, AvatarPosition, AvatarRatio } from '../../types/resume';
import type { RcFile } from 'antd/es/upload/interface';
import AvatarCropEditor from '../AvatarCropEditor';
import { useState } from 'react';

export default function BasicsEditor() {
  const resume = useResumeStore((s) => s.resumes.find((r) => r.id === s.activeResumeId) ?? null);
  const { updateBasics, setTitle } = useResumeStore();

  // 头像裁剪弹窗状态
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  if (!resume) return null;
  const { basics } = resume;

  /** 选择文件后先打开裁剪弹窗，不直接保存 */
  const handleAvatarUpload = (file: RcFile) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('请上传图片文件');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      message.error('图片大小不能超过 5MB');
      return false;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setCropSrc(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    return false; // prevent default upload
  };

  /** 裁剪完成后保存到 store */
  const handleCropSave = (croppedDataUrl: string) => {
    updateBasics({ avatar: croppedDataUrl });
    setCropSrc(null);
  };

  /** 对已有头像重新裁剪 */
  const handleReCrop = () => {
    if (basics.avatar) {
      setCropSrc(basics.avatar);
    }
  };

  const handleRemoveAvatar = () => {
    updateBasics({ avatar: '' });
  };

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

        {/* ── 布局选择器 ── */}
        <Form.Item label="头部布局">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {HEADER_LAYOUTS.map((layout) => {
              const isActive = (basics.header_layout || 'classic-center') === layout.id;
              return (
                <div
                  key={layout.id}
                  onClick={() => updateBasics({ header_layout: layout.id as HeaderLayout })}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    border: isActive
                      ? '2px solid var(--neon-cyan, #00f0ff)'
                      : '1px solid var(--border-subtle, #e5e5e5)',
                    background: isActive
                      ? 'rgba(0, 240, 255, 0.06)'
                      : 'var(--bg-tertiary, #f5f6f8)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'center',
                  }}
                >
                  <div style={{
                    fontSize: '12px',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'var(--neon-cyan, #00f0ff)' : 'var(--text-primary, #333)',
                    marginBottom: '2px',
                  }}>
                    {layout.name}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: 'var(--text-muted, #999)',
                    lineHeight: 1.3,
                  }}>
                    {layout.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </Form.Item>

        {/* ── 分割线开关 ── */}
        <Form.Item label="头部分割线" style={{ marginBottom: '8px' }}>
          <Switch
            checked={basics.show_header_divider !== false}
            onChange={(checked) => updateBasics({ show_header_divider: checked })}
            size="small"
          />
          <span style={{ fontSize: '13px', color: 'var(--text-muted, #999)', marginLeft: '8px' }}>
            {basics.show_header_divider !== false ? '显示' : '隐藏'}
          </span>
        </Form.Item>

        {/* ── 头像位置 ── */}
        <Form.Item label="头像位置" style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {([
              { id: 'left' as AvatarPosition, name: '📷 左侧' },
              { id: 'right' as AvatarPosition, name: '右侧 📷' },
            ]).map((opt) => {
              const isActive = (basics.avatar_position || 'left') === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => updateBasics({ avatar_position: opt.id })}
                  style={{
                    flex: 1, padding: '6px 10px', borderRadius: '6px', textAlign: 'center',
                    cursor: 'pointer', transition: 'all 0.15s ease', fontSize: '12px',
                    border: isActive
                      ? '2px solid var(--neon-cyan, #00f0ff)'
                      : '1px solid var(--border-subtle, #e5e5e5)',
                    background: isActive
                      ? 'rgba(0, 240, 255, 0.06)'
                      : 'var(--bg-tertiary, #f5f6f8)',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'var(--neon-cyan, #00f0ff)' : 'var(--text-primary, #333)',
                  }}
                >
                  {opt.name}
                </div>
              );
            })}
          </div>
        </Form.Item>

        {/* ── 头像比例 ── */}
        <Form.Item label="头像比例" style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {AVATAR_RATIOS.map((r) => {
              const isActive = (basics.avatar_ratio || '2:3') === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => updateBasics({ avatar_ratio: r.id as AvatarRatio })}
                  style={{
                    flex: 1, padding: '6px 4px', borderRadius: '6px', textAlign: 'center',
                    cursor: 'pointer', transition: 'all 0.15s ease', fontSize: '11px',
                    border: isActive
                      ? '2px solid var(--neon-cyan, #00f0ff)'
                      : '1px solid var(--border-subtle, #e5e5e5)',
                    background: isActive
                      ? 'rgba(0, 240, 255, 0.06)'
                      : 'var(--bg-tertiary, #f5f6f8)',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'var(--neon-cyan, #00f0ff)' : 'var(--text-primary, #333)',
                  }}
                >
                  {r.name}
                </div>
              );
            })}
          </div>
        </Form.Item>

        {/* ── 头像上传 ── */}
        <Form.Item label="头像">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Upload
              name="avatar"
              showUploadList={false}
              beforeUpload={handleAvatarUpload as (file: RcFile, fileList: RcFile[]) => boolean}
              accept="image/*"
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '8px',
                  border: basics.avatar
                    ? '2px solid var(--border-subtle, #e5e5e5)'
                    : '2px dashed var(--border-glow, #ccc)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--bg-tertiary, #f5f6f8)',
                  transition: 'all 0.15s',
                  position: 'relative',
                }}
              >
                {basics.avatar ? (
                  <img
                    src={basics.avatar}
                    alt="avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted, #999)' }}>
                    <CameraOutlined style={{ fontSize: '18px', display: 'block', marginBottom: '2px' }} />
                    <span style={{ fontSize: '9px' }}>上传</span>
                  </div>
                )}
              </div>
            </Upload>
            {basics.avatar && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button
                  type="button"
                  onClick={handleReCrop}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '4px 8px', borderRadius: '4px', fontSize: '11px',
                    border: '1px solid var(--border-subtle, #e5e5e5)',
                    background: 'transparent',
                    color: 'var(--neon-cyan, #00f0ff)',
                    cursor: 'pointer',
                  }}
                >
                  <ScissorOutlined /> 裁剪
                </button>
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '4px 8px', borderRadius: '4px', fontSize: '11px',
                    border: '1px solid var(--border-subtle, #e5e5e5)',
                    background: 'transparent',
                    color: 'var(--neon-magenta, #ff2d6d)',
                    cursor: 'pointer',
                  }}
                >
                  <DeleteOutlined /> 移除
                </button>
              </div>
            )}
            <span style={{ fontSize: '10px', color: 'var(--text-muted, #999)' }}>
              支持 JPG/PNG，≤ 5MB
            </span>
          </div>
        </Form.Item>

        {/* 头像裁剪弹窗 */}
        <AvatarCropEditor
          open={!!cropSrc}
          src={cropSrc || ''}
          avatarRatio={basics.avatar_ratio}
          onSave={handleCropSave}
          onCancel={() => setCropSrc(null)}
        />

        <Form.Item label="姓名">
          <Input
            value={basics.name}
            onChange={(e) => updateBasics({ name: e.target.value })}
            placeholder="例: 张三"
          />
        </Form.Item>

        <Form.Item label="意向岗位">
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
