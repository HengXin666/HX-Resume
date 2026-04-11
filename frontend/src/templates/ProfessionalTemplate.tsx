import type { ResumeData, SectionKey } from '../types/resume';
import '../styles/resume-print.css';
import { getVisibleSections, isBuiltinSection, getPageSizeVars, buildHeadingStyle } from './useSectionRenderer';
import MarkdownRenderer from '../components/MarkdownRenderer';

interface Props {
  resume: ResumeData;
  onSectionClick?: (sectionKey: string) => void;
}

export default function ProfessionalTemplate({ resume, onSectionClick }: Props) {
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
  const headingStyle: React.CSSProperties = {
    ...baseHeading,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const renderHeading = (text: string) => (
    <div>
      <h2 style={headingStyle}>{text}</h2>
      {baseUnderline && <div style={baseUnderline} />}
    </div>
  );

  /** Timeline dot style */
  const dotStyle: React.CSSProperties = {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: style.primary_color,
    border: `2px solid ${style.primary_color}`,
    flexShrink: 0,
    marginTop: '6px',
  };

  const timelineItem: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    marginBottom: '14px',
    position: 'relative',
  };

  const timelineLine: React.CSSProperties = {
    position: 'absolute',
    left: '3px',
    top: '16px',
    bottom: '-14px',
    width: '2px',
    background: `${style.primary_color}30`,
  };

  const sectionRenderers: Record<SectionKey, () => React.ReactNode> = {
    summary: () =>
      basics.summary ? (
        <div
          key="summary"
          className="resume-section--clickable"
          style={{ marginBottom: `${style.section_gap}px`, ...sectionClickStyle }}
          onClick={handleClick('basics')}
        >
          {renderHeading('个人简介')}
          <div style={{ padding: '10px 14px', background: `${style.primary_color}08`, borderLeft: `3px solid ${style.primary_color}`, borderRadius: '0 4px 4px 0' }}>
            <MarkdownRenderer content={basics.summary} className="resume-summary" />
          </div>
        </div>
      ) : null,

    work: () =>
      work.length > 0 ? (
        <div
          key="work"
          className="resume-section--clickable"
          style={{ marginBottom: `${style.section_gap}px`, ...sectionClickStyle }}
          onClick={handleClick('work')}
        >
          {renderHeading('工作经历')}
          {work.map((w, i) => (
            <div key={i} data-section="work" data-item-index={i} style={timelineItem}>
              <div style={{ position: 'relative' }}>
                <div style={dotStyle} />
                {i < work.length - 1 && <div style={timelineLine} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  {w.logo && <img src={w.logo} alt="" style={{
                    width: '40px', height: '40px',
                    borderRadius: `${style.logo_border_radius ?? 6}px`,
                    border: (style.logo_border ?? true) ? '1px solid #e5e5e5' : 'none',
                    objectFit: 'contain', flexShrink: 0,
                  }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontWeight: 700, fontSize: '15px' }}>{w.company}</span>
                      <span style={{ fontSize: '12px', color: 'var(--resume-dim)', fontWeight: 500 }}>
                        {w.start_date} — {w.end_date || '至今'}
                      </span>
                    </div>
                    {(w.department || w.position) && (
                      <div style={{ fontSize: '13px', color: style.primary_color, fontWeight: 500, marginTop: '2px' }}>
                        {w.department}{w.department && w.position && ' '}{w.position}
                      </div>
                    )}
                  </div>
                </div>
                {w.description && (
                  <div style={{ marginTop: '4px', color: 'var(--resume-body)' }}>
                    <MarkdownRenderer content={w.description} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : null,

    projects: () =>
      projects.length > 0 ? (
        <div
          key="projects"
          className="resume-section--clickable"
          style={{ marginBottom: `${style.section_gap}px`, ...sectionClickStyle }}
          onClick={handleClick('projects')}
        >
          {renderHeading('项目经验')}
          {projects.map((p, i) => (
            <div key={i} data-section="projects" data-item-index={i} style={timelineItem}>
              <div style={{ position: 'relative' }}>
                <div style={dotStyle} />
                {i < projects.length - 1 && <div style={timelineLine} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 700, fontSize: '15px' }}>{p.name}</span>
                  <span style={{ fontSize: '12px', color: 'var(--resume-dim)' }}>
                    {p.start_date}{p.end_date ? ` — ${p.end_date}` : ''}
                  </span>
                </div>
                {(p.keywords.length > 0 || p.url) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px', fontSize: '12px', color: 'var(--resume-sub)' }}>
                    <span>{p.keywords.join(' / ')}</span>
                    {p.url && (
                      <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: 'var(--resume-link)', display: 'inline-flex', alignItems: 'center', gap: '3px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                        {p.url.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                )}
                {p.description && (
                  <div style={{ marginTop: '4px', color: 'var(--resume-body)' }}>
                    <MarkdownRenderer content={p.description} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : null,

    education: () =>
      education.length > 0 ? (
        <div
          key="education"
          className="resume-section--clickable"
          style={{ marginBottom: `${style.section_gap}px`, ...sectionClickStyle }}
          onClick={handleClick('education')}
        >
          {renderHeading('教育背景')}
          {education.map((e, i) => (
            <div key={i} data-section="education" data-item-index={i} style={timelineItem}>
              <div style={{ position: 'relative' }}>
                <div style={dotStyle} />
                {i < education.length - 1 && <div style={timelineLine} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div>
                    <span style={{ fontWeight: 700 }}>{e.institution}</span>
                    {e.area && <span style={{ color: 'var(--resume-muted)', marginLeft: '8px' }}>{e.area}{e.study_type && ` · ${e.study_type}`}</span>}
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--resume-dim)' }}>
                    {e.start_date} — {e.end_date || '至今'}
                  </span>
                </div>
                {e.description && (
                  <div style={{ marginTop: '4px' }}>
                    <MarkdownRenderer content={e.description} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : null,

    skills: () =>
      skills_text ? (
        <div
          key="skills"
          className="resume-section--clickable"
          style={{ marginBottom: `${style.section_gap}px`, ...sectionClickStyle }}
          onClick={handleClick('skills')}
        >
          {renderHeading('专业技能')}
          <MarkdownRenderer content={skills_text} />
        </div>
      ) : null,

    awards: () =>
      awards.length > 0 ? (
        <div
          key="awards"
          className="resume-section--clickable"
          style={{ marginBottom: `${style.section_gap}px`, ...sectionClickStyle }}
          onClick={handleClick('awards')}
        >
          {renderHeading('荣誉奖项')}
          {awards.map((a, i) => (
            <div key={i} data-section="awards" data-item-index={i} className="resume-item">
              <div className="resume-item-header">
                <div>
                  <span style={{ fontWeight: 600 }}>{a.title}</span>
                  {a.awarder && <span style={{ color: 'var(--resume-muted)', marginLeft: '8px' }}>{a.awarder}</span>}
                </div>
                {a.date && <span className="resume-item-date">{a.date}</span>}
              </div>
              {a.summary && <div className="resume-item-subtitle"><MarkdownRenderer content={a.summary} /></div>}
            </div>
          ))}
        </div>
      ) : null,

    languages: () =>
      languages.length > 0 ? (
        <div
          key="languages"
          className="resume-section--clickable"
          style={{ marginBottom: `${style.section_gap}px`, ...sectionClickStyle }}
          onClick={handleClick('languages')}
        >
          {renderHeading('语言能力')}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {languages.map((lang, i) => (
              <span key={i} style={{ fontSize: '13px', padding: '4px 12px', background: `${style.primary_color}10`, borderRadius: '4px', border: `1px solid ${style.primary_color}25` }}>
                <strong>{lang.language}</strong>
                {lang.fluency && <span style={{ color: 'var(--resume-dim)', marginLeft: '4px' }}>({lang.fluency})</span>}
              </span>
            ))}
          </div>
        </div>
      ) : null,

    interests: () =>
      interests.length > 0 ? (
        <div
          key="interests"
          className="resume-section--clickable"
          style={{ marginBottom: `${style.section_gap}px`, ...sectionClickStyle }}
          onClick={handleClick('interests')}
        >
          {renderHeading('兴趣爱好')}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {interests.flatMap((item) => item.keywords.length > 0 ? item.keywords : [item.name]).map((k, i) => (
              <span key={i} className="resume-skill-tag" style={{ background: `${style.primary_color}12`, color: style.primary_color, border: `1px solid ${style.primary_color}25` }}>
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
      <div key={key} className="resume-section--clickable" style={{ marginBottom: `${style.section_gap}px`, ...sectionClickStyle }} onClick={handleClick(key)}>
        {renderHeading(cs.title)}
        {cs.items.map((item, i) => (
          <div key={i} className="resume-item">
            <div className="resume-item-header">
              <div>
                <span className="resume-item-title">{item.title}</span>
                {item.subtitle && <span style={{ color: 'var(--resume-muted)', marginLeft: '8px' }}>{item.subtitle}</span>}
              </div>
              {item.date && <span className="resume-item-date">{item.date}</span>}
            </div>
            {item.description && <div className="resume-item-subtitle"><MarkdownRenderer content={item.description} /></div>}
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
      {/* Header — name left, contact right */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '6px',
          paddingBottom: '10px',
          borderBottom: `3px solid ${style.primary_color}`,
          ...sectionClickStyle,
        }}
        className="resume-section--clickable"
        onClick={handleClick('basics')}
      >
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: style.primary_color, margin: 0, letterSpacing: '1px' }}>
            {basics.name || '您的姓名'}
          </h1>
          {basics.label && (
            <div style={{ fontSize: '14px', color: 'var(--resume-muted)', marginTop: '2px', fontWeight: 500 }}>
              {basics.label}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--resume-dim)', lineHeight: 1.8 }}>
          {basics.phone && <div>{basics.phone}</div>}
          {basics.email && <div>{basics.email}</div>}
          {basics.url && <div>{basics.url.replace(/^https?:\/\//, '')}</div>}
          {basics.location?.city && <div>{basics.location.city}</div>}
        </div>
      </div>

      {visibleSections.map((key) =>
        isBuiltinSection(key)
          ? sectionRenderers[key]()
          : renderCustomSection(key)
      )}
    </div>
  );
}
