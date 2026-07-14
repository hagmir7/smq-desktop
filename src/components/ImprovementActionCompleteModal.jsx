import React, { useEffect, useState } from "react";
import { Modal, Form, Select, DatePicker, message } from "antd";
import dayjs from "dayjs";
import { api } from "../utils/api";

const { Option } = Select;

const EFFECTIVENESS_OPTIONS = ["Efficace", "Partiellement efficace", "Non efficace"];

/**
 * Modal to mark an improvement action as completed.
 *
 * PATCH improvement-actions/{record.id}/complete
 * Body: { completion_date: "YYYY-MM-DD", effectiveness: "..." }
 *
 * Usage:
 *   <ImprovementActionCompleteModal
 *     open={open}
 *     record={completingRecord}
 *     onClose={() => setOpen(false)}
 *     onSuccess={() => { ...refresh table... }}
 *   />
 */
export default function ImprovementActionCompleteModal({ open, record, onClose, onSuccess }) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (record) {
      form.setFieldsValue({
        completion_date: record.completion_date ? dayjs(record.completion_date) : dayjs(),
        effectiveness: record.effectiveness || undefined,
      });
    } else {
      form.resetFields();
    }
  }, [open, record, form]);

  const handleCancel = () => {
    form.resetFields();
    onClose?.();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const payload = {
        completion_date: values.completion_date.format("YYYY-MM-DD"),
        effectiveness: values.effectiveness,
      };

      setSubmitting(true);

      const response = await api.patch(
        `improvement-actions/${record.id}/complete`,
        payload
      );

      message.success("Action marquée comme terminée.");
      onSuccess?.(response.data);
      form.resetFields();
      onClose?.();
    } catch (err) {
      if (err?.errorFields) return; // form validation error, already shown inline
      console.error(err);
      message.error(err?.response?.data?.message || "Une erreur est survenue lors de la clôture de l'action.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Clôturer l'action d'amélioration"
      onCancel={handleCancel}
      onOk={handleSubmit}
      confirmLoading={submitting}
      okText="Clôturer"
      cancelText="Annuler"
      destroyOnClose
      maskClosable={false}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="completion_date"
          label="Date de réalisation"
          rules={[{ required: true, message: "La date de réalisation est requise" }]}
        >
          <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
        </Form.Item>

        <Form.Item
          name="effectiveness"
          label="Efficacité"
          rules={[{ required: true, message: "L'efficacité est requise" }]}
        >
          <Select placeholder="Sélectionner l'efficacité">
            {EFFECTIVENESS_OPTIONS.map((opt) => (
              <Option key={opt} value={opt}>
                {opt}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}