import React from "react";
import { Form, DatePicker, Select, Button } from "antd";
import { CheckCircle2 } from "lucide-react";
import dayjs from "dayjs";

export default function CorrectiveActionCompleteForm({ onSubmit, loading }) {
    const [form] = Form.useForm();
    return (
        <Form
            form={form}
            layout="vertical"
            initialValues={{ completion_date: dayjs(), effectiveness: "Efficace" }}
            onFinish={(vals) => onSubmit({
                completion_date: vals.completion_date.format("YYYY-MM-DD"),
                effectiveness: vals.effectiveness,
            })}
        >
            <Form.Item
                name="completion_date" label="Date de clôture" rules={[{ required: true }]}
                extra="Envoyée au format AAAA-MM-JJ pour éviter toute ambiguïté JJ/MM ou MM/JJ."
            >
                <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item
                name="effectiveness" label="Efficacité"
            >
                <Select options={[
                    { value: "Efficace", label: "Efficace" },
                    { value: "Partiellement efficace", label: "Partiellement efficace" },
                    { value: "Non efficace", label: "Non efficace" },
                ]} />
            </Form.Item>
            <Form.Item className="mb-0 text-right">
                <Button type="primary" htmlType="submit" loading={loading} icon={<CheckCircle2 size={14} />}>
                    Marquer comme terminée
                </Button>
            </Form.Item>
        </Form>
    );
}