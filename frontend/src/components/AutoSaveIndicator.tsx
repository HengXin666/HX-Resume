import { CheckCircleOutlined, CloudOutlined, LoadingOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useResumeStore } from '../stores/resumeStore';

type SaveStatus = 'idle' | 'saving' | 'saved';

/** Format relative time like "刚刚" / "1 分钟前" / "15 分钟前" / "1 小时前" */
function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 10) return '刚刚';
  if (seconds < 60) return `${seconds} 秒前`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  return new Date(isoString).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AutoSaveIndicator() {
  const resume = useResumeStore((s) =>
    s.resumes.find((r) => r.id === s.activeResumeId) ?? null,
  );
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [relativeTime, setRelativeTime] = useState('');
  const prevUpdatedAt = useRef(resume?.updated_at);
  const savingTimer = useRef<ReturnType<typeof setTimeout>>();
  const idleTimer = useRef<ReturnType<typeof setTimeout>>();

  // Detect changes to updated_at → "saving" → "saved" → "idle" (relative time)
  useEffect(() => {
    if (!resume) return;
    if (prevUpdatedAt.current !== resume.updated_at) {
      prevUpdatedAt.current = resume.updated_at;
      setStatus('saving');
      clearTimeout(savingTimer.current);
      clearTimeout(idleTimer.current);
      savingTimer.current = setTimeout(() => {
        setStatus('saved');
        idleTimer.current = setTimeout(() => setStatus('idle'), 3000);
      }, 800);
    }
    return () => {
      clearTimeout(savingTimer.current);
      clearTimeout(idleTimer.current);
    };
  }, [resume?.updated_at, resume]);

  // Tick every 15s to update relative time display
  useEffect(() => {
    if (!resume?.updated_at) return;

    const update = () => setRelativeTime(formatRelativeTime(resume.updated_at));
    update();
    const interval = setInterval(update, 15_000);
    return () => clearInterval(interval);
  }, [resume?.updated_at]);

  if (!resume) return null;

  const iconSize = '11px';

  return (
    <Tooltip
      title="数据自动保存在当前浏览器本地（localStorage），更换浏览器或清除数据后将丢失"
      placement="bottom"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          transition: 'color 0.3s, opacity 0.3s',
          userSelect: 'none',
          whiteSpace: 'nowrap',
          cursor: 'help',
        }}
      >
      {status === 'saving' ? (
        <>
          <LoadingOutlined spin style={{ fontSize: iconSize, color: 'var(--neon-yellow)' }} />
          <span style={{ color: 'var(--neon-yellow)' }}>保存中</span>
        </>
      ) : status === 'saved' ? (
        <>
          <CheckCircleOutlined style={{ fontSize: iconSize, color: 'var(--neon-green)' }} />
          <span style={{ color: 'var(--neon-green)' }}>自动保存成功</span>
        </>
      ) : (
        <>
          <CloudOutlined style={{ fontSize: iconSize }} />
          <span>保存于 {relativeTime}</span>
        </>
      )}
      </div>
    </Tooltip>
  );
}
