import { useEffect, useState } from 'react';
import MarkdownEditor from '../MarkdownEditor';

interface HighlightsEditorProps {
  value: string[];
  onChange: (highlights: string[]) => void;
  rows?: number;
  placeholder?: string;
}

/**
 * 解决 highlights 数组与 textarea 文本之间 join/split 双向转换导致光标跳转的问题。
 *
 * 策略：
 * - 聚焦时使用本地 string state
 * - 失焦时才 split('\n') → 数组写入 store
 * - 未聚焦时显示 store 数据的 join('\n') 结果
 */
export default function HighlightsEditor({
  value,
  onChange,
  rows = 4,
  placeholder,
}: HighlightsEditorProps) {
  const [focused, setFocused] = useState(false);
  const [localText, setLocalText] = useState('');

  const displayText = value.join('\n');

  useEffect(() => {
    if (!focused) {
      setLocalText(displayText);
    }
  }, [displayText, focused]);

  const handleFocus = () => {
    setLocalText(displayText);
    setFocused(true);
  };

  const commitValue = () => {
    const highlights = localText.split('\n').filter((l) => l.trim());
    onChange(highlights);
    setFocused(false);
  };

  return (
    <MarkdownEditor
      value={focused ? localText : displayText}
      onChange={(val) => setLocalText(val)}
      onFocus={handleFocus}
      onBlur={commitValue}
      rows={rows}
      placeholder={placeholder}
    />
  );
}
