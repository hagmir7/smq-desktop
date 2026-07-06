import React, { useEffect, useState } from 'react';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  SettingOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import Dashboard from './components/Dashboard.jsx';
import UpdateNotifier from './components/UpdateNotifier.jsx';

const { Header, Sider, Content } = Layout;

export default function App() {
  const [appVersion, setAppVersion] = useState('');
  const [selectedKey, setSelectedKey] = useState('dashboard');

  useEffect(() => {
    window.appInfo?.getVersion().then(setAppVersion);
  }, []);

  return (
    <Layout className="h-screen">
      <UpdateNotifier />

      {/* Draggable custom title bar area — works with frame:false in main.js if you want a fully custom title bar. */}
      <Header className="titlebar-drag flex items-center bg-white border-b border-gray-100 px-4 h-12 leading-none">
        <span className="titlebar-no-drag font-semibold text-gray-700">
          Electron React App
        </span>
      </Header>

      <Layout>
        <Sider width={220} theme="light" className="border-r border-gray-100">
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            onClick={(e) => setSelectedKey(e.key)}
            className="h-full border-r-0"
            items={[
              { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
              { key: 'apps', icon: <AppstoreOutlined />, label: 'Apps' },
              { key: 'settings', icon: <SettingOutlined />, label: 'Settings' }
            ]}
          />
        </Sider>
        <Content className="bg-gray-50 overflow-auto">
          {selectedKey === 'dashboard' && <Dashboard appVersion={appVersion} />}
          {selectedKey === 'apps' && (<div className="p-6 text-gray-500">Apps view — add your content here.</div>)}
          {selectedKey === 'settings' && (<div className="p-6 text-gray-500">Settings view — add your content here.</div>)}
        </Content>
      </Layout>
    </Layout>
  );
}
