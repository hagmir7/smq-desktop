import React, { useEffect, useState } from "react";
import {
    Form,
    Input,
    DatePicker,
    Row,
    Col,
    Button,
    Space,
    Select,
    message,
} from "antd";
import { api } from "../utils/api";

const { TextArea } = Input;

export default function CreateForm({ onSubmit, onCancel, loading }) {
    const [form] = Form.useForm();

    const [services, setServices] = useState([]);
    const [responsables, setResponsables] = useState([]);

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
        getServices();
        getResponsables();
    }, []);

    return (
        <Form
            form={form}
            layout="vertical"
            initialValues={{ type: "Action corrective" }}
            onFinish={(vals) =>
                onSubmit({
                    description: vals.description,
                    due_date: vals.due_date.format("YYYY-MM-DD"),
                    type: vals.type,
                    service_id: Number(vals.service_id),
                    responsable_id: Number(vals.responsable_id),
                })
            }
        >
            <Form.Item
                name="description"
                label="Description"
                rules={[{ required: true }]}
            >
                <TextArea rows={4} autoFocus />
            </Form.Item>

            <Row gutter={12}>
                <Col span={12}>
                    <Form.Item
                        name="due_date"
                        label="Date d'échéance"
                        rules={[{ required: true }]}
                    >
                        <DatePicker className="w-full" />
                    </Form.Item>
                </Col>

                <Col span={12}>
                    <Form.Item
                        name="type"
                        label="Type"
                    >
                        <Input />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={12}>
                <Col span={12}>
                    <Form.Item
                        name="service_id"
                        label="Service"
                        rules={[{ required: true }]}
                    >
                        <Select
                            placeholder="Sélectionner un service"
                            options={services}
                            showSearch
                            optionFilterProp="label"
                        />
                    </Form.Item>
                </Col>

                <Col span={12}>
                    <Form.Item
                        name="responsable_id"
                        label="Responsable"
                        rules={[{ required: true }]}
                    >
                        <Select
                            placeholder="Sélectionner un responsable"
                            options={responsables}
                            showSearch
                            optionFilterProp="label"
                        />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item className="mb-0 text-right">
                <Space>
                    <Button onClick={onCancel}>
                        Annuler
                    </Button>

                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                    >
                        Créer l'action
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    );
}