import { forwardRef, useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { UndoOutlined, RedoOutlined, SettingOutlined, DeleteOutlined } from '@ant-design/icons';
import { useResumeStore } from '../stores/resumeStore';
import { usePublicResumeStore } from '../stores/publicResumeStore';
import { useThemeStore } from '../stores/themeStore';
import { getTemplate } from '../templates';
import PagedPreview from './PagedPreview';
import type { RedactItem, RedactStyle } from '../types/resume';
import SelectionToolbar from './SelectionToolbar';

/** Page heights in mm */
const PAGE_HEIGHTS: Record<string, number> = {
  A4: 297,
  Letter: 279,
};

/** 生成打码占位文本（与原文等长） */
function redactPlaceholder(originalText: string, _style: RedactStyle): string {
  return '█'.repeat(Math.max(originalText.length, 3));
}

/** 右键菜单项 */
interface ContextMenuItem {
  redactItemId: string;
  originalText: string;
  replacement: string;
  style: RedactStyle;
}

const RedactedPreview = forwardRef<HTMLDivElement, object>((_props, ref) => {
  const resume = useResumeStore((s) =>
    s.resumes.find((r) => r.id === s.activeResumeId) ?? null,
  );
  const config = usePublicResumeStore((s) => s.config);
  const addRedactItem = usePublicResumeStore((s) => s.addRedactItem);
  const removeRedactItem = usePublicResumeStore((s) => s.removeRedactItem);
  const updateRedactItem = usePublicResumeStore((s) => s.updateRedactItem);
  const undo = usePublicResumeStore((s) => s.undo);
  const redo = usePublicResumeStore((s) => s.redo);
  const reset = usePublicResumeStore((s) => s.reset);
  const isDark = useThemeStore((s) => s.mode === 'dark');
  const containerRef = useRef<HTMLDivElement>(null);

  // 选中文本浮动工具栏状态
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');

  // 右键上下文菜单状态
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; item: ContextMenuItem } | null>(null);
  // 编辑替换文本
  const [editingReplacement, setEditingReplacement] = useState('');

  /**
   * 用 redactedItems 生成一个 key，每次 undo/redo/add/remove 都会变化，
   * 强制 React 重新挂载 Template 组件，从而让打码重新生效。
   */
  const templateKey = useMemo(() => {
    return config.redactedItems
      .map((i) => `${i.id}:${i.style}:${i.solidColor}:${i.replacement}`)
      .join(',');
  }, [config.redactedItems]);

  /**
   * 核心：遍历 DOM 文本节点，将匹配的打码文本直接替换。
   * 这样导出的 HTML 中就不包含原文了。
   */
  const applyRedaction = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (config.redactedItems.length === 0) return;

    // 收集所有文本节点
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null,
    );

    const textNodes: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      textNodes.push(node as Text);
    }

    // 对每条打码记录，遍历文本节点做替换
    for (const item of config.redactedItems) {
      const search = item.originalText;
      if (!search) continue;

      const replacementText = item.replacement || redactPlaceholder(search, item.style);

      for (const textNode of textNodes) {
        const content = textNode.textContent ?? '';
        if (!content.includes(search)) continue;

        // 找到匹配位置
        const idx = content.indexOf(search);
        if (idx < 0) continue;

        // 分割文本节点：before + replaced + after
        const parent = textNode.parentNode;
        if (!parent) continue;

        const before = content.substring(0, idx);
        const after = content.substring(idx + search.length);

        // 创建替换元素
        const redactSpan = document.createElement('span');
        redactSpan.className = 'redacted-text';
        redactSpan.setAttribute('data-redacted', 'true');
        redactSpan.setAttribute('data-redact-id', item.id);
        redactSpan.textContent = replacementText;
        applyRedactSpanStyle(redactSpan, item);

        // 替换原文本节点
        if (before) {
          parent.insertBefore(document.createTextNode(before), textNode);
        }
        parent.insertBefore(redactSpan, textNode);
        if (after) {
          parent.insertBefore(document.createTextNode(after), textNode);
        }
        parent.removeChild(textNode);

        // 禁用父级 <a> 链接的跳转行为
        const anchorParent = redactSpan.closest('a');
        if (anchorParent) {
          anchorParent.removeAttribute('href');
          anchorParent.style.pointerEvents = 'none';
          anchorParent.style.cursor = 'default';
          anchorParent.setAttribute('data-link-disabled', 'true');
        }
      }
    }
  }, [config.redactedItems]);

  useEffect(() => {
    // 延迟等待模板渲染完成后再执行打码替换
    const timer = setTimeout(applyRedaction, 150);
    return () => clearTimeout(timer);
  }, [applyRedaction, resume, templateKey]);

  /** Ctrl+Z / Ctrl+Shift+Z 快捷键 */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 只在公开模式下拦截
      if (!config.enabled) return;
      // 不拦截输入框内的快捷键
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return;

      const isMod = e.ctrlKey || e.metaKey;
      if (!isMod) return;

      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config.enabled, undo, redo]);

  /** 监听鼠标松开事件，检测是否有选中文本 */
  const handleMouseUp = useCallback(() => {
    // 小延迟让浏览器完成选区
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (!text || text.length < 1) {
        setToolbarPos(null);
        setSelectedText('');
        return;
      }

      // 检测选区是否在预览容器内
      const range = selection?.getRangeAt(0);
      const container = containerRef.current;
      if (!range || !container || !container.contains(range.commonAncestorContainer)) {
        setToolbarPos(null);
        setSelectedText('');
        return;
      }

      // 已经被打码的文本不再弹出
      const ancestor = range.commonAncestorContainer;
      const parentEl = ancestor.nodeType === Node.ELEMENT_NODE
        ? ancestor as Element
        : ancestor.parentElement;
      if (parentEl?.closest('[data-redacted="true"]')) {
        setToolbarPos(null);
        setSelectedText('');
        return;
      }

      const rect = range.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      setSelectedText(text);
      setToolbarPos({
        x: rect.left + rect.width / 2 - containerRect.left,
        y: rect.top - containerRect.top - 8,
      });
    }, 10);
  }, []);

  /** 点击其他地方关闭工具栏 & 右键菜单 */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.selection-toolbar')) return;
    if (target.closest('.redact-context-menu')) return;
    setCtxMenu(null);
  }, []);

  /** 用户从浮动菜单选择了打码样式 */
  const handleRedactSelection = useCallback((style: RedactStyle) => {
    if (!selectedText) return;
    addRedactItem(selectedText, style);
    window.getSelection()?.removeAllRanges();
    setToolbarPos(null);
    setSelectedText('');
  }, [selectedText, addRedactItem]);

  /** 右键点击打码区域 */
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const redactedEl = target.closest('[data-redacted="true"]');
    if (!redactedEl) return;

    e.preventDefault();
    const redactId = redactedEl.getAttribute('data-redact-id');
    if (!redactId) return;

    const item = config.redactedItems.find((i) => i.id === redactId);
    if (!item) return;

    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();

    setCtxMenu({
      x: e.clientX - containerRect.left,
      y: e.clientY - containerRect.top,
      item: {
        redactItemId: item.id,
        originalText: item.originalText,
        replacement: item.replacement,
        style: item.style,
      },
    });
    setEditingReplacement(item.replacement);
    // 关闭选中文本工具栏
    setToolbarPos(null);
    setSelectedText('');
  }, [config.redactedItems]);

  /** 关闭右键菜单 */
  useEffect(() => {
    const close = () => setCtxMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  if (!resume) return null;

  const template = getTemplate(resume.template_id);
  const Template = template.component;
  const pageSize = resume.style_config.page_size ?? 'A4';
  const pageWidthMM = pageSize === 'Letter' ? 216 : 210;
  const pageHeightMM = PAGE_HEIGHTS[pageSize] ?? 297;

  const canUndo = usePublicResumeStore((s) => s._history.length > 0);
  const canRedo = usePublicResumeStore((s) => s._future.length > 0);
  const itemCount = config.redactedItems.length;

  const STYLE_OPTIONS: { key: RedactStyle; label: string }[] = [
    { key: 'mosaic', label: '马赛克' },
    { key: 'solid', label: '纯色' },
  ];

  return (
    <div
      id="resume-preview-public"
      className={isDark ? 'resume-preview-dark' : ''}
      ref={containerRef}
      style={{ position: 'relative' }}
      onMouseUp={handleMouseUp}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
    >
      {/* 顶部浮动工具条 */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 10px',
        background: 'rgba(255,0,128,0.08)',
        borderBottom: '1px solid rgba(255,0,128,0.2)',
        backdropFilter: 'blur(8px)',
        fontSize: '11px',
        color: 'var(--text-secondary)',
        gap: '6px',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <SettingOutlined style={{ color: 'var(--neon-magenta)', fontSize: '12px' }} />
          <span style={{ fontWeight: 600, color: 'var(--neon-magenta)' }}>打码模式</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
            选中文本 → 选择打码方式 | 右键打码处可编辑
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {itemCount > 0 && (
            <span style={{
              fontSize: '10px',
              padding: '1px 6px',
              background: 'rgba(255,0,128,0.15)',
              borderRadius: '8px',
              color: 'var(--neon-magenta)',
              fontWeight: 600,
            }}>
              {itemCount} 项
            </span>
          )}
          <button
            type="button"
            title="撤回 (Ctrl+Z)"
            disabled={!canUndo}
            onClick={undo}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '24px', height: '24px',
              border: 'none', borderRadius: '4px',
              background: canUndo ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: canUndo ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: canUndo ? 'pointer' : 'default',
              fontSize: '12px', opacity: canUndo ? 1 : 0.4,
            }}
          >
            <UndoOutlined />
          </button>
          <button
            type="button"
            title="反撤回 (Ctrl+Shift+Z)"
            disabled={!canRedo}
            onClick={redo}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '24px', height: '24px',
              border: 'none', borderRadius: '4px',
              background: canRedo ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: canRedo ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: canRedo ? 'pointer' : 'default',
              fontSize: '12px', opacity: canRedo ? 1 : 0.4,
            }}
          >
            <RedoOutlined />
          </button>
          {itemCount > 0 && (
            <button
              type="button"
              title="清空所有打码"
              onClick={reset}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '24px', height: '24px',
                border: 'none', borderRadius: '4px',
                background: 'transparent',
                color: 'var(--neon-magenta)',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              <DeleteOutlined />
            </button>
          )}
        </div>
      </div>

      {/* 选中文本后的浮动工具栏 */}
      {toolbarPos && selectedText && (
        <SelectionToolbar
          x={toolbarPos.x}
          y={toolbarPos.y}
          selectedText={selectedText}
          onSelect={handleRedactSelection}
          onClose={() => { setToolbarPos(null); setSelectedText(''); }}
        />
      )}

      {/* 右键打码编辑菜单 */}
      {ctxMenu && (
        <div
          className="redact-context-menu"
          style={{
            position: 'absolute',
            left: `${ctxMenu.x}px`,
            top: `${ctxMenu.y}px`,
            zIndex: 1000,
            minWidth: '200px',
            padding: '8px 0',
            background: 'var(--bg-primary, #1a1a2e)',
            border: '1px solid var(--border-subtle, #333)',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4), 0 0 1px rgba(255,0,128,0.3)',
            fontSize: '12px',
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 原文预览 */}
          <div style={{ padding: '4px 12px 8px', borderBottom: '1px solid var(--border-subtle, #333)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted, #888)', marginBottom: '2px' }}>原文</div>
            <div style={{ color: 'var(--text-primary, #eee)', fontWeight: 500, wordBreak: 'break-all' }}>
              {ctxMenu.item.originalText.length > 30
                ? ctxMenu.item.originalText.slice(0, 30) + '…'
                : ctxMenu.item.originalText}
            </div>
          </div>

          {/* 替换文本编辑 */}
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle, #333)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted, #888)', marginBottom: '4px' }}>
              替换文本（留空则使用打码遮盖）
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <input
                type="text"
                value={editingReplacement}
                onChange={(e) => setEditingReplacement(e.target.value)}
                placeholder="输入替换文本..."
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  fontSize: '11px',
                  background: 'var(--bg-tertiary, #252540)',
                  border: '1px solid var(--border-subtle, #444)',
                  borderRadius: '4px',
                  color: 'var(--text-primary, #eee)',
                  outline: 'none',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateRedactItem(ctxMenu.item.redactItemId, { replacement: editingReplacement });
                    setCtxMenu(null);
                  }
                  e.stopPropagation();
                }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  updateRedactItem(ctxMenu.item.redactItemId, { replacement: editingReplacement });
                  setCtxMenu(null);
                }}
                style={{
                  padding: '4px 8px',
                  fontSize: '10px',
                  background: 'var(--neon-magenta, #ff0080)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                确定
              </button>
            </div>
          </div>

          {/* 样式切换 */}
          <div style={{ padding: '6px 12px', borderBottom: '1px solid var(--border-subtle, #333)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted, #888)', marginBottom: '4px' }}>样式</div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {STYLE_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    updateRedactItem(ctxMenu.item.redactItemId, { style: key });
                    setCtxMenu(null);
                  }}
                  style={{
                    padding: '3px 10px',
                    fontSize: '11px',
                    background: ctxMenu.item.style === key
                      ? 'var(--neon-magenta, #ff0080)'
                      : 'var(--bg-tertiary, #252540)',
                    color: ctxMenu.item.style === key ? '#fff' : 'var(--text-primary, #eee)',
                    border: '1px solid var(--border-subtle, #444)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 删除打码 */}
          <div style={{ padding: '6px 12px' }}>
            <button
              type="button"
              onClick={() => {
                removeRedactItem(ctxMenu.item.redactItemId);
                setCtxMenu(null);
              }}
              style={{
                width: '100%',
                padding: '5px 8px',
                fontSize: '11px',
                background: 'transparent',
                color: '#ff4d4f',
                border: '1px solid #ff4d4f40',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              <DeleteOutlined />
              移除此打码
            </button>
          </div>
        </div>
      )}

      <PagedPreview
        ref={ref}
        pageWidthMM={pageWidthMM}
        pageHeightMM={pageHeightMM}
      >
        <Template key={templateKey} resume={resume} />
      </PagedPreview>
    </div>
  );
});

