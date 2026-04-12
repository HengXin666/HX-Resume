import { useRef, useState, useCallback } from 'react';
import { Modal, Slider, Space, Button } from 'antd';
import { RotateLeftOutlined, RotateRightOutlined, UndoOutlined } from '@ant-design/icons';
import Cropper from 'react-cropper';
import type { ReactCropperElement } from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { AVATAR_RATIOS } from '../types/resume';
import type { AvatarRatio } from '../types/resume';

interface Props {
  open: boolean;
  src: string;
  /** 当前简历中选中的头像比例 */
  avatarRatio?: AvatarRatio;
  onSave: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

/**
 * 头像裁剪 + 缩放 + 旋转编辑弹窗。
 *
 * 基于 cropperjs，支持：
 * - 鼠标拖拽平移、滚轮缩放
 * - 按简历头像比例裁剪（1:1、2:3、3:4、4:3）
 * - 自由比例裁剪
 * - 旋转调整
 * - 输出裁剪后的 PNG dataURL
 */
export default function AvatarCropEditor({ open, src, avatarRatio, onSave, onCancel }: Props) {
  const cropperRef = useRef<ReactCropperElement>(null);

  // 根据当前简历头像比例计算初始 cropperjs aspectRatio
  const getInitialAspect = (): number => {
    const found = AVATAR_RATIOS.find((r) => r.id === avatarRatio);
    return found ? found.value : 2 / 3;
  };

  const [activeRatio, setActiveRatio] = useState<string>(avatarRatio || '2:3');
  const [aspectRatio, setAspectRatio] = useState<number>(getInitialAspect);
  const [zoom, setZoom] = useState(0);
  const [rotation, setRotation] = useState(0);

  const getCropper = useCallback(() => {
    return cropperRef.current?.cropper;
  }, []);

  /** 裁剪确认 */
  const handleSave = () => {
    const cropper = getCropper();
    if (!cropper) return;
    const canvas = cropper.getCroppedCanvas({
      maxWidth: 800,
      maxHeight: 800,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    });
    if (canvas) {
      onSave(canvas.toDataURL('image/png'));
    }
  };

  /** 切换比例 */
  const handleAspectChange = (ratioId: string, ratio: number) => {
    setActiveRatio(ratioId);
    setAspectRatio(ratio);
    const cropper = getCropper();
    if (cropper) {
      cropper.setAspectRatio(ratio);
    }
  };

  /** 旋转 */
  const handleRotate = (deg: number) => {
    const cropper = getCropper();
    if (cropper) {
      cropper.rotate(deg);
      setRotation((r) => r + deg);
    }
  };

  /** 精确旋转（滑块） */
  const handleRotationSlider = (deg: number) => {
    const cropper = getCropper();
    if (cropper) {
      cropper.rotateTo(deg);
      setRotation(deg);
    }
  };

  /** 缩放（滑块控制） */
  const handleZoomSlider = (val: number) => {
    const cropper = getCropper();
    if (cropper) {
      cropper.zoomTo(val);
      setZoom(val);
    }
  };

  /** 滚轮缩放时同步滑块 */
  const handleCropperZoom = (e: Cropper.ZoomEvent<HTMLImageElement>) => {
    const newRatio = e.detail.ratio;
    if (newRatio < 0.1 || newRatio > 10) {
      e.preventDefault();
      return;
    }
    setZoom(newRatio);
  };

  /** 重置全部 */
  const handleReset = () => {
    const cropper = getCropper();
    if (cropper) {
      cropper.reset();
      setZoom(0);
      setRotation(0);
      const initAspect = getInitialAspect();
      setAspectRatio(initAspect);
      setActiveRatio(avatarRatio || '2:3');
      cropper.setAspectRatio(initAspect);
    }
  };

  /** cropper ready 时初始化 zoom 值 */
  const handleReady = () => {
    const cropper = getCropper();
    if (cropper) {
      const imageData = cropper.getImageData();
      const currentZoom = imageData.width / imageData.naturalWidth;
      setZoom(currentZoom);
      setRotation(0);
    }
  };

  // 比例选项：简历头像预设 + 自由裁剪
  const ratioOptions: { id: string; label: string; value: number }[] = [
    ...AVATAR_RATIOS.map((r) => ({ id: r.id, label: r.name, value: r.value })),
    { id: 'free', label: '自由裁剪', value: 0 },
  ];

  return (
    <Modal
      title="裁剪头像"
      open={open}
      onOk={handleSave}
      onCancel={onCancel}
      okText="确认裁剪"
      cancelText="取消"
      width={560}
      destroyOnHidden
    >
      {/* 裁剪区域 */}
      <div
        style={{
          width: '100%',
          margin: '16px 0 12px',
          borderRadius: 8,
          overflow: 'hidden',
          background: '#1a1a1a',
        }}
      >
        <Cropper
          ref={cropperRef}
          src={src}
          style={{ height: 360, width: '100%' }}
          aspectRatio={aspectRatio}
          viewMode={1}
          dragMode="move"
          guides
          center
          highlight={false}
          background
          responsive
          autoCropArea={0.85}
          checkOrientation={false}
          zoom={handleCropperZoom}
          ready={handleReady}
        />
      </div>

      {/* 比例切换 + 旋转按钮 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {ratioOptions.map((opt) => (
          <Button
            key={opt.id}
            size="small"
            type={activeRatio === opt.id ? 'primary' : 'default'}
            onClick={() => handleAspectChange(opt.id, opt.value)}
          >
            {opt.label}
          </Button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          <Button
            size="small"
            icon={<RotateLeftOutlined />}
            onClick={() => handleRotate(-90)}
            title="逆时针旋转 90°"
          />
          <Button
            size="small"
            icon={<RotateRightOutlined />}
            onClick={() => handleRotate(90)}
            title="顺时针旋转 90°"
          />
          <Button size="small" icon={<UndoOutlined />} onClick={handleReset}>
            重置
          </Button>
        </div>
      </div>

      {/* 缩放滑块 */}
      <Space direction="vertical" style={{ width: '100%' }} size={4}>
        <div style={{ fontSize: 12, color: '#666', display: 'flex', justifyContent: 'space-between' }}>
          <span>缩放</span>
          <span style={{ fontFamily: 'monospace', color: '#1890ff' }}>{zoom.toFixed(2)}x</span>
        </div>
        <Slider
          min={0.1}
          max={5}
          step={0.01}
          value={zoom}
          onChange={handleZoomSlider}
        />
      </Space>

      {/* 旋转滑块 */}
      {rotation !== 0 && (
        <Space direction="vertical" style={{ width: '100%', marginTop: 4 }} size={4}>
          <div style={{ fontSize: 12, color: '#666', display: 'flex', justifyContent: 'space-between' }}>
            <span>旋转</span>
            <span style={{ fontFamily: 'monospace', color: '#1890ff' }}>{rotation}°</span>
          </div>
          <Slider
            min={-180}
            max={180}
            step={1}
            value={rotation}
            onChange={handleRotationSlider}
          />
        </Space>
      )}

      <div style={{ marginTop: 8, fontSize: 11, color: '#999' }}>
        拖拽移动图片，滚轮缩放，拖拽裁剪框边缘调整大小。裁剪后的头像以 PNG 格式保存。
      </div>
    </Modal>
  );
}
