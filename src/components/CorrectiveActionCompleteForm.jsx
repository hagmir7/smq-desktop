import React, { useEffect } from "react";
import { Form, DatePicker, Select, Button } from "antd";
import { CheckCircle2 } from "lucide-react";
import dayjs from "dayjs";
import { useAuth } from "../contexts/AuthContext";

export default function CorrectiveActionCompleteForm({
    onSubmit,
    loading,
    item,
}) {
    const [form] = Form.useForm();
    const { roles } = useAuth();

    const isAdmin = roles("admin");
    const disabled = !!item?.closing_date && !isAdmin;

    useEffect(() => {
        form.setFieldsValue({
            closing_date: item?.closing_date
                ? dayjs(item.closing_date)
                : dayjs(),
            effectiveness: item?.effectiveness || "Efficace",
        });
    }, [item, form]);

    const handleFinish = (values) => {
        if (disabled) return;

        onSubmit({
            closing_date: values.closing_date.format("YYYY-MM-DD"),
            effectiveness: values.effectiveness,
        });
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
        >
            <Form.Item
                name="closing_date"
                label="Date de clôture"
                rules={[{ required: true }]}
            >
                <DatePicker
                    className="w-full"
                    format="DD/MM/YYYY"
                    disabled={disabled}
                />
            </Form.Item>

            <Form.Item
                name="effectiveness"
                label="Efficacité"
                rules={[{ required: true }]}
            >
                <Select
                    disabled={disabled}
                    options={[
                        { value: "Efficace", label: "Efficace" },
                        {
                            value: "Partiellement efficace",
                            label: "Partiellement efficace",
                        },
                        { value: "Non efficace", label: "Non efficace" },
                    ]}
                />
            </Form.Item>

            <Form.Item className="mb-0 text-right">
                <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    disabled={disabled}
                    icon={<CheckCircle2 size={14} />}
                >
                    Clôturer
                </Button>
            </Form.Item>
        </Form>
    );
}