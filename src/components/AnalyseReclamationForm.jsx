import React, { useEffect, useState } from 'react';
import { Form, Input, Radio, message, Button, Spin } from 'antd';
import reclamationApi from '../utils/reclamationApi';

const { TextArea } = Input;

export default function AnalyseReclamationForm({ reclamationId, reclamation }) {

    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(!reclamation);

    const populateForm = (data) => {
        form.setFieldsValue({
            post_analysis: data?.post_analysis,
            is_recevable: data?.is_recevable,
            corrective_action: data?.corrective_action,
        });
    };

    const fetchReclamation = async () => {
        try {
            setLoading(true);
            const response = await reclamationApi.show(reclamationId);
            populateForm(response.data);
        } catch (err) {
            message.error("Impossible de charger les données de l'étape 2.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (reclamation) {
            populateForm(reclamation);
            setLoading(false);
        } else if (reclamationId) {
            fetchReclamation();
        }
    }, [reclamationId, reclamation]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);
            await reclamationApi.updateStep2(reclamationId, {
                post_analysis: values.post_analysis,
                is_recevable: values.is_recevable,
                corrective_action: values.corrective_action,
            });
            message.success('Étape 2 enregistrée.');
        } catch (err) {
            console.log(err);
            if (err?.errorFields) return;
            message.error(err?.response?.data?.message || "Échec de l'enregistrement de l'étape 2.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <Spin />
            </div>
        );
    }

    return (
        <div>
            <Form form={form} layout="vertical" className="mt-4">
                <div className="flex gap-2">
                    <Form.Item
                        label="Analyse (post-analysis)"
                        name="post_analysis"
                        className='w-full'
                        rules={[{ required: true, message: "Le champ post analysis est requis." }]}
                    >
                        <TextArea rows={3} placeholder="Analyse effectuée après réception" />
                    </Form.Item>
                    <Form.Item
                        label="Action corrective proposée"
                        name="corrective_action"
                        className='w-full'
                        rules={[{ required: true, message: 'Ce champ est requis.' }]}
                    >
                        <TextArea rows={3} placeholder="Proposition ou résumé de l'action corrective" />
                    </Form.Item>
                </div>

                <Form.Item
                    label="Réclamation recevable ?"
                    name="is_recevable"
                    rules={[{ required: true, message: 'Veuillez indiquer la recevabilité.' }]}
                >
                    <Radio.Group>
                        <Radio.Button value={true}>Oui</Radio.Button>
                        <Radio.Button value={false}>Non</Radio.Button>
                    </Radio.Group>
                </Form.Item>

                <div className='w-full flex justify-center'>
                    <Button onClick={handleSubmit} loading={submitting} className='mt-3 w-1/3' type='primary'>
                        Enregistrer
                    </Button>
                </div>
            </Form>
        </div>
    );
}