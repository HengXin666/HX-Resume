import type { ResumeData, SectionKey } from '../types/resume';
import '../styles/resume-print.css';
import { getVisibleSections, isBuiltinSection, getPageSizeVars, buildHeadingStyle } from './useSectionRenderer';
import MarkdownRenderer from '../components/MarkdownRenderer';
import HeaderSection from '../components/HeaderSection';

interface Props {
  resume: ResumeData;
  onSectionClick?: (sectionKey: string) => void;
}

export default function ModernTemplate({ resume, onSectionClick }: Props) {
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

  const { heading: hStyle, underline: hUnderline } = buildHeadingStyle(style.heading_style, style.primary_color);

  const renderHeading = (text: string) => (
    <div>
      <h2 style={hStyle}>{text}</h2>
      {hUnderline && <div style={hUnderline} />}
    </div>
  );

  const sectionRenderers: Record<SectionKey, () => React.ReactNode> = {
    summary: () =>
      basics.summary ? (
        <div key="summary" className="resume-section--clickable" style={{ marginBottom: `${style.section_gap}px`, ...sectionClickStyle }} onClick={handleClick('basics')}>
          {renderHeading('个人简介')}
          <MarkdownRenderer content={basics.summary} />
        </div>
      ) : null,

    work: () =>
      work.length > 0 ? (
        <div key="work" className="resume-section--clickable" style={{ marginBottom: `${style.section_gap}px`, ...sectionClickStyle }} onClick={handleClick('work')}>
          {renderHeading('工作经历')}
          {work.map((w, i) => (
            <div key={i} className="resume-item" data-section="work" data-item-index={i} style={{ marginTop: '10px' }}>
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
                  <div className="resume-item-header">
                    <span style={{ fontWeight: 600, fontSize: '15px' }}>{w.company}</span>
                    <span className="resume-item-date">{w.start_date} — {w.end_date || '至今'}</span>
                  </div>
                  {(w.department || w.position) && (
                    <div style={{ color: 'var(--resume-sub)', fontSize: '13px', marginTop: '2px' }}>
                      {w.department}{w.department && w.position && ' '}{w.position}
                    </div>
                  )}
                </div>
              </div>
              {w.description && (
                <div style={{ marginTop: '4px' }}>
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
          {renderHeading('项目经验')}
          {projects.map((p, i) => (
            <div key={i} className="resume-item" data-section="projects" data-item-index={i} style={{ marginTop: '10px' }}>
              <div className="resume-item-header">
                <span style={{ fontWeight: 600, fontSize: '15px' }}>{p.name}</span>
                <span className="resume-item-date">
                  {p.start_date}{p.end_date ? ` — ${p.end_date}` : ''}
                </span>
              </div>
              {(p.keywords.length > 0 || p.url) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px', marginBottom: '4px', fontSize: '12px', color: 'var(--resume-sub)' }}>
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
          {renderHeading('教育背景')}
          {education.map((e, i) => (
            <div key={i} className="resume-item" data-section="education" data-item-index={i} style={{ marginTop: '10px' }}>
              <div className="resume-item-header">
                <div>
                  <span style={{ fontWeight: 600 }}>{e.institution}</span>
                  {e.area && <span style={{ color: 'var(--resume-muted)' }}> — {e.area} · {e.study_type}</span>}
                </div>
                <span className="resume-item-date">{e.start_date} — {e.end_date || '至今'}</span>
              </div>
              {e.description && (
                <div style={{ marginTop: '4px' }}>
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
          {renderHeading('专业技能')}
          <MarkdownRenderer content={skills_text} />
        </div>
      ) : null,

    awards: () =>
      awards.length > 0 ? (
        <div key="awards" className="resume-section--clickable" style={{ marginBottom: `${style.section_gap}px`, ...sectionClickStyle }} onClick={handleClick('awards')}>
          {renderHeading('荣誉奖项')}
          {awards.map((a, i) => (
            <div key={i} className="resume-item" data-section="awards" data-item-index={i} style={{ marginTop: '8px' }}>
              <div className="resume-item-header">
                <div>
                  <span style={{ fontWeight: 600 }}>{a.title}</span>
                  {a.awarder && <span style={{ color: 'var(--resume-muted)' }}> · {a.awarder}</span>}
                </div>
                {a.date && <span className="resume-item-date">{a.date}</span>}
              </div>
              {a.summary && <div style={{ color: 'var(--resume-muted)', fontSize: '13px', marginTop: '2px' }}><MarkdownRenderer content={a.summary} /></div>}
            </div>
          ))}
        </div>
      ) : null,

    languages: () =>
      languages.length > 0 ? (
        <div key="languages" className="resume-section--clickable" style={{ marginBottom: `${style.section_gap}px`, ...sectionClickStyle }} onClick={handleClick('languages')}>
          {renderHeading('语言能力')}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {languages.map((lang, i) => (
              <span key={i} style={{ fontSize: '13px' }}>
                <strong>{lang.language}</strong>
                {lang.fluency && <span style={{ color: 'var(--resume-dim)', marginLeft: '4px' }}>({lang.fluency})</span>}
              </span>
            ))}
          </div>
        </div>
      ) : null,

    interests: () =>
      interests.length > 0 ? (
        <div key="interests" className="resume-section--clickable" style={{ marginBottom: `${style.section_gap}px`, ...sectionClickStyle }} onClick={handleClick('interests')}>
          {renderHeading('兴趣爱好')}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
            {interests.flatMap((item) => item.keywords.length > 0 ? item.keywords : [item.name]).map((k, i) => (
              <span key={i} style={{ fontSize: '12px', padding: '2px 10px', background: `${style.primary_color}15`, color: style.primary_color, borderRadius: '3px', border: `1px solid ${style.primary_color}30` }}>
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
          <div key={i} className="resume-item" style={{ marginTop: '10px' }}>
            <div className="resume-item-header">
              <div>
                <span style={{ fontWeight: 600, fontSize: '15px' }}>{item.title}</span>
                {item.subtitle && <span style={{ color: 'var(--resume-muted)' }}> · {item.subtitle}</span>}
              </div>
              {item.date && <span className="resume-item-date">{item.date}</span>}
            </div>
            {item.description && <div style={{ color: 'var(--resume-muted)', marginTop: '2px' }}><MarkdownRenderer content={item.description} /></div>}
            {item.highlights.length > 0 && (
              <ul className="resume-highlights">
                {item.highlights.map((h, j) => <li key={j}><MarkdownRenderer content={h} /></li>)}
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

      {/* Main content — vertical flow */}
      {visibleSections.map((key) =>
        isBuiltinSection(key)
          ? sectionRenderers[key]()
          : renderCustomSection(key)
      )}
    </div>
  );
}
