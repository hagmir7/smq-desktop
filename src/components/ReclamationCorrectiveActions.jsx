import React, { useCallback, useEffect, useState } from 'react';
import {
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Select,
  message,
  Tooltip,
} from 'antd';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import reclamationApi from '../utils/reclamationApi';
import { Building, User } from 'lucide-react';
import { api } from '../utils/api';
import RightClickMenu from './ui/RightClickMenu';
import dayjs from 'dayjs';
import { useAuth } from '../contexts/AuthContext';

const { TextArea } = Input;

const ACTION_TYPES = ['Action corrective'];

// Recursively find a record by id inside a (possibly nested) actions tree
const findActionById = (list, id) => {
  for (const item of list) {
    if (String(item.id) === String(id)) return item;
    if (Array.isArray(item.children) && item.children.length) {
      const found = findActionById(item.children, id);
      if (found) return found;
    }
  }
  return null;
};

// Recursively find a record whose computed rowKey (see Table's `rowKey` prop)
// matches the given key. Mirrors: record.id ?? `${record.type}-${record.description}`
const findActionByRowKey = (list, key) => {
  for (const item of list) {
    const itemKey = item.id ?? `${item.type}-${item.description}`;
    if (String(itemKey) === String(key)) return item;
    if (Array.isArray(item.children) && item.children.length) {
      const found = findActionByRowKey(item.children, key);
      if (found) return found;
    }
  }
  return null;
};

