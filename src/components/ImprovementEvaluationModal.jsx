import React, { useCallback, useEffect, useState } from "react";
import { Modal, Form, Radio, Input, DatePicker, message, Select, Divider } from "antd";
import dayjs from "dayjs";
import { api } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import { Building, User } from "lucide-react";

const { TextArea } = Input;

/**
 * Modal to evaluate an improvement sheet's effectiveness and optionally close it.
 *
 * PATCH /improvement-sheets/{record.id}/evaluate
 * Body: {
 *   effectiveness: boolean,
 *   observation_description: string,
 *   evaluation_date: "YYYY-MM-DD",
 *   closed: boolean | null,
 *   closing_date: "YYYY-MM-DD" | null,
 *   description: string | null,
 *   due_date: "YYYY-MM-DD" | null,
 *   service_id: number | null,
 *   responsable_id: number | null
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

export default function ImprovementEvaluationModal({ open, record, onClose, onSuccess }) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  // Tri-state: true = "Oui" (closed), false = "No", null = "Action complémentaire"
  const [closed, setClosed] = useState(null);
  const { permissions } = useAuth();
  const [responsibles, setResponsibles] = useState([]);
  const [services, setServices] = useState([]);

  // If the record already has an evaluation date, it has already been
  // evaluated: show the form as a read-only view instead of letting the
  // user re-submit it.
  const isEvaluated = Boolean(record?.evaluation_date);

  const fetchServices = useCallback(async () => {
    try {
      const response = await api.get("services");
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
      const response = await api.get("users/responsibles");
      const rows = response?.data?.data || response?.data || [];
      setResponsibles(
        rows.map((u) => ({
          label: u.name ?? u.full_name ?? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim(),
          value: Number(u.id),
        }))
      );
    } catch (error) {
      console.error(error);
      message.error(error?.response?.data?.message || "Une erreur s'est produite");
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    if (record) {
      // Keep the true tri-state (true / false / null) instead of coercing
      // null ("Action complémentaire") into false ("No") via !!record.closed.
      // Note: if the API ever returns closed as 0/1 instead of a real boolean,
      // normalize it here, e.g.:
      // const initialClosed = record.closed === undefined || record.closed === null
      //   ? null
      //   : Boolean(record.closed);
      const initialClosed = record.closed === undefined ? null : record.closed;
      setClosed(initialClosed);
      form.setFieldsValue({
        effectiveness: record.effectiveness ?? undefined,
        observation_description: record.observation_description || "",
        evaluation_date: record.evaluation_date ? dayjs(record.evaluation_date) : dayjs(),
        closed: initialClosed,
        closing_date: record.closing_date ? dayjs(record.closing_date) : null,
        description: record.correctiveAction?.description ?? undefined,
        due_date: record.correctiveAction?.due_date ? dayjs(record.correctiveAction.due_date) : undefined,
        service_id: record.correctiveAction?.service_id ?? undefined,
        responsable_id: record.correctiveAction?.responsable_id ?? undefined,
      });
    } else {
      setClosed(null);
      form.resetFields();
    }

    fetchServices();
    fetchResponsibles();
  }, [open, record, form, fetchServices, fetchResponsibles]);

  const handleCancel = () => {
    form.resetFields();
    onClose?.();
  };

  // Reset the fields tied to a mode that's no longer active, so stale values
  // from a previous selection aren't left lingering in the form state.
  const handleClosedChange = (value) => {
    setClosed(value);
    if (value !== true) {
      form.setFieldsValue({ closing_date: null });
    }
    if (value !== null) {
      form.setFieldsValue({
        description: undefined,
        due_date: undefined,
        service_id: undefined,
        responsable_id: undefined,
      });
    }
  };

  const handleSubmit = async () => {
    // Belt-and-braces guard: the OK button is hidden/disabled in this case,
    // but don't let a stray call through if the record is already evaluated.
    if (isEvaluated) return;

    try {
      const values = await form.validateFields();

      const payload = {
        effectiveness: values.effectiveness,
        observation_description: values.observation_description,
        evaluation_date: values.evaluation_date
          ? values.evaluation_date.format("YYYY-MM-DD")
          : null,
        closed: values.closed,
        closing_date:
          values.closed === true && values.closing_date
            ? values.closing_date.format("YYYY-MM-DD")
            : null,
        description: values.closed === null ? values.description : null,
        due_date: values.closed === null && values.due_date
          ? values.due_date.format("YYYY-MM-DD")
          : null,
        service_id: values.closed === null ? (values.service_id || null) : null,
        responsable_id: values.closed === null ? (values.responsable_id || null) : null,
      };

      setSubmitting(true);

      const response = await api.patch(`improvement-sheets/${record.id}/evaluate`, payload);

      message.success("Fiche d'amélioration évaluée avec succès.");
      onSuccess?.(response.data);
      form.resetFields();
      onClose?.();
    } catch (err) {
      if (err?.errorFields) return;
      console.error(err);
      message.error(err?.response?.data?.message || "Une erreur est survenue lors de l'évaluation.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={record ? `Évaluer ${record.code || ""}` : "Évaluer la fiche"}
      onCancel={handleCancel}
      onOk={isEvaluated ? handleCancel : handleSubmit}
      confirmLoading={submitting}
      okText={isEvaluated ? "Fermer" : "Enregistrer l'évaluation"}
      cancelText="Annuler"
      // No need for two buttons that both close the modal.
      cancelButtonProps={{ style: { display: isEvaluated ? "none" : undefined } }}
      destroyOnHidden
      maskClosable={false}
    >
      <Form form={form} layout="vertical" disabled={isEvaluated}>
        <Form.Item
          name="evaluation_date"
          label="Date d'evaluation"
          rules={[{ required: true, message: "La date d'evaluation est requise" }]}
        >
          <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
        </Form.Item>

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

        <Form.Item name="closed" label="Action clôturée">
          <Radio.Group onChange={(e) => handleClosedChange(e.target.value)}>
            <Radio.Button value={true}>Oui</Radio.Button>
            <Radio.Button value={false}>No</Radio.Button>
            <Radio.Button value={null}>Action complémentaire</Radio.Button>
          </Radio.Group>
        </Form.Item>

        {closed === true && (
          <Form.Item
            name="closing_date"
            label="Date de clôture"
            rules={[{ required: true, message: "La date de clôture est requise" }]}
          >
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
        )}

        <Form.Item
          name="observation_description"
          label="Observation"
          // rules={[{ required: true, message: "La description de l'observation est requise" }]}
        >
          <TextArea
            rows={3}
            placeholder="Ex: Aucune anomalie détectée depuis la mise en place du contrôle..."
          />
        </Form.Item>

        {closed === null && (
          <div className="grid grid-cols-3 gap-x-4">
            <Divider className="col-span-3">Action complémentaire</Divider>
            <Form.Item
              label="Description"
              name="description"
              className="col-span-3"
              rules={[{ required: true, message: "La description est requise." }]}
            >
              <TextArea rows={3} placeholder="Détails de l'action corrective" />
            </Form.Item>
            <Form.Item
              label="Échéance"
              name="due_date"
              rules={[{ required: true, message: "La date est requise." }]}
            >
              <DatePicker className="w-full" format="DD/MM/YYYY" />
            </Form.Item>

            <Form.Item name="service_id" label="Processus">
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
              rules={[{ required: true, message: "Requis." }]}
            >
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
        )}
      </Form>
    </Modal>
  );
}