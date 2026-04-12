import type { ResumeData, SectionKey } from '../types/resume';
import '../styles/resume-print.css';
import { getVisibleSections, isBuiltinSection, getPageSizeVars, buildHeadingStyle } from './useSectionRenderer';
import MarkdownRenderer from '../components/MarkdownRenderer';
import HeaderSection from '../components/HeaderSection';

interface Props {
  resume: ResumeData;
  onSectionClick?: (sectionKey: string) => void;
}

export default function MinimalTemplate({ resume, onSectionClick }: Props) {
  const { basics, education, work, skills_text, projects, awards, languages, interests, style_config: style } = resume;
  const visibleSections = getVisibleSections(resume);

  const sectionClickStyle: React.CSSProperties = onSectionClick
    ? { cursor: 'pointer', borderRadius: '4px', transition: 'background 0.15s' }
    : {};

  const handleClick = (key: string) => (e: React.MouseEvent) => {
    if (!onSectionClick) return;
    e.stopPropagation();
    const target = e.target as HTMLElement;
    const itemEl = target.closest('[data-item-index]');
    if (itemEl) {
      const itemIndex = itemEl.getAttribute('data-item-index');
      const section = itemEl.getAttribute('data-section') ?? key;
      onSectionClick(`${section}:${itemIndex}`);
    } else {
      onSectionClick(key);
    }
  };

  const { heading: baseHeading, underline: baseUnderline } = buildHeadingStyle(style.heading_style, style.primary_color);
  const sectionHeading: React.CSSProperties = {
    ...baseHeading,
    fontSize: '12px',
    letterSpacing: '3px',
    textTransform: 'uppercase',
  };

  const renderHeading = (text: string) => (
    <div>
      <h2 style={sectionHeading}>{text}</h2>
      {baseUnderline && <div style={baseUnderline} />}
    </div>
  );

  const sectionRenderers: Record<SectionKey, () => React.ReactNode> = {
    summary: () =>
      basics.summary ? (
        <div key="summary" className="resume-section--clickable" style={{ marginBottom: `${style.section_gap}px`, textAlign: 'center', maxWidth: '500px', margin: '0 auto 20px', ...sectionClickStyle }} onClick={handleClick('basics')}>
          <MarkdownRenderer content={basics.summary} className="resume-summary" />
        </div>
      ) : null,

    work: () =>
      work.length > 0 ? (
        <div key="work" className="resume-section--clickable" style={{ marginBottom: `${style.section_gap}px`, ...sectionClickStyle }} onClick={handleClick('work')}>
          {renderHeading('Experience')}
          {work.map((w, i) => (
            <div key={i} data-section="work" data-item-index={i} style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {w.logo && (
                  <img src={w.logo} alt="" style={{
                    width: '40px', height: '40px',
                    borderRadius: `${style.logo_border_radius ?? 6}px`,
                    border: (style.logo_border ?? true) ? '1px solid #e5e5e5' : 'none',
                    objectFit: 'contain', flexShrink: 0,
                  }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>{w.company}</span>
                    <span style={{ fontSize: '12px', color: 'var(--resume-dim)' }}>
                      {w.start_date} ~ {w.end_date || '至今'}
                    </span>
                  </div>
                  {(w.department || w.position) && (
                    <div style={{ color: 'var(--resume-sub)', fontSize: '12px', marginTop: '2px' }}>
                      {w.department}{w.department && w.position && ' '}{w.position}
                    </div>
                  )}
                </div>
              </div>
              {w.description && (
                <div style={{ marginTop: '4px', color: 'var(--resume-highlight)' }}>
                  <MarkdownRenderer content={w.description} />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null,

    projects: () =>
      projects.length > 0 ? (
        <div key="projects" className="resume-section--clickable" style={{ marginBottom: `${style.section_gap}px`, ...sectionClickStyle }} onClick={handleClick('projects')}>
          {renderHeading('Projects')}
          {projects.map((p, i) => (
            <div key={i} data-section="projects" data-item-index={i} style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>{p.name}</span>
                <span style={{ fontSize: '12px', color: 'var(--resume-dim)' }}>
                  {p.start_date}{p.end_date ? ` ~ ${p.end_date}` : ''}
                </span>
              </div>
              {(p.keywords.length > 0 || p.url) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px', marginBottom: '4px', fontSize: '11px', color: 'var(--resume-sub)' }}>
                  <span>{p.keywords.length > 0 ? p.keywords.join(' / ') : ''}</span>
                  {p.url && (
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="resume-project-link" onClick={(e) => e.stopPropagation()}>
                      <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
                      {p.url.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </div>
              )}
              {p.description && <div style={{ color: 'var(--resume-muted)', marginTop: '4px' }}><MarkdownRenderer content={p.description} /></div>}
            </div>
          ))}
        </div>
      ) : null,

    education: () =>
      education.length > 0 ? (
        <div key="education" className="resume-section--clickable" style={{ marginBottom: `${style.section_gap}px`, ...sectionClickStyle }} onClick={handleClick('education')}>
          {renderHeading('Education')}
          {education.map((e, i) => (
            <div key={i} data-section="education" data-item-index={i} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{e.institution}</span>
                  {e.area && <span style={{ color: 'var(--resume-dim)' }}>{' · '}{e.area}</span>}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--resume-dim)' }}>
                  {e.start_date} ~ {e.end_date || '至今'}
                </span>
              </div>
              {e.description && (
                <div style={{ marginTop: '4px', color: 'var(--resume-muted)' }}>
                  <MarkdownRenderer content={e.description} />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null,

    skills: () =>
      skills_text ? (
        <div key="skills" className="resume-section--clickable" style={{ marginBottom: `${style.section_gap}px`, ...sectionClickStyle }} onClick={handleClick('skills')}>
          {renderHeading('Skills')}
          <MarkdownRenderer content={skills_text} />
        </div>
      ) : null,

    awards: () =>
      awards.length > 0 ? (
        <div key="awards" className="resume-section--clickable" style={{ marginBottom: `${style.section_gap}px`, ...sectionClickStyle }} onClick={handleClick('awards')}>
          {renderHeading('Awards')}
          {awards.map((a, i) => (
            <div key={i} data-section="awards" data-item-index={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div>
                <span style={{ fontWeight: 600 }}>{a.title}</span>
                {a.awarder && <span style={{ color: 'var(--resume-dim)' }}>{' · '}{a.awarder}</span>}
              </div>
              {a.date && <span style={{ fontSize: '12px', color: 'var(--resume-dim)' }}>{a.date}</span>}
            </div>
          ))}
        </div>
      ) : null,

    languages: () =>
      languages.length > 0 ? (
        <div key="languages" className="resume-section--clickable" style={{ marginBottom: `${style.section_gap}px`, ...sectionClickStyle }} onClick={handleClick('languages')}>
          {renderHeading('Languages')}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {languages.map((lang, i) => (
              <span key={i} style={{ fontSize: '13px' }}>
                {lang.language}
                {lang.fluency && <span style={{ color: 'var(--resume-dim)', marginLeft: '4px' }}>({lang.fluency})</span>}
              </span>
            ))}
          </div>
        </div>
      ) : null,

    interests: () =>
      interests.length > 0 ? (
        <div key="interests" className="resume-section--clickable" style={{ marginBottom: `${style.section_gap}px`, ...sectionClickStyle }} onClick={handleClick('interests')}>
          {renderHeading('Interests')}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {interests.flatMap((item) => item.keywords.length > 0 ? item.keywords : [item.name]).map((k, i) => (
              <span key={i} style={{ fontSize: '12px', color: 'var(--resume-muted)', background: 'var(--resume-tag-bg)', padding: '2px 10px', borderRadius: '10px' }}>
                {k}
              </span>
            ))}
          </div>
        </div>
      ) : null,
  };

  const renderCustomSection = (key: string) => {
    const sectionId = key.replace('custom_', '');
    const cs = resume.custom_sections.find((s) => s.id === sectionId);
    if (!cs || cs.items.length === 0) return null;
    return (
      <div key={key} style={{ marginBottom: `${style.section_gap}px` }}>
        {renderHeading(cs.title)}
        {cs.items.map((item, i) => (
          <div key={i} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontWeight: 600 }}>{item.title}</span>
                {item.subtitle && <span style={{ color: 'var(--resume-dim)' }}>{' · '}{item.subtitle}</span>}
              </div>
              {item.date && <span style={{ fontSize: '12px', color: 'var(--resume-dim)' }}>{item.date}</span>}
            </div>
            {item.description && <div style={{ color: 'var(--resume-muted)', marginTop: '2px' }}><MarkdownRenderer content={item.description} /></div>}
            {item.highlights.length > 0 && (
              <ul style={{ listStyle: 'none', padding: 0, margin: '4px 0 0' }}>
                {item.highlights.map((h, j) => (
                  <li key={j} style={{ color: 'var(--resume-highlight)', paddingLeft: '12px', position: 'relative', marginBottom: '2px' }}>
                    <span style={{ position: 'absolute', left: 0, color: 'var(--resume-divider)' }}>–</span>
                    <MarkdownRenderer content={h} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      className="resume-page"
      style={{
        ...getPageSizeVars(style.page_size),
        fontFamily: style.font_family,
        fontSize: `${style.font_size}px`,
        lineHeight: style.line_height,
        paddingTop: `${style.margin_top}mm`,
        paddingBottom: `${style.margin_bottom}mm`,
        paddingLeft: `${style.margin_left}mm`,
        paddingRight: `${style.margin_right}mm`,
      }}
    >
      {/* Header — using HeaderSection component */}
      <HeaderSection
        basics={basics}
        style_config={style}
        sectionClickStyle={sectionClickStyle}
        onClickBasics={handleClick('basics')}
      />

      {/* Ordered visible sections */}
      {visibleSections.map((key) =>
        isBuiltinSection(key)
          ? sectionRenderers[key]()
          : renderCustomSection(key)
      )}
    </div>
  );
}
