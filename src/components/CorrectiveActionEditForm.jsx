import React, { useEffect, useState } from "react";
import { Form, Input, DatePicker, Button, Select, message } from "antd";
import dayjs from "dayjs";
import { api } from "../utils/api";

const { TextArea } = Input;

export default function CorrectiveActionEditForm({ item, onSubmit, loading }) {
    const [form] = Form.useForm();
    const [responsables, setResponsables] = useState([]);

    const getResponsables = async () => {
        try {
            const { data } = await api.get("users/responsibles");

            setResponsables(
                (data || []).map((user) => ({
                    label: user.full_name || user.name,
                    value: Number(user.id),
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
        getResponsables();
    }, []);

    useEffect(() => {
        if (item) {
            form.setFieldsValue({
                description: item.description,
                due_date: item.due_date ? dayjs(item.due_date) : null,
                responsable_id: Number(item.responsable_id),
            });
        }
    }, [item, responsables, form]);

    return (
        <Form
            form={form}
            layout="vertical"
            initialValues={{
                description: item.description,
                due_date: item.due_date ? dayjs(item.due_date) : null,
                responsable_id: item.responsable_id,
            }}
            onFinish={(vals) =>
                onSubmit({
                    description: vals.description,
                    due_date: vals.due_date.format("YYYY-MM-DD"),
                    responsable_id: Number(vals.responsable_id),
                })
            }
        >
            <Form.Item
                name="description"
                label="Description"
                rules={[{ required: true }]}
            >
                <TextArea rows={4} />
            </Form.Item>

            <Form.Item
                name="due_date"
                label="Date d'échéance"
                rules={[{ required: true }]}
            >
                <DatePicker className="w-full" />
            </Form.Item>

            <Form.Item
                name="responsable_id"
                label="Responsable"
                rules={[{ required: true }]}
            >
                <Select
                    options={responsables}
                    placeholder="Sélectionner un responsable"
                />
            </Form.Item>

            <Form.Item className="mb-0 text-right">
                <Button type="primary" htmlType="submit" loading={loading}>
                    Enregistrer
                </Button>
            </Form.Item>
        </Form>
    );
}