import { useRef, useState, useCallback } from 'react';
import { Modal, Slider, Space, Button } from 'antd';
import { RotateLeftOutlined, RotateRightOutlined, UndoOutlined } from '@ant-design/icons';
import Cropper from 'react-cropper';
import type { ReactCropperElement } from 'react-cropper';
import 'cropperjs/dist/cropper.css';

interface Props {
  open: boolean;
  src: string;
  onSave: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

/**
 * Logo 裁剪 + 缩放 + 旋转编辑弹窗。
 *
 * 基于 cropperjs（业界最成熟的图片裁剪方案），支持：
 * - 鼠标拖拽平移、滚轮缩放
 * - 1:1 正方形裁剪（适合 Logo）
 * - 自由比例裁剪
 * - 旋转调整
 * - 输出裁剪后的 PNG dataURL
 */
export default function LogoCropEditor({ open, src, onSave, onCancel }: Props) {
  const cropperRef = useRef<ReactCropperElement>(null);
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [zoom, setZoom] = useState(0);
  const [rotation, setRotation] = useState(0);

  /** 获取 cropper 实例 */
  const getCropper = useCallback(() => {
    return cropperRef.current?.cropper;
  }, []);

  /** 裁剪确认 */
  const handleSave = () => {
    const cropper = getCropper();
    if (!cropper) return;
    const canvas = cropper.getCroppedCanvas({
      maxWidth: 512,
      maxHeight: 512,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    });
    if (canvas) {
      onSave(canvas.toDataURL('image/png'));
    }
  };

  /** 切换比例 */
  const handleAspectChange = (ratio: number) => {
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
    // 限制缩放范围
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
      setAspectRatio(1);
      cropper.setAspectRatio(1);
    }
  };

  /** cropper ready 时初始化 zoom 值 */
  const handleReady = () => {
    const cropper = getCropper();
    if (cropper) {
      const imageData = cropper.getImageData();
      // 获取当前 zoom level
      const currentZoom = imageData.width / imageData.naturalWidth;
      setZoom(currentZoom);
      setRotation(0);
    }
  };

  return (
    <Modal
      title="裁剪 Logo"
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
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <Button
          size="small"
          type={aspectRatio === 1 ? 'primary' : 'default'}
          onClick={() => handleAspectChange(1)}
        >
          1:1 正方形
        </Button>
        <Button
          size="small"
          type={aspectRatio === 0 ? 'primary' : 'default'}
          onClick={() => handleAspectChange(0)}
        >
          自由裁剪
        </Button>
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
        拖拽移动图片，滚轮缩放，拖拽裁剪框边缘调整大小。裁剪后的 Logo 以 PNG 格式保存。
      </div>
    </Modal>
  );
}
