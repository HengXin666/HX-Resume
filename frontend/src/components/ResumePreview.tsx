import { forwardRef } from 'react';
import { useResumeStore } from '../stores/resumeStore';
import { useThemeStore } from '../stores/themeStore';
import { getTemplate } from '../templates';
import PagedPreview from './PagedPreview';

/** Page heights in mm */
const PAGE_HEIGHTS: Record<string, number> = {
  A4: 297,
  Letter: 279,
};

interface Props {
  onSectionClick?: (sectionKey: string) => void;
  inlineEditing?: boolean;
}

const ResumePreview = forwardRef<HTMLDivElement, Props>(({ onSectionClick, inlineEditing = false }, ref) => {
  const resume = useResumeStore((s) =>
    s.resumes.find((r) => r.id === s.activeResumeId) ?? null,
  );
  const isDark = useThemeStore((s) => s.mode === 'dark');

  if (!resume) return null;

  const template = getTemplate(resume.template_id);
  const Template = template.component;
  const pageSize = resume.style_config.page_size ?? 'A4';
  const pageWidthMM = pageSize === 'Letter' ? 216 : 210;
  const pageHeightMM = PAGE_HEIGHTS[pageSize] ?? 297;

  return (
    <div
      id="resume-preview"
      className={`${isDark ? 'resume-preview-dark' : ''} ${inlineEditing ? 'resume-preview--editing' : ''}`.trim()}
    >
      <PagedPreview
        ref={ref}
        pageWidthMM={pageWidthMM}
        pageHeightMM={pageHeightMM}
        editing={inlineEditing}
        staticChildren={<Template resume={resume} />}
      >
        <Template resume={resume} onSectionClick={onSectionClick} inlineEditing={inlineEditing} />
      </PagedPreview>
    </div>
  );
});

ResumePreview.displayName = 'ResumePreview';

export default ResumePreview;
