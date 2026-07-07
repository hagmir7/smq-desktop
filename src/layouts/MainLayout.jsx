import React, { useEffect, useState } from 'react';
import { Layout, Menu, ConfigProvider } from 'antd';
import {
  DashboardOutlined,
  SettingOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import UpdateNotifier from '../components/UpdateNotifier.jsx';
import DropMenu from '../components/DropMenu.jsx';
import { ClipboardCheck, Layers, RefreshCcw } from 'lucide-react';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined className='text-white' />, label: 'Dashboard' },
  { key: '/apps', icon: <AppstoreOutlined className='text-white' />, label: 'Apps' },
  {
    key: '/Paramètres', icon: <SettingOutlined className='text-white' />, label: 'Settings', children: [
      {
        key: '/users',
        icon: <RefreshCcw size={19} />,
        label:  "Utilisateurs" ,
      },
      {

        key: '/roles',
        icon: <ClipboardCheck size={19} />,
        label: 'Rôles et permissions',
      },
      {
        key: '/connections',
        icon: <Layers size={19} />,
        // disabled: true,
        label: 'Connexions DB',
      },


    ],
  }
];

export default function MainLayout() {
  const [appVersion, setAppVersion] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    window.electron?.getVersion().then(setAppVersion);
  }, []);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#16a34a', // green-600
        },
      }}
    >
      <Layout style={{ height: '100vh' }}>
        <UpdateNotifier />

        <Sider
          width={220}
          theme="light"
          className="border-r border-gray-100 flex flex-col bg-green-900"
          style={{ height: '100vh' }}
        >
          <div className="px-4 py-4">
            <Link to="/">
              <h1 className='text-white text-xl p-0 m-0 text-start'>SMQ PRO</h1>
              <span className='text-white'> Intercocina {appVersion && <span className="text-gray-400 font-normal text-xs ml-1">v{appVersion}</span>}</span>
            </Link>
          </div>
          <Menu
            mode="inline"
            theme="dark"
            selectedKeys={[location.pathname]}
            onClick={(e) => navigate(e.key)}
            className="border-r-0 flex-1 bg-green-900"
            items={menuItems}
            style={{
              '--ant-menu-item-selected-bg': '#dcfce7', // green-100
              '--ant-menu-item-selected-color': '#16a34a', // green-600
            }}
          />
        </Sider>

        <Layout>
         <Header className="titlebar-drag flex items-center justify-between bg-white border-b border-gray-200 px-4 h-12 leading-none shadow-sm relative z-10">
          <span className="titlebar-no-drag font-semibold text-gray-700">
            SMQ {appVersion && <span className="text-gray-400 font-normal text-xs ml-1">v{appVersion}</span>}
          </span>
          <span className="titlebar-no-drag">
            <DropMenu />
          </span>
        </Header>
          <Content className="bg-gray-100 overflow-auto">
            <Outlet context={{ appVersion }} />
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}