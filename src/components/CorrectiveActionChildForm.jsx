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
import { PlusOutlined } from "@ant-design/icons";
import PersonForm from "./PersonForm";

const { TextArea } = Input;

export default function CorrectiveActionChildForm({ onSubmit, loading }) {
    const [form] = Form.useForm();

    const [personModalOpen, setPersonModalOpen] = useState(false);

    const [services, setServices] = useState([]);
    const [persons, setPersons] = useState([]);
    const [servicesLoading, setServicesLoading] = useState(false);
    const [personsLoading, setPersonsLoading] = useState(false);

    const getServices = async () => {
        try {
            setServicesLoading(true);

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
                error?.response?.data?.message ||
                "Erreur lors du chargement des services."
            );
        } finally {
            setServicesLoading(false);
        }
    };

    const getPersons = async () => {
        try {
            setPersonsLoading(true);

            const { data } = await api.get("persons");

            const items = (data || []).map((item) => ({
                label: item.full_name,
                value: item.id,
            }));

            setPersons(items);

            if (items.length) {
                form.setFieldValue("person_id", items[0].value);
            }
        } catch (error) {
            message.error(
                error?.response?.data?.message ||
                "Erreur lors du chargement des personnes."
            );
        } finally {
            setPersonsLoading(false);
        }
    };

    useEffect(() => {
        getServices();
        getPersons();
    }, []);

    const handleFinish = (values) => {
        const payload = {
            description: values.description,
            due_date: values.due_date?.format("YYYY-MM-DD"),
            type: "Action corrective",
            service_id: Number(values.service_id),
            person_id: Number(values.person_id),
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
                        label="Processus"
                        rules={[
                            {
                                required: true,
                                message:
                                    "Veuillez sélectionner un processus.",
                            },
                        ]}
                    >
                        <Select
                            options={services}
                            placeholder="Sélectionner un processus"
                            loading={servicesLoading}
                        />
                    </Form.Item>
                </Col>

                <Col span={12}>
                    <Form.Item
                        label="RSP de traitment"
                        required
                    >
                        <div className="flex items-start gap-2">
                            <Form.Item
                                name="person_id"
                                noStyle
                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Veuillez sélectionner une personne.",
                                    },
                                ]}
                            >
                                <Select
                                    options={persons}
                                    placeholder="Sélectionner une personne"
                                    loading={personsLoading}
                                    showSearch
                                    optionFilterProp="label"
                                    allowClear
                                    className="flex-1"
                                />
                            </Form.Item>

                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => setPersonModalOpen(true)}
                                title="Ajouter une personne"
                            />
                        </div>
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

            <PersonForm
                open={personModalOpen}
                onCancel={() =>
                    setPersonModalOpen(false)
                }
                onSuccess={async (person) => {
                    setPersonModalOpen(false);

                    // Refresh the Select
                    await getPersons();

                    // Automatically select the new person
                    if (person?.id) {
                        form.setFieldValue(
                            'person_id',
                            Number(person.id)
                        );
                    }
                }}
            />
        </Form>
    );
}