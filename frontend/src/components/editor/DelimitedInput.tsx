import { Input } from 'antd';
import { useEffect, useRef, useState } from 'react';

interface DelimitedInputProps {
  /** 当前关键词数组 */
  value: string[];
  /** 值变化回调，传入解析后的数组 */
  onChange: (keywords: string[]) => void;
  /** 显示时的分隔符，默认 ' / ' */
  displaySeparator?: string;
  /** 解析输入时使用的分隔正则，默认支持中英文逗号、分号、斜杠 */
  splitPattern?: RegExp;
  placeholder?: string;
}

/**
 * 解决受控组件中 join/split 双向转换导致光标跳到末尾的问题。
 *
 * 策略：
 * - 聚焦时使用本地 string state，用户可自由编辑
 * - 失焦时才 split → 数组写入 store
 * - 未聚焦时直接显示 store 数据的 join 结果
 */
export default function DelimitedInput({
  value,
  onChange,
  displaySeparator = ' / ',
  splitPattern = /[,，;；/]/,
  placeholder,
}: DelimitedInputProps) {
  const [focused, setFocused] = useState(false);
  const [localText, setLocalText] = useState('');
  const justBlurred = useRef(false);

  // 当 store 值在非聚焦状态下从外部变化时（如撤销/同步），同步本地文本
  const displayText = value.join(displaySeparator);

  useEffect(() => {
    if (!focused) {
      setLocalText(displayText);
    }
  }, [displayText, focused]);

  const handleFocus = () => {
    // 聚焦时把 store 当前值作为编辑起点
    setLocalText(displayText);
    setFocused(true);
  };

  const commitValue = () => {
    const keywords = localText
      .split(splitPattern)
      .map((k) => k.trim())
      .filter(Boolean);
    onChange(keywords);
    setFocused(false);
  };

  const handleBlur = () => {
    justBlurred.current = true;
    commitValue();
    // 防止短时间内重复触发
    requestAnimationFrame(() => {
      justBlurred.current = false;
    });
  };

  return (
    <Input
      value={focused ? localText : displayText}
      onChange={(e) => setLocalText(e.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
    />
  );
}
