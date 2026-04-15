import html2canvas from 'html2canvas';
import type { ResumeData, PublicResumeConfig } from '../types/resume';

/** Light-mode CSS variable overrides for export */
const LIGHT_MODE_VARS: Record<string, string> = {
  '--resume-bg': '#ffffff',
  '--resume-text': '#1a1a1a',
  '--resume-h1': '#111',
  '--resume-h2': '#222',
  '--resume-h3': '#333',
  '--resume-muted': '#555',
  '--resume-dim': '#888',
  '--resume-body': '#444',
  '--resume-contact': '#555',
  '--resume-highlight': '#444',
  '--resume-divider': '#ddd',
  '--resume-tag-bg': '#f5f5f5',
  '--resume-link': '#2563eb',
  '--resume-sub': '#8a7e6b',
  '--resume-sub-dim': '#c5b9a8',
};

/**
 * html2canvas does NOT support CSS `object-fit`. To work around this we wrap
 * each <img> that uses object-fit inside a `overflow:hidden` container <div>,
 * then manually compute the image's rendered width/height/position to emulate
 * the contain / cover behaviour. The <img> tag itself is preserved (NOT
 * replaced with background-image) so html2canvas renders it at full
 * resolution — background-image is known to produce blurry results.
 */
function fixObjectFitImages(root: HTMLElement): void {
  const imgs = root.querySelectorAll('img');
  imgs.forEach((img) => {
    const fit = img.style.objectFit || getComputedStyle(img).objectFit;
    if (!fit || fit === 'fill') return;

    // Container dimensions (the box the image lives in)
    const boxW = img.offsetWidth || parseInt(img.style.width) || 40;
    const boxH = img.offsetHeight || parseInt(img.style.height) || 40;

    // We need the image's natural size to compute the correct crop/scale.
    // Since all images are base64 data-URLs the image is already loaded.
    const natW = img.naturalWidth || boxW;
    const natH = img.naturalHeight || boxH;

    const boxRatio = boxW / boxH;
    const imgRatio = natW / natH;

    let renderW: number;
    let renderH: number;

    if (fit === 'contain' || fit === 'scale-down') {
      // Shrink so the ENTIRE image fits inside the box (letterbox)
      if (imgRatio > boxRatio) {
        renderW = boxW;
        renderH = boxW / imgRatio;
      } else {
        renderH = boxH;
        renderW = boxH * imgRatio;
      }
    } else {
      // 'cover': enlarge so the image COVERS the box entirely (crop)
      if (imgRatio > boxRatio) {
        renderH = boxH;
        renderW = boxH * imgRatio;
      } else {
        renderW = boxW;
        renderH = boxW / imgRatio;
      }
    }

    // Centre the image inside the box
    const left = (boxW - renderW) / 2;
    const top = (boxH - renderH) / 2;

    // Build wrapper div with overflow:hidden — html2canvas supports this
    const wrapper = document.createElement('div');
    wrapper.style.width = `${boxW}px`;
    wrapper.style.height = `${boxH}px`;
    wrapper.style.position = 'relative';
    wrapper.style.overflow = 'hidden';
    wrapper.style.borderRadius = img.style.borderRadius;
    wrapper.style.border = img.style.border;
    wrapper.style.flexShrink = img.style.flexShrink;
    wrapper.style.display = 'inline-block';

    // Reset img: remove object-fit, set computed size & position
    img.style.objectFit = '';
    img.style.width = `${renderW}px`;
    img.style.height = `${renderH}px`;
    img.style.position = 'absolute';
    img.style.left = `${left}px`;
    img.style.top = `${top}px`;
    img.style.border = 'none';
    img.style.borderRadius = '0';
    img.style.maxWidth = 'none';
    img.style.maxHeight = 'none';

    // Replace the img with [wrapper > img]
    img.replaceWith(wrapper);
    wrapper.appendChild(img);
  });
}

/** Force light-mode CSS variables on an element */
function applyLightModeVars(el: HTMLElement): void {
  for (const [k, v] of Object.entries(LIGHT_MODE_VARS)) {
    el.style.setProperty(k, v);
  }
}

