import React, { useEffect } from 'react';
import { Modal, Form, Input, Radio, Select, message, DatePicker } from 'antd';
import dayjs from 'dayjs';
import reclamationApi from '../utils/reclamationApi';

const { TextArea } = Input;

const PRIORITIES = ['Normale', 'Critique', 'Urgente'];

export default function ReclamationStep3Modal({
  reclamationId,
  open,
  onClose,
  onUpdated,
}) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = React.useState(false);

  // Watch the selected value
  const isJustifiee = Form.useWatch('is_justifiee', form);

  // Disable only when "Non" is selected
  const disabled = isJustifiee === 0;

  useEffect(() => {
    if (!open || !reclamationId) return;

    form.resetFields();
    fetchReclamation();
  }, [open, reclamationId]);

  const populateForm = (data) => {
    form.setFieldsValue({
      processing_analysis: data?.processing_analysis || '',
      cause_analysis: data?.cause_analysis || '',
      priority: data?.priority || undefined,
      planned_closing_date: data?.planned_closing_date
        ? dayjs(data.planned_closing_date)
        : null,
      is_justifiee:
        data?.is_justifiee !== null && data?.is_justifiee !== undefined
          ? Number(data.is_justifiee)
          : undefined,
    });
  };

  const fetchReclamation = async () => {
    try {
      setSubmitting(true);

      const response = await reclamationApi.show(reclamationId);
      populateForm(response.data);
    } catch (err) {
      console.error(err);
      message.error("Impossible de charger les données de l'étape 3.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      setSubmitting(true);

      await reclamationApi.updateStep3(reclamationId, {
        processing_analysis: values.processing_analysis,
        is_justifiee: values.is_justifiee,
        cause_analysis: values.cause_analysis,
        priority: values.priority,
        planned_closing_date: values.planned_closing_date
          ? values.planned_closing_date.format('YYYY-MM-DD')
          : null,
      });

      message.success("L'analyse a été enregistrée avec succès.");

      onUpdated?.();
      onClose();
    } catch (err) {
      console.error(err);

      if (err?.errorFields) return;

      message.error(
        err?.response?.data?.message ||
          "Échec de l'enregistrement de l'étape 3."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Analyse et Traitement"
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
          <TextArea
            rows={3}
            placeholder="Analyse ou traitement effectué"
          />
        </Form.Item>

        <Form.Item
          label="Réclamation justifiée ?"
          name="is_justifiee"
          rules={[
            {
              required: true,
              message: 'Veuillez indiquer si la réclamation est justifiée.',
            },
          ]}
        >
          <Radio.Group>
            <Radio.Button value={1}>Oui</Radio.Button>
            <Radio.Button value={0}>Non</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          label="Analyse de la cause"
          name="cause_analysis"
          rules={[{ required: !disabled, message: 'Ce champ est requis.' }]}
        >
          <TextArea
            rows={3}
            placeholder="Cause racine identifiée"
            disabled={disabled}
          />
        </Form.Item>

        <div className="flex gap-3">
          <Form.Item
            label="Priorité"
            name="priority"
            className="w-full"
            rules={[
              {
                required: !disabled,
                message: 'La priorité est requise.',
              },
            ]}
          >
            <Select
              placeholder="Sélectionner une priorité"
              disabled={disabled}
            >
              {PRIORITIES.map((priority) => (
                <Select.Option key={priority} value={priority}>
                  {priority}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Clôture prévue"
            name="planned_closing_date"
            className="w-full"
          >
            <DatePicker
              className="w-full"
              format="YYYY-MM-DD"
              disabled={disabled}
            />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}