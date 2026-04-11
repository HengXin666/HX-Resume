import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, ColorPicker, Form, Select, Slider, Switch, message, Popconfirm } from 'antd';
import { useMemo, useRef } from 'react';
import { useCustomFonts } from '../../hooks/useCustomFonts';
import { useResumeStore } from '../../stores/resumeStore';
import { templates } from '../../templates';
import { DEFAULT_STYLE_CONFIG, DEFAULT_HEADING_STYLE } from '../../types/resume';
import type { HeadingStyle } from '../../types/resume';

/** Built-in fonts — system fonts won't need Google Fonts loading */
const BUILTIN_FONTS = [
  { value: "'Noto Sans SC', 'Inter', sans-serif", label: 'Noto Sans SC (推荐)' },
  { value: "'Inter', 'Noto Sans SC', sans-serif", label: 'Inter' },
  { value: "'Orbitron', sans-serif", label: 'Orbitron (科技)' },
  { value: "'Noto Serif SC', serif", label: '思源宋体' },
  { value: "'LXGW WenKai', cursive", label: '霞鹜文楷' },
  { value: "Georgia, serif", label: 'Georgia' },
  { value: "'Courier New', monospace", label: 'Courier New' },
  // System fonts (no download needed)
  { value: "SimHei, '黑体', sans-serif", label: '黑体 (系统)' },
  { value: "'Microsoft YaHei', '微软雅黑', sans-serif", label: '微软雅黑 (系统)' },
  { value: "SimSun, '宋体', serif", label: '宋体 (系统)' },
  { value: "KaiTi, '楷体', serif", label: '楷体 (系统)' },
  { value: "'FangSong', '仿宋', serif", label: '仿宋 (系统)' },
];