export default function ReclamationCorrectiveActions({ reclamationId }) {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [responsibles, setResponsibles] = useState([]);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [showChildren, setShowChildren] = useState(false);
  const { permissions } = useAuth();

  // null => creating a new top-level action; object => editing that action
  const [editingAction, setEditingAction] = useState(null);
  // set when creating a sub-action for a given parent id
  const [parentId, setParentId] = useState(null);

  const hasAnyChildren = actions.some((a) => Array.isArray(a.children) && a.children.length > 0);

  const fetchActions = async () => {
    if (!reclamationId) return;
    setLoading(true);
    try {
      const res = await reclamationApi.listCorrectiveActions(reclamationId);
      const rows = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      // Mark nested rows so we can give them a different background in the table
      const markChildren = (list, isChild = false) =>
        list.map((item) => ({
          ...item,
          __isChild: isChild,
          children: Array.isArray(item.children)
            ? markChildren(item.children, true)
            : item.children,
        }));
      setActions(markChildren(rows));
    } catch (err) {
      message.error('Impossible de charger les actions correctives.');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = useCallback(async () => {
    try {
      const response = await api.get('services');
      setServices(
        (response?.data?.data || []).map((s) => ({
          label: s.name,
          value: Number(s.id),
        }))
      );
    } catch (error) {
      console.error(error);
      message.error(error?.response?.data?.message || "Une erreur s'est produite");
    }
  }, []);

  const fetchResponsibles = useCallback(async () => {
    try {
      const response = await api.get('users/responsibles');
      const rows = response?.data?.data || response?.data || [];
      setResponsibles(
        rows.map((u) => ({
          label: u.name ?? u.full_name ?? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim(),
          value: Number(u.id),
        }))
      );
    } catch (error) {
      console.error(error);
      message.error(error?.response?.data?.message || "Une erreur s'est produite");
    }
  }, []);

  useEffect(() => {
    fetchServices();
    fetchResponsibles();
    fetchActions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reclamationId]);

  const openCreateModal = (forParentId = null) => {
    form.resetFields();
    setEditingAction(null);
    setParentId(forParentId);
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingAction(record);
    setParentId(null);
    form.setFieldsValue({
      type: record.type,
      description: record.description,
      effectiveness_criteria: record.effectiveness_criteria,
      due_date: record.due_date ? dayjs(record.due_date) : undefined,
      service_id: record.service_id != null ? Number(record.service_id) : undefined,
      responsable_id: record.responsable_id != null ? Number(record.responsable_id) : undefined,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const payload = {
        description: values.description,
        type: values.type,
        effectiveness_criteria: values.effectiveness_criteria,
        due_date: values.due_date ? dayjs(values.due_date).format('YYYY-MM-DD') : undefined,
        service_id: values.service_id != null ? Number(values.service_id) : undefined,
        responsable_id: values.responsable_id != null ? Number(values.responsable_id) : undefined,
      };

      if (editingAction) {
        await reclamationApi.updateCorrectiveAction(reclamationId, editingAction.id, payload);
        message.success('Action corrective mise à jour.');
      } else {
        if (parentId) payload.parent_id = parentId;
        await reclamationApi.createCorrectiveAction(reclamationId, payload);
        message.success(parentId ? 'Sous-action créée.' : 'Action corrective créée.');
      }

      form.resetFields();
      setModalOpen(false);
      setEditingAction(null);
      setParentId(null);
      fetchActions();
    } catch (err) {
      console.error(err);
      if (err?.errorFields) return;
      message.error(
        editingAction
          ? "Échec de la mise à jour de l'action corrective."
          : "Échec de la création de l'action corrective."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Supprimer cette action corrective ?',
      content: 'Cette action est irréversible.',
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          await reclamationApi.deleteCorrectiveAction(reclamationId, id);
          message.success('Action corrective supprimée.');
          fetchActions();
        } catch (err) {
          console.error(err);
          message.error("Échec de la suppression de l'action corrective.");
        }
      },
    });
  };

  const handleMenuClick = (key, id) => {
    switch (key) {
      case 'edit': {
        const record = findActionById(actions, id);
        if (record) openEditModal(record);
        break;
      }
      case 'addSub':
        openCreateModal(id);
        break;
      case 'delete':
        handleDelete(id);
        break;
      default:
        break;
    }
  };

  const rowMenuItems = (record) => [
    { label: 'Modifier', key: 'edit', id: record?.id },
    { label: 'Ajouter une sous-action', key: 'addSub', id: record?.id },
    { label: 'Supprimer', key: 'delete', id: record?.id },
  ];

  const columns = [
{
  title: 'Responsable',
  dataIndex: 'responsable',
  key: 'responsable',
  width: 180,
  render: (responsable, record) => {
    const name =
      responsable?.full_name ||
      responsibles.find((r) => r.value === Number(record.responsable_id))?.label ||
      '-';
    return (
      <Tag color="geekblue" style={{ verticalAlign: 'middle', marginRight: 0 }}>
        {name}
      </Tag>
    );
  },
},
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: "Critère d'efficacité",
      dataIndex: 'effectiveness_criteria',
      key: 'effectiveness_criteria',
      render: (value) => value || '-',
    },
    {
      title: 'Échéance',
      dataIndex: 'due_date',
      key: 'due_date',
      width: 110,
      render: (date) => (date ? dayjs(date).format('DD/MM/YYYY') : '-'),
    },

    {
      title: 'Réalisation',
      dataIndex: 'completion_date',
      key: 'completion_date',
      width: 110,
      render: (date) => (date ? dayjs(date).format('DD/MM/YYYY') : '-'),
    },

     {
      title: 'Efficacité',
      dataIndex: 'effectiveness',
      key: 'effectiveness',
      width: 110,
      // render: (date) => ),
    },
  ];

  // antd's components.body.row does NOT receive `record` as a prop — only
  // standard <tr> attributes, including `data-row-key` (set because we pass rowKey).
  // So we look the record up ourselves from that key.
  const ContextMenuRow = (props) => {
    const { children, ...restProps } = props;
    const rowKey = restProps['data-row-key'];
    const record = rowKey !== undefined ? findActionByRowKey(actions, rowKey) : null;

    if (!record) return <tr {...restProps}>{children}</tr>;

    return (
      <RightClickMenu menuItems={rowMenuItems(record)} onItemClick={handleMenuClick}>
        <tr {...restProps}>{children}</tr>
      </RightClickMenu>
    );
  };

  return (
    <div>
      {/* Distinct background for child (sub-action) rows */}
      <style>{`
        .reclamation-actions-table .child-action-row > td {
          background-color: #fafafa;
        }
        .reclamation-actions-table .child-action-row > td:first-child {
          border-left: 2px solid #91caff;
        }
        .reclamation-actions-table .child-action-row:hover > td {
          background-color: #f0f0f0 !important;
        }
      `}</style>

      <div className="flex items-center justify-between mb-3">
        <h4 className="text-base font-medium m-0">Actions correctives</h4>
        <div className="flex items-center gap-3">
          {hasAnyChildren && (
            <Tooltip title={showChildren ? 'Masquer les sous-actions' : 'Afficher les sous-actions'}>
              <Button
                size="small"
                icon={showChildren ? <MinusOutlined /> : <PlusOutlined />}
                onClick={() => setShowChildren((v) => !v)}
              />
            </Tooltip>
          )}
          <Button
            size="small"
            type="primary"
            disabled={!permissions('creer.action_corrective')}
            icon={<PlusOutlined />}
            onClick={() => openCreateModal(null)}>
            Ajouter
          </Button>
        </div>
      </div>

      <div className="border border-solid border-gray-200 rounded-lg overflow-hidden border-b-0">
        <Table
          className="reclamation-actions-table"
          size="small"
          loading={loading}
          dataSource={actions}
          columns={columns}
          rowKey={(record) => record.id ?? `${record.type}-${record.description}`}
          rowClassName={(record) => (record.__isChild ? 'child-action-row' : '')}
          pagination={false}
          locale={{ emptyText: 'Aucune action corrective' }}
          childrenColumnName={showChildren ? 'children' : '__no_children__'}
          components={{ body: { row: ContextMenuRow } }}
          expandable={
            showChildren
              ? {
                expandIconColumnIndex: 0,
                rowExpandable: (record) => Array.isArray(record.children) && record.children.length > 0,
                expandIcon: ({ expanded, onExpand, record }) =>
                  Array.isArray(record.children) && record.children.length > 0 ? (
                    <Button
                      size="small"
                      type="text"
                      icon={expanded ? <MinusOutlined /> : <PlusOutlined />}
                      onClick={(e) => onExpand(record, e)}
                      style={{ marginRight: 6 }}
                    />
                  ) : null,
              }
              : undefined
          }
        />
      </div>

      <Modal
        title={
          editingAction
            ? "Modifier l'action corrective"
            : parentId
              ? 'Nouvelle sous-action'
              : 'Nouvelle action corrective'
        }
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditingAction(null);
          setParentId(null);
        }}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText={editingAction ? 'Enregistrer' : 'Créer'}
        cancelText="Annuler"
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item label="Type" name="type" rules={[{ required: true, message: 'Le type est requis.' }]}>
            <Select placeholder="Sélectionner un type" defaultValue={'Action corrective'}>
              {ACTION_TYPES.map((t) => (
                <Select.Option key={t} value={t}>
                  {t}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'La description est requise.' }]}
          >
            <TextArea rows={3} placeholder="Détails de l'action corrective" />
          </Form.Item>

          <Form.Item
            label="Critère d'efficacité"
            name="effectiveness_criteria"
            rules={[{ required: true, message: 'Ce champ est requis.' }]}
          >
            <TextArea rows={2} placeholder="Comment le succès sera-t-il évalué ?" />
          </Form.Item>

          <div className="grid grid-cols-3 gap-x-4">
            <Form.Item
              label="Échéance"
              name="due_date"
              rules={[{ required: true, message: 'La date est requise.' }]}
            >
              <DatePicker className="w-full" format="DD/MM/YYYY" />
            </Form.Item>

            <Form.Item name="service_id" label="Service">
              <Select
                options={services}
                placeholder="Sélectionnez un service"
                suffixIcon={<Building size={16} />}
                allowClear
              />
            </Form.Item>

            <Form.Item label="Responsable" name="responsable_id" rules={[{ required: true, message: 'Requis.' }]}>
              <Select
                options={responsibles}
                placeholder="Sélectionnez un responsable"
                suffixIcon={<User size={16} />}
                showSearch
                optionFilterProp="label"
                allowClear
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}