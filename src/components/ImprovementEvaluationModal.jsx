import React, { useEffect, useState } from "react";
import { Modal, Form, Radio, Input, DatePicker, Switch, message } from "antd";
import dayjs from "dayjs";
import { api } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";

const { TextArea } = Input;

/**
 * Modal to evaluate an improvement sheet's effectiveness and optionally close it.
 *
 * PATCH /improvement-sheets/{record.id}/evaluate
 * Body: {
 *   effectiveness: boolean,
 *   observation_description: string,
 *   observation_date: "YYYY-MM-DD",
 *   closed: boolean,
 *   closing_date: "YYYY-MM-DD" | null
 * }
 *
 * Usage:
 *   <ImprovementEvaluationModal
 *     open={open}
 *     record={evaluatingRecord}
 *     onClose={() => setOpen(false)}
 *     onSuccess={() => { ...refresh table... }}
 *   />
 */

const EFFECTIVENESS_OPTIONS = ["Efficace", "Non efficace"];
export default function ImprovementEvaluationModal({ open, record, onClose, onSuccess }) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [closed, setClosed] = useState(false);
  const {permissions} = useAuth();

  useEffect(() => {
    if (!open) return;

    if (record) {
      const initialClosed = !!record.closed;
      setClosed(initialClosed);
      form.setFieldsValue({
        effectiveness: record.effectiveness ?? undefined,
        observation_description: record.observation_description || "",
        observation_date: record.observation_date ? dayjs(record.observation_date) : dayjs(),
        closed: initialClosed,
        closing_date: record.closing_date ? dayjs(record.closing_date) : null,
      });
    } else {
      setClosed(false);
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
        effectiveness: values.effectiveness,
        observation_description: values.observation_description,
        observation_date: values.observation_date
          ? values.observation_date.format("YYYY-MM-DD")
          : null,
        closed: values.closed,
        closing_date: values.closed && values.closing_date
          ? values.closing_date.format("YYYY-MM-DD")
          : null,
      };

      setSubmitting(true);

      const response = await api.patch(
        `improvement-sheets/${record.id}/evaluate`,
        payload
      );

      message.success("Fiche d'amélioration évaluée avec succès.");
      onSuccess?.(response.data);
      form.resetFields();
      onClose?.();
    } catch (err) {
      if (err?.errorFields) return;
      console.error(err);
      message.error("Une erreur est survenue lors de l'évaluation.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={record ? `Évaluer ${record.code || ""}` : "Évaluer la fiche"}
      onCancel={handleCancel}
      onOk={handleSubmit}
      confirmLoading={submitting}
      okText="Enregistrer l'évaluation"
      cancelText="Annuler"
      destroyOnClose
      maskClosable={false}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="effectiveness"
          label="Efficacité"
          rules={[{ required: true, message: "L'efficacité est requise" }]}
        >
          <Radio.Group>
            <Radio.Button value={true}>Efficace</Radio.Button>
            <Radio.Button value={false}>Non efficace</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="observation_description"
          label="Description de l'observation"
          rules={[{ required: true, message: "La description de l'observation est requise" }]}
        >
          <TextArea
            rows={3}
            placeholder="Ex: Aucune anomalie détectée depuis la mise en place du contrôle..."
          />
        </Form.Item>

        <Form.Item
          name="observation_date"
          label="Date d'observation"
          rules={[{ required: true, message: "La date d'observation est requise" }]}
        >
          <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
        </Form.Item>

        <Form.Item name="closed" label="Clôturer la fiche" valuePropName="checked">
          <Switch onChange={setClosed} />
        </Form.Item>

        {closed && (
          <Form.Item
            name="closing_date"
            label="Date de clôture"
            rules={[{ required: true, message: "La date de clôture est requise" }]}
          >
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}