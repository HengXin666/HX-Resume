import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useMemo } from 'react';
import type { ReactNode } from 'react';

interface Props {
  /** Page width in mm (e.g. 210 for A4) */
  pageWidthMM: number;
  /** Page height in mm (e.g. 297 for A4) */
  pageHeightMM: number;
  /** The resume template content to paginate */
  children: ReactNode;
}

/** Convert mm to px at 96 dpi */
const MM_TO_PX = 96 / 25.4;

/** Gap between visible pages in px */
const PAGE_GAP_PX = 24;

/**
 * PagedPreview — displays resume content split into visual A4/Letter pages,
 * similar to how Word/Google Docs show page boundaries.
 *
 * Strategy:
 * 1. Render content once, off-screen, to measure its total height
 * 2. Calculate how many pages are needed (total height / page height)
 * 3. For each page, render the content again but clip it to show only
 *    the relevant vertical slice using overflow:hidden + negative marginTop
 *
 * Why re-render per page instead of CSS-only?
 * - CSS clip-path/overflow with absolute positioning breaks the content's
 *   interactive features (click handlers, hover states)
 * - Re-rendering keeps all React event handlers working naturally
 * - For 1-3 page resumes the overhead is negligible
 *
 * The ref is forwarded to a hidden full-content div so PDF export
 * (which needs the complete unclipped .resume-page) still works.
 */
const PagedPreview = forwardRef<HTMLDivElement, Props>(
  ({ pageWidthMM, pageHeightMM, children }, ref) => {
    const measureRef = useRef<HTMLDivElement>(null);
    const exportRef = useRef<HTMLDivElement>(null);
    const [pageCount, setPageCount] = useState(1);

    const pageWidthPx = useMemo(() => pageWidthMM * MM_TO_PX, [pageWidthMM]);
    const pageHeightPx = useMemo(() => pageHeightMM * MM_TO_PX, [pageHeightMM]);

    // Expose the hidden full-content div for PDF export
    useImperativeHandle(ref, () => exportRef.current!);

    // Observe content and recalculate page count
    useEffect(() => {
      const measure = measureRef.current;
      if (!measure) return;

      const recalc = () => {
        const resumePage = measure.querySelector('.resume-page') as HTMLElement;
        if (!resumePage) return;

        const contentHeight = resumePage.scrollHeight;
        // scrollHeight is an integer (browser rounds up), pageHeightPx is a float.
        // Use a small tolerance (2px) so rounding errors don't create a phantom page.
        const pages = Math.max(1, Math.ceil((contentHeight - 2) / pageHeightPx));
        setPageCount(pages);
      };

      // Initial calc (slight delay for fonts/images)
      const timer = setTimeout(recalc, 100);
      recalc();

      // Watch for size changes
      const ro = new ResizeObserver(recalc);
      ro.observe(measure);

      // Watch for content changes (text edits, section toggles)
      const mo = new MutationObserver(recalc);
      mo.observe(measure, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
      });

      return () => {
        clearTimeout(timer);
        ro.disconnect();
        mo.disconnect();
      };
    }, [pageHeightPx]);

    return (
      <div className="paged-preview" style={{ width: `${pageWidthPx}px` }}>
        {/* ── Hidden: measurement copy ── */}
        <div
          ref={measureRef}
          aria-hidden="true"
          className="paged-preview__measure"
          style={{ width: `${pageWidthPx}px` }}
        >
          {children}
        </div>

        {/* ── Hidden: export copy (ref target for PDF export) ── */}
        <div
          ref={exportRef}
          aria-hidden="true"
          className="paged-preview__measure"
          style={{ width: `${pageWidthPx}px` }}
        >
          {children}
        </div>

        {/* ── Visible: page frames ── */}
        {Array.from({ length: pageCount }, (_, i) => (
          <div
            key={i}
            className="paged-preview__page-wrapper"
            style={{
              width: `${pageWidthPx}px`,
              height: `${pageHeightPx}px`,
              marginBottom: i < pageCount - 1 ? `${PAGE_GAP_PX}px` : '0',
            }}
          >
            {/* Page number badge */}
            {pageCount > 1 && (
              <div className="paged-preview__page-number">
                {i + 1} / {pageCount}
              </div>
            )}

            {/* Clipped content viewport */}
            <div
              className="paged-preview__page-content"
              style={{
                width: `${pageWidthPx}px`,
                height: `${pageHeightPx}px`,
                overflow: 'hidden',
              }}
            >
              <div style={{ marginTop: `${-i * pageHeightPx}px` }}>
                {children}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  },
);

PagedPreview.displayName = 'PagedPreview';

export default PagedPreview;
