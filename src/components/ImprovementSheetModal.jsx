import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  Button,
  message,
  Spin,
} from "antd";
import { api } from "../utils/api";

const { TextArea } = Input;

export default function ImprovementSheetModal({
  open,
  onClose,
  corrective_action_id,
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);

  // --- Corrective action live-search state ---
  const [caOptions, setCaOptions] = useState([]);
  const [caFetching, setCaFetching] = useState(false);
  const caFetchIdRef = useRef(0); // guards against out-of-order responses

  useEffect(() => {
    if (open) {
      loadData();
      form.setFieldsValue({
        corrective_action_id,
        finding_source: "Action corrective",
      });
    } else {
      form.resetFields();
      setCaOptions([]);
    }
  }, [open, corrective_action_id]);

  const loadData = async () => {
    try {
      const [usersRes, servicesRes] = await Promise.all([
        api.get("users"),
        api.get("services"),
      ]);

      setUsers(usersRes.data.data || usersRes.data);
      setServices(servicesRes.data.data || servicesRes.data);
    } catch (err) {
      message.error("Erreur lors du chargement des données.");
    }
  };

  const searchCorrectiveActions = async (value) => {
    const fetchId = ++caFetchIdRef.current;
    setCaFetching(true);

    try {
      const res = await api.get("corrective-actions/list", {
        params: { search: value },
      });

      // ignore stale responses (e.g. user typed again before this resolved)
      if (fetchId !== caFetchIdRef.current) return;

      const data = res.data.data || res.data;

      setCaOptions(
        data.map((ca) => ({
          value: ca.id,
          label: ca.code ? `${ca.code} - ${ca.description}` : ca.description,
        }))
      );
    } catch (err) {
      if (fetchId === caFetchIdRef.current) {
        message.error("Erreur lors de la recherche des actions correctives.");
      }
    } finally {
      if (fetchId === caFetchIdRef.current) setCaFetching(false);
    }
  };

  // debounce the search calls (300ms)
  const debouncedSearch = useMemo(() => {
    let timeout;
    return (value) => {
      clearTimeout(timeout);
      if (!value) {
        setCaOptions([]);
        return;
      }
      timeout = setTimeout(() => searchCorrectiveActions(value), 300);
    };
  }, []);

  const onFinish = async (values) => {
    setLoading(true);

    try {
      await api.post("improvement-sheets", values);

      message.success("Fiche d'amélioration créée avec succès.");

      form.resetFields();
      onClose();
    } catch (err) {
      message.error(
        err?.response?.data?.message ||
          "Erreur lors de l'enregistrement."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      destroyOnClose
      title="Créer une fiche d'amélioration"
      centered
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          finding_source: "Action corrective",
          corrective_action_id,
        }}
      >
        {corrective_action_id ? (
          <Form.Item name="corrective_action_id" hidden>
            <Input />
          </Form.Item>
        ) : (
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Action corrective"
                name="corrective_action_id"
                rules={[
                  {
                    required: true,
                    message: "Sélectionnez une action corrective.",
                  },
                ]}
              >
                <Select
                  showSearch
                  placeholder="Rechercher une action corrective..."
                  filterOption={false}
                  notFoundContent={
                    caFetching ? <Spin size="small" /> : "Aucun résultat"
                  }
                  onSearch={debouncedSearch}
                  onFocus={() => {
                    if (caOptions.length === 0) searchCorrectiveActions("");
                  }}
                  options={caOptions}
                />
              </Form.Item>
            </Col>
          </Row>
        )}

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Source"
              name="finding_source"
              rules={[{ required: true }]}
            >
              <Input disabled />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              label="Titre"
              name="title"
              rules={[{ required: true, message: "Le titre est obligatoire." }]}
            >
              <Input placeholder="Titre de la fiche d'amélioration" />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              label="Description"
              name="description"
              rules={[
                { required: true, message: "La description est obligatoire." },
              ]}
            >
              <TextArea rows={4} />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              label="Analyse des causes"
              name="cause_analysis"
              rules={[
                {
                  required: true,
                  message: "L'analyse des causes est obligatoire.",
                },
              ]}
            >
              <TextArea rows={4} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Responsable"
              name="responsable_id"
              rules={[
                { required: true, message: "Sélectionnez un responsable." },
              ]}
            >
              <Select
                placeholder="Choisir un responsable"
                showSearch
                optionFilterProp="label"
                options={users.map((u) => ({
                  value: u.id,
                  label: u.full_name,
                }))}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Processus"
              name="service_id"
              rules={[
                { required: true, message: "Sélectionnez un processus." },
              ]}
            >
              <Select
                placeholder="Choisir un processus"
                options={services.map((s) => ({
                  value: s.id,
                  label: s.name,
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row justify="end" gutter={8}>
          <Col>
            <Button onClick={onClose}>Annuler</Button>
          </Col>

          <Col>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
            >
              Enregistrer
            </Button>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}