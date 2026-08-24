import React, { useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  message,
} from 'antd';
import { api } from '../utils/api';

export default function PersonForm({
  open,
  onCancel,
  onSuccess,
}) {
  const [form] = Form.useForm();

  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      setLoading(true);

      const response = await api.post('persons', {
        full_name: values.full_name.trim(),
        code: values.code?.trim() || null,
      });

      const person =
        response?.data?.data || response?.data;

      message.success(
        'Personne créée avec succès.'
      );

      form.resetFields();

      onSuccess?.(person);

    } catch (error) {
      console.error(error);

      // Ant Design validation error
      if (error?.errorFields) {
        return;
      }

      message.error(
        error?.response?.data?.message ||
          'Erreur lors de la création de la personne.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (loading) return;

    form.resetFields();
    onCancel?.();
  };

  return (
    <Modal
      title="Nouvelle personne"
      open={open}
      onCancel={handleCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="Créer"
      cancelText="Annuler"
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        className="mt-4"
      >
        <Form.Item
          label="Nom complet"
          name="full_name"
          rules={[
            {
              required: true,
              whitespace: true,
              message:
                'Veuillez saisir le nom complet.',
            },
            {
              max: 255,
              message:
                'Le nom complet ne peut pas dépasser 255 caractères.',
            },
          ]}
        >
          <Input
            placeholder="Ex. Mohamed "
            autoFocus
          />
        </Form.Item>

        <Form.Item
          label="Matricule"
          name="code"
          rules={[
            {
              max: 50,
              message:
                'Le code ne peut pas dépasser 50 caractères.',
            },
          ]}
        >
          <Input
            placeholder="Ex. P001"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}