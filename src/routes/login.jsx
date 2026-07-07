import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Alert, Typography, Modal, AutoComplete } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import Connection from '../components/Connection';
import { Link } from 'lucide-react';

const { Title } = Typography;

const Login = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { login, loading, message } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usernames, setUsernames] = useState([]);
  const [appVersion, setAppVersion] = useState('');
  const [errorType, setErrorType] = useState(null);


  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('usernames') || '[]');
    setUsernames(saved);
  }, []);


  useEffect(() => {
    const loadVersion = async () => {
      if (window.electron?.version) {
        const version = await window.electron.version();
        setAppVersion(version);
      }
    };
    loadVersion();
  }, []);

  useEffect(() => {
    form.setFieldsValue({
      email: import.meta.env.MODE === 'development' ? 'admin' : '',
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
    console.log(window.electron)
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      const response = await api.get('user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(response)

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
          <div className="font-semibold mb-2">Erreur de connexion réseau</div>
          <div>
            Impossible de se connecter au serveur. Veuillez vérifier votre connexion internet 
            ou cliquez sur le bouton ci-dessous pour changer le type de connexion.
          </div>
        </div>
      );
    }
    return message;
  };

  return (
    <div className="bg-gradient-to-br from-gray-100 via-green-50 to-green-200 min-h-screen flex justify-center items-center p-6">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <img
            className="h-20 mx-auto mb-4"
            src="https://app.intercocina.com/assets/imgs/intercocina-logo.png"
            alt="Intercocina"
          />
          <Title level={2} className="text-gray-800">Connectez-vous</Title>
        </div>

        {(message || errorType === 'network') && (
          <Alert 
            message={getErrorMessage()} 
            type={errorType === 'network' ? 'warning' : 'error'} 
            showIcon 
            className="mb-6"
            action={
              errorType === 'network' && (
                <Button 
                  size="small" 
                  type="link" 
                  onClick={() => setIsModalOpen(true)}
                  className="text-green-600 hover:text-green-700"
                >
                  Changer la connexion
                </Button>
              )
            }
          />
        )}

        <Form form={form} layout="vertical" onFinish={handleSubmit}>

          <Form.Item
            name="email"
            label="Nom d'utilisateur ou e-mail"
            rules={[{ required: true, message: "Veuillez entrer votre identifiant" }]}
          >
            <AutoComplete
              options={usernames.map(u => ({ value: u }))}
              placeholder="Entrez votre identifiant"
              // allowClear
              size="large"
              className="rounded-lg w-full"
            >
              <Input prefix={<UserOutlined className="text-gray-400" />} size="large" />
            </AutoComplete>
          </Form.Item>

          <Form.Item
            name="password"
            label="Mot de passe"
            rules={[{ required: true, message: "Veuillez entrer votre mot de passe" }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Entrez votre mot de passe"
              size="large"
              className="rounded-lg"
            />
          </Form.Item>

          <Form.Item className="mt-4">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              className="bg-green-600 hover:bg-green-700 rounded-lg"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </Form.Item>
        </Form>

        <Modal title="Type de connexion" open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={false}>
          <Connection />
        </Modal>

        <div className="mt-6 text-center">
          <Button onClick={() => setIsModalOpen(true)}>
            <Link size={18} />
          </Button>
        </div>

        {window.electron && <div className="text-center mt-5 text-gray-700">v{appVersion}</div>}

      </div>
    </div>
  );
};

export default Login;