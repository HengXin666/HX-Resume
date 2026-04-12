import {
  DownloadOutlined,
  EyeOutlined,
  FileMarkdownOutlined,
  FilePdfOutlined,
  GithubOutlined,
  HistoryOutlined,
  Html5Outlined,
  ImportOutlined,
  MoonOutlined,
  SaveOutlined,
  SunOutlined,
  SwapOutlined,
  UploadOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Button, Dropdown, Empty, Modal, Space, Tooltip, message } from 'antd';
import type { MenuProps } from 'antd';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AutoSaveIndicator from './AutoSaveIndicator';
import SyncSettings from './SyncSettings';
import VersionDiffModal from './VersionDiffModal';
import { useThemeStore } from '../stores/themeStore';
import { useResumeStore } from '../stores/resumeStore';
import { usePublicResumeStore } from '../stores/publicResumeStore';
import { downloadFile, exportToMarkdown, exportToMarkdownRedacted } from '../utils/exporters';

interface HeaderProps {
  onExportPDF: () => void;
  onExportHTML: () => void;
  /** 公开简历模式下的导出回调 */
  onPublicExportPDF?: () => void;
  onPublicExportHTML?: () => void;
  /** 切换公开简历模式（由 EditorPage 处理面板联动） */
  onTogglePublicMode?: () => void;
}

