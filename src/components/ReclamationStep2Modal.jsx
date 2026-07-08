import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Radio, message } from 'antd';
import reclamationApi from '../utils/reclamationApi';

const { TextArea } = Input;

export default function ReclamationStep2Modal({ reclamationId, open, onClose, onUpdated }) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) form.resetFields();
  }, [open, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await reclamationApi.updateStep2(reclamationId, {
        post_analysis: values.post_analysis,
        is_recevable: values.is_recevable,
        corrective_action: values.corrective_action,
      });
      message.success('Étape 2 enregistrée.');
      onUpdated?.();
      onClose();
    } catch (err) {
      if (err?.errorFields) return;
      message.error("Échec de l'enregistrement de l'étape 2.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Étape 2 — Analyse et recevabilité"
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
          label="Analyse (post-analysis)"
          name="post_analysis"
          rules={[{ required: true, message: "Le champ post analysis est requis." }]}
        >
          <TextArea rows={3} placeholder="Analyse effectuée après réception" />
        </Form.Item>

        <Form.Item
          label="Réclamation recevable ?"
          name="is_recevable"
          rules={[{ required: true, message: 'Veuillez indiquer la recevabilité.' }]}
        >
          <Radio.Group>
            <Radio.Button value={true}>Oui</Radio.Button>
            <Radio.Button value={false}>Non</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          label="Action corrective proposée"
          name="corrective_action"
          rules={[{ required: true, message: 'Ce champ est requis.' }]}
        >
          <TextArea rows={3} placeholder="Proposition ou résumé de l'action corrective" />
        </Form.Item>
      </Form>
    </Modal>
  );
}