/**
 * HeaderSection — 简历基本信息区域，支持 6 种布局模板
 * 所有模板复用此组件，通过 basics.header_layout 决定展示风格
 *
 * 头像：用户可选左/右位置，可选比例 (1:1, 2:3, 3:4, 4:3)
 * 联系方式：SVG 图标 + 文字，邮箱可点击但不带蓝色/下划线
 * 分割线：由 basics.show_header_divider 控制
 */
import type { CSSProperties } from 'react';
import type { Basics, StyleConfig } from '../types/resume';
import { AVATAR_RATIOS } from '../types/resume';

/* ── SVG 联系图标 ─────────────────────────── */
const PhoneIcon = ({ color = 'currentColor', size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const EmailIcon = ({ color = 'currentColor', size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const LinkIcon = ({ color = 'currentColor', size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const LocationIcon = ({ color = 'currentColor', size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

/* ── 联系信息条目 ─────────────────────────── */
interface ContactItemProps {
  icon: React.ReactNode;
  text: string;
  href?: string;
  style?: CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
}

function ContactItem({ icon, text, href, style, onClick }: ContactItemProps) {
  const inner = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', ...style }}>
      {icon}
      <span>{text}</span>
    </span>
  );
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="header-contact-link"
        style={{ color: 'inherit', textDecoration: 'none', borderBottom: 'none', ...style }}
        onClick={onClick}
      >
        {inner}
      </a>
    );
  }
  return inner;
}

/* ── 头像渲染 — 根据用户选择的比例 ─────── */
function getAvatarRatioValue(ratioId: string | undefined): number {
  const found = AVATAR_RATIOS.find((r) => r.id === ratioId);
  return found ? found.value : 2 / 3;
}

function Avatar({ src, height, border, ratio }: {
  src: string;
  height: number;
  border?: string;
  /** 宽高比 (w/h)，如 1 表示正方形，2/3 表示身份证 */
  ratio: number;
}) {
  if (!src) return null;
  const w = Math.round(height * ratio);
  return (
    <img
      src={src}
      alt="avatar"
      style={{
        width: `${w}px`,
        height: `${height}px`,
        borderRadius: '4px',
        border: border ?? '1px solid #e0e0e0',
        objectFit: 'cover',
        flexShrink: 0,
        display: 'block',
      }}
    />
  );
}

/* ── 收集联系信息 ─────────────────────────── */
function useContactItems(basics: Basics, iconColor: string) {
  const items: { key: string; icon: React.ReactNode; text: string; href?: string }[] = [];
  if (basics.phone) {
    items.push({ key: 'phone', icon: <PhoneIcon color={iconColor} />, text: basics.phone });
  }
  if (basics.email) {
    items.push({ key: 'email', icon: <EmailIcon color={iconColor} />, text: basics.email, href: `mailto:${basics.email}` });
  }
  if (basics.url) {
    items.push({ key: 'url', icon: <LinkIcon color={iconColor} />, text: basics.url.replace(/^https?:\/\//, ''), href: basics.url });
  }
  if (basics.location?.city) {
    items.push({ key: 'city', icon: <LocationIcon color={iconColor} />, text: basics.location.city });
  }
  return items;
}

/* ── 可选分割线 ─────────────────────────── */
function Divider({ show, color, width }: { show: boolean; color: string; width?: string }) {
  if (!show) return null;
  return (
    <div style={{
      height: '1px',
      background: color,
      width: width ?? '100%',
      marginTop: '10px',
    }} />
  );
}

/* ══════════════════════════════════════
   主组件
   ══════════════════════════════════════ */
export interface HeaderSectionProps {
  basics: Basics;
  style_config: StyleConfig;
  sectionClickStyle?: CSSProperties;
  onClickBasics?: (e: React.MouseEvent) => void;
}

export default function HeaderSection({ basics, style_config: style, sectionClickStyle = {}, onClickBasics }: HeaderSectionProps) {
  const layout = basics.header_layout || 'classic-center';
  const pc = style.primary_color;

  const wrapperProps = {
    className: 'resume-section--clickable',
    style: sectionClickStyle,
    onClick: onClickBasics,
  };

  switch (layout) {
    case 'classic-center':
      return <LayoutClassicCenter basics={basics} pc={pc} style={style} {...wrapperProps} />;
    case 'left-right':
      return <LayoutLeftRight basics={basics} pc={pc} style={style} {...wrapperProps} />;
    case 'banner-gradient':
      return <LayoutBannerGradient basics={basics} pc={pc} style={style} {...wrapperProps} />;
    case 'sidebar-photo':
      return <LayoutSidebarPhoto basics={basics} pc={pc} style={style} {...wrapperProps} />;
    case 'compact-inline':
      return <LayoutCompactInline basics={basics} pc={pc} style={style} {...wrapperProps} />;
    case 'modern-card':
      return <LayoutModernCard basics={basics} pc={pc} style={style} {...wrapperProps} />;
    default:
      return <LayoutClassicCenter basics={basics} pc={pc} style={style} {...wrapperProps} />;
  }
}

/* ═══════════════════════════════════════
   Layout 共用 props
   ═══════════════════════════════════════ */
interface LayoutProps {
  basics: Basics;
  pc: string;
  style: StyleConfig;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

/* ═══════════════════════════════════════
   Layout 1: 经典居中
   无头像时：姓名+职位+联系方式 全部居中
   有头像时：头像在用户选的一侧，姓名+联系居中
   ═══════════════════════════════════════ */
function LayoutClassicCenter({ basics, pc, style, className, onClick }: LayoutProps) {
  const contacts = useContactItems(basics, pc);
  const showDivider = basics.show_header_divider !== false;
  const pos = basics.avatar_position || 'left';
  const ratio = getAvatarRatioValue(basics.avatar_ratio);
  const hasAvatar = !!basics.avatar;

  const avatarEl = hasAvatar ? (
    <Avatar src={basics.avatar} height={72} border={`1px solid ${pc}40`} ratio={ratio} />
  ) : null;

  return (
    <div className={className} onClick={onClick} style={{ marginBottom: `${style.section_gap}px` }}>
      {hasAvatar ? (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
          flexDirection: pos === 'right' ? 'row-reverse' : 'row',
        }}>
          {avatarEl}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h1 style={{ color: pc, marginBottom: '2px', fontSize: '24px' }}>
              {basics.name || '您的姓名'}
            </h1>
            {basics.label && (
              <div style={{ fontSize: '14px', color: 'var(--resume-muted)', marginBottom: '6px' }}>
                {basics.label}
              </div>
            )}
            <div
              className="resume-contact"
              style={{
                display: 'flex', justifyContent: 'center',
                flexWrap: 'wrap', gap: '4px 14px',
                fontSize: '12px', color: 'var(--resume-contact)',
              }}
            >
              {contacts.map((c) => (
                <ContactItem key={c.key} icon={c.icon} text={c.text} href={c.href} onClick={(e) => e.stopPropagation()} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ color: pc, marginBottom: '2px', fontSize: '24px' }}>
            {basics.name || '您的姓名'}
          </h1>
          {basics.label && (
            <div style={{ fontSize: '14px', color: 'var(--resume-muted)', marginBottom: '6px' }}>
              {basics.label}
            </div>
          )}
          <div
            className="resume-contact"
            style={{
              display: 'flex', justifyContent: 'center',
              flexWrap: 'wrap', gap: '4px 14px',
              fontSize: '12px', color: 'var(--resume-contact)',
            }}
          >
            {contacts.map((c) => (
              <ContactItem key={c.key} icon={c.icon} text={c.text} href={c.href} onClick={(e) => e.stopPropagation()} />
            ))}
          </div>
        </div>
      )}
      <Divider show={showDivider} color={`${pc}30`} />
    </div>
  );
}

/* ═══════════════════════════════════════
   Layout 2: 左右分栏
   左：头像+姓名+头衔  右：联系方式竖排
   底部主色粗线分隔（可选）
   ═══════════════════════════════════════ */
function LayoutLeftRight({ basics, pc, style, className, onClick }: LayoutProps) {
  const contacts = useContactItems(basics, pc);
  const showDivider = basics.show_header_divider !== false;
  const pos = basics.avatar_position || 'left';
  const ratio = getAvatarRatioValue(basics.avatar_ratio);

  const avatarEl = basics.avatar ? (
    <Avatar src={basics.avatar} height={64} border={`1px solid ${pc}40`} ratio={ratio} />
  ) : null;

  const nameBlock = (
    <div>
      <h1 style={{ fontSize: '28px', fontWeight: 800, color: pc, margin: 0, letterSpacing: '1px' }}>
        {basics.name || '您的姓名'}
      </h1>
      {basics.label && (
        <div style={{ fontSize: '14px', color: 'var(--resume-muted)', marginTop: '2px', fontWeight: 500 }}>
          {basics.label}
        </div>
      )}
    </div>
  );

  // 头像位于左侧：[avatar][name]...[contacts]
  // 头像位于右侧：[name]...[contacts][avatar]
  const leftPart = (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '14px',
      flexDirection: pos === 'right' ? 'row' : 'row',
    }}>
      {pos === 'left' && avatarEl}
      {nameBlock}
    </div>
  );

  return (
    <div className={className} onClick={onClick} style={{ marginBottom: '6px' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        paddingBottom: showDivider ? '10px' : '6px',
        borderBottom: showDivider ? `3px solid ${pc}` : 'none',
      }}>
        {leftPart}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '14px',
          flexDirection: pos === 'right' ? 'row' : 'row',
        }}>
          <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--resume-dim)', lineHeight: 1.9 }}>
            {contacts.map((c) => (
              <div key={c.key}>
                <ContactItem icon={c.icon} text={c.text} href={c.href} style={{ justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()} />
              </div>
            ))}
          </div>
          {pos === 'right' && avatarEl}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   Layout 3: 渐变横幅
   头像在用户选的一侧 + 信息，底部带主色渐变色条装饰
   ═══════════════════════════════════════ */
function LayoutBannerGradient({ basics, pc, style, className, onClick }: LayoutProps) {
  const contacts = useContactItems(basics, pc);
  const showDivider = basics.show_header_divider !== false;
  const pos = basics.avatar_position || 'left';
  const ratio = getAvatarRatioValue(basics.avatar_ratio);

  const avatarEl = basics.avatar ? (
    <Avatar src={basics.avatar} height={76} border={`1px solid ${pc}30`} ratio={ratio} />
  ) : null;

  return (
    <div className={className} onClick={onClick} style={{ marginBottom: `${style.section_gap}px` }}>
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '16px',
        flexDirection: pos === 'right' ? 'row-reverse' : 'row',
        padding: '14px 16px',
        background: `linear-gradient(135deg, ${pc}08, ${pc}04)`,
        borderLeft: pos === 'left' ? `4px solid ${pc}` : 'none',
        borderRight: pos === 'right' ? `4px solid ${pc}` : 'none',
        borderRadius: pos === 'left' ? '0 6px 6px 0' : '6px 0 0 6px',
      }}>
        {avatarEl}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, margin: 0, color: pc }}>
            {basics.name || '您的姓名'}
          </h1>
          {basics.label && (
            <div style={{ fontSize: '14px', color: 'var(--resume-muted)', marginTop: '3px', fontWeight: 500 }}>
              {basics.label}
            </div>
          )}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '4px 14px',
            marginTop: '8px', fontSize: '12px', color: 'var(--resume-dim)',
          }}>
            {contacts.map((c) => (
              <ContactItem key={c.key} icon={c.icon} text={c.text} href={c.href} onClick={(e) => e.stopPropagation()} />
            ))}
          </div>
        </div>
      </div>
      {showDivider && (
        <div style={{
          height: '2px',
          background: `linear-gradient(90deg, ${pc}, ${pc}40, transparent)`,
          marginTop: '6px',
        }} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   Layout 4: 照片侧栏
   头像在用户选的一侧 + 姓名/职位/联系信息
   ═══════════════════════════════════════ */
function LayoutSidebarPhoto({ basics, pc, style, className, onClick }: LayoutProps) {
  const contacts = useContactItems(basics, pc);
  const showDivider = basics.show_header_divider !== false;
  const pos = basics.avatar_position || 'left';
  const ratio = getAvatarRatioValue(basics.avatar_ratio);

  const avatarEl = basics.avatar ? (
    <Avatar src={basics.avatar} height={88} border={`1px solid ${pc}30`} ratio={ratio} />
  ) : (
    <div style={{
      width: `${Math.round(88 * ratio)}px`, height: '88px', borderRadius: '4px',
      background: `${pc}08`, border: `1px dashed ${pc}40`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: `${pc}80`, fontSize: '10px', flexShrink: 0,
    }}>
      上传照片
    </div>
  );

  return (
    <div className={className} onClick={onClick} style={{ marginBottom: `${style.section_gap}px` }}>
      <div style={{
        display: 'flex', gap: '18px', alignItems: 'flex-start',
        flexDirection: pos === 'right' ? 'row-reverse' : 'row',
        paddingBottom: showDivider ? '12px' : '4px',
        borderBottom: showDivider ? '1px solid var(--resume-divider)' : 'none',
      }}>
        {avatarEl}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: pc, margin: 0 }}>
            {basics.name || '您的姓名'}
          </h1>
          {basics.label && (
            <div style={{ fontSize: '14px', color: 'var(--resume-muted)', marginTop: '3px', fontWeight: 500 }}>
              {basics.label}
            </div>
          )}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '4px 14px',
            marginTop: '8px', fontSize: '12px', color: 'var(--resume-dim)',
          }}>
            {contacts.map((c) => (
              <ContactItem key={c.key} icon={c.icon} text={c.text} href={c.href} onClick={(e) => e.stopPropagation()} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   Layout 5: 紧凑单行
   一行显示所有信息，节省空间
   ═══════════════════════════════════════ */
function LayoutCompactInline({ basics, pc, style, className, onClick }: LayoutProps) {
  const contacts = useContactItems(basics, 'var(--resume-dim)');
  const showDivider = basics.show_header_divider !== false;
  const pos = basics.avatar_position || 'left';
  const ratio = getAvatarRatioValue(basics.avatar_ratio);

  const avatarEl = basics.avatar ? (
    <Avatar src={basics.avatar} height={40} border={`1px solid ${pc}40`} ratio={ratio} />
  ) : null;

  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        marginBottom: `${style.section_gap}px`,
        paddingBottom: '8px',
        borderBottom: showDivider ? `2px solid ${pc}` : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          flexDirection: pos === 'right' ? 'row-reverse' : 'row',
        }}>
          {avatarEl}
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: pc, margin: 0, whiteSpace: 'nowrap' }}>
            {basics.name || '您的姓名'}
          </h1>
        </div>
        {basics.label && (
          <span style={{
            fontSize: '13px', color: 'var(--resume-muted)',
            borderLeft: `2px solid ${pc}40`, paddingLeft: '10px',
          }}>
            {basics.label}
          </span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', flexWrap: 'wrap', gap: '4px 12px', fontSize: '11px', color: 'var(--resume-dim)' }}>
          {contacts.map((c) => (
            <ContactItem key={c.key} icon={c.icon} text={c.text} href={c.href} onClick={(e) => e.stopPropagation()} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   Layout 6: 现代卡片
   头像在用户选的一侧 + 信息，带精致的边框和背景
   ═══════════════════════════════════════ */
function LayoutModernCard({ basics, pc, style, className, onClick }: LayoutProps) {
  const contacts = useContactItems(basics, pc);
  const showDivider = basics.show_header_divider !== false;
  const pos = basics.avatar_position || 'left';
  const ratio = getAvatarRatioValue(basics.avatar_ratio);

  const avatarEl = basics.avatar ? (
    <Avatar src={basics.avatar} height={80} border={`1px solid ${pc}25`} ratio={ratio} />
  ) : null;

  return (
    <div className={className} onClick={onClick} style={{ marginBottom: `${style.section_gap}px` }}>
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '16px',
        flexDirection: pos === 'right' ? 'row-reverse' : 'row',
        padding: '16px',
        border: `1px solid ${pc}20`,
        borderRadius: '8px',
        background: `linear-gradient(180deg, ${pc}06 0%, transparent 100%)`,
      }}>
        {avatarEl}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: pc, margin: 0 }}>
            {basics.name || '您的姓名'}
          </h1>
          {basics.label && (
            <div style={{ fontSize: '13px', color: 'var(--resume-muted)', marginTop: '4px', fontWeight: 500 }}>
              {basics.label}
            </div>
          )}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '6px 14px',
            marginTop: '10px', fontSize: '12px', color: 'var(--resume-dim)',
          }}>
            {contacts.map((c) => (
              <ContactItem key={c.key} icon={c.icon} text={c.text} href={c.href} onClick={(e) => e.stopPropagation()} />
            ))}
          </div>
        </div>
      </div>
      {showDivider && (
        <Divider show color={`${pc}20`} />
      )}
    </div>
  );
}
