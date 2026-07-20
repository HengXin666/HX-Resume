import { useRef } from 'react';
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import type { Basics } from '../types/resume';
import { useResumeStore } from '../stores/resumeStore';
import MarkdownRenderer from './MarkdownRenderer';

type CollectionSection =
  | 'work'
  | 'education'
  | 'projects'
  | 'awards'
  | 'languages'
  | 'interests';

export type InlineFieldTarget =
  | { section: 'basics'; field: string }
  | { section: 'skills'; field: 'skills_text' }
  | { section: CollectionSection; index: number; field: string }
  | { section: 'custom-section'; sectionId: string; field: 'title' }
  | { section: 'custom-item'; sectionId: string; index: number; field: string };

interface Props {
  value: string;
  target: InlineFieldTarget;
  enabled?: boolean;
  markdown?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  placeholder?: string;
}

/**
 * A small contentEditable bridge used inside every resume template.
 * It only writes to the store on blur, so typing never causes React to
 * replace the current DOM selection/caret.
 */
export default function InlineResumeField({
  value,
  target,
  enabled = false,
  markdown = false,
  className,
  style,
  children,
  placeholder = '点击编辑',
}: Props) {
  const elementRef = useRef<HTMLElement>(null);
  const initialHtmlRef = useRef('');
  const cancelledRef = useRef(false);

  if (!enabled) {
    if (markdown) return <MarkdownRenderer content={value} className={className} />;
    return <span className={className} style={style}>{children ?? value}</span>;
  }

  const commit = (nextValue: string) => {
    if (nextValue === value) return;
    commitInlineValue(target, nextValue);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelledRef.current = true;
      if (elementRef.current) elementRef.current.innerHTML = initialHtmlRef.current;
      elementRef.current?.blur();
      return;
    }

    if (!markdown && event.key === 'Enter') {
      event.preventDefault();
      elementRef.current?.blur();
      return;
    }

    if (markdown && event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      elementRef.current?.blur();
    }
  };

  const editableProps = {
    ref: (node: HTMLElement | null) => { elementRef.current = node; },
    contentEditable: true,
    suppressContentEditableWarning: true,
    spellCheck: false,
    autoCorrect: 'off',
    autoCapitalize: 'off',
    role: 'textbox',
    tabIndex: 0,
    title: markdown ? '点击直接编辑，Ctrl/⌘ + Enter 保存' : '点击直接编辑，Enter 保存',
    'data-inline-resume-field': 'true',
    'data-inline-empty': value ? 'false' : 'true',
    onMouseDown: (event: React.MouseEvent) => event.stopPropagation(),
    onClick: (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
    },
    onFocus: () => {
      cancelledRef.current = false;
      initialHtmlRef.current = elementRef.current?.innerHTML ?? '';
    },
    onKeyDown: handleKeyDown,
    onBlur: () => {
      const element = elementRef.current;
      if (!element) return;
      if (cancelledRef.current) {
        cancelledRef.current = false;
        return;
      }
      const nextValue = markdown
        ? htmlToMarkdown(element)
        : normalizeInlineText(element.innerText);
      commit(nextValue);
    },
  };

  if (markdown) {
    return (
      <div {...editableProps} className={`inline-resume-field inline-resume-field--markdown ${className ?? ''}`.trim()} style={style}>
        {value ? <MarkdownRenderer content={value} /> : <span className="inline-resume-field__placeholder">{placeholder}</span>}
      </div>
    );
  }

  return (
    <span {...editableProps} className={`inline-resume-field ${className ?? ''}`.trim()} style={style}>
      {(children ?? value) || <span className="inline-resume-field__placeholder">{placeholder}</span>}
    </span>
  );
}

function normalizeInlineText(value: string): string {
  return value.replace(/\u00a0/g, ' ').replace(/[\r\n]+/g, ' ').trim();
}

function commitInlineValue(target: InlineFieldTarget, value: string) {
  const store = useResumeStore.getState();
  const resume = store.activeResume();
  if (!resume) return;

  if (target.section === 'basics') {
    if (target.field.startsWith('location.')) {
      const locationKey = target.field.slice('location.'.length);
      store.updateBasics({ location: { ...resume.basics.location, [locationKey]: value } });
    } else {
      store.updateBasics({ [target.field]: value } as Partial<Basics>);
    }
    return;
  }

  if (target.section === 'skills') {
    store.updateSkillsText(value);
    return;
  }

  if (target.section === 'custom-section') {
    store.updateCustomSectionTitle(target.sectionId, value);
    return;
  }

  if (target.section === 'custom-item') {
    const section = resume.custom_sections.find((item) => item.id === target.sectionId);
    const item = section?.items[target.index];
    if (!item) return;
    store.updateCustomSectionItem(target.sectionId, target.index, { ...item, [target.field]: value });
    return;
  }

  switch (target.section) {
    case 'work': {
      const item = resume.work[target.index];
      if (item) store.updateWork(target.index, { ...item, [target.field]: value });
      break;
    }
    case 'education': {
      const item = resume.education[target.index];
      if (item) store.updateEducation(target.index, { ...item, [target.field]: value });
      break;
    }
    case 'projects': {
      const item = resume.projects[target.index];
      if (item) store.updateProject(target.index, { ...item, [target.field]: value });
      break;
    }
    case 'awards': {
      const item = resume.awards[target.index];
      if (item) store.updateAward(target.index, { ...item, [target.field]: value });
      break;
    }
    case 'languages': {
      const item = resume.languages[target.index];
      if (item) store.updateLanguage(target.index, { ...item, [target.field]: value });
      break;
    }
    case 'interests': {
      const item = resume.interests[target.index];
      if (item) store.updateInterest(target.index, { ...item, [target.field]: value });
      break;
    }
  }
}

/** Convert the limited rich text emitted by MarkdownRenderer back to Markdown. */
function htmlToMarkdown(root: HTMLElement): string {
  const renderNode = (node: Node, listDepth = 0): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
    if (!(node instanceof HTMLElement)) return '';

    const content = Array.from(node.childNodes).map((child) => renderNode(child, listDepth)).join('');
    switch (node.tagName.toLowerCase()) {
      case 'br': return '\n';
      case 'strong':
      case 'b': return `**${content}**`;
      case 'em':
      case 'i': return `*${content}*`;
      case 'code': return `\`${content}\``;
      case 'a': return `[${content}](${node.getAttribute('href') ?? ''})`;
      case 'h1': return `# ${content}\n\n`;
      case 'h2': return `## ${content}\n\n`;
      case 'h3':
      case 'h4':
      case 'h5': return `### ${content}\n\n`;
      case 'blockquote': return content.split('\n').filter(Boolean).map((line) => `> ${line}`).join('\n') + '\n\n';
      case 'p': return `${content}\n\n`;
      case 'ul':
      case 'ol': return `${Array.from(node.children).map((child, index) => {
        const prefix = node.tagName.toLowerCase() === 'ol' ? `${index + 1}. ` : '- ';
        return `${'  '.repeat(listDepth)}${prefix}${renderNode(child, listDepth + 1).trim()}`;
      }).join('\n')}\n\n`;
      case 'li': return content;
      default: return content;
    }
  };

  return Array.from(root.childNodes)
    .map((node) => renderNode(node))
    .join('')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
