import React, { useEffect, useState, useMemo } from "react";
import {
  Table,
  Typography,
  Tag,
  Space,
  Input,
  Select,
  Empty,
  Tooltip,
  Avatar,
  message,
  Layout,
  Button,
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
  CalendarOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { api } from "../utils/api";
import { Link } from "react-router-dom";
import { Loader2, Logs, RefreshCcw, Search } from "lucide-react";

const { Title, Text } = Typography;
const { Header, Content } = Layout;

const EFFECTIVENESS_COLORS = {
  Efficace: "green",
  "Partiellement efficace": "orange",
  "Non efficace": "red",
};

function formatDate(value) {
  return value ? dayjs(value).format("DD/MM/YYYY") : "-";
}

function getStatus(record) {
  if (record.completion_date) {
    return { label: "Terminée", color: "green" };
  }
  if (record.due_date && dayjs(record.due_date).isBefore(dayjs(), "day")) {
    return { label: "En retard", color: "red" };
  }
  return { label: "En cours", color: "blue" };
}

export default function ImprovementsJournal() {
  const [loading, setLoading] = useState(true);
  const [actions, setActions] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    total: 0,
    perPage: 15,
  });

  const [search, setSearch] = useState("");
  const [effectivenessFilter, setEffectivenessFilter] = useState(null);
  const [serviceFilter, setServiceFilter] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get(`improvement-actions?page=${page}`);

      setActions(data.data);
      setPagination({
        current: data.current_page,
        total: data.total,
        perPage: data.per_page,
      });
    } catch {
      message.error("Erreur lors du chargement du journal des actions.");
    } finally {
      setLoading(false);
    }
  };

  // Build service filter options from the loaded data
  const serviceOptions = useMemo(() => {
    const map = new Map();
    actions.forEach((a) => {
      if (a.service?.id) map.set(a.service.id, a.service.name);
    });
    return [...map.entries()].map(([id, name]) => ({ label: name, value: id }));
  }, [actions]);

  const filteredData = useMemo(() => {
    return actions.filter((item) => {
      const matchesSearch =
        !search ||
        item.code?.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase()) ||
        item.responsable?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        item.improvement_sheet?.code?.toLowerCase().includes(search.toLowerCase());

      const matchesEffectiveness =
        !effectivenessFilter || item.effectiveness === effectivenessFilter;

      const matchesService = !serviceFilter || item.service?.id === serviceFilter;

      return matchesSearch && matchesEffectiveness && matchesService;
    });
  }, [actions, search, effectivenessFilter, serviceFilter]);

  const columns = [
    {
      title: "Ref",
      dataIndex: "code",
      key: "code",
      width: 110,
      fixed: "left",
      sorter: (a, b) => (a.code || "").localeCompare(b.code || ""),
      render: (code) => <Text strong>{code}</Text>,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: { showTitle: false },
      render: (text) => (
        <Tooltip title={text} placement="topLeft">
          {text}
        </Tooltip>
      ),
    },
    {
      title: "Fiche d'amélioration",
      dataIndex: ["improvement_sheet", "code"],
      key: "improvement_sheet",
      width: 170,
      render: (_, record) =>
        record.improvement_sheet?.code ? (
          <Link to={`/improvements/${record.improvement_sheet_id}`}>
            <Space size={4}>
              <FileTextOutlined className="text-gray-400" />
              {record.improvement_sheet.code}
            </Space>
          </Link>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "Responsable",
      dataIndex: ["responsable", "full_name"],
      key: "responsable",
      width: 180,
      render: (_, record) =>
        record.responsable?.full_name ? (
          <Space size="small">
            <Avatar size="small" icon={<UserOutlined />} />
            <span className="whitespace-nowrap">{record?.responsable?.full_name}</span>
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "Service",
      dataIndex: ["service", "name"],
      key: "service",
      width: 160,
      render: (_, record) => record.service?.name || <Text type="secondary">-</Text>,
    },
    {
      title: "Critères d'efficacité",
      dataIndex: "effectiveness_criteria",
      key: "effectiveness_criteria",
      ellipsis: { showTitle: false },
      render: (text) =>
        text ? (
          <Tooltip title={text} placement="topLeft">
            {text}
          </Tooltip>
        ) : (
          "-"
        ),
    },
    {
      title: "Échéance",
      dataIndex: "due_date",
      key: "due_date",
      width: 130,
      sorter: (a, b) => dayjs(a.due_date).unix() - dayjs(b.due_date).unix(),
      render: (value) => (
        <span>
          <CalendarOutlined style={{ marginRight: 6 }} />
          {formatDate(value)}
        </span>
      ),
    },
    {
      title: "Date de réalisation",
      dataIndex: "completion_date",
      key: "completion_date",
      width: 150,
      render: formatDate,
    },
    {
      title: "Efficacité",
      dataIndex: "effectiveness",
      key: "effectiveness",
      width: 160,
      filters: Object.keys(EFFECTIVENESS_COLORS).map((e) => ({ text: e, value: e })),
      onFilter: (value, record) => record.effectiveness === value,
      render: (value) =>
        value ? (
          <Tag color={EFFECTIVENESS_COLORS[value] || "default"}>{value}</Tag>
        ) : (
          <Tag>Non évaluée</Tag>
        ),
    },
    {
      title: "Statut",
      key: "status",
      width: 110,
      fixed: "right",
      render: (_, record) => {
        const status = getStatus(record);
        return <Tag color={status.color}>{status.label}</Tag>;
      },
    },
  ];

  return (

    <Layout className="min-h-full bg-slate-100">
      <Header className="flex items-center justify-between !bg-white !px-6 border-b border-slate-200" style={{ height: 64, lineHeight: "64px" }}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-700 text-white">
            <Logs size={18} />
          </div>
          <div className="leading-tight">
            <div className="text-base font-semibold text-slate-900">Journal d'amélioration</div>
            <div className="text-xs text-slate-500">Action(s) au total.</div>
          </div>
        </div>
        <Space>

            <Select
              allowClear
              placeholder="Efficacité"
              style={{ width: 170 }}
              value={effectivenessFilter}
              onChange={setEffectivenessFilter}
              options={Object.keys(EFFECTIVENESS_COLORS).map((e) => ({
                label: e,
                value: e,
              }))}
            />

            <Select
              allowClear
              placeholder="Service"
              style={{ width: 170 }}
              value={serviceFilter}
              onChange={setServiceFilter}
              options={serviceOptions}
            />
          <Input
            allowClear
            placeholder="Ref, description..."
            prefix={<Search size={14} className="text-slate-400" />}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs"
          />
       
          <Button icon={loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />} onClick={loadData}></Button>

          {/* <Button type="primary" icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
            Nouvelle
          </Button> */}
        </Space>
      </Header>

      <Content className="mx-auto w-full px-4 py-4"> 
        <div className="border border-solid border-gray-200 rounded-lg overflow-hidden bg-white">
          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={filteredData}
            scroll={{ x: 1400 }}
            size="small"
            bordered={false}
            className="rounded-xl overflow-hidden shadow-sm"
            locale={{
              emptyText: <Empty description="Aucune action d'amélioration trouvée." />,
            }}
            pagination={{
              current: pagination.current,
              total: pagination.total,
              pageSize: pagination.perPage,
              showSizeChanger: false,
              showTotal: (total) => `${total} action(s)`,
              onChange: loadData,
            }}
          />
      </div>
      </Content>
    </Layout>

  );
}