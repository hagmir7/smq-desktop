import React, { useEffect, useState } from 'react';
import { Drawer, Descriptions, Tag, Button, Space, Divider, Skeleton, message } from 'antd';
import reclamationApi from '../utils/reclamationApi';
import ReclamationAttachments from './ReclamationAttachments';
import CorrectiveActions from './CorrectiveActions';
import ReclamationStep2Modal from './ReclamationStep2Modal';
import ReclamationStep3Modal from './ReclamationStep3Modal';

export default function ReclamationDetailDrawer({ reclamationId, open, onClose, onChanged }) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step2Open, setStep2Open] = useState(false);
  const [step3Open, setStep3Open] = useState(false);

  const fetchRecord = async () => {
    if (!reclamationId) return;
    setLoading(true);
    try {
      const res = await reclamationApi.show(reclamationId);
      setRecord(res.data?.data ?? res.data);
    } catch (err) {
      message.error('Impossible de charger la réclamation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchRecord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reclamationId]);

  const refresh = () => {
    fetchRecord();
    onChanged?.();
  };

  return (
    <Drawer
      title={record ? `Réclamation — ${record.object || record.client_code}` : 'Réclamation'}
      open={open}
      onClose={onClose}
      width={640}
      destroyOnClose
    >
      {loading || !record ? (
        <Skeleton active />
      ) : (
        <div className="flex flex-col gap-6">
          <div>
            <Space className="mb-3">
              <Button size="small" onClick={() => setStep2Open(true)}>
                Étape 2 — Analyse
              </Button>
              <Button size="small" onClick={() => setStep3Open(true)}>
                Étape 3 — Traitement
              </Button>
            </Space>

            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Réclamant">{record.claimant_name}</Descriptions.Item>
              <Descriptions.Item label="Date">{record.claimant_date}</Descriptions.Item>
              <Descriptions.Item label="Client">
                {record.client_company_name || record.claimant_name} ({record.client_code})
              </Descriptions.Item>
              <Descriptions.Item label="Téléphone">{record.client_phone}</Descriptions.Item>
              <Descriptions.Item label="Email">{record.client_email}</Descriptions.Item>
              <Descriptions.Item label="Canal">
                {record.reception_method ? <Tag>{record.reception_method}</Tag> : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Objet">{record.object}</Descriptions.Item>
              <Descriptions.Item label="Description">{record.description}</Descriptions.Item>
              <Descriptions.Item label="Recevable">
                {record.is_recevable === null || record.is_recevable === undefined ? (
                  <Tag>En attente</Tag>
                ) : record.is_recevable ? (
                  <Tag color="green">Oui</Tag>
                ) : (
                  <Tag color="red">Non</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Analyse (étape 2)">
                {record.post_analysis || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Justifiée">
                {record.is_justifiee === null || record.is_justifiee === undefined ? (
                  <Tag>En attente</Tag>
                ) : Number(record.is_justifiee) ? (
                  <Tag color="green">Oui</Tag>
                ) : (
                  <Tag color="red">Non</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Priorité">
                {record.priority ? <Tag color="blue">{record.priority}</Tag> : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Analyse de traitement">
                {record.processing_analysis || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Analyse de cause">
                {record.cause_analysis || '—'}
              </Descriptions.Item>
            </Descriptions>
          </div>

          <Divider className="!my-0" />

          <ReclamationAttachments
            reclamationId={record.id}
            attachments={record.attachments || []}
            onChanged={refresh}
          />

          <Divider className="!my-0" />

          <CorrectiveActions reclamationId={record.id} />
        </div>
      )}

      <ReclamationStep2Modal
        reclamationId={reclamationId}
        open={step2Open}
        onClose={() => setStep2Open(false)}
        onUpdated={refresh}
      />
      <ReclamationStep3Modal
        reclamationId={reclamationId}
        open={step3Open}
        onClose={() => setStep3Open(false)}
        onUpdated={refresh}
      />
    </Drawer>
  );
}