/**
 * Export the resume preview DOM element as a PNG image.
 *
 * Uses html2canvas for reliable text rendering (no spurious line-breaks),
 * with a pre-processing step that converts <img> elements with object-fit
 * into background-image <div>s — the one known html2canvas limitation.
 *
 * Strategy: clone the element into a fresh container appended directly to
 * document.body so html2canvas works in a clean layout context.
 */
export async function exportToImage(
  element: HTMLElement,
  filename: string = 'resume.png',
): Promise<void> {
  // 1. Clone the element so we don't mutate the live DOM
  const clone = element.cloneNode(true) as HTMLElement;

  // Strip preview-only classes
  clone.classList.remove('resume-preview-dark');

  // Apply light-mode CSS variables
  applyLightModeVars(clone);

  // Remove box-shadow & transition for a clean capture
  clone.style.boxShadow = 'none';
  clone.style.transition = 'none';
  clone.style.margin = '0';

  // 2. Create a wrapper container and append the clone to document.body
  const wrapper = document.createElement('div');
  wrapper.style.cssText = [
    'position: fixed',
    'left: 0',
    'top: 0',
    'z-index: -9999',
    'pointer-events: none',
    'overflow: hidden',
    'width: 0',
    'height: 0',
  ].join(';');

  const inner = document.createElement('div');
  inner.style.cssText = [
    'position: absolute',
    'left: 0',
    'top: 0',
    'width: max-content',
    'height: max-content',
    'visibility: visible',
  ].join(';');

  inner.appendChild(clone);
  wrapper.appendChild(inner);
  document.body.appendChild(wrapper);

  // Small delay for styles/fonts to settle
  await new Promise((r) => setTimeout(r, 150));

  // 3. Fix object-fit images AFTER the clone is in the DOM
  //    (so offsetWidth/offsetHeight are available)
  fixObjectFitImages(clone);

  // Another small delay after DOM mutations
  await new Promise((r) => setTimeout(r, 50));

  try {
    const canvas = await html2canvas(clone, {
      scale: 4,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: clone.scrollWidth,
      height: clone.scrollHeight,
      windowWidth: clone.scrollWidth,
      windowHeight: clone.scrollHeight,
    });

    const dataUrl = canvas.toDataURL('image/png');

    // Trigger download
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    // 4. Clean up the temporary wrapper
    document.body.removeChild(wrapper);
  }
}

/**
 * Export the resume preview DOM element as a PDF file.
 *
 * Strategy: use the browser's native print dialog via an invisible iframe.
 * This ensures the PDF output is **pixel-identical** to the preview because
 * the same DOM + CSS is used. Links remain clickable, images render natively,
 * and page dimensions are controlled by @page CSS rules.
 *
 * Replaces the old html2canvas + jsPDF approach which produced a rasterised
 * image ~ losing links, mis-sizing pages, and sometimes dropping images.
 */