RedactedPreview.displayName = 'RedactedPreview';
export default RedactedPreview;

// ── 打码样式应用 ──

function applyRedactSpanStyle(span: HTMLElement, item: RedactItem) {
  // 共通样式：不可选中、使文本不可复制
  Object.assign(span.style, {
    userSelect: 'none',
    WebkitUserSelect: 'none',
    display: 'inline',
    borderRadius: '2px',
    lineHeight: 'inherit',
    fontSize: 'inherit',
    letterSpacing: '0',
    cursor: 'context-menu',
  });

  switch (item.style) {
    case 'mosaic':
      Object.assign(span.style, {
        color: 'transparent',
        background: 'repeating-conic-gradient(rgba(120,120,120,0.6) 0% 25%, rgba(180,180,180,0.6) 0% 50%) 0 0 / 6px 6px',
        filter: 'blur(1px)',
        padding: '0 2px',
      });
      break;
    case 'solid':
      Object.assign(span.style, {
        color: item.solidColor || '#333',
        background: item.solidColor || '#333',
        padding: '0 2px',
      });
      break;
  }

  // 替换文本模式：如果有替换文本，显示替换文本而非打码
  if (item.replacement) {
    Object.assign(span.style, {
      color: 'inherit',
      background: 'rgba(0,200,255,0.1)',
      filter: 'none',
      borderBottom: '1px dashed rgba(0,200,255,0.5)',
    });
  }
}
