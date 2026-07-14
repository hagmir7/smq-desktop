import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Select, DatePicker, message } from "antd";
import dayjs from "dayjs";
import { api } from "../utils/api";
import { locale } from "../utils/config";

const { TextArea } = Input;
const { Option } = Select;

/**
 * Modal form to create or update an "improvement action".
 *
 * Create -> POST /improvement-sheets/{improvementSheetId}/improvement-actions
 * Update -> PATCH //improvement-actions/{record.id}
 *
 * Usage:
 *   <ImprovementActionModal
 *     open={open}
 *     mode="create"                 // or "update"
 *     improvementSheetId={sheetId}  // required when mode="create"
 *     record={editingRecord}        // required when mode="update"
 *     onClose={() => setOpen(false)}
 *     onSuccess={(action) => { ...refresh table... }}
 *   />
 */
export default function ImprovementActionModal({
  open,
  mode = "create", // "create" | "update"
  improvementSheetId,
  record,
  onClose,
  onSuccess,
}) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [services, setServices] = useState([]);
  const [responsables, setResponsables] = useState([]);

  const isUpdate = mode === "update";

  // Load select options whenever the modal opens
  useEffect(() => {
    if (!open) return;

    const loadOptions = async () => {
      setLoadingOptions(true);
      try {
        const [servicesRes, responsablesRes] = await Promise.all([
          api.get("services"),
          api.get("users/responsibles"),
        ]);
        setServices(servicesRes.data?.data || servicesRes.data || []);
        setResponsables(responsablesRes.data?.data || responsablesRes.data || []);
      } catch (err) {
        console.error(err);
        message.error("Erreur lors du chargement des listes.");
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, [open]);

  // Fill / reset the form whenever the modal opens
  useEffect(() => {
    if (!open) return;

    if (isUpdate && record) {
      form.setFieldsValue({
        description: record.description,
        responsable_id: record.responsable_id != null ? String(record.responsable_id) : undefined,
        service_id: record.service_id != null ? String(record.service_id) : undefined,
        effectiveness_criteria: record.effectiveness_criteria,
        due_date: record.due_date ? dayjs(record.due_date) : null,
      });
    } else {
      form.resetFields();
    }
  }, [open, isUpdate, record, form]);

  const handleCancel = () => {
    form.resetFields();
    onClose?.();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const payload = {
        ...values,
        due_date: values.due_date ? values.due_date.format("YYYY-MM-DD") : null,
        responsable_id: values.responsable_id != null ? Number(values.responsable_id) : undefined,
        service_id: values.service_id != null ? Number(values.service_id) : undefined,
      };

      setSubmitting(true);

      let response;
      if (isUpdate) {
        response = await api.put(`improvement-actions/${record.id}`, payload);
        message.success("Action d'amélioration mise à jour avec succès.");
      } else {
        response = await api.post(`improvement-sheets/${improvementSheetId}/improvement-actions`, payload);
        message.success("Action d'amélioration créée avec succès.");
      }

      onSuccess?.(response.data);
      form.resetFields();
      onClose?.();
    } catch (err) {
      if (err?.errorFields) return;
      console.error(err);
      message.error("Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={isUpdate ? "Modifier l'action d'amélioration" : "Nouvelle action d'amélioration"}
      onCancel={handleCancel}
      onOk={handleSubmit}
      confirmLoading={submitting}
      okText={isUpdate ? "Mettre à jour" : "Créer"}
      cancelText="Annuler"
      destroyOnClose
      maskClosable={false}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: "La description est requise" }]}
        >
          <TextArea rows={3} placeholder="Décrire l'action à mener" />
        </Form.Item>

        <Form.Item
          name="responsable_id"
          label="Responsable"
          rules={[{ required: true, message: "Le responsable est requis" }]}
        >
          <Select
            showSearch
            loading={loadingOptions}
            placeholder="Sélectionner un responsable"
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
            }
          >
            {responsables.map((user) => (
              <Option key={user.id} value={String(user.id)}>
                {user.full_name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* service_id is required on create; kept editable on update too, remove if not needed */}
        <Form.Item
          name="service_id"
          label="Service"
          rules={[{ required: !isUpdate, message: "Le service est requis" }]}
        >
          <Select
            showSearch
            loading={loadingOptions}
            placeholder="Sélectionner un service"
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
            }
          >
            {services.map((service) => (
              <Option key={service.id} value={String(service.id)}>
                {service.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="effectiveness_criteria"
          label="Critères d'efficacité"
          rules={[{ required: !isUpdate, message: "Les critères d'efficacité sont requis" }]}
        >
          <TextArea rows={2} placeholder="Ex: 100% des opérateurs formés et certifiés..." />
        </Form.Item>

        <Form.Item
          name="due_date"
          label="Date d'échéance"
          rules={[{ required: true, message: "La date d'échéance est requise" }]}
        >
          <DatePicker locale={locale} style={{ width: "100%" }} format="DD/MM/YYYY" />
        </Form.Item>
      </Form>
    </Modal>
  );
}