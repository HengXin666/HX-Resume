import {
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import {
  Button,
  ColorPicker,
  Empty,
  Input,
  Radio,
  Space,
  Tooltip,
} from 'antd';
import { usePublicResumeStore } from '../../stores/publicResumeStore';
import type { RedactStyle } from '../../types/resume';

const STYLE_OPTIONS: { value: RedactStyle; label: string; icon: React.ReactNode }[] = [
  { value: 'mosaic', label: '马赛克', icon: <span style={{ fontFamily: 'monospace' }}>▓▓</span> },
  { value: 'solid', label: '纯色遮盖', icon: <span>██</span> },
];

export default function PublicModeEditor() {
  const {
    config,
    removeRedactItem,
    updateRedactItem,
    setDefaultStyle,
    setDefaultSolidColor,
    reset,
  } = usePublicResumeStore();

  return (
    <div style={{ padding: '12px' }}>
      {/* 使用说明 */}
      <div style={{
        padding: '10px 12px',
        background: 'rgba(0,200,255,0.06)',
        border: '1px solid rgba(0,200,255,0.15)',
        borderRadius: 'var(--radius-sm)',
        marginBottom: '16px',
      }}>
        <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--neon-cyan)' }}>
          如何使用
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
          在右侧预览区<strong>鼠标选中文本</strong>，弹出菜单后选择打码方式即可。
          <br />
          打码后的文本会被直接替换，导出 HTML/PDF 时原文不可见。
        </p>
      </div>

      {/* ── 全局默认打码样式 ── */}
      <div className="section-label">默认打码样式</div>
      <Radio.Group
        value={config.defaultStyle}
        onChange={(e) => setDefaultStyle(e.target.value)}
        style={{ marginBottom: '12px' }}
      >
        {STYLE_OPTIONS.map((opt) => (
          <Radio.Button key={opt.value} value={opt.value}>
            <Space size={4}>
              {opt.icon}
              {opt.label}
            </Space>
          </Radio.Button>
        ))}
      </Radio.Group>

      {/* 纯色设置 */}
      {config.defaultStyle === 'solid' && (
        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>遮盖颜色:</span>
          <ColorPicker
            value={config.defaultSolidColor}
            onChange={(_, hex) => setDefaultSolidColor(hex)}
            showText
            size="small"
          />
        </div>
      )}

      {/* ── 已打码项列表 ── */}
      <div className="section-label" style={{ marginTop: '16px' }}>
        已打码文本 ({config.redactedItems.length})
      </div>

      {config.redactedItems.length === 0 ? (
        <Empty
          description="选中预览区文本即可添加打码"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ margin: '20px 0' }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {config.redactedItems.map((item) => (
            <div
              key={item.id}
              style={{
                padding: '8px 10px',
                background: 'rgba(255, 77, 79, 0.06)',
                border: '1px solid rgba(255, 77, 79, 0.2)',
                borderRadius: 'var(--radius-sm)',
                transition: 'all 0.2s',
              }}
            >
              {/* 第一行：原文 + 操作 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '180px',
                  }}>
                    "{item.originalText}"
                  </div>
                  {item.replacement && (
                    <div style={{
                      fontSize: '10px',
                      color: 'var(--neon-cyan)',
                      marginTop: '2px',
                    }}>
                      → {item.replacement}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                  {/* 样式切换 */}
                  <Radio.Group
                    size="small"
                    value={item.style}
                    onChange={(e) => updateRedactItem(item.id, { style: e.target.value })}
                    optionType="button"
                    buttonStyle="solid"
                  >
                    <Radio.Button value="mosaic" style={{ padding: '0 4px', fontSize: '10px' }}>
                      ▓
                    </Radio.Button>
                    <Radio.Button value="solid" style={{ padding: '0 4px', fontSize: '10px' }}>
                      █
                    </Radio.Button>
                  </Radio.Group>
                  {/* 删除 */}
                  <Tooltip title="移除打码">
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeRedactItem(item.id)}
                    />
                  </Tooltip>
                </div>
              </div>

              {/* 第二行：替换文本输入 */}
              <div style={{ marginTop: '6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                <Input
                  size="small"
                  value={item.replacement}
                  onChange={(e) => updateRedactItem(item.id, { replacement: e.target.value })}
                  placeholder="留空则使用打码效果，或输入替代文字"
                  style={{ flex: 1, fontSize: '11px' }}
                  prefix={<EditOutlined style={{ color: 'var(--neon-cyan)', fontSize: '10px' }} />}
                  allowClear
                  onClear={() => updateRedactItem(item.id, { replacement: '' })}
                />
              </div>

              {/* 纯色颜色选择 */}
              {item.style === 'solid' && (
                <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>颜色:</span>
                  <ColorPicker
                    value={item.solidColor}
                    onChange={(_, hex) => updateRedactItem(item.id, { solidColor: hex })}
                    size="small"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 清空按钮 */}
      {config.redactedItems.length > 0 && (
        <div style={{ marginTop: '12px', textAlign: 'center' }}>
          <Button
            size="small"
            danger
            onClick={reset}
          >
            清空所有打码
          </Button>
        </div>
      )}
    </div>
  );
}