export async function exportToPDF(
  element: HTMLElement,
  _filename: string = 'resume.pdf',
): Promise<void> {
  // Detect page size from CSS variable
  const computedStyle = getComputedStyle(element);
  const pageWidthVar = computedStyle.getPropertyValue('--page-width').trim() || '210mm';
  const isLetter = pageWidthVar.includes('216');

  // ── 1. Collect all stylesheets ──
  const styleContent = collectStyles();

  // ── 2. Clone the element at 1:1 (no scale transform) ──
  const clone = element.cloneNode(true) as HTMLElement;
  // Strip any preview-only classes
  clone.classList.remove('resume-preview-dark');
  // Remove cursor / hover styles added for preview interactivity
  clone.querySelectorAll('.resume-section--clickable').forEach((el) => {
    (el as HTMLElement).style.cursor = 'default';
  });

  // ── 3. Build print-specific @page + body rules ──
  const pageSize = isLetter ? 'letter' : 'A4';
  const printCSS = `
    @page {
      size: ${pageSize} portrait;
      margin: 0;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      display: flex;
      justify-content: center;
    }
    /* Force light mode variables */
    .resume-page {
      --resume-bg: #ffffff;
      --resume-text: #1a1a1a;
      --resume-h1: #111;
      --resume-h2: #222;
      --resume-h3: #333;
      --resume-muted: #555;
      --resume-dim: #888;
      --resume-body: #444;
      --resume-contact: #555;
      --resume-highlight: #444;
      --resume-divider: #ddd;
      --resume-tag-bg: #f5f5f5;
      --resume-link: #2563eb;
      --resume-sub: #8a7e6b;
      --resume-sub-dim: #c5b9a8;
      box-shadow: none !important;
      margin: 0 !important;
    }
    /* Ensure clickable sections look normal in print */
    .resume-section--clickable:hover {
      background: transparent !important;
    }
    /* Fine-grained page-break control: avoid breaks inside items, not sections */
    .resume-section > h2,
    .resume-section--clickable > div:first-child {
      break-after: avoid;
      page-break-after: avoid;
    }
    .resume-item,
    [data-item-index] {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    /* Make links visually distinct and keep clickable */
    a {
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    /* Contact links should NOT be blue/underlined in PDF */
    .resume-contact a,
    .header-contact-link {
      color: inherit !important;
      text-decoration: none !important;
    }
    /* Ensure SVG icons render in print */
    svg {
      display: inline-block !important;
    }
  `;

  // ── 4. Create hidden iframe ──
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;width:0;height:0;border:none;left:-9999px;top:-9999px;';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error('Failed to create print iframe');
  }

  // Write the document
  iframeDoc.open();
  iframeDoc.write(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>Print Resume</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>${styleContent}</style>
  <style>${printCSS}</style>
</head>
<body>${clone.outerHTML}</body>
</html>`);
  iframeDoc.close();

  // ── 5. Wait for fonts & images, then trigger print ──
  await new Promise<void>((resolve) => {
    const win = iframe.contentWindow!;
    const tryPrint = () => {
      // Wait for fonts
      if (iframeDoc.fonts && iframeDoc.fonts.ready) {
        iframeDoc.fonts.ready.then(() => {
          win.focus();
          win.print();
          // Cleanup after print dialog closes
          setTimeout(() => {
            document.body.removeChild(iframe);
            resolve();
          }, 500);
        });
      } else {
        win.focus();
        win.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          resolve();
        }, 500);
      }
    };

    // Give the iframe time to load styles and render
    if (win.document.readyState === 'complete') {
      setTimeout(tryPrint, 300);
    } else {
      win.addEventListener('load', () => setTimeout(tryPrint, 300));
    }
  });
}

/**
 * Collect all stylesheets from the current document as a single CSS string.
 * Handles both inline <style> and cross-origin <link> (which may throw).
 */
function collectStyles(): string {
  const parts: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) {
        parts.push(rule.cssText);
      }
    } catch {
      // Cross-origin stylesheet ~ skip (Google Fonts are loaded via <link> in iframe)
    }
  }
  return parts.join('\n');
}

/**
 * Generate Markdown from resume data.
 */
export function exportToMarkdown(resume: ResumeData): string {
  const lines: string[] = [];
  const { basics, education, work, skills_text, projects } = resume;

  // Header
  if (basics.name) {
    lines.push(`# ${basics.name}`);
    if (basics.label) lines.push(`**${basics.label}**`);
    lines.push('');
  }

  // Contact
  const contacts: string[] = [];
  if (basics.email) contacts.push(`📧 ${basics.email}`);
  if (basics.phone) contacts.push(`📱 ${basics.phone}`);
  if (basics.url) contacts.push(`🌐 [${basics.url}](${basics.url})`);
  if (contacts.length) {
    lines.push(contacts.join(' | '));
    lines.push('');
  }

  // Summary
  if (basics.summary) {
    lines.push('## 个人简介');
    lines.push('');
    lines.push(basics.summary);
    lines.push('');
  }

  // Work Experience
  if (work.length) {
    lines.push('## 工作经历');
    lines.push('');
    for (const w of work) {
      const dept = w.department ? ` · ${w.department}` : '';
      lines.push(`### ${w.position}${dept} @ ${w.company}`);
      lines.push(`*${w.start_date} - ${w.end_date || '至今'}*`);
      lines.push('');
      if (w.description) lines.push(w.description);
      lines.push('');
    }
  }

  // Education
  if (education.length) {
    lines.push('## 教育背景');
    lines.push('');
    for (const e of education) {
      lines.push(`### ${e.institution}`);
      lines.push(`${e.area} ~ ${e.study_type}`);
      lines.push(`*${e.start_date} - ${e.end_date || '至今'}*`);
      if (e.description) {
        lines.push('');
        lines.push(e.description);
      }
      lines.push('');
    }
  }

  // Skills
  if (skills_text) {
    lines.push('## 技能');
    lines.push('');
    lines.push(skills_text);
    lines.push('');
  }

  // Projects
  if (projects.length) {
    lines.push('## 项目经验');
    lines.push('');
    for (const p of projects) {
      lines.push(`### ${p.name}`);
      if (p.url) lines.push(`🔗 [${p.url}](${p.url})`);
      if (p.keywords.length) {
        lines.push(`> 技术栈: ${p.keywords.join(', ')}`);
      }
      lines.push('');
      if (p.description) lines.push(p.description);
      for (const h of p.highlights) {
        lines.push(`- ${h}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Generate Markdown from resume data with redacted text replaced.
 * Redacted items have their originalText replaced with "██████" placeholders.
 */
export function exportToMarkdownRedacted(
  resume: ResumeData,
  config: PublicResumeConfig,
): string {
  // 先生成普通 Markdown
  let md = exportToMarkdown(resume);

  // 对每个打码项，替换所有出现的原文
  for (const item of config.redactedItems) {
    if (!item.originalText) continue;
    const replacement = item.replacement || '█'.repeat(Math.max(item.originalText.length, 3));
    // 全局替换（转义正则特殊字符）
    const escaped = item.originalText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    md = md.replace(new RegExp(escaped, 'g'), replacement);
  }

  return md;
}

/**
 * Export resume preview as standalone HTML file.
 * Includes a built-in dark/light mode toggle button.
 */
export function exportToHTML(
  element: HTMLElement,
  title: string = 'Resume',
): void {
  // Temporarily remove dark preview class to capture light-mode HTML
  const previewWrapper = element.closest('.resume-preview-dark');
  if (previewWrapper) {
    previewWrapper.classList.remove('resume-preview-dark');
  }

  const styles = Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules)
          .map((rule) => rule.cssText)
          .join('\n');
      } catch {
        return '';
      }
    })
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>${styles}</style>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      min-height: 100vh;
      overflow-y: auto;
      background: #f5f5f5;
    }
    .resume-export-wrapper {
      display: flex;
      justify-content: center;
      padding: 20px 0;
      min-height: 100vh;
    }
    #dark-toggle {
      position: fixed;
      top: 12px;
      right: 12px;
      z-index: 9999;
      padding: 6px 14px;
      border: 1px solid rgba(128,128,128,0.3);
      border-radius: 6px;
      background: rgba(255,255,255,0.9);
      backdrop-filter: blur(8px);
      cursor: pointer;
      font-size: 13px;
      color: #333;
      transition: all 0.2s;
    }
    #dark-toggle:hover { background: rgba(200,200,200,0.9); }
    @media print { #dark-toggle { display: none; } .resume-export-wrapper { padding: 0; } }
  </style>
  <script>
    function toggleDarkMode() {
      var wrapper = document.querySelector('.resume-export-wrapper');
      var btn = document.getElementById('dark-toggle');
      if (wrapper.classList.contains('resume-preview-dark')) {
        wrapper.classList.remove('resume-preview-dark');
        document.body.style.background = '#f5f5f5';
        btn.textContent = '🌙 暗色模式';
        btn.style.background = 'rgba(255,255,255,0.9)';
        btn.style.color = '#333';
      } else {
        wrapper.classList.add('resume-preview-dark');
        document.body.style.background = '#0d0d1a';
        btn.textContent = '☀️ 亮色模式';
        btn.style.background = 'rgba(40,40,60,0.9)';
        btn.style.color = '#eee';
      }
    }
  </script>
</head>
<body>
  <button id="dark-toggle" onclick="toggleDarkMode()">🌙 暗色模式</button>
  <div class="resume-export-wrapper">
    ${element.outerHTML}
  </div>
</body>
</html>`;

  // Restore dark class
  if (previewWrapper) {
    previewWrapper.classList.add('resume-preview-dark');
  }

  downloadFile(html, `${title}.html`, 'text/html');
}

/**
 * Download a text file.
 */
export function downloadFile(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
