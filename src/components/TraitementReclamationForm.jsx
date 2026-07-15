import React, { useEffect, useRef, useState } from 'react';
import { Form, Input, Radio, Select, message, Button, Spin } from 'antd';
import reclamationApi from '../utils/reclamationApi';

const { TextArea } = Input;

const PRIORITIES = ['Normale', 'Critique'];

export default function TraitementReclamationForm({ reclamationId, reclamation }) {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(!reclamation);
    const initializedFor = useRef(null); // tracks which reclamationId we've already populated

    const populateForm = (data) => {
        form.setFieldsValue({
            processing_analysis: data?.processing_analysis,
            cause_analysis: data?.cause_analysis,
            priority: data?.priority,
            is_justifiee: data?.is_justifiee != null ? Number(data.is_justifiee) : undefined,
        });
    };

    const fetchReclamation = async () => {
        try {
            setLoading(true);
            const response = await reclamationApi.show(reclamationId);
            populateForm(response.data);
        } catch (err) {
            message.error("Impossible de charger les données de l'étape 3.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (initializedFor.current === reclamationId) return; // already populated, don't overwrite user edits
        initializedFor.current = reclamationId;

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
            await reclamationApi.updateStep3(reclamationId, {
                processing_analysis: values.processing_analysis,
                is_justifiee: values.is_justifiee,
                cause_analysis: values.cause_analysis,
                priority: values.priority,
            });
            message.success('Étape 3 enregistrée.');
        } catch (err) {
            console.error(err)
            if (err?.errorFields) return;
            message.error(err?.response?.data?.message || "Échec de l'enregistrement de l'étape 3.");
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
                <div className="flex gap-2 w-full">
                    <Form.Item
                        label="Analyse de la reclamation"
                        name="processing_analysis"
                        className='w-full'
                        rules={[{ required: true, message: 'Ce champ est requis.' }]}
                    >
                        <TextArea rows={3} placeholder="Analyse ou traitement effectué" />
                    </Form.Item>

                    <Form.Item
                        label="Analyse de la cause"
                        name="cause_analysis"
                        className='w-full'
                        rules={[{ required: true, message: 'Ce champ est requis.' }]}
                    >
                        <TextArea rows={3} placeholder="Cause racine identifiée" />
                    </Form.Item>
                </div>
                <div className="flex gap-2 w-full">
                    <Form.Item
                        label="Priorité"
                        name="priority"
                        className='w-full'
                        rules={[{ required: true, message: 'La priorité est requise.' }]}
                    >
                        <Select placeholder="Sélectionner une priorité">
                            {PRIORITIES.map((p) => (
                                <Select.Option key={p} value={p}>
                                    {p}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label="Réclamation justifiée ?"
                        name="is_justifiee"
                        className='w-full'
                        rules={[{ required: true, message: 'Veuillez indiquer si la réclamation est justifiée.' }]}
                    >
                        <Radio.Group>
                            <Radio.Button value={1}>Oui</Radio.Button>
                            <Radio.Button value={0}>Non</Radio.Button>
                        </Radio.Group>
                    </Form.Item>
                </div>
                <div className='w-full flex justify-center'>
                    <Button onClick={handleSubmit} loading={submitting} className='mt-3 w-1/3' type='primary'>
                        Enregistrer
                    </Button>
                </div>
            </Form>
        </div>
    );
}