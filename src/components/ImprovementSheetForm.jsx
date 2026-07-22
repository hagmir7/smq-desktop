import React, { useEffect, useState, useCallback } from "react";
import {
    Form,
    Input,
    Select,
    DatePicker,
    Switch,
    Button,
    Card,
    Spin,
    message,
    Row,
    Col,
    Divider,
    Radio,
    Tag,
    Tooltip
} from "antd";
import axios from "axios";
import dayjs from "dayjs";
import { api } from "../utils/api";
import ImprovementEvaluationModal from "./ImprovementEvaluationModal";
import { AuditOutlined } from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";

const { TextArea } = Input;
const { Option } = Select;

const IMPACT_OPTIONS = ["Faible", "Moyen", "Élevé"];
const STATUT_OPTIONS = ["Planifié", "En cours", "Terminé", "Annulé"];
const EFFECTIVENESS_OPTIONS = ["Efficace", "Partiellement efficace", "Non efficace"];

const DATE_FIELDS = ["observation_date", "closing_date"];

export default function ImprovementSheetForm({ id, onSaved }) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [services, setServices] = useState([]);
    const [responsables, setResponsables] = useState([]);
    const [evaluateOpen, setEvaluateOpen] = useState(false)
    const { permissions } = useAuth();

    const [sheet, setSheet] = useState(null)

    const handleEvaluateSuccess = () => {
        setEvaluateOpen(false);
        loadData();
    };


    const loadData = useCallback(async () => {

        setLoading(true);
        try {
            const [sheetRes, servicesRes, responsablesRes] = await Promise.all([
                api.get(`/improvement-sheets/${id}`),
                api.get("/services"),
                api.get("/users/responsibles"),
            ]);

            const sheet = sheetRes.data;
            setSheet(sheet);
            setServices(servicesRes.data?.data || servicesRes.data || []);
            setResponsables(responsablesRes.data?.data || responsablesRes.data || []);

            const formValues = {
                ...sheet,
                // Select fields must be strings/numbers, not nested objects
                responsable_id: sheet.responsable_id != null ? String(sheet.responsable_id) : undefined,
                service_id: sheet.service_id != null ? String(sheet.service_id) : undefined,
            };

            DATE_FIELDS.forEach((field) => {
                formValues[field] = sheet[field] ? dayjs(sheet[field]) : null;
            });

            form.setFieldsValue(formValues);
        } catch (err) {
            console.error(err);
            message.error("Erreur lors du chargement de la fiche d'amélioration.");
        } finally {
            setLoading(false);
        }
    }, [id, form]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleFinish = async (values) => {
        setSaving(true);
        try {
            const payload = { ...values };

            // Convert dayjs objects back to ISO strings (or null) before sending
            DATE_FIELDS.forEach((field) => {
                payload[field] = values[field] ? values[field].toISOString() : null;
            });

            const { data } = await api.put(`improvement-sheets/${id}`, payload);

            message.success("Fiche d'amélioration mise à jour avec succès.");
            onSaved?.(data);
        } catch (err) {
            console.error(err);
            message.error("Erreur lors de l'enregistrement de la fiche.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
                <Spin size="large" tip="Chargement..." />
            </div>
        );
    }

    return (
        <div className="px-3">
            <div className="flex justify-between p-0  mt-3 pb-0">
                <h1 className="text-lg" style={{ paddingBottom: 0 }}>Fiche d'amélioration <Tag>{sheet?.code}</Tag></h1>
                <Tooltip title="Évaluer">
                    <Button
                        type="primary"
                         disabled={!permissions('evaluer.fiche_amelioration')}
                        icon={<AuditOutlined />}
                        onClick={() => setEvaluateOpen(true)}
                    >Évaluer</Button>
                </Tooltip>
            </div>
            <Form form={form} layout="vertical" onFinish={handleFinish}>
                <div className="md:flex gap-4">
                    <div className="w-full">
                        <Divider orientation="left" orientationMargin={0}>
                            Informations générales
                        </Divider>

                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item
                                    name="title"
                                    label="Titre"
                                    rules={[{ required: true, message: "Le titre est requis" }]}
                                >
                                    <Input placeholder="Titre de la fiche" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="finding_source"
                                    label="Source du constat"
                                    rules={[{ required: true, message: "Champ requis" }]}
                                >
                                    <Input placeholder="Ex: Action corrective" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="impact" label="Impact" rules={[{ required: true }]}>
                                    <Select placeholder="Sélectionner l'impact">
                                        {IMPACT_OPTIONS.map((opt) => (
                                            <Option key={opt} value={opt}>
                                                {opt}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                {/* Select populated from GET /services */}
                                <Form.Item
                                    name="service_id"
                                    label="Service"
                                    rules={[{ required: true, message: "Le service est requis" }]}
                                >
                                    <Select
                                        showSearch
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
                            </Col>
                            <Col span={12}>
                                {/* Select populated from GET /users/responsibles */}
                                <Form.Item
                                    name="responsable_id"
                                    label="Responsable"
                                    rules={[{ required: true, message: "Le responsable est requis" }]}
                                >
                                    <Select
                                        showSearch
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
                            </Col>
                        </Row>

                        <Form.Item name="description" label="Description">
                            <TextArea rows={3} placeholder="Description de la fiche d'amélioration" />
                        </Form.Item>

                        <Form.Item name="cause_analysis" label="Analyse des causes">
                            <TextArea rows={3} placeholder="Analyse des causes" />
                        </Form.Item>
                    </div>

                    <div className="w-full">
                        <Divider orientation="left" orientationMargin={0}>
                            Suivi & Évaluation
                        </Divider>

                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item name="statut" label="Statut" rules={[{ required: true }]}>
                                    <Select disabled placeholder="Sélectionner le statut">
                                        {STATUT_OPTIONS.map((opt) => (
                                            <Option key={opt} value={opt}>
                                                {opt}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>

                            <Col span={10}>
                                <Form.Item
                                    name="effectiveness"
                                    label="Efficacité"
                                // rules={[{ required: true, message: "L'efficacité est requise" }]}
                                >
                                    <Radio.Group disabled>
                                        <Radio.Button value={true}>Efficace</Radio.Button>
                                        <Radio.Button value={false}>Non efficace</Radio.Button>
                                    </Radio.Group>
                                </Form.Item>
                            </Col>

                            <Col span={6}>
                                <Form.Item name="closed" label="Clôturée" valuePropName="checked">
                                    <Switch disabled />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="observation_date" label="Date d'observation">
                                    <DatePicker
                                        disabled
                                        style={{ width: "100%" }}
                                        format="DD/MM/YYYY"
                                    />
                                </Form.Item>
                            </Col>

                            <Col span={12}>
                                <Form.Item name="closing_date" label="Date de clôture">
                                    <DatePicker
                                        disabled
                                        style={{ width: "100%" }}
                                        format="DD/MM/YYYY"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            name="observation_description"
                            label="Description de l'observation"
                        >
                            <TextArea
                                disabled
                                rows={3}
                                placeholder="Description de l'observation"
                            />
                        </Form.Item>
                    </div>
                </div>

                <Form.Item>
                    <Button  disabled={!permissions('modifier.fiche_amelioration')} type="primary" htmlType="submit" loading={saving}>
                        Enregistrer
                    </Button>
                    <Button style={{ marginLeft: 8 }} onClick={loadData} disabled={saving}>
                        Réinitialiser
                    </Button>
                </Form.Item>
            </Form>

            <ImprovementEvaluationModal
                open={evaluateOpen}
                record={sheet}
                onClose={() => setEvaluateOpen(false)}
                onSuccess={handleEvaluateSuccess}
            />
        </div>
    );
}