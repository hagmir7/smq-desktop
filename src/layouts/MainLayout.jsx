import React, { useEffect, useState } from 'react';
import { Layout, Menu, ConfigProvider } from 'antd';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import UpdateNotifier from '../components/UpdateNotifier.jsx';
import DropMenu from '../components/DropMenu.jsx';
import { Astroid, ClipboardCheck, Flag, Layers, LayoutDashboard, Logs, Pyramid, RefreshCcw, Settings, SquareMenu } from 'lucide-react';
import MainHeader from '../components/MainHeader.jsx';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { key: '/reclamations', icon: <Flag size={18} />, label: 'Réclamations' },
  { key: '/correction-actions', icon: <Astroid size={18} />, label: 'Actions Corrective' },
  { key: '/improvements', icon: <Pyramid size={18} />, label: 'Améliorations' },
  { key: '/improvements-journal', icon: <Logs size={18} />, label: 'Journal Améliorations' },
  { key: '/register', icon: <SquareMenu size={18} />, label: 'Register ENR-06 ' },
  {
    key: '/Paramètres', icon: <Settings size={18} />, label: 'Settings', children: [
      {
        key: '/users',
        icon: <RefreshCcw size={18} />,
        label: "Utilisateurs",
      },
      {
        key: '/roles',
        icon: <ClipboardCheck size={18} />,
        label: 'Rôles et permissions',
      },
      {
        key: '/connections',
        icon: <Layers size={18} />,
        // disabled: true,
        label: 'Connexions DB',
      },


    ],
  }
];

// Flattens menuItems (including nested children) into a single lookup array
const flattenMenuItems = (items) => {
  return items.reduce((acc, item) => {
    acc.push(item);
    if (item.children) {
      acc.push(...flattenMenuItems(item.children));
    }
    return acc;
  }, []);
};

const flatMenuItems = flattenMenuItems(menuItems);

export default function MainLayout() {
  const [appVersion, setAppVersion] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    window.electron?.getVersion().then(setAppVersion);
  }, []);

  useEffect(() => {
    const currentItem = flatMenuItems.find((item) => item.key === location.pathname);
    if (currentItem) {
      document.title = currentItem.label;
      document.getElementById('title').innerHTML = currentItem.label;
    }
  }, [location.pathname]);

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
          <MainHeader appVersion={appVersion} />
          <Content className="bg-gray-100 overflow-auto">
            <div className='m-2 rounded-lg bg-white shadow-sm overflow-hidden'>
              <Outlet context={{ appVersion }} />
            </div>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}