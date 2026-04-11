import { CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { useEffect, useRef, useState } from 'react';
import { useResumeStore } from '../stores/resumeStore';

export default function AutoSaveIndicator() {
  const resume = useResumeStore((s) => s.resumes.find((r) => r.id === s.activeResumeId) ?? null);
  const [status, setStatus] = useState<'saved' | 'saving'>('saved');
  const prevRef = useRef(resume?.updated_at);

  useEffect(() => {
    if (!resume) return;
    if (prevRef.current !== resume.updated_at) {
      prevRef.current = resume.updated_at;
      setStatus('saving');
      const timer = setTimeout(() => setStatus('saved'), 600);
      return () => clearTimeout(timer);
    }
  }, [resume?.updated_at, resume]);

  if (!resume) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '10px',
        fontFamily: 'var(--font-mono)',
        color: status === 'saving' ? 'var(--neon-yellow)' : 'var(--text-muted)',
        transition: 'color 0.3s',
      }}
    >
      {status === 'saving' ? (
        <>
          <LoadingOutlined spin style={{ fontSize: '10px' }} />
          <span>保存中...</span>
        </>
      ) : (
        <>
          <CheckCircleOutlined style={{ fontSize: '10px', color: 'var(--neon-green)' }} />
          <span>已自动保存</span>
        </>
      )}
    </div>
  );
}
