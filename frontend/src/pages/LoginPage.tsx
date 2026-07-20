import { LockOutlined, LoginOutlined, SafetyCertificateOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input } from 'antd';
import axios from 'axios';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface LoginValues {
  username: string;
  password: string;
}

export default function LoginPage() {
  const { login } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async ({ username, password }: LoginValues) => {
    setSubmitting(true);
    setError('');
    try {
      await login(username.trim(), password);
    } catch (reason) {
      if (axios.isAxiosError(reason) && reason.response?.status === 429) {
        setError('登录尝试过于频繁，请稍后再试');
      } else if (axios.isAxiosError(reason) && reason.response?.status === 401) {
        setError('用户名或密码不正确');
      } else {
        setError('无法连接服务器，请检查部署状态后重试');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-page__glow" aria-hidden="true" />
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-card__brand">
          <span className="login-card__brand-mark">HX::RESUME</span>
          <span className="login-card__secure"><SafetyCertificateOutlined /> PRIVATE ACCESS</span>
        </div>

        <div className="login-card__heading">
          <span className="login-card__eyebrow">SECURE WORKSPACE</span>
          <h1 id="login-title">登录简历工作台</h1>
          <p>请输入部署时设置的管理员账号与密码。</p>
        </div>

        {error && <Alert type="error" showIcon message={error} className="login-card__alert" />}

        <Form<LoginValues>
          layout="vertical"
          requiredMark={false}
          onFinish={handleSubmit}
          initialValues={{ username: 'admin' }}
          autoComplete="on"
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              autoComplete="username"
              autoFocus
              size="large"
              placeholder="管理员账号"
            />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              autoComplete="current-password"
              size="large"
              placeholder="部署密码"
            />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<LoginOutlined />}
            loading={submitting}
            block
            size="large"
            className="login-card__submit"
          >
            登录
          </Button>
        </Form>

        <p className="login-card__footnote">
          本系统暂不开放注册。登录状态由安全的 HttpOnly 会话维护。
        </p>
      </section>
    </main>
  );
}
