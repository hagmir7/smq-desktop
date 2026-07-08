import React from 'react'
import { api } from '../utils/api';
import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  Space,
  Tag,
  Popconfirm,
  Tooltip,
  message,
  Typography,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";
const { Title, Text } = Typography;

const connectionsApi = {
  list: () => api.get("connections").then((res) => res.data),
  get: (id) => api.get(`connections/${id}`).then((res) => res.data),
  create: (payload) => api.post("connections", payload).then((res) => res.data),
  update: (id, payload) => api.put(`connections/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`connections/${id}`).then((res) => res.data),
  test: (id) => api.post(`connections/${id}/test`).then((res) => res.data),
};

export default function Connections() {
  const [connectionsList, setConnectionsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testingId, setTestingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const data = await connectionsApi.list();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data?.data)
            ? data.data
            : [];
      setConnectionsList(list);
    } catch (error) {
      message.error("Impossible de charger les connexions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const openCreateModal = () => {
    setEditingConnection(null);
    form.resetFields();
    form.setFieldsValue({ auth_win: false });
    setModalOpen(true);
  };

  const openEditModal = (connection) => {
    setEditingConnection(connection);
    // Don't prefill password - it isn't (and shouldn't be) returned by the API.
    form.setFieldsValue({ ...connection, password: undefined });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      // On edit, if the password field was left blank, don't send it -
      // avoids overwriting the stored password with an empty string.
      const payload = { ...values };
      if (editingConnection && !payload.password) {
        delete payload.password;
      }

      setSaving(true);
      if (editingConnection) {
        await connectionsApi.update(editingConnection.id, payload);
        message.success("Connexion mise à jour");
      } else {
        await connectionsApi.create(payload);
        message.success("Connexion créée");
      }
      setModalOpen(false);
      fetchConnections();
    } catch (error) {
      if (error?.errorFields) return; // validation error, already shown inline
      message.error("Échec de l'enregistrement de la connexion");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await connectionsApi.remove(id);
      message.success("Connexion supprimée");
      fetchConnections();
    } catch (error) {
      message.error("Échec de la suppression de la connexion");
    }
  };

  const handleTest = async (connection) => {
    setTestingId(connection.id);
    try {
      await connectionsApi.test(connection.id);
      message.success(`Connexion à "${connection.server}" réussie`);
    } catch (error) {
      message.error(`Échec du test de connexion pour "${connection.server}"`);
      
    } finally {
      setTestingId(null);
      fetchConnections();
    }
  };

  const columns = [
    {
      title: "Nom",
      dataIndex: "name",
      key: "name",
      render: (name) => (
        <Space>
          <DatabaseOutlined className="text-blue-500" />
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: "Serveur",
      dataIndex: "server",
      key: "server",
    },
    {
      title: "Utilisateur",
      dataIndex: "username",
      key: "username",
    },

    {
      title: "État",
      dataIndex: "status",
      key: "status",
      render: (status) =>
        Number(status) === 1 ? (
          <Tag color="green">Actif</Tag>
        ) : (
          <Tag color="red">Inactif</Tag>
        ),
    },
    {
      title: "Authentification",
      dataIndex: "auth_win",
      key: "auth_win",
      render: (authWin) =>
        authWin ? (
          <Tag color="blue">Windows</Tag>
        ) : (
          <Tag color="default">SQL Server</Tag>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_, connection) => (
        <Space>
          <Tooltip title="Tester la connexion">
            <Button
              icon={<ThunderboltOutlined />}
              loading={testingId === connection.id}
              onClick={() => handleTest(connection)}
            />
          </Tooltip>
          <Tooltip title="Modifier">
            <Button icon={<EditOutlined />} onClick={() => openEditModal(connection)} />
          </Tooltip>
          <Popconfirm
            title="Supprimer cette connexion ?"
            description="Cette action est irréversible."
            okText="Supprimer"
            okButtonProps={{ danger: true }}
            cancelText="Annuler"
            onConfirm={() => handleDelete(connection.id)}
          >
            <Tooltip title="Supprimer">
              <Button icon={<DeleteOutlined />} danger />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Title level={4} className="!mb-1 p-0 m-0">
            Connexions
          </Title>
          <Text type="secondary">Gérez les connexions aux bases de données de l'application</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          Nouvelle
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={connectionsList}
        rowKey="id"
        loading={loading}
        size='small'
        locale={{ emptyText: "Aucune connexion configurée" }}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingConnection ? "Modifier la connexion" : "Nouvelle connexion"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        confirmLoading={saving}
        okText="Enregistrer"
        cancelText="Annuler"
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="name"
            label="Nom de la connexion"
            rules={[{ required: true, message: "Le nom est requis" }]}
          >
            <Input placeholder="Ex : STILEMOBILI" />
          </Form.Item>

          <Form.Item
            name="server"
            label="Serveur"
            rules={[{ required: true, message: "Le serveur est requis" }]}
          >
            <Input placeholder="Ex : intercocinasvr" />
          </Form.Item>

          <Form.Item name="auth_win" label="Authentification Windows" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.auth_win !== curr.auth_win}
          >
            {({ getFieldValue }) =>
              !getFieldValue("auth_win") && (
                <>
                  <Form.Item
                    name="username"
                    label="Nom d'utilisateur"
                    rules={[{ required: true, message: "Le nom d'utilisateur est requis" }]}
                  >
                    <Input placeholder="Ex : sa" />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    label="Mot de passe"
                    rules={[
                      {
                        required: !editingConnection,
                        message: "Le mot de passe est requis",
                      },
                    ]}
                  >
                    <Input.Password
                      placeholder={
                        editingConnection
                          ? "Laisser vide pour conserver le mot de passe actuel"
                          : "••••••••"
                      }
                    />
                  </Form.Item>
                </>
              )
            }
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}