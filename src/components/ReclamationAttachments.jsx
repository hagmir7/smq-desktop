import React, { useState } from 'react';
import { Upload, Button, List, Popconfirm, message, Empty } from 'antd';
import { UploadOutlined, DeleteOutlined, PaperClipOutlined } from '@ant-design/icons';
import reclamationApi from '../utils/reclamationApi';

export default function ReclamationAttachments({ reclamationId, attachments = [], onChanged }) {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (fileList.length === 0) return;
    setUploading(true);
    try {
      await reclamationApi.addAttachments(
        reclamationId,
        fileList.map((f) => f.originFileObj)
      );
      message.success('Fichiers ajoutés.');
      setFileList([]);
      onChanged?.();
    } catch (err) {
      console.error(err)
      message.error("Échec de l'ajout des fichiers.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachmentId) => {
    try {
      await reclamationApi.deleteAttachment(reclamationId, attachmentId);
      message.success('Pièce jointe supprimée.');
      onChanged?.();
    } catch (err) {
      message.error('Échec de la suppression de la pièce jointe.');
    }
  };

  return (
    <div>
      <h4 className="text-base font-medium mb-3">Pièces jointes</h4>

      <List
        size="small"
        dataSource={attachments}
        locale={{ emptyText: <Empty description="Aucune pièce jointe" /> }}
        renderItem={(att) => (
          <List.Item
            actions={[
              <Popconfirm
                key="delete"
                title="Supprimer ce fichier ?"
                okText="Supprimer"
                okButtonProps={{ danger: true }}
                cancelText="Annuler"
                onConfirm={() => handleDelete(att.id)}
              >
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>,
            ]}
          >
            <a
              href={att.url || att.path}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2"
            >
              <PaperClipOutlined /> {att.name || att.file_name || `Fichier #${att.id}`}
            </a>
          </List.Item>
        )}
      />

      <div className="flex items-center gap-2 mt-3">
        <Upload
          multiple
          beforeUpload={() => false}
          fileList={fileList}
          onChange={({ fileList: fl }) => setFileList(fl)}
          showUploadList={{ showRemoveIcon: true }}
        >
          <Button icon={<UploadOutlined />}>Sélectionner des fichiers</Button>
        </Upload>
        <Button
          type="primary"
          disabled={fileList.length === 0}
          loading={uploading}
          onClick={handleUpload}
        >
          Téléverser
        </Button>
      </div>
    </div>
  );
}