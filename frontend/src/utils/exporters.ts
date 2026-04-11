import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { ResumeData } from '../types/resume';

/** Page dimensions in mm */
const PAGE_SIZES = {
  A4: { width: 210, height: 297 },
  Letter: { width: 216, height: 279 },
} as const;

/** mm to px at 96 dpi */
const MM_TO_PX = 96 / 25.4;

/**
 * Export the resume preview DOM element as a PDF file.
 *
 * Strategy: clone the .resume-page element, place the clone at 1:1 scale
 * in a hidden off-screen container, capture with html2canvas, then
 * generate exact A4/Letter PDF with jsPDF.
 *
 * This avoids the issue where the preview is CSS-scaled (transform: scale(0.55))
 * causing html2canvas to capture a smaller image.
 */
export async function exportToPDF(
  element: HTMLElement,
  filename: string = 'resume.pdf'
): Promise<void> {
  // Detect page size from CSS variable
  const computedStyle = getComputedStyle(element);
  const pageWidthVar = computedStyle.getPropertyValue('--page-width').trim() || '210mm';
  const isLetter = pageWidthVar.includes('216');
  const { width: pdfW, height: pdfH } = isLetter ? PAGE_SIZES.Letter : PAGE_SIZES.A4;

  // Target pixel dimensions at 96dpi (matches CSS mm units)
  const targetWidthPx = pdfW * MM_TO_PX;

  // ── 1. Clone the element and place at 1:1 in a hidden container ──
  const clone = element.cloneNode(true) as HTMLElement;

  // Collect all <style> and <link> from the document to clone into the container
  const container = document.createElement('div');
  container.style.cssText = [
    'position: fixed',
    'top: 0',
    'left: 0',
    `width: ${targetWidthPx}px`,
    'z-index: -9999',
    'overflow: hidden',
    'pointer-events: none',
    'opacity: 0',
  ].join('; ');

  // Force light-mode CSS vars + reset transform/shadow
  const lightVars = [
    '--resume-bg: #ffffff',
    '--resume-text: #1a1a1a',
    '--resume-h1: #111',
    '--resume-h2: #222',
    '--resume-h3: #333',
    '--resume-muted: #555',
    '--resume-dim: #888',
    '--resume-body: #444',
    '--resume-contact: #555',
    '--resume-highlight: #444',
    '--resume-divider: #ddd',
    '--resume-tag-bg: #f5f5f5',
    '--resume-link: #2563eb',
    '--resume-sub: #8a7e6b',
    '--resume-sub-dim: #c5b9a8',
  ].join('; ');

  clone.style.cssText = `${clone.style.cssText}; ${lightVars}; `
    + 'transform: none !important; '
    + `width: ${targetWidthPx}px !important; `
    + 'box-shadow: none !important; '
    + 'background: #ffffff !important; '
    + 'color: #1a1a1a !important; '
    + 'margin: 0 !important; ';

  // Remove any resume-preview-dark class from clone ancestors
  clone.classList.remove('resume-preview-dark');

  container.appendChild(clone);
  document.body.appendChild(container);

  // Wait for layout and images
  await new Promise((r) => setTimeout(r, 300));

  // ── 2. Capture with html2canvas at 2x for sharp output ──
  const scale = 2;
  const canvas = await html2canvas(clone, {
    scale,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    allowTaint: true,
    width: targetWidthPx,
    windowWidth: targetWidthPx,
  });

  // Remove the temporary container
  document.body.removeChild(container);

  // ── 3. Generate PDF ──
  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  // The canvas pixel dimensions: canvas.width = targetWidthPx * scale
  // Map canvas width to PDF page width (mm)
  const imgWidthMM = pdfW;
  const imgHeightMM = (canvas.height * pdfW) / canvas.width;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [pdfW, pdfH],
    compress: true,
  });

  // Add image, split across pages if needed
  let heightLeft = imgHeightMM;
  let position = 0;

  pdf.addImage(imgData, 'JPEG', 0, position, imgWidthMM, imgHeightMM);
  heightLeft -= pdfH;

  while (heightLeft > 0) {
    position -= pdfH;
    pdf.addPage([pdfW, pdfH]);
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidthMM, imgHeightMM);
    heightLeft -= pdfH;
  }

  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
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
      lines.push(`${e.area} — ${e.study_type}`);
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
