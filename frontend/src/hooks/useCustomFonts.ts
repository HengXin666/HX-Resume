import { useCallback, useEffect, useState } from 'react';
import { deleteFont, getFontFileUrl, listFonts, uploadFont } from '../utils/api';
import type { FontInfo } from '../utils/api';

const STYLE_TAG_ATTR = 'data-custom-font';

/** Inject @font-face rules into <head> for all custom fonts */
function injectFontFaces(fonts: FontInfo[]) {
  // Remove all previous custom font style tags
  document.querySelectorAll(`style[${STYLE_TAG_ATTR}]`).forEach((el) => el.remove());

  if (fonts.length === 0) return;

  const rules = fonts
    .map((f) => {
      const url = getFontFileUrl(f.id);
      const format = f.mime_type.includes('woff2')
        ? 'woff2'
        : f.mime_type.includes('woff')
          ? 'woff'
          : f.mime_type.includes('otf')
            ? 'opentype'
            : 'truetype';
      return `@font-face {
  font-family: '${f.family}';
  src: url('${url}') format('${format}');
  font-display: swap;
}`;
    })
    .join('\n\n');

  const style = document.createElement('style');
  style.setAttribute(STYLE_TAG_ATTR, 'true');
  style.textContent = rules;
  document.head.appendChild(style);
}

export function useCustomFonts() {
  const [fonts, setFonts] = useState<FontInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await listFonts();
      setFonts(data);
      injectFontFaces(data);
    } catch {
      // Backend not running — use empty
      setFonts([]);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const upload = useCallback(
    async (file: File, family?: string) => {
      setLoading(true);
      try {
        await uploadFont(file, family);
        await refresh();
      } finally {
        setLoading(false);
      }
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      setLoading(true);
      try {
        await deleteFont(id);
        await refresh();
      } finally {
        setLoading(false);
      }
    },
    [refresh],
  );

  return { fonts, loading, upload, remove, refresh };
}