export default function StyleEditor() {
  const resume = useResumeStore((s) => s.resumes.find((r) => r.id === s.activeResumeId) ?? null);
  const { updateStyleConfig, setTemplateId } = useResumeStore();
  const { fonts: customFonts, loading: fontLoading, upload, remove } = useCustomFonts();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!resume) return null;
  const style = resume.style_config;
  const defaults = DEFAULT_STYLE_CONFIG;

  /** Merge built-in + custom font options */
  const fontOptions = useMemo(() => {
    const options = [...BUILTIN_FONTS];
    if (customFonts.length > 0) {
      options.push({ value: '__divider__', label: '── 自定义字体 ──' });
      for (const f of customFonts) {
        options.push({
          value: `'${f.family}', sans-serif`,
          label: `${f.family} (自定义)`,
        });
      }
    }
    return options;
  }, [customFonts]);

  /** Format a slider label showing current / default */
  const sliderLabel = (label: string, value: number, unit: string, defaultVal: number) => {
    const isDefault = value === defaultVal;
    return (
      <span>
        {label}{' '}
        <span style={{ color: isDefault ? 'var(--text-muted)' : 'var(--neon-cyan)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
          {value}{unit}
        </span>
      </span>
    );
  };

  const handleFontUpload = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['ttf', 'otf', 'woff', 'woff2'].includes(ext)) {
      message.error('仅支持 .ttf / .otf / .woff / .woff2 字体文件');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      message.error('字体文件不能超过 10MB');
      return;
    }
    try {
      await upload(file);
      message.success(`字体 "${file.name}" 上传成功`);
    } catch {
      message.error('字体上传失败，请确认后端已启动');
    }
  };

  const handleDeleteFont = async (id: string, family: string) => {
    try {
      await remove(id);
      message.success(`字体 "${family}" 已删除`);
      // If current font was the deleted one, reset to default
      if (style.font_family.includes(family)) {
        updateStyleConfig({ font_family: defaults.font_family });
      }
    } catch {
      message.error('删除字体失败');
    }
  };

  return (
    <div style={{ padding: '12px' }}>
      {/* ── Template Selection ── */}
      <div className="section-label">模版选择</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '8px', marginBottom: '20px' }}>
        {templates.map((t) => (
          <div
            key={t.id}
            onClick={() => setTemplateId(t.id)}
            style={{
              padding: '12px 8px',
              textAlign: 'center',
              cursor: 'pointer',
              border: resume.template_id === t.id
                ? '2px solid var(--neon-cyan)'
                : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              background: resume.template_id === t.id
                ? 'rgba(0, 240, 255, 0.05)'
                : 'transparent',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>{t.thumbnail}</div>
            <div style={{ fontSize: '11px', fontWeight: 600 }}>{t.name}</div>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{t.description}</div>
          </div>
        ))}
      </div>

      <Form layout="vertical" size="small">
        {/* ── Typography ── */}
        <div className="section-label">排版</div>

        <Form.Item label="字体">
          <Select
            value={style.font_family}
            onChange={(value) => {
              if (value === '__divider__') return;
              updateStyleConfig({ font_family: value });
            }}
            options={fontOptions.map((opt) => ({
              ...opt,
              disabled: opt.value === '__divider__',
            }))}
            style={{ width: '100%' }}
          />
        </Form.Item>

        {/* Custom font upload & management */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".ttf,.otf,.woff,.woff2"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFontUpload(file);
                e.target.value = '';
              }}
            />
            <Button
              size="small"
              icon={<UploadOutlined />}
              loading={fontLoading}
              onClick={() => fileInputRef.current?.click()}
            >
              上传自定义字体
            </Button>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              .ttf / .otf / .woff2
            </span>
          </div>
          {customFonts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {customFonts.map((f) => (
                <div
                  key={f.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '4px 8px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '4px',
                    fontSize: '11px',
                  }}
                >
                  <span style={{ fontFamily: `'${f.family}'`, fontSize: '12px' }}>
                    {f.family}
                    <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
                      ({(f.file_size / 1024).toFixed(0)}KB)
                    </span>
                  </span>
                  <Popconfirm title={`删除字体 "${f.family}"？`} onConfirm={() => handleDeleteFont(f.id, f.family)}>
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <Form.Item label={sliderLabel('正文字号', style.font_size, 'px', defaults.font_size)}>
            <Slider
              min={10}
              max={18}
              step={0.5}
              value={style.font_size}
              onChange={(value) => updateStyleConfig({ font_size: value })}
            />
          </Form.Item>
        </div>

        <Form.Item label={sliderLabel('行高', style.line_height, '', defaults.line_height)}>
          <Slider
            min={1.0}
            max={2.4}
            step={0.05}
            value={style.line_height}
            onChange={(value) => updateStyleConfig({ line_height: value })}
          />
        </Form.Item>

        <Form.Item label={sliderLabel('段落间距', style.section_gap, 'px', defaults.section_gap)}>
          <Slider
            min={4}
            max={40}
            step={2}
            value={style.section_gap}
            onChange={(value) => updateStyleConfig({ section_gap: value })}
          />
        </Form.Item>

        {/* ── Margins (ALL sliders) ── */}
        <div className="section-label" style={{ marginTop: '16px' }}>页边距</div>

        <Form.Item label={sliderLabel('上边距', style.margin_top, 'mm', defaults.margin_top)}>
          <Slider
            min={0}
            max={50}
            step={1}
            value={style.margin_top}
            onChange={(value) => updateStyleConfig({ margin_top: value })}
          />
        </Form.Item>

        <Form.Item label={sliderLabel('下边距', style.margin_bottom, 'mm', defaults.margin_bottom)}>
          <Slider
            min={0}
            max={50}
            step={1}
            value={style.margin_bottom}
            onChange={(value) => updateStyleConfig({ margin_bottom: value })}
          />
        </Form.Item>

        <Form.Item label={sliderLabel('左边距', style.margin_left, 'mm', defaults.margin_left)}>
          <Slider
            min={0}
            max={50}
            step={1}
            value={style.margin_left}
            onChange={(value) => updateStyleConfig({ margin_left: value })}
          />
        </Form.Item>

        <Form.Item label={sliderLabel('右边距', style.margin_right, 'mm', defaults.margin_right)}>
          <Slider
            min={0}
            max={50}
            step={1}
            value={style.margin_right}
            onChange={(value) => updateStyleConfig({ margin_right: value })}
          />
        </Form.Item>

        {/* ── Colors ── */}
        <div className="section-label" style={{ marginTop: '16px' }}>颜色</div>

        <Form.Item label="主色">
          <ColorPicker
            value={style.primary_color}
            onChange={(_, hex) => updateStyleConfig({ primary_color: hex })}
            showText
          />
        </Form.Item>

        {/* ── Page Settings ── */}
        <div className="section-label" style={{ marginTop: '16px' }}>页面</div>

        <Form.Item label="页面大小">
          <Select
            value={style.page_size}
            onChange={(value) => updateStyleConfig({ page_size: value })}
            options={[
              { value: 'A4', label: 'A4 (210 × 297mm)' },
              { value: 'Letter', label: 'Letter (216 × 279mm)' },
            ]}
          />
        </Form.Item>

        {/* ── Logo Style ── */}
        <div className="section-label" style={{ marginTop: '16px' }}>Logo 样式</div>

        <Form.Item label="显示边框">
          <Switch
            checked={style.logo_border ?? true}
            onChange={(v) => updateStyleConfig({ logo_border: v })}
          />
        </Form.Item>

        <Form.Item label={sliderLabel('圆角', style.logo_border_radius ?? 6, 'px', 6)}>
          <Slider
            min={0}
            max={20}
            step={1}
            value={style.logo_border_radius ?? 6}
            onChange={(value) => updateStyleConfig({ logo_border_radius: value })}
          />
        </Form.Item>

        {/* Logo live preview */}
        <div style={{
          padding: '12px',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '16px',
          background: 'var(--bg-tertiary)',
        }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px' }}>预览</div>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: `${style.logo_border_radius ?? 6}px`,
            border: (style.logo_border ?? true) ? `1px solid var(--border-subtle)` : 'none',
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}>
            Logo
          </div>
        </div>

        {/* ── Heading Style ── */}
        <div className="section-label" style={{ marginTop: '16px' }}>标题样式</div>

        {(() => {
          const hs: HeadingStyle = style.heading_style ?? DEFAULT_HEADING_STYLE;
          const updateHS = (patch: Partial<HeadingStyle>) =>
            updateStyleConfig({ heading_style: { ...hs, ...patch } } as Record<string, unknown>);

          return (
            <>
              <Form.Item label="标题字体">
                <Select
                  value={hs.font_family || ''}
                  onChange={(v) => updateHS({ font_family: v })}
                  options={[
                    { value: '', label: '跟随正文字体' },
                    ...fontOptions.filter(o => o.value !== '__divider__'),
                  ]}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item label={sliderLabel('标题字号', hs.font_size, 'px', defaults.heading_size)}>
                <Slider
                  min={14}
                  max={28}
                  step={1}
                  value={hs.font_size}
                  onChange={(v) => updateHS({ font_size: v })}
                />
              </Form.Item>

              <Form.Item label="标题颜色">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ColorPicker
                    value={hs.color || style.primary_color}
                    onChange={(_, hex) => updateHS({ color: hex })}
                    showText
                  />
                  {hs.color && (
                    <Button size="small" onClick={() => updateHS({ color: '' })}>
                      跟随主色
                    </Button>
                  )}
                </div>
              </Form.Item>

              <Form.Item label="左侧竖线">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Switch checked={hs.left_bar} onChange={(v) => updateHS({ left_bar: v })} />
                  {hs.left_bar && (
                    <ColorPicker
                      value={hs.left_bar_color || style.primary_color}
                      onChange={(_, hex) => updateHS({ left_bar_color: hex })}
                      size="small"
                    />
                  )}
                </div>
              </Form.Item>

              <Form.Item label="下划线样式">
                <Select
                  value={hs.underline}
                  onChange={(v) => updateHS({ underline: v })}
                  options={[
                    { value: 'none', label: '无' },
                    { value: 'solid', label: '实线' },
                    { value: 'dashed', label: '虚线' },
                    { value: 'dotted', label: '点线' },
                    { value: 'double', label: '双线' },
                  ]}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              {hs.underline !== 'none' && (
                <Form.Item label="下划线颜色">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ColorPicker
                      value={hs.underline_color || style.primary_color}
                      onChange={(_, hex) => updateHS({ underline_color: hex })}
                      showText
                    />
                    {hs.underline_color && (
                      <Button size="small" onClick={() => updateHS({ underline_color: '' })}>
                        跟随主色
                      </Button>
                    )}
                  </div>
                </Form.Item>
              )}

              <Form.Item label="标题背景色">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ColorPicker
                    value={hs.background || '#ffffff'}
                    onChange={(_, hex) => updateHS({ background: hex })}
                    showText
                    allowClear
                  />
                  {hs.background && (
                    <Button size="small" onClick={() => updateHS({ background: '' })}>
                      清除背景
                    </Button>
                  )}
                </div>
              </Form.Item>

              {/* Live preview */}
              <div style={{
                padding: '12px',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
                background: 'var(--bg-tertiary)',
              }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px' }}>预览</div>
                <div>
                  <div style={{
                    fontSize: `${hs.font_size}px`,
                    fontWeight: 600,
                    fontFamily: hs.font_family || 'inherit',
                    color: hs.color || style.primary_color,
                    borderLeft: hs.left_bar ? `3px solid ${hs.left_bar_color || style.primary_color}` : undefined,
                    paddingLeft: hs.left_bar ? '8px' : undefined,
                    paddingBottom: '4px',
                    paddingTop: hs.background ? '4px' : undefined,
                    paddingRight: hs.background ? '10px' : undefined,
                    background: hs.background || undefined,
                    borderRadius: hs.background ? '3px' : undefined,
                    display: 'inline-block',
                  }}>
                    标题样式预览
                  </div>
                  {hs.underline !== 'none' && (
                    <div style={{
                      borderBottom: `2px ${hs.underline} ${hs.underline_color || style.primary_color}`,
                      marginTop: '2px',
                    }} />
                  )}
                </div>
              </div>
            </>
          );
        })()}
      </Form>
    </div>
  );
}
