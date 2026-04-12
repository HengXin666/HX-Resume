import { CloseOutlined } from '@ant-design/icons';
import type { RedactStyle } from '../types/resume';

interface Props {
  x: number;
  y: number;
  selectedText: string;
  onSelect: (style: RedactStyle) => void;
  onClose: () => void;
}

const STYLES: { key: RedactStyle; label: string; icon: React.ReactNode }[] = [
  { key: 'mosaic', label: '马赛克', icon: <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>▓▓</span> },
  { key: 'solid', label: '纯色', icon: <span style={{ fontSize: '13px' }}>██</span> },
];

export default function SelectionToolbar({ x, y, selectedText, onSelect, onClose }: Props) {
  const previewText = selectedText.length > 12
    ? selectedText.slice(0, 12) + '…'
    : selectedText;

  return (
    <div
      className="selection-toolbar"
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -100%)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        padding: '4px 6px',
        background: 'var(--bg-primary, #1a1a2e)',
        border: '1px solid var(--border-subtle, #333)',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4), 0 0 1px rgba(255,0,128,0.3)',
        whiteSpace: 'nowrap',
        pointerEvents: 'auto',
        animation: 'toolbar-fade-in 0.15s ease-out',
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* 选中文本预览 */}
      <span style={{
        fontSize: '10px',
        color: 'var(--text-muted, #888)',
        maxWidth: '80px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        marginRight: '4px',
        padding: '2px 4px',
        background: 'var(--bg-tertiary, #252540)',
        borderRadius: '4px',
      }}>
        "{previewText}"
      </span>

      {/* 分隔线 */}
      <div style={{
        width: '1px',
        height: '20px',
        background: 'var(--border-subtle, #333)',
        margin: '0 2px',
      }} />

      {/* 打码样式按钮 */}
      {STYLES.map(({ key, label, icon }) => (
        <button
          key={key}
          type="button"
          title={`${label}打码`}
          onClick={() => onSelect(key)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            padding: '4px 8px',
            border: 'none',
            borderRadius: '5px',
            background: 'transparent',
            color: 'var(--text-primary, #eee)',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 500,
            transition: 'all 0.15s',
            lineHeight: 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--neon-magenta, #ff0080)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-primary, #eee)';
          }}
        >
          {icon}
          <span>{label}</span>
        </button>
      ))}

      {/* 关闭 */}
      <button
        type="button"
        title="取消"
        onClick={onClose}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '20px',
          height: '20px',
          border: 'none',
          borderRadius: '50%',
          background: 'transparent',
          color: 'var(--text-muted, #666)',
          cursor: 'pointer',
          fontSize: '10px',
          marginLeft: '2px',
        }}
      >
        <CloseOutlined />
      </button>

      {/* 小三角指示器 */}
      <div style={{
        position: 'absolute',
        bottom: '-5px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '10px',
        height: '10px',
        background: 'var(--bg-primary, #1a1a2e)',
        border: '1px solid var(--border-subtle, #333)',
        borderTop: 'none',
        borderLeft: 'none',
        transform: 'translateX(-50%) rotate(45deg)',
      }} />

      <style>{`
        @keyframes toolbar-fade-in {
          from { opacity: 0; transform: translate(-50%, -100%) translateY(4px); }
          to   { opacity: 1; transform: translate(-50%, -100%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
