import { forwardRef } from 'react';
import { useResumeStore } from '../stores/resumeStore';
import { useThemeStore } from '../stores/themeStore';
import { getTemplate } from '../templates';

interface Props {
  onSectionClick?: (sectionKey: string) => void;
}

const ResumePreview = forwardRef<HTMLDivElement, Props>(({ onSectionClick }, ref) => {
  const resume = useResumeStore((s) =>
    s.resumes.find((r) => r.id === s.activeResumeId) ?? null,
  );
  const isDark = useThemeStore((s) => s.mode === 'dark');

  if (!resume) return null;

  const template = getTemplate(resume.template_id);
  const Template = template.component;

  return (
    <div
      ref={ref}
      id="resume-preview"
      className={isDark ? 'resume-preview-dark' : ''}
    >
      <Template resume={resume} onSectionClick={onSectionClick} />
    </div>
  );
});

ResumePreview.displayName = 'ResumePreview';

export default ResumePreview;
