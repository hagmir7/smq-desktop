import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Alert, Typography, Modal, AutoComplete, Badge } from 'antd';
import { UserOutlined, LockOutlined, ShopOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import Connection from '../components/Connection';
import { Link } from 'lucide-react';
import TitleBar from '../components/TitleBar';

const { Title, Text } = Typography;

const Login = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { login, loading, message } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usernames, setUsernames] = useState([]);
  const [appVersion, setAppVersion] = useState('');
  const [errorType, setErrorType] = useState(null);

  useEffect(() => {
    window.electron?.getVersion().then(setAppVersion);
  }, []);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('usernames') || '[]');
    setUsernames(saved);
  }, []);

  useEffect(() => {
    form.setFieldsValue({
      email: import.meta.env.MODE === 'development' ? 'admin@admin.com' : '',
      password: import.meta.env.MODE === 'development' ? 'password' : ''
    });
    checkAuth();
  }, [form]);

  const handleSubmit = async (values) => {
    try {
      setErrorType(null);
      await login(values);

      const token = localStorage.getItem('authToken');
      if (!token) {
        setErrorType('auth');
        return;
      }

      const updated = Array.from(new Set([values.email, ...usernames]));
      localStorage.setItem('usernames', JSON.stringify(updated));
      setUsernames(updated);
    } catch (error) {
      if (error.message?.includes('Network') || error.code === 'ERR_NETWORK' || !navigator.onLine) {
        setErrorType('network');
      } else {
        setErrorType('auth');
      }
    }
  };

  /* Auto navigation if already logged in */
  const checkAuth = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      const response = await api.get('user', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (window.electron) {
        await window.electron.user({ user: response.data, access_token: token });
      } else {
        navigate('/');
      }
    } catch (error) {
      // Silent fail for auto-check
      console.error('Auth check failed:', error);
    }
  };

  // Determine which message to show
  const getErrorMessage = () => {
    if (errorType === 'network') {
      return (
        <div>
          <div className="font-semibold mb-1">Erreur de connexion réseau</div>
          <div className="text-sm opacity-90">
            Impossible de se connecter au serveur. Veuillez vérifier votre connexion internet
            ou cliquez sur le bouton ci-dessous pour changer le type de connexion.
          </div>
        </div>
      );
    }
    return message;
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0d3b2e] flex flex-col">
      {/* Title bar stays pinned to the top of the window */}
      <TitleBar title="SMQ Pro — Connexion" />

      {/* Everything below fills the remaining space and centers the login card */}
      <div className="relative flex-1 w-full flex items-center justify-center">
        {/* Decorative background layers */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 15% 20%, rgba(74, 222, 128, 0.18), transparent 45%), radial-gradient(circle at 85% 80%, rgba(16, 185, 129, 0.20), transparent 50%), linear-gradient(160deg, #0d3b2e 0%, #114b3a 45%, #1a5c46 100%)'
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 22px)'
          }}
        />

        {/* Full width on mobile, capped width on larger screens — no card, no border, no shadow */}
        <div className="relative w-full sm:max-w-md md:max-w-lg px-6 py-10 sm:px-10">
          <div className="relative z-10 text-center mb-8">
            <img
              className="h-14 mx-auto mb-5"
              src="https://app.intercocina.com/assets/imgs/intercocina-logo.png"
              alt="Intercocina"
            />
            <Title level={4} className="!mb-1 !text-white mt-0 pt-0">
              Connectez-vous
            </Title>
            <Text className="text-emerald-100">
              Entrez vos identifiants pour accéder à votre compte.
            </Text>
          </div>

          {(message || errorType === 'network') && (
            <Alert
              message={getErrorMessage()}
              type={errorType === 'network' ? 'warning' : 'error'}
              showIcon
              className="relative z-10 mb-6 rounded-lg"
              action={
                errorType === 'network' && (
                  <Button
                    size="small"
                    type="link"
                    onClick={() => setIsModalOpen(true)}
                    className="text-emerald-800 hover:text-emerald-900 whitespace-nowrap"
                  >
                    Changer la connexion
                  </Button>
                )
              }
            />
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            requiredMark={false}
            className="relative z-10"
          >
            <Form.Item
              name="email"
              label={<span className="font-medium text-emerald-50">E-mail</span>}
              rules={[{ required: true, message: "Veuillez entrer votre identifiant" }]}
            >
              <AutoComplete
                options={usernames.map((u) => ({ value: u }))}
                placeholder="Entrez votre identifiant"
                size="large"
                className="w-full"
              >
                <Input
                  prefix={<UserOutlined className="text-emerald-600" />}
                  size="large"
                  className="rounded-lg bg-white/95"
                />
              </AutoComplete>
            </Form.Item>

            <Form.Item
              name="password"
              label={<span className="font-medium text-emerald-50">Mot de passe</span>}
              rules={[{ required: true, message: "Veuillez entrer votre mot de passe" }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-emerald-600" />}
                placeholder="Entrez votre mot de passe"
                size="large"
                className="rounded-lg bg-white/95"
              />
            </Form.Item>

            <Form.Item className="mt-6 mb-2">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="middle"
                className="bg-white !text-emerald-800 hover:!bg-emerald-50 border-none rounded-lg h-9 font-semibold shadow-sm"
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </Form.Item>
          </Form>

          <div className="relative z-10 mt-6 flex items-center justify-center">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-white/10 border-white/20 text-emerald-50 hover:!text-white hover:!border-white/40 hover:!bg-white/15"
            >
              <Link size={16} />
              <span className="text-sm">Configurer la connexion</span>
            </Button>
          </div>

          {window.electron && (
           <div className='flex w-full justify-center'>
             <Badge className="relative z-10 text-center font-bold mt-6 text-xs text-white leading-4">
              v{appVersion}
            </Badge>
           </div>
          )}
        </div>
      </div>

      <Modal
        title="Type de connexion"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={false}
        width="90%"
        style={{ maxWidth: 480 }}
      >
        <Connection />
      </Modal>
    </div>
  );
};

export default Login;