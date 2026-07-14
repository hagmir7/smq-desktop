import React, { useEffect, useMemo, useState } from 'react';
import {
  Table,
  Input,
  Button,
  Tag,
  Space,
  Popconfirm,
  message,
  Typography,
  Tooltip,
  Layout,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EyeOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EditOutlined,
} from '@ant-design/icons';
import reclamationApi from '../utils/reclamationApi';
import ReclamationDetailDrawer from '../components/ReclamationDetailDrawer';
import ReclamationCreateModal from '../components/ReclamationCreateModal';
import { dateFormat } from '../utils/config';
import { Link } from 'react-router-dom';
import { Flag, GitBranch, Plus } from 'lucide-react';


const { Title } = Typography;


const { Header, Content } = Layout;

const priorityColor = {
  Urgente: 'red',
  Haute: 'orange',
  Normale: 'blue',
  Basse: 'default',
};

export default function Reclamations() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await reclamationApi.list();
      const rows = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setData(rows);
    } catch (err) {
      message.error("Impossible de charger les réclamations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    try {
      await reclamationApi.remove(id);
      message.success('Réclamation supprimée.');
      fetchData();
    } catch (err) {
      message.error('Échec de la suppression.');
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((r) =>
      [r.claimant_name, r.client_code, r.client_company_name, r.object]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [data, search]);


  const columns = [
    {
      title: "Ref",
      dataIndex: "code",
      // width: 250,
      render: (val, record) => (
        <div>{record.code}</div>
      ),
    },
    {
      title: "Client",
      dataIndex: "client_company_name",
      // width: 250,
      render: (val, record) => (
        <div className="text-xs text-gray-500">{record.client_code} - {record.client_company_name || record.claimant_name}</div>
      ),
    },
    {
      title: "Objet",
      dataIndex: "object",
      width: 350,
      render: (text) => (
        <div
          style={{
            whiteSpace: "normal",
            wordBreak: "break-word",
          }}
        >
          {text}
        </div>
      ),
    },
    {
      title: "Priorité",
      dataIndex: "priority",
      render: (val) =>
        val ? (
          <Tag color={priorityColor[val] || "default"}>{val}</Tag>
        ) : (
          <Tag>Non définie</Tag>
        ),
    },
    {
      title: "Recevable",
      dataIndex: "is_recevable",
      render: (val) =>
        val == null ? (
          <Tag>En attente</Tag>
        ) : val ? (
          <Tag color="green">Oui</Tag>
        ) : (
          <Tag color="red">Non</Tag>
        ),
    },
    {
      title: "Justifiée",
      dataIndex: "is_justifiee",
      render: (val) =>
        val == null ? (
          <Tag>En attente</Tag>
        ) : Number(val) ? (
          <Tag color="green">Oui</Tag>
        ) : (
          <Tag color="red">Non</Tag>
        ),
    },
    {
      title: "Date",
      dataIndex: "claimant_date",
      render: (value) => dateFormat(value),
    },
    {
      title: "Actions",
      key: "actions",
      width: 110,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Tooltip title="Voir le détail">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setSelectedId(record.id)}
            />
          </Tooltip>

           <Tooltip title="Modifier">
            <Link to={`/reclamations/show/${record.id}`}>
              <Button  size="small" icon={<EditOutlined />} />
            </Link>
          </Tooltip>

          <Popconfirm
            title="Supprimer cette réclamation ?"
            description="Cette action est irréversible."
            okText="Supprimer"
            cancelText="Annuler"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record.id)}
          >
            <Tooltip title="Supprimer">
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (

    <Layout className='min-h-full bg-slate-100'>
      <Header className="flex items-center justify-between !bg-white !px-6 border-b border-slate-200" style={{ height: 64, lineHeight: "64px" }}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-700 text-white">
            <Flag size={18} />
          </div>
          <div className="leading-tight">
            <div className="text-base font-semibold text-slate-900">Réclamations</div>
            <div className="text-xs text-slate-500">Gestion des réclamations</div>
          </div>
        </div>



        <Space>
            <Input
                allowClear
                placeholder="Rechercher (client, objet, réclamant...)"
                prefix={<SearchOutlined className="text-gray-400" />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-72"
              />
              <Tooltip title="Actualiser">
                <Button icon={<ReloadOutlined />} onClick={fetchData} />
              </Tooltip>
          <Button type="primary" icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
            Nouvelle
          </Button>
        </Space>
      </Header>
      <Content>
        <div className="p-4">
          <div className="border border-solid border-gray-200 rounded-lg bg-white">
            <Table
              rowKey="id"
              loading={loading}
              columns={columns}
              dataSource={filtered}
              style={{ whiteSpace: 'nowrap' }}
              size="small"
              scroll={{ x: "max-content" }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
              }}
            />
          </div>
          <ReclamationCreateModal
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            onCreated={() => {
              setCreateOpen(false);
              fetchData();
            }}
          />

          <ReclamationDetailDrawer
            reclamationId={selectedId}
            open={!!selectedId}
            onClose={() => setSelectedId(null)}
            onChanged={fetchData}
          />
        </div>
      </Content>
    </Layout>

  );
}