import React, { useEffect, useState } from "react";
import {
    Form,
    Input,
    DatePicker,
    Row,
    Col,
    Button,
    message,
    Select,
} from "antd";
import { GitBranch } from "lucide-react";
import { api } from "../utils/api";

const { TextArea } = Input;

export default function CorrectiveActionChildForm({ onSubmit, loading }) {
    const [form] = Form.useForm();

    const [services, setServices] = useState([]);
    const [responsables, setResponsables] = useState([]);

    const getServices = async () => {
        try {
            const { data } = await api.get("services");

            const items = (data?.data || []).map((item) => ({
                label: item.name,
                value: item.id,
            }));

            setServices(items);

            if (items.length) {
                form.setFieldValue("service_id", items[0].value);
            }
        } catch (error) {
            message.error(
                error?.response?.data?.message || "Erreur lors du chargement des services."
            );
        }
    };

    const getResponsables = async () => {
        try {
            const { data } = await api.get("users/responsibles");

            const items = (data || []).map((item) => ({
                label: item.full_name || item.name,
                value: item.id,
            }));

            setResponsables(items);

            if (items.length) {
                form.setFieldValue("responsable_id", items[0].value);
            }
        } catch (error) {
            message.error(
                error?.response?.data?.message ||
                "Erreur lors du chargement des responsables."
            );
        }
    };

    useEffect(() => {
        getServices();
        getResponsables();
    }, []);

    const handleFinish = (values) => {
        console.log(values);

        const payload = {
            description: values.description,
            due_date: values.due_date?.format("YYYY-MM-DD"),
            type: "Action corrective",
            service_id: Number(values.service_id),
            responsable_id: Number(values.responsable_id),
        };

        onSubmit(payload);
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
        >
            <Form.Item
                name="description"
                label="Description"
                rules={[
                    {
                        required: true,
                        message: "Veuillez saisir une description.",
                    },
                ]}
            >
                <TextArea
                    rows={4}
                    placeholder="Pourquoi l'action initiale n'a pas suffi, et ce qui est renforcé…"
                />
            </Form.Item>

            <Form.Item
                name="due_date"
                label="Date d'échéance"
                rules={[
                    {
                        required: true,
                        message: "Veuillez sélectionner une date.",
                    },
                ]}
            >
                <DatePicker className="w-full" />
            </Form.Item>

            <Row gutter={12}>
                <Col span={12}>
                    <Form.Item
                        name="service_id"
                        label="Service"
                        rules={[
                            {
                                required: true,
                                message: "Veuillez sélectionner un service.",
                            },
                        ]}
                    >
                        <Select
                            options={services}
                            placeholder="Sélectionner un service"
                            loading={!services.length}
                        />
                    </Form.Item>
                </Col>

                <Col span={12}>
                    <Form.Item
                        name="responsable_id"
                        label="Responsable"
                        rules={[
                            {
                                required: true,
                                message: "Veuillez sélectionner un responsable.",
                            },
                        ]}
                    >
                        <Select
                            options={responsables}
                            placeholder="Sélectionner un responsable"
                            loading={!responsables.length}
                        />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item className="mb-0 text-right">
                <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<GitBranch size={14} />}
                >
                    Créer le suivi
                </Button>
            </Form.Item>
        </Form>
    );
}