export default function Header({ onExportPDF, onExportHTML, onPublicExportPDF, onPublicExportHTML, onTogglePublicMode }: HeaderProps) {
  const { mode, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const resume = useResumeStore((s) => s.resumes.find((r) => r.id === s.activeResumeId) ?? null);
  const { importResume, saveVersion, restoreVersion, deleteVersion } = useResumeStore();
  const { config: publicConfig, setEnabled: setPublicEnabled } = usePublicResumeStore();
  const isPublicMode = publicConfig.enabled;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showVersions, setShowVersions] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [diffVersionId, setDiffVersionId] = useState<string | undefined>();

  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'pdf',
      label: 'PDF 文件（打印导出）',
      icon: <FilePdfOutlined />,
      onClick: onExportPDF,
    },
    {
      key: 'md',
      label: 'Markdown',
      icon: <FileMarkdownOutlined />,
      onClick: () => {
        if (!resume) return;
        const md = exportToMarkdown(resume);
        downloadFile(md, `${resume.title}.md`, 'text/markdown');
        message.success('Markdown 已导出');
      },
    },
    {
      key: 'html',
      label: 'HTML 页面',
      icon: <Html5Outlined />,
      onClick: onExportHTML,
    },
    { type: 'divider' },
    {
      key: 'json',
      label: '导出 JSON 数据',
      icon: <DownloadOutlined />,
      onClick: () => {
        if (!resume) return;
        const json = JSON.stringify(resume, null, 2);
        downloadFile(json, `${resume.slug}.json`, 'application/json');
        message.success('JSON 已导出');
      },
    },
  ];

  const handleImportJSON = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        importResume(data);
        message.success('简历数据已导入');
      } catch {
        message.error('文件格式错误，请导入有效的 JSON 文件');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveVersion = () => {
    const saved = saveVersion();
    if (saved) {
      message.success('版本快照已保存');
    } else {
      message.info('内容未变化，无需保存快照');
    }
  };

  /** 公开简历专用导出菜单 */
  const publicExportMenuItems: MenuProps['items'] = [
    {
      key: 'pub-pdf',
      label: '公开版 PDF（打印导出）',
      icon: <FilePdfOutlined />,
      onClick: onPublicExportPDF,
    },
    {
      key: 'pub-md',
      label: '公开版 Markdown',
      icon: <FileMarkdownOutlined />,
      onClick: () => {
        if (!resume) return;
        const md = exportToMarkdownRedacted(resume, publicConfig);
        downloadFile(md, `${resume.title}_公开版.md`, 'text/markdown');
        message.success('公开版 Markdown 已导出');
      },
    },
    {
      key: 'pub-html',
      label: '公开版 HTML 页面',
      icon: <Html5Outlined />,
      onClick: onPublicExportHTML,
    },
  ];

  return (
    <header
      style={{
        height: '56px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        position: 'relative',
        zIndex: 100,
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '16px',
            fontWeight: 800,
            letterSpacing: '2px',
            cursor: 'pointer',
          }}
          className="neon-text"
          onClick={() => navigate('/')}
          title="返回主页"
        >
          HX::RESUME
        </div>
        <span
          className="home-header__version"
          style={{
            cursor: 'pointer',
          }}
          onClick={() => navigate('/about')}
          title="关于 HX-Resume"
        >
          v0.4.0
        </span>
      </div>

      {/* Auto-save status — centered between logo and actions */}
      {resume && <AutoSaveIndicator />}

      {/* Actions */}
      <Space size="small">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {resume && (
          <>
            <Tooltip title="保存版本快照">
              <Button
                type="text"
                icon={<SaveOutlined />}
                onClick={handleSaveVersion}
                style={{ color: 'var(--neon-green)', fontSize: '14px' }}
              />
            </Tooltip>
            <Tooltip title="版本历史">
              <Button
                type="text"
                icon={<HistoryOutlined />}
                onClick={() => setShowVersions(true)}
                style={{ color: 'var(--text-secondary)', fontSize: '14px' }}
              />
            </Tooltip>
          </>
        )}

        <Tooltip title="导入 JSON">
          <Button
            type="text"
            icon={<ImportOutlined />}
            onClick={handleImportJSON}
            style={{ color: 'var(--text-secondary)', fontSize: '14px' }}
          />
        </Tooltip>

        <Dropdown menu={{ items: exportMenuItems }} trigger={['click']} disabled={!resume}>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            size="small"
            style={{ fontFamily: 'var(--font-display)', fontSize: '10px', letterSpacing: '1px' }}
          >
            导出
          </Button>
        </Dropdown>

        {/* 公开简历模式 */}
        {resume && (
          <>
            <Tooltip title={isPublicMode ? '退出公开简历模式' : '进入公开简历模式'}>
              <Button
                type={isPublicMode ? 'primary' : 'text'}
                icon={<EyeOutlined />}
                size="small"
                onClick={() => {
                  if (onTogglePublicMode) {
                    onTogglePublicMode();
                  } else {
                    setPublicEnabled(!isPublicMode);
                  }
                }}
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '10px',
                  letterSpacing: '1px',
                  ...(isPublicMode
                    ? { background: 'var(--neon-magenta)', borderColor: 'var(--neon-magenta)' }
                    : { color: 'var(--text-secondary)' }),
                }}
              >
                {isPublicMode ? '公开模式' : '公开'}
              </Button>
            </Tooltip>
            {isPublicMode && (
              <Dropdown menu={{ items: publicExportMenuItems }} trigger={['click']}>
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  size="small"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '10px',
                    letterSpacing: '1px',
                    background: 'var(--neon-magenta)',
                    borderColor: 'var(--neon-magenta)',
                  }}
                >
                  导出公开版
                </Button>
              </Dropdown>
            )}
          </>
        )}

        {import.meta.env.VITE_STATIC_MODE !== 'true' && <SyncSettings />}

        <Tooltip title={mode === 'dark' ? '切换亮色' : '切换暗色'}>
          <Button
            type="text"
            icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggleTheme}
            style={{ color: 'var(--neon-yellow)', fontSize: '14px' }}
          />
        </Tooltip>

        <Tooltip title="GitHub">
          <Button
            type="text"
            icon={<GithubOutlined />}
            onClick={() => window.open('https://github.com/HengXin666/HX-Resume', '_blank')}
            style={{ color: 'var(--text-secondary)', fontSize: '14px' }}
          />
        </Tooltip>
      </Space>

      {/* Version history modal */}
      {resume && (
        <Modal
          title={
            <span style={{ fontFamily: 'var(--font-display)', letterSpacing: '1px' }}>
              版本历史 — {resume.title}
            </span>
          }
          open={showVersions}
          onCancel={() => setShowVersions(false)}
          footer={null}
          width={520}
        >
          {/* 存储位置提示 */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '8px 12px',
            marginBottom: '12px',
            background: 'rgba(245, 255, 48, 0.06)',
            border: '1px solid rgba(245, 255, 48, 0.15)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '11px',
            color: 'var(--neon-yellow)',
            lineHeight: '1.5',
          }}>
            <WarningOutlined style={{ marginTop: '2px', flexShrink: 0 }} />
            <span>
              版本快照存储在<strong>当前浏览器本地</strong>（localStorage）。
              清除浏览器数据、更换浏览器或设备后，版本记录将丢失。
              重要版本请及时导出 JSON 备份。
            </span>
          </div>

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
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{ver.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(ver.timestamp).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <Tooltip title="与当前版本对比预览">
                      <Button
                        size="small"
                        type="text"
                        icon={<SwapOutlined />}
                        onClick={() => {
                          setDiffVersionId(ver.id);
                          setShowVersions(false);
                          setShowDiff(true);
                        }}
                        style={{ color: 'var(--neon-cyan)', fontSize: '12px' }}
                      />
                    </Tooltip>
                    <Dropdown
                      menu={{
                        items: [
                          {
                            key: 'restore',
                            label: '恢复此版本',
                            onClick: () => {
                              restoreVersion(resume.id, ver.id);
                              setShowVersions(false);
                              message.success('版本已恢复');
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
                      <Button size="small" type="text">操作</Button>
                    </Dropdown>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {/* Version diff modal */}
      {resume && (
        <VersionDiffModal
          open={showDiff}
          onClose={() => setShowDiff(false)}
          resume={resume}
          initialVersionId={diffVersionId}
        />
      )}
    </header>
  );
}
