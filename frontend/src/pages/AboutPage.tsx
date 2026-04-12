import { GithubOutlined, HomeOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '../stores/themeStore';

const APP_VERSION = 'v0.4.0';

const techStack = [
  { name: 'React', version: '19', color: 'var(--neon-cyan)' },
  { name: 'TypeScript', version: '6', color: 'var(--neon-purple)' },
  { name: 'Vite', version: '8', color: 'var(--neon-yellow)' },
  { name: 'Ant Design', version: '6', color: 'var(--neon-cyan)' },
  { name: 'Zustand', version: '5', color: 'var(--neon-green)' },
  { name: 'React Router', version: '7', color: 'var(--neon-magenta)' },
];

const features = [
  '多模板简历编辑（经典 / 现代 / 极简 / 创意 / 专业）',
  '实时预览 + 分页 A4 展示',
  '公开简历模式 & 敏感信息打码',
  '版本快照 & 历史回滚 & 双屏对比预览',
  '拖拽排序 & 多简历管理',
  '导出 PDF / HTML / Markdown / JSON',
  '赛博朋克 / 暖石日间双主题',
  '后端自动同步 + 本地持久化',
];

export default function AboutPage() {
  const navigate = useNavigate();
  const { mode, toggleTheme } = useThemeStore();

  return (
    <div className="home-page">
      {/* Header */}
      <header className="home-header">
        <div className="home-header__brand">
          <div
            className="home-header__logo neon-text"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/')}
            title="返回主页"
          >
            HX::RESUME
          </div>
          <span className="home-header__version home-header__version--active">
            {APP_VERSION}
          </span>
        </div>
        <div className="home-header__actions">
          <Tooltip title="返回主页">
            <Button
              type="text"
              icon={<HomeOutlined />}
              onClick={() => navigate('/')}
              style={{ color: 'var(--neon-cyan)', fontSize: '16px' }}
            />
          </Tooltip>
          <Tooltip title={mode === 'dark' ? '切换亮色' : '切换暗色'}>
            <Button
              type="text"
              icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleTheme}
              style={{ color: 'var(--neon-yellow)', fontSize: '16px' }}
            />
          </Tooltip>
          <Tooltip title="GitHub">
            <Button
              type="text"
              icon={<GithubOutlined />}
              onClick={() => window.open('https://github.com/HengXin666/HX-Resume', '_blank')}
              style={{ color: 'var(--text-secondary)', fontSize: '16px' }}
            />
          </Tooltip>
        </div>
      </header>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '40px 24px 60px' }}>
        <div className="about-container">
          {/* Title block */}
          <div className="about-hero">
            <h1 className="about-hero__title">
              <span className="neon-text">HX</span>::RESUME
            </h1>
            <div className="about-hero__version">{APP_VERSION}</div>
            <p className="about-hero__tagline">
              赛博朋克风格的现代简历管理平台
            </p>
          </div>

          {/* Features */}
          <section className="about-section">
            <div className="section-label">功能特性</div>
            <div className="about-features">
              {features.map((f, i) => (
                <div key={i} className="about-feature-item">
                  <span className="about-feature-item__bullet">▸</span>
                  {f}
                </div>
              ))}
            </div>
          </section>

          {/* Tech stack */}
          <section className="about-section">
            <div className="section-label">技术栈</div>
            <div className="about-tech-grid">
              {techStack.map((t) => (
                <div key={t.name} className="about-tech-card">
                  <span className="about-tech-card__name" style={{ color: t.color }}>
                    {t.name}
                  </span>
                  <span className="about-tech-card__version">v{t.version}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Info */}
          <section className="about-section">
            <div className="section-label">关于</div>
            <div className="about-info">
              <p>
                HX-Resume 是一个完全本地化的简历编辑与管理工具，
                数据存储在浏览器本地并可选同步至后端数据库。
                支持多模板切换、敏感信息打码、版本快照回滚等专业功能。
              </p>
              <p style={{ marginTop: '12px', color: 'var(--text-muted)', fontSize: '12px' }}>
                Built with ❤ and a cyberpunk aesthetic.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
