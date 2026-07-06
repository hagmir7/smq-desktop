import React from 'react';
import { Card, Col, Row, Statistic, Table, Tag } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  DesktopOutlined
} from '@ant-design/icons';

const columns = [
  { title: 'Project', dataIndex: 'project', key: 'project' },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (status) => {
      const color =
        status === 'Live' ? 'green' : status === 'Building' ? 'gold' : 'default';
      return <Tag color={color}>{status}</Tag>;
    }
  },
  { title: 'Stack', dataIndex: 'stack', key: 'stack' }
];

const data = [
  { key: 1, project: 'Desktop Client', status: 'Live', stack: 'Electron + React' },
  { key: 2, project: 'Auto-updater', status: 'Building', stack: 'electron-updater' },
  { key: 3, project: 'UI Kit', status: 'Live', stack: 'Ant Design + Tailwind' }
];

export default function Dashboard({ appVersion }) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 mb-1">
          Welcome back
        </h1>
        <p className="text-gray-500">
          Electron <Tag icon={<DesktopOutlined />}>v{appVersion || '—'}</Tag> ·
          React · Tailwind CSS · Ant Design
        </p>
      </div>

      <Row gutter={16}>
        <Col span={8}>
          <Card bordered className="shadow-sm">
            <Statistic
              title="Active Sessions"
              value={128}
              precision={0}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ArrowUpOutlined />}
              suffix="/ 200"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered className="shadow-sm">
            <Statistic
              title="Error Rate"
              value={1.2}
              precision={2}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ArrowDownOutlined />}
              suffix="%"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered className="shadow-sm">
            <Statistic title="Update Channel" value="latest" />
          </Card>
        </Col>
      </Row>

      <Card title="Projects" bordered className="shadow-sm">
        <Table columns={columns} dataSource={data} pagination={false} />
      </Card>
    </div>
  );
}
