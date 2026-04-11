import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          margin: '20px',
          background: '#1a0000',
          border: '2px solid #ff2d6d',
          borderRadius: '8px',
          color: '#ff6b6b',
          fontFamily: 'monospace',
          maxHeight: '80vh',
          overflow: 'auto',
        }}>
          <h2 style={{ color: '#ff2d6d', marginBottom: '16px' }}>
            ⚠️ 运行时错误
          </h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '13px', marginBottom: '12px' }}>
            {this.state.error?.message}
          </pre>
          <details style={{ cursor: 'pointer' }}>
            <summary style={{ color: '#ff9999', marginBottom: '8px' }}>错误堆栈</summary>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '11px', color: '#cc6666' }}>
              {this.state.error?.stack}
            </pre>
          </details>
          {this.state.errorInfo && (
            <details style={{ cursor: 'pointer', marginTop: '12px' }}>
              <summary style={{ color: '#ff9999', marginBottom: '8px' }}>组件堆栈</summary>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '11px', color: '#cc6666' }}>
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          <button
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              background: '#ff2d6d',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
