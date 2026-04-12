import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useEffect } from 'react';
import { BrowserRouter, HashRouter, Route, Routes } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import HomePage from './pages/HomePage';
import EditorPage from './pages/EditorPage';
import AboutPage from './pages/AboutPage';
import { useThemeStore } from './stores/themeStore';
import { useBackendSync } from './hooks/useBackendSync';
import './styles/cyberpunk.css';

/** In static mode (GitHub Pages), use HashRouter to avoid 404 on page refresh */
const Router = import.meta.env.VITE_STATIC_MODE === 'true' ? HashRouter : BrowserRouter;

export default function App() {
  const { mode } = useThemeStore();
  // Sync resume data with backend (auto push on changes, pull on startup)
  useBackendSync();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#00f0ff',
          colorBgContainer: mode === 'dark' ? '#16162588' : '#e2dfda',
          colorBgElevated: mode === 'dark' ? '#1a1a2e' : '#e2dfda',
          colorBorder: mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
          colorText: mode === 'dark' ? '#e0e0f0' : '#2c2a28',
          colorTextSecondary: mode === 'dark' ? '#a0a0c0' : '#504d49',
          fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
          borderRadius: 6,
        },
        components: {
          Tabs: {
            inkBarColor: '#00f0ff',
            itemSelectedColor: '#00f0ff',
            itemHoverColor: '#00f0ffaa',
          },
          Collapse: {
            headerBg: 'transparent',
            contentBg: 'transparent',
          },
        },
      }}
    >
      <div className="cyber-bg" />
      <ErrorBoundary>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/resume/:id" element={<EditorPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </Router>
      </ErrorBoundary>
    </ConfigProvider>
  );
}
