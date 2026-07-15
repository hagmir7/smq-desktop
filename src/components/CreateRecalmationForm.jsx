import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Select, Upload, message, Button, Spin } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import reclamationApi from '../utils/reclamationApi';

const { TextArea } = Input;

const RECEPTION_METHODS = ['Whatsapp', 'Email', 'Téléphone', 'Courrier', 'Visite'];

export default function CreateRecalmationForm({ reclamationId, reclamation, onCreated, onUpdated }) {
  const isEditMode = Boolean(reclamationId);

  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEditMode && !reclamation);

  const [fileList, setFileList] = useState([]); // newly added files
  const [existingAttachments, setExistingAttachments] = useState([]); // already on server (edit mode only)

  const populateForm = (data) => {
    form.setFieldsValue({
      claimant_name: data.claimant_name,
      claimant_date: data.claimant_date ? dayjs(data.claimant_date, 'DD/MM/YYYY') : undefined,
      client_code: data.client_code,
      client_company_name: data.client_company_name,
      client_phone: data.client_phone,
      client_email: data.client_email,
      reception_method: data.reception_method,
      object: data.object,
      description: data.description,
    });
    setExistingAttachments(data.attachments || []);
  };

  const fetchReclamation = async () => {
    try {
      setLoading(true);
      const response = await reclamationApi.show(reclamationId);
      populateForm(response.data);
    } catch (err) {
      message.error("Impossible de charger la réclamation.");
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    form.resetFields();
    setFileList([]);
  };

  useEffect(() => {
    if (!isEditMode) return; // create mode: start with a blank form
    if (reclamation) {
      populateForm(reclamation);
      setLoading(false);
    } else {
      fetchReclamation();
    }
  }, [reclamationId, reclamation]);

  const removeExistingAttachment = (attachmentId) => {
    setExistingAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload = {
        claimant_date: values.claimant_date
          ? dayjs(values.claimant_date).format('DD/MM/YYYY')
          : undefined,
        claimant_name: values.claimant_name,
        client_code: values.client_code,
        client_company_name: values.client_company_name,
        client_phone: values.client_phone,
        client_email: values.client_email,
        reception_method: values.reception_method,
        object: values.object,
        description: values.description,
      };

      if (isEditMode) {
        payload.existing_attachment_ids = existingAttachments.map((a) => a.id);

        if (withAttachments && fileList.length > 0) {
          await reclamationApi.updateStep1WithAttachments(
            reclamationId,
            payload,
            fileList.map((f) => f.originFileObj)
          );
        } else {
          await reclamationApi.updateStep1(reclamationId, payload);
        }

        message.success('Réclamation mise à jour avec succès.');
        setFileList([]);
  
        onUpdated?.();
      } else {
        if (withAttachments && fileList.length > 0) {
          await reclamationApi.createStep1WithAttachments(
            payload,
            fileList.map((f) => f.originFileObj)
          );
        } else {
          await reclamationApi.createStep1(payload);
        }

        message.success('Réclamation créée avec succès.');
        resetAndClose();
        onCreated?.();
      }
    } catch (err) {
      console.error(err)
      if (err?.errorFields) return; // validation error, already shown inline
      message.error(
        isEditMode
          ? "Échec de la mise à jour de la réclamation."
          : "Échec de la création de la réclamation."
      );
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
    <Form form={form} layout="vertical" className="mt-4">
      <div className="grid grid-cols-2 gap-x-4">
        <Form.Item
          label="Nom du réclamant"
          name="claimant_name"
          rules={[{ required: true, message: 'Le champ nom du réclamant est requis.' }]}
        >
          <Input placeholder="Nom complet" />
        </Form.Item>

        <Form.Item
          label="Date de réclamation"
          name="claimant_date"
          rules={[{ required: true, message: 'La date est requise.' }]}
        >
          <DatePicker className="w-full" format="DD/MM/YYYY" />
        </Form.Item>

        <Form.Item
          label="Code client"
          name="client_code"
          rules={[{ required: true, message: 'Le code client est requis.' }]}
        >
          <Input placeholder="CL150" />
        </Form.Item>

        <Form.Item label="Société" name="client_company_name">
          <Input placeholder="Nom de la société" />
        </Form.Item>

        <Form.Item
          label="Téléphone"
          name="client_phone"
          rules={[{ required: true, message: 'Le téléphone est requis.' }]}
        >
          <Input placeholder="0654751457" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="client_email"
          rules={[{ type: 'email', message: "Format d'email invalide." }]}
        >
          <Input placeholder="contact@client.com" />
        </Form.Item>

        <Form.Item
          label="Canal de réception"
          name="reception_method"
          rules={[{ required: true, message: 'Le canal de réception est requis.' }]}
        >
          <Select placeholder="Sélectionner un canal">
            {RECEPTION_METHODS.map((m) => (
              <Select.Option key={m} value={m}>
                {m}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </div>

      <Form.Item
        label="Objet"
        name="object"
        rules={[{ required: true, message: "Le champ objet est requis." }]}
      >
        <Input placeholder="Sujet de la réclamation" />
      </Form.Item>

      <Form.Item
        label="Description"
        name="description"
        rules={[{ required: true, message: 'La description est requise.' }]}
      >
        <TextArea rows={4} placeholder="Détails de la réclamation" />
      </Form.Item>

      {isEditMode && existingAttachments.length > 0 && (
        <div className="mb-3">
          <div className="text-sm text-gray-600 mb-1">Pièces jointes existantes</div>
          <div className="flex flex-wrap gap-2">
            {existingAttachments.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-2 border border-gray-200 rounded px-2 py-1 text-sm"
              >
                <a href={a.url} target="_blank" rel="noreferrer">
                  {a.name}
                </a>
                <button
                  type="button"
                  className="text-red-500 hover:text-red-600"
                  onClick={() => removeExistingAttachment(a.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}


       <Upload
          multiple
          beforeUpload={() => false}
          fileList={fileList}
          onChange={({ fileList: fl }) => setFileList(fl)}
        >
          <button
            type="button"
            className="inline-flex items-center gap-2 border border-dashed border-gray-300 rounded px-3 py-2 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-500"
          >
            <UploadOutlined /> Ajouter des fichiers
          </button>
        </Upload>

      <div className='w-full flex justify-center'>
        <Button onClick={handleSubmit} loading={submitting} className='mt-3 w-1/3' type='primary'>Enregistrer</Button>
      </div>
      
    </Form>
  );
}