import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  DatePicker,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EyeOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CheckSquareOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import reclamationApi from '../utils/reclamationApi';
import ReclamationDetailDrawer from '../components/ReclamationDetailDrawer';
import ReclamationCreateModal from '../components/ReclamationCreateModal';
import { dateFormat } from '../utils/config';
import { Link } from 'react-router-dom';
import { Flag, Plus } from 'lucide-react';
import ReclamationStep2Modal from '../components/ReclamationStep2Modal';
import ReclamationStep3Modal from '../components/ReclamationStep3Modal';
import CloseReclamation from '../components/CloseReclamation';
import ReclamationModalSeps from '../components/ReclamationModalSeps';
import { useAuth } from '../contexts/AuthContext';

const { Title } = Typography;
const { Header, Content } = Layout;
const { RangePicker } = DatePicker;

const priorityColor = {
  Urgente: 'red',
  Haute: 'orange',
  Normale: 'blue',
  Basse: 'default',
};

const workflowStepConfig = {
  1: { label: 'Création', color: 'default' },
  2: { label: 'Validation', color: 'blue' },
  3: { label: 'Analyse et Traitement', color: 'orange' },
  4: { label: 'Affectation', color: 'purple' },
  5: { label: 'Clôturé', color: 'green' },
};



export default function Reclamations() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState(null); // [dayjs, dayjs] | null
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [step2Open, setStep2Open] = useState(false);
  const [drowerOpen, setDrowerOpn] = useState(false);
  const [step3Open, setStep3Open] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {permissions} = useAuth();

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Keep a ref to the latest pagination/filters so the debounced search
  // handler always fires with fresh values without re-creating itself.
  const searchTimeout = useRef(null);

  const fetchData = async (overrides = {}) => {
    setLoading(true);
    try {
      const params = {
        page: overrides.page ?? pagination.current,
        per_page: overrides.pageSize ?? pagination.pageSize,
      };

      const currentSearch = overrides.search ?? search;
      if (currentSearch?.trim()) {
        params.search = currentSearch.trim();
      }

      const currentRange = overrides.dateRange ?? dateRange;
      if (currentRange?.[0]) {
        params.claimant_date_from = currentRange[0].format('YYYY-MM-DD');
      }
      if (currentRange?.[1]) {
        params.claimant_date_to = currentRange[1].format('YYYY-MM-DD');
      }

      const res = await reclamationApi.list(params);

      // Supports either a raw Laravel paginator payload, or one nested under `data`
      const payload = res.data?.data !== undefined && res.data?.current_page !== undefined
        ? res.data
        : res.data;

      const rows = payload?.data ?? [];
      const total = payload?.total ?? rows.length;
      const currentPage = payload?.current_page ?? params.page;
      const perPage = payload?.per_page ?? params.per_page;

      setData(rows);
      setPagination((prev) => ({
        ...prev,
        current: currentPage,
        pageSize: perPage,
        total,
      }));
    } catch (err) {
      message.error('Impossible de charger les réclamations.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchData({ page: 1, search: value });
    }, 400);
  };

  const handleDateRangeChange = (values) => {
    setDateRange(values);
    fetchData({ page: 1, dateRange: values });
  };

  const handleTableChange = (paginationConfig) => {
    fetchData({
      page: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
    });
  };


  const handleCloseReclamation = async (id, { closing_date }) => {
    try {
      await reclamationApi.close(id, {
        closing_date:closing_date,
      });

      message.success('Action clôturée avec succès.');
      fetchData();
    } catch (error) {
      console.error('Error closing action:', error);
      message.error(error?.response?.data?.message || 'Une erreur est survenue lors de la clôture de l\'action.');
    }
  };


  const getEtat = (record) => {
    if (record.statut === 'cloturee' || record.closing_date) {
      return workflowStepConfig[5];
    }
    return workflowStepConfig[record.workflow_step] ?? { label: 'Inconnu', color: 'default' };
  };

  const columns = [
    {
      title: 'Ref',
      dataIndex: 'code',
      render: (val, record) => <div>{record.code}</div>,
    },
    {
      title: 'Client',
      dataIndex: 'client_company_name',
      render: (val, record) => (
        <div className="text-xs text-gray-500">
          {record.client_code} - {record.client_company_name || record.claimant_name}
        </div>
      ),
    },
    {
      title: 'Objet',
      dataIndex: 'object',
      width: 350,
      render: (text) => (
        <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{text}</div>
      ),
    },
    {
      title: 'Priorité',
      dataIndex: 'priority',
      render: (val) =>
        val ? <Tag color={priorityColor[val] || 'default'}>{val}</Tag> : <Tag>Non définie</Tag>,
    },
    {
      title: 'Recevable',
      dataIndex: 'is_recevable',
      render: (val) =>
        val == null ? <Tag>En attente</Tag> : val ? <Tag color="green">Oui</Tag> : <Tag color="red">Non</Tag>,
    },
    {
      title: 'Etat',
      dataIndex: 'workflow_step',
      render: (val, record) => {
        const etat = workflowStepConfig[val] ?? { label: 'Inconnu', color: 'default' };
        // If using the separate statut/closing_date approach instead, use:
        // const etat = getEtat(record);
        return <Tag color={etat.color}>{etat.label}</Tag>;
      },
    },

    {
      title: 'Justifiée',
      dataIndex: 'is_justifiee',
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
      title: 'Date',
      dataIndex: 'claimant_date',
      render: (value) => dateFormat(value),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 110,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          {/* <Tooltip title="Voir le détail">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setDrowerOpn(true);
                setSelectedId(record.id);
              }}
            />
          </Tooltip> */}


          <Tooltip title="Voir le détail">
            <Button
              disabled={!permissions('voir.reclamation')}
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedId(record.id);
                setIsModalOpen(true);
              }}
            />
          </Tooltip>



          {/* <Tooltip title="Modifier">
            <Link to={`/reclamations/show/${record.id}`}>
              <Button size="small" icon={<EditOutlined />} />
            </Link>
          </Tooltip> */}

          {/* <Tooltip title="Modifier">
              <Button size="small" onClick={()=>{
                 setSelectedId(record.id);
                setIsModalOpen(true);
              }} icon={<EditOutlined />} />
          </Tooltip> */}


 

          <Tooltip title="Validation et recevabilité">
            <Button
              onClick={() => {
                setSelectedId(record.id);
                setStep2Open(true);
              }}
              size="small"
              disabled={!permissions('valider.reclamation')  }
              icon={<CheckCircleOutlined />}
            />
          </Tooltip>

          <Tooltip title="Traitement et Analyse">
            <Button
              onClick={() => {
                setSelectedId(record.id);
                setStep3Open(true);
              }}
              size="small"
              disabled={!permissions('analyse.reclamation') || !record.is_recevable}
              icon={<CheckSquareOutlined />}
            />
          </Tooltip>

          <CloseReclamation
            onCloseAction={(payload) => handleCloseReclamation(record.id, payload)}
            record={record}
          />

          <Popconfirm
            title="Supprimer cette réclamation ?"
            description="Cette action est irréversible."
            okText="Supprimer"
            cancelText="Annuler"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record.id)}
          >
            <Tooltip title="Supprimer">
              <Button disabled={!permissions('supprimer.reclamation')} size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>

          


        </Space>
      ),
    },
  ];

  return (
    <Layout className="min-h-full bg-slate-100">
      <Header
        className="flex items-center justify-between !bg-white !px-6 border-b border-slate-200"
        style={{ height: 64, lineHeight: '64px' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-700 text-white">
            <Flag size={18} />
          </div>
          <div className="leading-tight">
            <div className="text-base font-semibold text-slate-900">Réclamations</div>
            <div className="text-xs text-slate-500">Gestion des réclamations</div>
          </div>
        </div>

        <Space wrap>
          <Input
            allowClear
            placeholder="Rechercher (client, code, email, téléphone...)"
            prefix={<SearchOutlined className="text-gray-400" />}
            value={search}
            onChange={handleSearchChange}
            onClear={() => fetchData({ page: 1, search: '' })}
            className="w-72"
          />

          <RangePicker
            allowClear
            value={dateRange}
            onChange={handleDateRangeChange}
            format="DD/MM/YYYY"
            placeholder={['Date début', 'Date fin']}
          />

          <Tooltip title="Actualiser">
            <Button icon={<ReloadOutlined />} onClick={() => fetchData()} />
          </Tooltip>

          <Button disabled={!permissions('creer.reclamation')} type="primary" icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
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
              dataSource={data}
              style={{ whiteSpace: 'nowrap' }}
              size="small"
              scroll={{ x: 'max-content' }}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showTotal: (total) => `${total} réclamation(s)`,
              }}
              onChange={handleTableChange}
            />
          </div>

          <ReclamationCreateModal
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            onCreated={() => {
              setCreateOpen(false);
              fetchData({ page: 1 });
            }}
          />

          <ReclamationStep2Modal
            reclamationId={selectedId}
            open={step2Open}
            onClose={() => setStep2Open(false)}
            onUpdated={() => fetchData()}
          />

          <ReclamationDetailDrawer
            reclamationId={selectedId}
            open={!!drowerOpen}
            onClose={() => setDrowerOpn(null)}
            onChanged={() => fetchData()}
          />

          <ReclamationStep3Modal
            reclamationId={selectedId}
            open={step3Open}
            onClose={() => setStep3Open(false)}
            onUpdated={fetchData}
          />

          <ReclamationModalSeps
            reclamationId={selectedId}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          />
        </div>
      </Content>
    </Layout>
  );
}