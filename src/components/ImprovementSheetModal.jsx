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
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import { api } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";


const { TextArea } = Input;

/**
 * Create/Edit modal for Improvement Sheets.
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - onSaved?: (data) => void          // called after successful create/update
 * - corrective_action_id?: number     // preselects/locks the corrective action (create only)
 * - record?: object | null            // pass the improvement sheet record to edit; omit/null to create
 * - id?: number | string              // alternatively pass just the id to edit (will fetch the record)
 */
export default function ImprovementSheetModal({
  open,
  onClose,
  onSaved,
  corrective_action_id,
  record = null,
  id = null,
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);


  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const {user} = useAuth()

  // --- Corrective action live-search state ---
  const [caOptions, setCaOptions] = useState([]);
  const [caFetching, setCaFetching] = useState(false);
  const caFetchIdRef = useRef(0); // guards against out-of-order responses

  const editingId = record?.id ?? id ?? null;
  const isEdit = !!editingId;

  useEffect(() => {
    if (open) {
      init();
    } else {
      form.resetFields();
      setCaOptions([]);
    }
  }, [open, corrective_action_id, editingId]);

  const init = async () => {
    await loadOptions();

    if (isEdit) {
      await loadSheet();
    } else {
      form.setFieldsValue({
        corrective_action_id,
        finding_source: "Action corrective",
        responsibles: [{ responsable_id: undefined, service_id: undefined }],
      });
    }
  };

  const loadOptions = async () => {
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

  const loadSheet = async () => {
    setFetching(true);
    try {
      // Reuse the passed-in record if it already has what we need,
      // otherwise fetch it fresh (also covers the id-only usage).
      let sheet = record;
      if (!sheet || !sheet.responsibles) {
        const res = await api.get(`improvement-sheets/${editingId}`);
        sheet = res.data.data || res.data;
      }

      // Preload the corrective action select with its current value
      if (sheet.corrective_action) {
        setCaOptions([
          {
            value: sheet.corrective_action.id,
            label: sheet.corrective_action.code
              ? `${sheet.corrective_action.code} - ${sheet.corrective_action.description}`
              : sheet.corrective_action.description,
          },
        ]);
      }

      form.setFieldsValue({
        corrective_action_id: Number(sheet.corrective_action_id),
        finding_source: sheet.finding_source,
        title: sheet.title,
        description: sheet.description,
        service_id: Number(sheet.service_id),
        responsable_id: 3,
        cause_analysis: sheet.cause_analysis,
        responsibles:
          sheet.responsibles?.length > 0
            ? sheet.responsibles.map((r) => ({
                responsable_id: Number(r.responsable_id),
                service_id: Number(r.service_id),
              }))
            : [{ responsable_id: undefined, service_id: undefined }],
      });
    } catch (err) {
      message.error("Erreur lors du chargement de la fiche.");
    } finally {
      setFetching(false);
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
      let data;
      if (isEdit) {
        const res = await api.put(`improvement-sheets/${editingId}`, values);
        data = res.data;
        console.log(res);
        message.success("Fiche d'amélioration mise à jour avec succès.");
      } else {
        const res = await api.post("improvement-sheets", values);
        data = res.data;
        message.success("Fiche d'amélioration créée avec succès.");
      }

      form.resetFields();
      onSaved?.(data);
      onClose();
    } catch (err) {
      console.error(err);
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
      destroyOnHidden
      title={
        isEdit
          ? "Modifier la fiche d'amélioration"
          : "Créer une fiche d'amélioration"
      }
      centered
    >
      <Spin spinning={fetching}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            finding_source: "Action corrective",
            corrective_action_id,
            responsable_id: 3,
            service_id: Number(user?.service_id),
            responsibles: [{ responsable_id: undefined, service_id: undefined }],
          }}
        >
          {corrective_action_id && !isEdit ? (
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

            <Col span={12}>
              <Form.Item
                label="Emetteur"
                name="responsable_id"
            
                rules={[
                  { required: true, message: "Sélectionnez un emetteur." },
                ]}
              >
                <Select
                  defaultValue={2}
                  placeholder="Choisir un emetteur"
                  showSearch
                  disabled
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
                  disabled
                  options={services.map((s) => ({
                    value: s.id,
                    label: s.name,
                  }))}
                />
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
                label="Causes identifiées"
                name="cause_analysis"
                rules={[
                  {
                    required: true,
                    message: "L'Causes identifiées est obligatoire.",
                  },
                ]}
              >
                <TextArea rows={4} />
              </Form.Item>
            </Col>
          </Row>
          <Row justify="end" gutter={8}>
            <Col>
              <Button onClick={onClose}>Annuler</Button>
            </Col>

            <Col>
              <Button type="primary" htmlType="submit" loading={loading}>
                Enregistrer
              </Button>
            </Col>
          </Row>
        </Form>
      </Spin>
    </Modal>
  );
}