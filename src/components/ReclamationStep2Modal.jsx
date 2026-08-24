import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Radio, message } from 'antd';
import reclamationApi from '../utils/reclamationApi';
import { useAuth } from '../contexts/AuthContext';

const { TextArea } = Input;

export default function ReclamationStep2Modal({
  reclamationId,
  open,
  onClose,
  onUpdated,
}) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const { permissions } = useAuth()
  const [reclamation, setReclamation] = useState(null);

  const isRecevable = Form.useWatch('is_recevable', form);

  useEffect(() => {
    if (!open || !reclamationId) return;
    form.resetFields();
    fetchReclamation();
  }, [open, reclamationId, form]);

  const populateForm = (data) => {
    form.setFieldsValue({
      post_analysis: data?.post_analysis,
      is_recevable: data?.is_recevable != null ? Boolean(data.is_recevable) : undefined,
      corrective_action: data?.corrective_action,
    });
  };

  const fetchReclamation = async () => {
    try {
      setSubmitting(true);
      const response = await reclamationApi.show(reclamationId);
      populateForm(response.data);
      setReclamation(response.data)
    } catch (err) {
      message.error("Impossible de charger les données.");
    } finally {
      setSubmitting(false);
    }
  };

  // Clear stale corrective_action when the reclamation is marked non-recevable
  useEffect(() => {
    if (isRecevable === false) {
      form.setFieldValue('corrective_action', undefined);
    }
  }, [isRecevable, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      setSubmitting(true);

      await reclamationApi.updateStep2(reclamationId, {
        post_analysis: values.post_analysis,
        is_recevable: values.is_recevable,
        corrective_action: values.is_recevable ? values.corrective_action : null,
      });

      message.success('Enregistrée.');
      onUpdated?.();
      onClose();
    } catch (err) {
      if (err?.errorFields) return;
      message.error("Échec de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Validation et recevabilité"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={submitting}
      okText="Enregistrer"
      cancelText="Annuler"
      destroyOnHidden
    >
      <Form form={form} layout="vertical" className="mt-4" disabled={!reclamation?.post_analysis && (!permissions('modifier.validation')) ? false : true}>
        <Form.Item
          label="Analyse (post-analysis)"
          name="post_analysis"
          
          // rules={[
          //   {
          //     required: true,
          //     message: "Le champ post analysis est requis.",
          //   },
          // ]}
        >
          <TextArea
            rows={3}
            placeholder="Analyse effectuée après réception"
          />
        </Form.Item>

        <Form.Item
          label="Réclamation recevable ?"
          name="is_recevable"
          rules={[
            {
              required: true,
              message: "Veuillez indiquer la recevabilité.",
            },
          ]}
        >
          <Radio.Group>
            <Radio.Button value={true}>Oui</Radio.Button>
            <Radio.Button value={false}>Non</Radio.Button>
          </Radio.Group>
        </Form.Item>

        {isRecevable && (
          <Form.Item
            label="Action de correction"
            name="corrective_action"
            rules={[
              {
                required: true,
                message: "Veuillez saisir l'action corrective.",
              },
            ]}
          >
            <TextArea
              rows={3}
              placeholder="Proposition ou résumé de l'action corrective"
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}