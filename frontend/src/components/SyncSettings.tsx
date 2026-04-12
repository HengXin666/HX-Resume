import {
  CheckCircleOutlined,
  CloudDownloadOutlined,
  CloudUploadOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  LoadingOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Button, Input, Modal, Space, Tag, Tooltip, message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import {
  getGitStatus,
  getSyncConfig,
  gitPull,
  gitPush,
  updateSyncConfig,
  type GitStatus,
  type SyncConfig,
} from '../utils/api';

export default function SyncSettings() {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<SyncConfig>({ repo_url: '', branch: 'main' });
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [pushing, setPushing] = useState(false);

  const fetchState = useCallback(async () => {
    try {
      const [cfg, st] = await Promise.all([getSyncConfig(), getGitStatus()]);
      setConfig(cfg);
      setStatus(st);
    } catch {
      // 后端可能未启动
    }
  }, []);

  useEffect(() => {
    if (open) fetchState();
  }, [open, fetchState]);

  const handleSaveConfig = async () => {
    setLoading(true);
    try {
      await updateSyncConfig(config);
      message.success('同步配置已保存');
      await fetchState();
    } catch {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePull = async () => {
    setPulling(true);
    try {
      const result = await gitPull();
      if (result.ok) {
        message.success(result.message || '拉取成功');
      } else {
        message.error(result.error || '拉取失败');
      }
      await fetchState();
    } catch {
      message.error('拉取请求失败');
    } finally {
      setPulling(false);
    }
  };

  const handlePush = async () => {
    setPushing(true);
    try {
      const result = await gitPush();
      if (result.ok) {
        message.success(result.message || '推送成功');
      } else {
        message.error(result.error || '推送失败');
      }
      await fetchState();
    } catch {
      message.error('推送请求失败');
    } finally {
      setPushing(false);
    }
  };

  return (
    <>
      <Tooltip title="数据同步设置">
        <Button
          type="text"
          icon={<SettingOutlined />}
          onClick={() => setOpen(true)}
          style={{ color: 'var(--text-secondary)', fontSize: '14px' }}
        />
      </Tooltip>

      <Modal
        title={
          <span style={{ fontFamily: 'var(--font-display)', letterSpacing: '1px' }}>
            <SettingOutlined /> 数据同步设置
          </span>
        }
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width={520}
      >
        {/* 说明 */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          padding: '8px 12px',
          marginBottom: '16px',
          background: 'rgba(0, 255, 255, 0.04)',
          border: '1px solid rgba(0, 255, 255, 0.12)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          lineHeight: '1.6',
        }}>
          <InfoCircleOutlined style={{ marginTop: '3px', flexShrink: 0, color: 'var(--neon-cyan)' }} />
          <span>
            配置一个<strong>私有 Git 仓库地址</strong>，即可通过本地 git 命令同步简历数据。
            无需配置 Token，本机 git 已有的认证信息会自动生效。
          </span>
        </div>

        {/* 仓库配置 */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            <LinkOutlined /> 仓库地址
          </label>
          <Input
            placeholder="https://github.com/username/my-resume-data.git"
            value={config.repo_url}
            onChange={(e) => setConfig({ ...config, repo_url: e.target.value })}
            style={{ marginBottom: '8px' }}
          />
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            分支
          </label>
          <Input
            placeholder="main"
            value={config.branch}
            onChange={(e) => setConfig({ ...config, branch: e.target.value })}
            style={{ marginBottom: '12px' }}
          />
          <Button
            type="primary"
            size="small"
            onClick={handleSaveConfig}
            loading={loading}
            style={{ fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '1px' }}
          >
            保存配置
          </Button>
        </div>

        {/* 状态 */}
        {status && (
          <div style={{
            padding: '10px 12px',
            marginBottom: '16px',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            fontSize: '12px',
          }}>
            <Space size="small" wrap>
              <Tag color={status.configured ? 'cyan' : 'default'}>
                {status.configured ? '已配置' : '未配置'}
              </Tag>
              {status.initialized && (
                <Tag color="green">
                  <CheckCircleOutlined /> 已初始化
                </Tag>
              )}
              {status.branch && <Tag>{status.branch}</Tag>}
              {status.has_uncommitted_changes && (
                <Tag color="orange">有未提交更改</Tag>
              )}
            </Space>
          </div>
        )}

        {/* 同步操作 */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            icon={pulling ? <LoadingOutlined /> : <CloudDownloadOutlined />}
            onClick={handlePull}
            loading={pulling}
            disabled={!config.repo_url}
            style={{ flex: 1, fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '1px' }}
          >
            拉取 (Pull)
          </Button>
          <Button
            type="primary"
            icon={pushing ? <LoadingOutlined /> : <CloudUploadOutlined />}
            onClick={handlePush}
            loading={pushing}
            disabled={!config.repo_url}
            style={{ flex: 1, fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '1px' }}
          >
            推送 (Push)
          </Button>
        </div>
      </Modal>
    </>
  );
}
