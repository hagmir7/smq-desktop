import React, { useEffect, useState, useMemo } from "react";
import {
  Table,
  Typography,
  Tag,
  Space,
  Button,
  Modal,
  Descriptions,
  Empty,
  Input,
  Select,
  message,
  Tooltip,
  Avatar,
  Popconfirm,
  Layout,
} from "antd";
import {
  EyeOutlined,
  SearchOutlined,
  UserOutlined,
  FileTextOutlined,
  EditOutlined,
  AuditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { api } from "../utils/api";
import { Link } from "react-router-dom";
import ImprovementEvaluationModal from "../components/ImprovementEvaluationModal";
import { Plus, Pyramid } from "lucide-react";
const { Header, Content } = Layout;

const { Title, Text, Paragraph } = Typography;

const statusColors = {
  Planifié: "processing",
  "En cours": "warning",
  Clôturée: "success",
};

const impactColors = {
  Faible: "green",
  Moyen: "orange",
  Élevé: "red",
};

export default function Improvements() {
  const [loading, setLoading] = useState(true);
  const [improvements, setImprovements] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    total: 0,
    perPage: 15,
  });

  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [impactFilter, setImpactFilter] = useState(null);

  // Evaluation modal state
  const [evaluateOpen, setEvaluateOpen] = useState(false);
  const [evaluatingRecord, setEvaluatingRecord] = useState(null);

  // Per-row deleting state, so only the clicked row shows a loading spinner
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (page = 1) => {
    setLoading(true);

    try {
      const { data } = await api.get(`improvement-sheets?page=${page}`);

      setImprovements(data.data);

      setPagination({
        current: data.current_page,
        total: data.total,
        perPage: data.per_page,
      });
    } catch {
      message.error("Erreur lors du chargement.");
    } finally {
      setLoading(false);
    }
  };

  const showDetails = (record) => {
    setSelected(record);
    setOpen(true);
  };

  const openEvaluateModal = (record) => {
    setEvaluatingRecord(record);
    setEvaluateOpen(true);
  };

  const handleEvaluateSuccess = () => {
    setEvaluateOpen(false);
    loadData(pagination.current);
  };

  const handleDelete = async (record) => {
    setDeletingId(record.id);
    try {
      await api.delete(`improvement-sheets/${record.id}`);
      message.success("Fiche d'amélioration supprimée.");
      loadData(pagination.current);
    } catch {
      message.error("Erreur lors de la suppression de la fiche.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredData = useMemo(() => {
    return improvements.filter((item) => {
      const matchesSearch =
        !search ||
        item.code?.toLowerCase().includes(search.toLowerCase()) ||
        item.title?.toLowerCase().includes(search.toLowerCase()) ||
        item.responsable?.full_name
          ?.toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus = !statusFilter || item.statut === statusFilter;
      const matchesImpact = !impactFilter || item.impact === impactFilter;

      return matchesSearch && matchesStatus && matchesImpact;
    });
  }, [improvements, search, statusFilter, impactFilter]);

  const columns = [
    {
      title: "Ref.",
      dataIndex: "code",
      key: "code",
      width: 130,
      fixed: "left",
      sorter: (a, b) => (a.code || "").localeCompare(b.code || ""),
      render: (code) => <Text strong>{code}</Text>,
    },
    {
      title: "Titre",
      dataIndex: "title",
      key: "title",
      width: 280,
      render: (title, record) => (
        <div>
          <div className="font-medium">{title}</div>
          <Paragraph
            ellipsis={{ rows: 1 }}
            type="secondary"
            className="!mb-0 text-xs"
          >
            {record.description}
          </Paragraph>
        </div>
      ),
    },
    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      width: 130,
      filters: Object.keys(statusColors).map((s) => ({
        text: s,
        value: s,
      })),
      onFilter: (value, record) => record.statut === value,
      render: (statut) => (
        <Tag color={statusColors[statut] || "default"}>{statut}</Tag>
      ),
    },
    {
      title: "Impact",
      dataIndex: "impact",
      key: "impact",
      width: 110,
      filters: Object.keys(impactColors).map((i) => ({
        text: i,
        value: i,
      })),
      onFilter: (value, record) => record.impact === value,
      render: (impact) => (
        <Tag color={impactColors[impact]}>{impact}</Tag>
      ),
    },
    {
      title: "Responsable",
      dataIndex: ["responsable", "full_name"],
      key: "responsable",
      width: 200,
      render: (_, record) =>
        record.responsable?.full_name ? (
          <Space size="small">
            <Avatar size="small" icon={<UserOutlined />} />
            <span>{record.responsable.full_name}</span>
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
      render: (_, record) => record.service?.name || (
        <Text type="secondary">-</Text>
      ),
    },
    {
      title: "Action corrective",
      dataIndex: ["corrective_action", "code"],
      key: "corrective_action",
      width: 150,
      render: (_, record) =>
        record.corrective_action?.code ? (
          <Space size={4}>
            <FileTextOutlined className="text-gray-400" />
            {record.corrective_action.code}
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "Créée le",
      dataIndex: "created_at",
      key: "created_at",
      width: 130,
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "",
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Voir le détail">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => showDetails(record)}
            />
          </Tooltip>

          <Tooltip title="Modifier">
            <Link to={`/improvements/${record.id}`}>
              <Button type="text" icon={<EditOutlined />} />
            </Link>
          </Tooltip>

          <Tooltip title="Évaluer">
            <Button
              type="text"
              icon={<AuditOutlined />}
              onClick={() => openEvaluateModal(record)}
            />
          </Tooltip>

          <Popconfirm
            title="Supprimer cette fiche ?"
            description="Cette action est irréversible."
            okText="Supprimer"
            cancelText="Annuler"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record)}
          >
            <Tooltip title="Supprimer">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                loading={deletingId === record.id}
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
            <Pyramid size={18} />
          </div>
          <div className="leading-tight">
            <div className="text-base font-semibold text-slate-900">Fiches d'amélioration</div>
            <div className="text-xs text-slate-500">{pagination.total} fiche(s) au total</div>
          </div>
        </div>



        <Space>
          <Input
            allowClear
            placeholder="Rechercher (Ref, Titre, description...)"
            prefix={<SearchOutlined className="text-gray-400" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-72"
          />
          <Select
            allowClear
            placeholder="Statut"
            style={{ width: 150 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={Object.keys(statusColors).map((s) => ({
              label: s,
              value: s,
            }))}
          />
          <Tooltip title="Actualiser">
            <Button icon={<ReloadOutlined />} onClick={loadData} />
          </Tooltip>
          <Button type="primary" icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
            Nouvelle
          </Button>
        </Space>
      </Header>
      <Content >
        <div className="p-4"> 
          <div className="border border-solid border-gray-200 rounded-lg overflow-hidden">
          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={filteredData}
            scroll={{ x: 1450 }}
            size="small"
            bordered={false}
            className="rounded-xl overflow-hidden shadow-sm"
            locale={{
              emptyText: (
                <Empty description="Aucune fiche d'amélioration." />
              ),
            }}
            pagination={{
              current: pagination.current,
              total: pagination.total,
              pageSize: pagination.perPage,
              showSizeChanger: false,
              showTotal: (total) => `${total} fiche(s)`,
              onChange: loadData,
            }}
          />
        </div>
        </div>
      </Content>


      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={[
          <Button key="close" onClick={() => setOpen(false)}>
            Fermer
          </Button>,
        ]}
        width={950}
        title={
          selected
            ? `${selected.code} - ${selected.title}`
            : "Fiche d'amélioration"
        }
      >
        {selected && (
          <Descriptions
            bordered
            column={2}
            size="middle"
            labelStyle={{ width: 220 }}
          >
            <Descriptions.Item label="Code">
              {selected.code}
            </Descriptions.Item>

            <Descriptions.Item label="Statut">
              <Tag color={statusColors[selected.statut]}>
                {selected.statut}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Source">
              {selected.finding_source}
            </Descriptions.Item>

            <Descriptions.Item label="Impact">
              <Tag color={impactColors[selected.impact]}>
                {selected.impact}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Responsable">
              {selected.responsable?.full_name || "-"}
            </Descriptions.Item>

            <Descriptions.Item label="Service">
              {selected.service?.name || "-"}
            </Descriptions.Item>

            <Descriptions.Item label="Action corrective">
              {selected.corrective_action?.code || "-"}
            </Descriptions.Item>

            <Descriptions.Item label="Date de création">
              {dayjs(selected.created_at).format("DD/MM/YYYY HH:mm")}
            </Descriptions.Item>

            <Descriptions.Item label="Description" span={2}>
              {selected.description}
            </Descriptions.Item>

            <Descriptions.Item label="Analyse des causes" span={2}>
              {selected.cause_analysis}
            </Descriptions.Item>

            <Descriptions.Item label="Observation" span={2}>
              {selected.observation_description || "-"}
            </Descriptions.Item>

            <Descriptions.Item label="Date d'observation">
              {selected.observation_date
                ? dayjs(selected.observation_date).format("DD/MM/YYYY")
                : "-"}
            </Descriptions.Item>

            <Descriptions.Item label="Date de clôture">
              {selected.closing_date
                ? dayjs(selected.closing_date).format("DD/MM/YYYY")
                : "-"}
            </Descriptions.Item>

            <Descriptions.Item label="Clôturée">
              {selected.closed ? (
                <Tag color="success">Oui</Tag>
              ) : (
                <Tag color="default">Non</Tag>
              )}
            </Descriptions.Item>

            <Descriptions.Item label="Efficacité">
              {selected.effectiveness === true ? (
                <Tag color="success">Efficace</Tag>
              ) : selected.effectiveness === false ? (
                <Tag color="error">Non efficace</Tag>
              ) : (
                "-"
              )}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <ImprovementEvaluationModal
        open={evaluateOpen}
        record={evaluatingRecord}
        onClose={() => setEvaluateOpen(false)}
        onSuccess={handleEvaluateSuccess}
      />

    </Layout>

  );
}