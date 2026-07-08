import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Radio, Select, message } from 'antd';
import reclamationApi from '../utils/reclamationApi';

const { TextArea } = Input;

const PRIORITIES = ['Basse', 'Normale', 'Haute', 'Urgente'];

export default function ReclamationStep3Modal({ reclamationId, open, onClose, onUpdated }) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) form.resetFields();
  }, [open, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await reclamationApi.updateStep3(reclamationId, {
        processing_analysis: values.processing_analysis,
        is_justifiee: values.is_justifiee,
        cause_analysis: values.cause_analysis,
        priority: values.priority,
      });
      message.success('Étape 3 enregistrée.');
      onUpdated?.();
      onClose();
    } catch (err) {
      if (err?.errorFields) return;
      message.error("Échec de l'enregistrement de l'étape 3.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Étape 3 — Traitement et cause"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={submitting}
      okText="Enregistrer"
      cancelText="Annuler"
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          label="Analyse de traitement"
          name="processing_analysis"
          rules={[{ required: true, message: 'Ce champ est requis.' }]}
        >
          <TextArea rows={3} placeholder="Analyse ou traitement effectué" />
        </Form.Item>

        <Form.Item
          label="Réclamation justifiée ?"
          name="is_justifiee"
          rules={[{ required: true, message: 'Veuillez indiquer si la réclamation est justifiée.' }]}
        >
          <Radio.Group>
            <Radio.Button value={1}>Oui</Radio.Button>
            <Radio.Button value={0}>Non</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          label="Analyse de la cause"
          name="cause_analysis"
          rules={[{ required: true, message: 'Ce champ est requis.' }]}
        >
          <TextArea rows={3} placeholder="Cause racine identifiée" />
        </Form.Item>

        <Form.Item
          label="Priorité"
          name="priority"
          rules={[{ required: true, message: 'La priorité est requise.' }]}
        >
          <Select placeholder="Sélectionner une priorité">
            {PRIORITIES.map((p) => (
              <Select.Option key={p} value={p}>
                {p}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}