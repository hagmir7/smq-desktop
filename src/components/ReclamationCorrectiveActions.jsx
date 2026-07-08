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
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import reclamationApi from '../utils/reclamationApi';
import { Building } from 'lucide-react';
import { api } from '../utils/api';

const { TextArea } = Input;

const ACTION_TYPES = ['Action corrective', 'Action préventive', 'Action curative'];

export default function ReclamationCorrectiveActions({ reclamationId }) {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchActions = async () => {
    if (!reclamationId) return;
    setLoading(true);
    try {
      const res = await reclamationApi.listCorrectiveActions(reclamationId);
      const rows = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setActions(rows);
    } catch (err) {
      message.error('Impossible de charger les actions correctives.');
    } finally {
      setLoading(false);
    }
  };

    const fetchServices = useCallback(async () => {
        try {
            const response = await api.get("services");
            setServices(
                (response?.data?.data || []).map((s) => ({
                    label: s.name,
                    value: s.id,
                }))
            );
        } catch (error) {
            console.error(error);
            message.error(error?.response?.data?.message || "Une erreur s'est produite"
            );
        }
    }, []);

  useEffect(() => {
    fetchServices()
    fetchActions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reclamationId]);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await reclamationApi.createCorrectiveAction(reclamationId, {
        description: values.description,
        type: values.type,
        effectiveness_criteria: values.effectiveness_criteria,
        due_date: values.due_date ? dayjs(values.due_date).format('YYYY-MM-DD') : undefined,
        service_id: values.service_id,
        responsable_id: values.responsable_id,
      });
      message.success('Action corrective créée.');
      form.resetFields();
      setModalOpen(false);
      fetchActions();
    } catch (err) {
      console.error(err);
      if (err?.errorFields) return;
      message.error("Échec de la création de l'action corrective.");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (type) => <Tag color="geekblue">{type}</Tag>,
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
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-base font-medium m-0">Actions correctives</h4>
        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          Ajouter
        </Button>
      </div>

      <div className='border border-solid border-gray-200 rounded-lg overflow-hidden border-b-0'>
        <Table
          size="small"
          loading={loading}
          dataSource={actions}
          columns={columns}
          rowKey={(record) => record.id ?? `${record.type}-${record.description}`}
          pagination={false}
          locale={{ emptyText: 'Aucune action corrective' }}
          childrenColumnName="__no_children__"
        />
      </div>

      <Modal
        title="Nouvelle action corrective"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleCreate}
        confirmLoading={submitting}
        okText="Créer"
        cancelText="Annuler"
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            label="Type"
            name="type"
            rules={[{ required: true, message: 'Le type est requis.' }]}
          >
            <Select placeholder="Sélectionner un type">
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

        

            <Form.Item  name="service_id" label="Service">
              <Select
                options={services}
                placeholder="Sélectionnez un service"
                suffixIcon={<Building size={16} />}
                allowClear
              />
            </Form.Item>

            <Form.Item
              label="Responsable"
              name="responsable_id"
              rules={[{ required: true, message: 'Requis.' }]}
            >
              <InputNumber className="w-full" min={1} placeholder="ID responsable" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}