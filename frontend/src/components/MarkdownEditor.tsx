import { EditOutlined, EyeOutlined } from '@ant-design/icons';
import { useCallback, useRef, useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  /** Show preview toggle or just be a textarea */
  preview?: boolean;
}

/**
 * A Markdown-aware text editor with preview toggle.
 * - Tab key inserts a tab (or 2 spaces) instead of moving focus
 * - Ctrl+B wraps selection in bold, Ctrl+I in italic
 * - Enter inside a list auto-continues the list marker
 */
export default function MarkdownEditor({
  value,
  onChange,
  placeholder = '支持 Markdown 语法...',
  rows = 4,
  preview = true,
}: Props) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const ta = textareaRef.current;
      if (!ta) return;

      // Ctrl+B: bold
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        wrapSelection(ta, '**', '**', onChange);
        return;
      }
      // Ctrl+I: italic
      if (e.ctrlKey && e.key === 'i') {
        e.preventDefault();
        wrapSelection(ta, '*', '*', onChange);
        return;
      }
      // Tab: insert 2 spaces
      if (e.key === 'Tab') {
        e.preventDefault();
        insertAtCursor(ta, '  ', onChange);
        return;
      }
      // Enter: auto-continue list
      if (e.key === 'Enter') {
        const { selectionStart } = ta;
        const textBefore = value.slice(0, selectionStart);
        const currentLine = textBefore.split('\n').pop() ?? '';

        // Unordered list continuation
        const ulMatch = currentLine.match(/^(\s*)([-*+])\s(.+)/);
        if (ulMatch) {
          e.preventDefault();
          insertAtCursor(ta, `\n${ulMatch[1]}${ulMatch[2]} `, onChange);
          return;
        }
        // Ordered list continuation
        const olMatch = currentLine.match(/^(\s*)(\d+)\.\s(.+)/);
        if (olMatch) {
          e.preventDefault();
          const nextNum = parseInt(olMatch[2], 10) + 1;
          insertAtCursor(ta, `\n${olMatch[1]}${nextNum}. `, onChange);
          return;
        }
        // Empty list item → remove the marker
        const emptyUl = currentLine.match(/^(\s*)([-*+])\s*$/);
        if (emptyUl) {
          e.preventDefault();
          // Delete current line and insert newline
          const lineStart = selectionStart - currentLine.length;
          const newVal = value.slice(0, lineStart) + '\n' + value.slice(selectionStart);
          onChange(newVal);
          requestAnimationFrame(() => {
            ta.selectionStart = ta.selectionEnd = lineStart + 1;
          });
          return;
        }
      }
    },
    [value, onChange],
  );

  const toolbar = preview && (
    <div className="md-editor__toolbar">
      <button
        type="button"
        className={`md-editor__tab ${mode === 'edit' ? 'md-editor__tab--active' : ''}`}
        onClick={() => setMode('edit')}
      >
        <EditOutlined /> 编辑
      </button>
      <button
        type="button"
        className={`md-editor__tab ${mode === 'preview' ? 'md-editor__tab--active' : ''}`}
        onClick={() => setMode('preview')}
      >
        <EyeOutlined /> 预览
      </button>
      <span className="md-editor__hint">支持 Markdown · Ctrl+B 加粗 · Ctrl+I 斜体</span>
    </div>
  );

  return (
    <div className="md-editor">
      {toolbar}
      {mode === 'edit' ? (
        <textarea
          ref={textareaRef}
          className="md-editor__textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={rows}
          spellCheck={false}
        />
      ) : (
        <div className="md-editor__preview" style={{ minHeight: `${rows * 22}px` }}>
          {value ? (
            <MarkdownRenderer content={value} />
          ) : (
            <span className="md-editor__empty">{placeholder}</span>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Helpers ── */

function insertAtCursor(
  ta: HTMLTextAreaElement,
  text: string,
  onChange: (v: string) => void,
) {
  const { selectionStart, selectionEnd, value } = ta;
  const newVal = value.slice(0, selectionStart) + text + value.slice(selectionEnd);
  onChange(newVal);
  requestAnimationFrame(() => {
    ta.selectionStart = ta.selectionEnd = selectionStart + text.length;
  });
}

function wrapSelection(
  ta: HTMLTextAreaElement,
  before: string,
  after: string,
  onChange: (v: string) => void,
) {
  const { selectionStart, selectionEnd, value } = ta;
  const selected = value.slice(selectionStart, selectionEnd);
  const wrapped = `${before}${selected || '文字'}${after}`;
  const newVal = value.slice(0, selectionStart) + wrapped + value.slice(selectionEnd);
  onChange(newVal);
  requestAnimationFrame(() => {
    if (selected) {
      ta.selectionStart = selectionStart;
      ta.selectionEnd = selectionStart + wrapped.length;
    } else {
      // Place cursor inside the markers
      ta.selectionStart = selectionStart + before.length;
      ta.selectionEnd = selectionStart + before.length + 2; // '文字'.length
    }
  });
}
