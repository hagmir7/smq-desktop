import React, { useState } from 'react';
import { Modal, Form, Input, DatePicker, Select, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import reclamationApi from '../utils/reclamationApi';

const { TextArea } = Input;

const RECEPTION_METHODS = ['Whatsapp', 'Email', 'Téléphone', 'Courrier', 'Visite'];

const OBJECTS = [
  "Produit non conforme à la commande (dimensions, modèle, référence, spécifications techniques)",
  "Défaut ou problème de fabrication (perçage, finition, rayures, peinture, qualité des matériaux)",
  "Produit endommagé à la réception",
  "Commande ou accessoires incomplets (produit, accessoires ou éléments manquants)",
  "Problème de montage / assemblage",
  "Problème d’emballage",
  "Non-conformité esthétique (couleur, aspect, finition, etc.)",
  "Retard ou problème de livraison",
  "Étiquetage / identification du produit",
  "Service client insatisfaisant",
  "Autre"
];

export default function ReclamationCreateModal({ open, onClose, onCreated }) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [isOtherObject, setIsOtherObject] = useState(false);

  const resetAndClose = () => {
    form.resetFields();
    setFileList([]);
    setIsOtherObject(false);
    onClose();
  };

  const handleObjectChange = (value) => {
    setIsOtherObject(value === 'Autre');
    if (value !== 'Autre') {
      form.setFieldValue('object_other', undefined);
    }
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
        reception_method: values.reception_method,
        object: values.object === 'Autre' ? values.object_other : values.object,
        description: values.description,
      };

      await reclamationApi.createStep1WithAttachments(
          payload,
          fileList.map((f) => f.originFileObj)
        );

      message.success('Réclamation créée avec succès.');
      resetAndClose();
      onCreated?.();
    } catch (err) {
      console.log(err);
      if (err?.errorFields) return;
      message.error(err?.response?.data?.message  || "Échec de la mise à jour de la réclamation.")
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Nouvelle réclamation"
      open={open}
      onCancel={resetAndClose}
      onOk={handleSubmit}
      confirmLoading={submitting}
      okText="Créer"
      cancelText="Annuler"
      width={640}
      destroyOnClose
    >
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
            label="Ref client"
            name="client_code"
            rules={[{ required: true, message: 'Le ref client est requis.' }]}
          >
            <Input placeholder="CL150" />
          </Form.Item>

          <Form.Item label="Société" name="client_company_name">
            <Input placeholder="Nom de la société" />
          </Form.Item>

          <Form.Item
            label="Téléphone"
            name="client_phone"
          >
            <Input placeholder="0654751457" />
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
          <Select
            placeholder="Sélectionner un objet"
            onChange={handleObjectChange}
          >
            {OBJECTS.map((o) => (
              <Select.Option key={o} value={o}>
                {o}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {isOtherObject && (
          <Form.Item
            label="Précisez l'objet"
            name="object_other"
            rules={[{ required: true, message: "Veuillez préciser l'objet." }]}
          >
            <Input placeholder="Précisez l'objet de la réclamation" />
          </Form.Item>
        )}

        <Form.Item
          label="Description"
          name="description"
          rules={[{ required: true, message: 'La description est requise.' }]}
        >
          <TextArea rows={4} placeholder="Détails de la réclamation" />
        </Form.Item>

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
      </Form>
    </Modal>
  );
}