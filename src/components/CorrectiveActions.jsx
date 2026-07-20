import React, { useEffect, useState } from "react";
import {
  List,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Empty,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import reclamationApi from "../utils/reclamationApi";
import { api } from "../utils/api";

const { TextArea } = Input;

const ACTION_TYPES = [
  "Action corrective",
];

export default function CorrectiveActions({ reclamationId }) {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const [services, setServices] = useState([]);
  const [responsables, setResponsables] = useState([]);

  const fetchActions = async () => {
    if (!reclamationId) return;

    setLoading(true);

    try {
      const res = await reclamationApi.listCorrectiveActions(reclamationId);
      const rows = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setActions(rows);
    } catch (err) {
      message.error("Impossible de charger les actions correctives.");
    } finally {
      setLoading(false);
    }
  };

  const getServices = async () => {
    try {
      const { data } = await api.get("services");

      const rows = Array.isArray(data) ? data : data?.data ?? [];

      setServices(
        rows.map((item) => ({
          label: item.name,
          value: Number(item.id),
        }))
      );
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          "Erreur lors du chargement des services."
      );
    }
  };

  const getResponsables = async () => {
    try {
      const { data } = await api.get("users/responsibles");

      const rows = Array.isArray(data) ? data : data?.data ?? [];

      setResponsables(
        rows.map((item) => ({
          label: item.full_name || item.name,
          value: Number(item.id),
        }))
      );
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          "Erreur lors du chargement des responsables."
      );
    }
  };

  useEffect(() => {
    fetchActions();
    getServices();
    getResponsables();
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
        due_date: values.due_date
          ? values.due_date.format("YYYY-MM-DD")
          : null,
        service_id: Number(values.service_id),
        responsable_id: Number(values.responsable_id),
      });

      message.success("Action corrective créée.");

      form.resetFields();
      setModalOpen(false);
      fetchActions();
    } catch (err) {
      if (err?.errorFields) return;

      console.error(err);

      message.error("Échec de la création de l'action corrective.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-base font-medium m-0">
          Actions correctives
        </h4>

        <Button
          size="small"
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
        >
          Ajouter
        </Button>
      </div>

      <List
        loading={loading}
        dataSource={actions}
        locale={{
          emptyText: <Empty description="Aucune action corrective" />,
        }}
        renderItem={(item) => (
          <List.Item>
            <div className="w-full">
              <div className="flex items-center justify-between">
                <Tag color="geekblue">{item.type}</Tag>

                {item.due_date && (
                  <span className="text-xs text-gray-500">
                    Échéance :{" "}
                    {dayjs(item.due_date).format("DD/MM/YYYY")}
                  </span>
                )}
              </div>

              <p className="mt-2 mb-1">{item.description}</p>

              {item.effectiveness_criteria && (
                <p className="text-xs text-gray-500 mb-0">
                  Critère d'efficacité :{" "}
                  {item.effectiveness_criteria}
                </p>
              )}
            </div>
          </List.Item>
        )}
      />

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
            rules={[
              {
                required: true,
                message: "Le type est requis.",
              },
            ]}
          >
            <Select
              placeholder="Sélectionner un type"
              defaultValue={'Action corrective'}
              options={ACTION_TYPES.map((t) => ({
                label: t,
                value: t,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[
              {
                required: true,
                message: "La description est requise.",
              },
            ]}
          >
            <TextArea
              rows={3}
              placeholder="Détails de l'action corrective"
            />
          </Form.Item>

          <Form.Item
            label="Critère d'efficacité"
            name="effectiveness_criteria"
            rules={[
              {
                required: true,
                message: "Ce champ est requis.",
              },
            ]}
          >
            <TextArea
              rows={2}
              placeholder="Comment le succès sera-t-il évalué ?"
            />
          </Form.Item>

          <div className="grid grid-cols-3 gap-x-4">
            <Form.Item
              label="Échéance"
              name="due_date"
              rules={[
                {
                  required: true,
                  message: "La date est requise.",
                },
              ]}
            >
              <DatePicker
                className="w-full"
                format="DD/MM/YYYY"
              />
            </Form.Item>

            <Form.Item
              label="Service"
              name="service_id"
              rules={[
                {
                  required: true,
                  message: "Requis.",
                },
              ]}
            >
              <Select
                placeholder="Sélectionner un service"
                options={services}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>

            <Form.Item
              label="Responsable"
              name="responsable_id"
              rules={[
                {
                  required: true,
                  message: "Requis.",
                },
              ]}
            >
              <Select
                placeholder="Sélectionner un responsable"
                options={responsables}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}