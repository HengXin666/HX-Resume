import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import HomePage from './pages/HomePage';
import EditorPage from './pages/EditorPage';
import { useThemeStore } from './stores/themeStore';
import './styles/cyberpunk.css';

export default function App() {
  const { mode } = useThemeStore();

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
          colorBgContainer: mode === 'dark' ? '#16162588' : '#ffffff',
          colorBgElevated: mode === 'dark' ? '#1a1a2e' : '#ffffff',
          colorBorder: mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
          colorText: mode === 'dark' ? '#e0e0f0' : '#1a1a2e',
          colorTextSecondary: mode === 'dark' ? '#a0a0c0' : '#4a4a6a',
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
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/:id" element={<EditorPage />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </ConfigProvider>
  );
}
