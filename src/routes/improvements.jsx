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
} from "antd";
import {
  EyeOutlined,
  SearchOutlined,
  UserOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { api } from "../utils/api";

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
      title: "Code",
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
      width: 90,
      fixed: "right",
      render: (_, record) => (
        <Tooltip title="Voir le détail">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => showDetails(record)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Title level={3} className="!mb-1">
              Fiches d'amélioration
            </Title>
            <Text type="secondary">{pagination.total} fiche(s) au total</Text>
          </div>

          <Space wrap>
            <Input
              allowClear
              placeholder="Rechercher un code, un titre, un responsable..."
              prefix={<SearchOutlined className="text-gray-400" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 280 }}
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

            <Select
              allowClear
              placeholder="Impact"
              style={{ width: 130 }}
              value={impactFilter}
              onChange={setImpactFilter}
              options={Object.keys(impactColors).map((i) => ({
                label: i,
                value: i,
              }))}
            />
          </Space>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={filteredData}
          scroll={{ x: 1400 }}
          size="middle"
          bordered={false}
          className="rounded-xl overflow-hidden shadow-sm"
          onRow={(record) => ({
            onClick: () => showDetails(record),
            className: "cursor-pointer",
          })}
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
    </>
  );
}