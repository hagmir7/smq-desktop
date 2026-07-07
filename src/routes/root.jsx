import { NavLink, Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import { Spin } from 'antd';

export default function Root() {
  return (
    <>
      <nav style={{ display: 'flex', gap: 16, padding: '12px 24px', borderBottom: '1px solid #f0f0f0' }}>
        <NavLink to="/" end style={({ isActive }) => ({ fontWeight: isActive ? 600 : 400 })}>
          Home
        </NavLink>
        <NavLink to="/dashboard" style={({ isActive }) => ({ fontWeight: isActive ? 600 : 400 })}>
          Dashboard
        </NavLink>
        <NavLink to="/settings" style={({ isActive }) => ({ fontWeight: isActive ? 600 : 400 })}>
          Settings
        </NavLink>
      </nav>
      <main style={{ padding: 24 }}>
        <Suspense fallback={<Spin style={{ marginTop: 40 }} />}>
          <Outlet />
        </Suspense>
      </main>
    </>
  );
}