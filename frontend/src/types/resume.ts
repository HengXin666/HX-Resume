export interface Basics {
  name: string;
  label: string;
  email: string;
  phone: string;
  url: string;
  summary: string;
  location: Record<string, string>;
  profiles: SocialProfile[];
  avatar: string;
}

export interface SocialProfile {
  network: string;
  username: string;
  url: string;
}

export interface EducationItem {
  institution: string;
  area: string;
  study_type: string;
  start_date: string;
  end_date: string;
  score: string;
  courses: string[];
  /** Markdown 详情描述 */
  description: string;
}

export interface WorkItem {
  company: string;
  /** 部门名称 */
  department: string;
  position: string;
  website: string;
  start_date: string;
  end_date: string;
  /** Markdown 工作详情（用户自由编写） */
  description: string;
  /** 公司 Logo（Base64 data URL） */
  logo: string;
}

export interface SkillItem {
  /** Markdown 技能描述（用户自由编写） */
  content: string;
}

export interface ProjectItem {
  name: string;
  description: string;
  url: string;
  highlights: string[];
  keywords: string[];
  start_date: string;
  end_date: string;
}

export interface AwardItem {
  title: string;
  date: string;
  awarder: string;
  summary: string;
}

export interface LanguageItem {
  language: string;
  fluency: string;
}

export interface InterestItem {
  name: string;
  keywords: string[];
}

export interface CustomSectionItem {
  title: string;
  subtitle: string;
  date: string;
  description: string;
  highlights: string[];
}

export interface CustomSection {
  id: string;
  title: string;
  items: CustomSectionItem[];
}

/** Structured heading decoration config */
export interface HeadingStyle {
  /** 标题字体 (留空 = 跟随正文) */
  font_family: string;
  /** 标题字号 px */
  font_size: number;
  /** 标题颜色 (留空 = 使用主色) */
  color: string;
  /** 是否显示左侧竖线 */
  left_bar: boolean;
  /** 左侧竖线颜色 (留空 = 使用主色) */
  left_bar_color: string;
  /** 下划线样式: 'none' | 'solid' | 'dashed' | 'dotted' | 'double' */
  underline: 'none' | 'solid' | 'dashed' | 'dotted' | 'double';
  /** 下划线颜色 (留空 = 使用主色) */
  underline_color: string;
  /** 标题背景色 (留空 = 无背景) */
  background: string;
}

export const DEFAULT_HEADING_STYLE: HeadingStyle = {
  font_family: '',
  font_size: 18,
  color: '',
  left_bar: false,
  left_bar_color: '',
  underline: 'solid',
  underline_color: '',
  background: '',
};

export interface StyleConfig {
  font_family: string;
  font_size: number;
  line_height: number;
  margin_top: number;
  margin_bottom: number;
  margin_left: number;
  margin_right: number;
  section_gap: number;
  primary_color: string;
  text_color: string;
  background_color: string;
  heading_size: number;
  page_size: string;
  /** @deprecated 使用 heading_style 代替 */
  custom_css: string;
  /** 结构化标题样式 */
  heading_style: HeadingStyle;
  /** Logo 是否显示边框 */
  logo_border: boolean;
  /** Logo 边框圆角 px */
  logo_border_radius: number;
}

/** A snapshot of a resume at a point in time */
export interface ResumeVersion {
  id: string;
  timestamp: number;
  label: string;
  data: ResumeData;
}

/** Controls which sections are visible and their order */
export interface SectionVisibility {
  summary: boolean;
  work: boolean;
  education: boolean;
  skills: boolean;
  projects: boolean;
  awards: boolean;
  languages: boolean;
  interests: boolean;
}

export const DEFAULT_SECTION_VISIBILITY: SectionVisibility = {
  summary: true,
  work: true,
  education: true,
  skills: true,
  projects: true,
  awards: false,
  languages: false,
  interests: false,
};

/** Section ordering: the display order of sections */
export type SectionKey = keyof SectionVisibility;

export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  'summary',
  'work',
  'projects',
  'education',
  'skills',
  'awards',
  'languages',
  'interests',
];

export interface ResumeData {
  id: string;
  title: string;
  slug: string;
  template_id: string;
  basics: Basics;
  education: EducationItem[];
  work: WorkItem[];
  skills_text: string;
  projects: ProjectItem[];
  awards: AwardItem[];
  languages: LanguageItem[];
  interests: InterestItem[];
  custom_sections: CustomSection[];
  style_config: StyleConfig;
  section_visibility: SectionVisibility;
  section_order: SectionKey[];
  source?: string;
  created_at: string;
  updated_at: string;
  sort_order: number;
  versions: ResumeVersion[];
}

export type TemplateId = 'classic' | 'modern' | 'minimal' | 'professional' | 'creative' | 'cyberpunk';

export const DEFAULT_STYLE_CONFIG: StyleConfig = {
  font_family: "'Noto Sans SC', 'Inter', sans-serif",
  font_size: 14,
  line_height: 1.6,
  margin_top: 20,
  margin_bottom: 20,
  margin_left: 24,
  margin_right: 24,
  section_gap: 16,
  primary_color: '#00f0ff',
  text_color: '#1a1a1a',
  background_color: '#ffffff',
  heading_size: 18,
  page_size: 'A4',
  custom_css: '',
  heading_style: { ...DEFAULT_HEADING_STYLE },
  logo_border: true,
  logo_border_radius: 6,
};

export const DEFAULT_BASICS: Basics = {
  name: '',
  label: '',
  email: '',
  phone: '',
  url: '',
  summary: '',
  location: {},
  profiles: [],
  avatar: '',
};

export function createEmptyResume(): ResumeData {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: '未命名简历',
    slug: `resume-${Date.now()}`,
    template_id: 'classic',
    basics: { ...DEFAULT_BASICS },
    education: [],
    work: [],
    skills_text: '',
    projects: [],
    awards: [],
    languages: [],
    interests: [],
    custom_sections: [],
    style_config: { ...DEFAULT_STYLE_CONFIG },
    section_visibility: { ...DEFAULT_SECTION_VISIBILITY },
    section_order: [...DEFAULT_SECTION_ORDER],
    created_at: now,
    updated_at: now,
    sort_order: 0,
    versions: [],
  };
}
