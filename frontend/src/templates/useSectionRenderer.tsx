import type { CSSProperties } from 'react';
import type { ResumeData, SectionKey, HeadingStyle } from '../types/resume';
import { DEFAULT_SECTION_ORDER, DEFAULT_SECTION_VISIBILITY, DEFAULT_HEADING_STYLE } from '../types/resume';

/** Get page CSS custom properties based on page_size setting */
export function getPageSizeVars(pageSize: string): CSSProperties {
  switch (pageSize) {
    case 'Letter':
      return {
        '--page-width': '216mm',
        '--page-min-height': '279mm',
      } as CSSProperties;
    case 'A4':
    default:
      return {
        '--page-width': '210mm',
        '--page-min-height': '297mm',
      } as CSSProperties;
  }
}

/** Get numeric page width in mm for scaling calculations */
export function getPageWidthMM(pageSize: string): number {
  switch (pageSize) {
    case 'Letter': return 216;
    case 'A4':
    default: return 210;
  }
}

/**
 * Build heading CSSProperties from the structured HeadingStyle config.
 * Falls back to primary_color for empty color fields.
 *
 * Returns { heading, underline } — the heading style for the <h2> text/bg,
 * and a separate underline style for an independent <div> below it.
 */
export function buildHeadingStyle(
  hs: HeadingStyle | undefined,
  primaryColor: string,
): { heading: CSSProperties; underline: CSSProperties | null } {
  const h = hs ?? DEFAULT_HEADING_STYLE;
  const color = h.color || primaryColor;

  const heading: CSSProperties = {
    fontSize: `${h.font_size}px`,
    fontWeight: 600,
    color,
    marginTop: '16px',
    marginBottom: 0,
    paddingBottom: '4px',
  };

  // Font family
  if (h.font_family) {
    heading.fontFamily = h.font_family;
  }

  // Left bar
  if (h.left_bar) {
    heading.borderLeft = `3px solid ${h.left_bar_color || primaryColor}`;
    heading.paddingLeft = '8px';
  }

  // Background — only wraps the text, not the full line
  if (h.background) {
    heading.background = h.background;
    heading.padding = h.left_bar ? '4px 10px 4px 8px' : '4px 10px';
    heading.borderRadius = '3px';
    heading.display = 'inline-block';
  }

  // Underline — separate element
  let underline: CSSProperties | null = null;
  if (h.underline !== 'none') {
    const uColor = h.underline_color || primaryColor;
    let borderStyle = '';
    switch (h.underline) {
      case 'solid':
        borderStyle = `2px solid ${uColor}`;
        break;
      case 'dashed':
        borderStyle = `2px dashed ${uColor}`;
        break;
      case 'dotted':
        borderStyle = `2px dotted ${uColor}`;
        break;
      case 'double':
        borderStyle = `3px double ${uColor}`;
        break;
    }
    underline = {
      borderBottom: borderStyle,
      marginBottom: '8px',
    };
  } else {
    // No underline, just add bottom margin to heading wrapper
    heading.marginBottom = '8px';
  }

  return { heading, underline };
}

/**
 * Get the ordered visible sections for a resume.
 * Returns the section_order filtered by section_visibility.
 * Supports both built-in SectionKey and custom section keys (custom_*).
 */
export function getVisibleSections(resume: ResumeData): string[] {
  const order: string[] = resume.section_order ?? DEFAULT_SECTION_ORDER;
  const visibility = resume.section_visibility ?? DEFAULT_SECTION_VISIBILITY;

  return order.filter((key) => {
    // Built-in sections: check visibility map
    if (key in visibility) {
      return (visibility as Record<string, boolean>)[key];
    }
    // Custom sections (custom_*): check if the custom section exists and is visible
    if (key.startsWith('custom_')) {
      const customId = key.replace('custom_', '');
      const exists = resume.custom_sections.some((cs) => cs.id === customId);
      // Default to visible if not explicitly hidden
      const vis = (visibility as Record<string, boolean>)[key];
      return exists && vis !== false;
    }
    return false;
  });
}

/**
 * Extract the SectionKey portion from a visible section string.
 * Returns null for custom sections.
 */
export function isBuiltinSection(key: string): key is SectionKey {
  const builtins: string[] = ['summary', 'work', 'education', 'skills', 'projects', 'awards', 'languages', 'interests'];
  return builtins.includes(key);
}
