import {
  DownloadOutlined,
  FileMarkdownOutlined,
  FilePdfOutlined,
  GithubOutlined,
  HistoryOutlined,
  Html5Outlined,
  ImportOutlined,
  MoonOutlined,
  SaveOutlined,
  SunOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Button, Dropdown, Empty, Modal, Space, Tooltip, message } from 'antd';
import type { MenuProps } from 'antd';
import { useRef, useState } from 'react';
import { useThemeStore } from '../stores/themeStore';
import { useResumeStore } from '../stores/resumeStore';
import { downloadFile, exportToMarkdown } from '../utils/exporters';

interface HeaderProps {
  onExportPDF: () => void;
  onExportHTML: () => void;
}

export default function Header({ onExportPDF, onExportHTML }: HeaderProps) {
  const { mode, toggleTheme } = useThemeStore();
  const resume = useResumeStore((s) => s.resumes.find((r) => r.id === s.activeResumeId) ?? null);
  const { importResume, saveVersion, restoreVersion, deleteVersion } = useResumeStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showVersions, setShowVersions] = useState(false);

  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'pdf',
      label: 'PDF 文件',
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
          }}
          className="neon-text"
        >
          HX::RESUME
        </div>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-subtle)',
            padding: '1px 5px',
            borderRadius: '3px',
          }}
        >
          v0.3.0
        </span>
      </div>

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
            onClick={() => window.open('https://github.com', '_blank')}
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
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{ver.label}</div>
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
    </header>
  );
}
