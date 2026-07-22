import React, { useEffect, useState, useCallback } from "react";
import { Table, Tag, Button, message, Tooltip, Space, Empty, Popconfirm } from "antd";
import {
  ReloadOutlined,
  CalendarOutlined,
  PlusOutlined,
  EditOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { api } from "../utils/api";
import ImprovementActionModal from "./ImprovementActionModal";
import ImprovementActionCompleteModal from "./ImprovementActionCompleteModal";
import { useAuth } from "../contexts/AuthContext";

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

export default function ImprovementActionsTable({ improvementSheetId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create/update modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingRecord, setEditingRecord] = useState(null);

  // Completion modal state
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completingRecord, setCompletingRecord] = useState(null);

  // Per-row deleting state, so only the clicked row shows a loading spinner
  const [deletingId, setDeletingId] = useState(null);

  const { permissions } = useAuth();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `improvement-sheets/${improvementSheetId}/improvement-actions`
      );
      setData(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
      message.error("Erreur lors du chargement des actions d'amélioration.");
    } finally {
      setLoading(false);
    }
  }, [improvementSheetId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setModalMode("create");
    setEditingRecord(null);
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setModalMode("update");
    setEditingRecord(record);
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    setModalOpen(false);
    loadData();
  };

  const openCompleteModal = (record) => {
    setCompletingRecord(record);
    setCompleteModalOpen(true);
  };

  const handleCompleteSuccess = () => {
    setCompleteModalOpen(false);
    loadData();
  };

  const handleDelete = async (record) => {
    setDeletingId(record.id);
    try {
      await api.delete(`improvement-actions/${record.id}`);
      message.success("Action d'amélioration supprimée.");
      loadData();
    } catch (err) {
      console.error(err);
      message.error(err?.response?.data?.message, "Erreur lors de la suppression de l'action.");
    } finally {
      setDeletingId(null);
    }
  };

  const columns = [
    {
      title: "Ref",
      dataIndex: "code",
      key: "code",
      width: 110,
      fixed: "left",
      sorter: (a, b) => a.code.localeCompare(b.code),
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
      title: "Responsable",
      dataIndex: ["responsable", "full_name"],
      key: "responsable",
      width: 160,
      filters: [...new Map(
        data.map((r) => [r.responsable?.id, r.responsable?.full_name])
      ).entries()].map(([id, name]) => ({ text: name, value: id })),
      onFilter: (value, record) => record.responsable?.id === value,
      render: (_, record) => record.responsable?.full_name || "-",
    },
    {
      title: "Service",
      dataIndex: ["service", "name"],
      key: "service",
      width: 140,
      filters: [...new Map(
        data.map((r) => [r.service?.id, r.service?.name])
      ).entries()].map(([id, name]) => ({ text: name, value: id })),
      onFilter: (value, record) => record.service?.id === value,
      render: (_, record) => record.service?.name || "-",
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
      render: (_, record) => {
        const status = getStatus(record);
        return <Tag color={status.color}>{status.label}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Modifier">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>

          {!record.completion_date && (
            <Tooltip title="Clôturer">
              <Button
                type="text"
                icon={<CheckCircleOutlined />}
                onClick={() => openCompleteModal(record)}
              />
            </Tooltip>
          )}

          <Popconfirm
            title="Supprimer cette action ?"
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
    <>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={columns}
        style={{display: permissions('voir.action_amelioration') ? 'table' : 'none'}}
        size="small"
        scroll={{ x: 1350 }}
        locale={{
          emptyText: (
            <Empty description="Aucune action d'amélioration trouvée" />
          ),
        }}
        title={() => (
          <Space style={{ width: "100%", justifyContent: "space-between", display: "flex" }}>
            <strong>Actions d'amélioration</strong>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
                Actualiser
              </Button>
              <Button type="primary"  disabled={!permissions('creer.action_amelioration')} icon={<PlusOutlined />} onClick={openCreateModal}>
                Nouvelle action
              </Button>
            </Space>
          </Space>
        )}
        pagination={{ pageSize: 10, showSizeChanger: true }}
      />

      <ImprovementActionModal
        open={modalOpen}
        mode={modalMode}
        improvementSheetId={improvementSheetId}
        record={editingRecord}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      <ImprovementActionCompleteModal
        open={completeModalOpen}
        record={completingRecord}
        onClose={() => setCompleteModalOpen(false)}
        onSuccess={handleCompleteSuccess}
      />
    </>
  );
}