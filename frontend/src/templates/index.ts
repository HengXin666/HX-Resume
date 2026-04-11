import type { ComponentType } from 'react';
import type { ResumeData } from '../types/resume';
import ClassicTemplate from './ClassicTemplate';
import CreativeTemplate from './CreativeTemplate';
import MinimalTemplate from './MinimalTemplate';
import ModernTemplate from './ModernTemplate';
import ProfessionalTemplate from './ProfessionalTemplate';

export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  component: ComponentType<{ resume: ResumeData; onSectionClick?: (sectionKey: string) => void }>;
  thumbnail: string; // emoji placeholder
}

export const templates: TemplateInfo[] = [
  {
    id: 'classic',
    name: '经典',
    description: '传统单栏布局，清晰专业',
    component: ClassicTemplate,
    thumbnail: '📄',
  },
  {
    id: 'modern',
    name: '现代',
    description: '双栏布局，左侧彩色侧边栏',
    component: ModernTemplate,
    thumbnail: '🎨',
  },
  {
    id: 'minimal',
    name: '极简',
    description: '留白优雅，适合高级职位',
    component: MinimalTemplate,
    thumbnail: '✨',
  },
  {
    id: 'professional',
    name: '商务',
    description: '时间轴风格，稳重专业',
    component: ProfessionalTemplate,
    thumbnail: '💼',
  },
  {
    id: 'creative',
    name: '创意',
    description: '色块头部，装饰性标题线',
    component: CreativeTemplate,
    thumbnail: '🎯',
  },
];

export function getTemplate(id: string): TemplateInfo {
  return templates.find((t) => t.id === id) || templates[0];
}
