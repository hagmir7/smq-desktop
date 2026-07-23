import React, { useEffect, useState, useCallback } from "react";
import { Modal, Steps, Spin, Button, Tag, Empty, Tabs, Descriptions, Avatar } from "antd";
import {
  ReloadOutlined,
  PhoneOutlined,
  MailOutlined,
  BankOutlined,
  UserOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
  PaperClipOutlined,
  DownloadOutlined,
  CheckCircleFilled,
  InboxOutlined,
} from "@ant-design/icons";
import { api } from "../utils/api";
import ReclamationCorrectiveActions from "./ReclamationCorrectiveActions";
import { useAuth } from "../contexts/AuthContext";

// ---------------------------------------------------------------------------
// Adjust this import to point at your own axios/fetch instance.
// Expected usage in this file: api.get(`reclamations/${id}`) -> { data }
// ReclamationCorrectiveActions fetches its own data from
// GET /reclamations/{id}/corrective-actions internally.
// ---------------------------------------------------------------------------
// import api from "../services/api";

const STEPS = [
  { key: "creation", label: "Création", tab: "general" },
  { key: "validation", label: "Validation", tab: "general" },
  { key: "analyse", label: "Analyse", tab: "analyse" },
  { key: "affectation", label: "Affectation", tab: "affectation"},
  { key: "cloture", label: "Clôturé", tab: "cloture" },
];

const PRIORITY_COLOR = {
  Haute: "error",
  Moyenne: "warning",
  Basse: "success",
};

const STATUT_COLOR = {
  "Clôturée": "success",
  "En cours": "processing",
  Nouvelle: "default",
  "En attente": "warning",
};

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

function resolveStepState(data) {
  if (!data) return { currentIndex: 0, isClosed: false };
  const isClosed = data.statut === "Clôturée";
  if (isClosed) return { currentIndex: STEPS.length - 1, isClosed: true };
  const raw = Number(data.workflow_step);
  const currentIndex = Number.isFinite(raw)
    ? Math.min(Math.max(raw, 0), STEPS.length - 1)
    : 0;
  return { currentIndex, isClosed: false };
}

function SummaryStat({ icon: Icon, label, value, accent }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: accent ? `${accent}1A` : "#F1F5F9" }}
      >
        <Icon style={{ color: accent || "#64748B", fontSize: 15 }} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-slate-400 leading-none mb-1">
          {label}
        </p>
        <p className="text-sm font-medium text-slate-700 truncate">{value ?? "—"}</p>
      </div>
    </div>
  );
}

export default function ReclamationModalSeps({ reclamationId, isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("general");
  const {permissions} = useAuth();

  const fetchReclamation = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`reclamations/${id}`);
      setData(res.data);
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Impossible de charger la réclamation."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && reclamationId) fetchReclamation(reclamationId);
    if (!isOpen) {
      setData(null);
      setError(null);
      setActiveTab("general");
    }
  }, [isOpen, reclamationId, fetchReclamation]);

  useEffect(() => {
    if (data) setActiveTab(STEPS[resolveStepState(data).currentIndex].tab);
  }, [data?.id]);

  const { currentIndex } = resolveStepState(data);

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={960}
      styles={{
        content: { padding: 0, overflow: "hidden", borderRadius: 16 },
        body: { padding: 0 },
      }}
      closeIcon={<span className="text-slate-400 hover:text-slate-600">✕</span>}
    >
      {loading && (
        <div className="flex flex-col items-center justify-center py-28 gap-3">
          <Spin size="large" />
          <p className="text-sm text-slate-400">Chargement de la réclamation…</p>
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-28 gap-3 px-6 text-center">
          <ExclamationCircleOutlined className="text-3xl text-rose-400" />
          <p className="text-sm text-slate-500">{error}</p>
          <Button type="primary" icon={<ReloadOutlined />} onClick={() => fetchReclamation(reclamationId)}>
            Réessayer
          </Button>
        </div>
      )}

      {!loading && !error && !data && (
        <div className="py-20">
          <Empty description="Aucune donnée" />
        </div>
      )}

      {!loading && !error && data && (
        <div>
          {/* Header band */}
          <div className="px-7 pt-6 pb-5 bg-gradient-to-br from-indigo-50 via-white to-white border-b border-slate-100">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-semibold text-slate-800 tracking-tight">
                    {data.code || "Réclamation"}
                  </h2>
                  {data.statut && (
                    <Tag color={STATUT_COLOR[data.statut] || "default"} className="!m-0 !rounded-full !px-2.5">
                      {data.statut}
                    </Tag>
                  )}
                  {data.priority && (
                    <Tag color={PRIORITY_COLOR[data.priority] || "default"} className="!m-0 !rounded-full !px-2.5">
                      Priorité {data.priority}
                    </Tag>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-1.5 max-w-2xl">{data.object || "—"}</p>
              </div>
              {data.responsable?.full_name && (
                <div className="flex items-center gap-2 shrink-0 bg-white border border-slate-200 rounded-full pl-1 pr-3 py-1">
                  <Avatar size={26} style={{ background: "#4F46E5", fontSize: 11 }}>
                    {initials(data.responsable.full_name)}
                  </Avatar>
                  <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
                    {data.responsable.full_name}
                  </span>
                </div>
              )}
            </div>

            {/* Progress */}
            <div className="mt-6">
              <Steps
                current={currentIndex}
                size="small"
                onChange={(i) => setActiveTab(STEPS[i].tab)}
                items={STEPS.map((step, i) => ({
                  title: <span className="text-xs cursor-pointer">{step.label}</span>,
                  icon:
                    i < currentIndex || (data.statut === "Clôturée" && i <= currentIndex) ? (
                      <CheckCircleFilled />
                    ) : undefined,
                }))}
              />
            </div>
          </div>

          {/* Quick facts strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 px-7 py-4 bg-slate-50/70 border-b border-slate-100">
            <SummaryStat icon={UserOutlined} label="Réclamant" value={data.claimant_name} accent="#4F46E5" />
            <SummaryStat icon={BankOutlined} label="Client" value={data.client_company_name} accent="#0EA5E9" />
            <SummaryStat icon={CalendarOutlined} label="Enregistré le" value={formatDate(data.registration_date)} accent="#F59E0B" />
            <SummaryStat icon={CalendarOutlined} label="Clôture prévue" value={formatDate(data.planned_closing_date)} accent="#10B981" />
          </div>

          {/* Tabbed detail */}
          <div className="px-7 py-5 max-h-[52vh] overflow-y-auto">
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: "general",
                  label: "Général",
                  children: (
                    <Descriptions column={2} size="small" bordered>
                      <Descriptions.Item label="Réclamant">{data.claimant_name ?? "—"}</Descriptions.Item>
                      <Descriptions.Item label="Date de réclamation">
                        {formatDate(data.claimant_date)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Mode de réception">
                        {data.reception_method ?? "—"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Date d'enregistrement">
                        {formatDate(data.registration_date)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Créé par">{data.user?.full_name ?? "—"}</Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: "client",
                  label: "Client",
                  children: (
                    <Descriptions column={2} size="small" bordered>
                      <Descriptions.Item label={<span><BankOutlined className="mr-1.5" />Entreprise</span>}>
                        {data.client_company_name ?? "—"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Code client">{data.client_code ?? "—"}</Descriptions.Item>
                      <Descriptions.Item label={<span><PhoneOutlined className="mr-1.5" />Téléphone</span>}>
                        {data.client_phone ?? "—"}
                      </Descriptions.Item>
                      <Descriptions.Item label={<span><MailOutlined className="mr-1.5" />Email</span>}>
                        {data.client_email ?? "—"}
                      </Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: "analyse",
                  label: "Analyse & Traitement",
                  children: (
                    <Descriptions column={1} size="small" bordered>
                      <Descriptions.Item
                        label={
                          <span>
                            Recevable{" "}
                            <Tag className="!ml-1" color={data.is_recevable ? "success" : "default"}>
                              {data.is_recevable ? "Oui" : "Non"}
                            </Tag>
                          </span>
                        }
                      >
                        {data.post_analysis ?? "—"}
                      </Descriptions.Item>
                      <Descriptions.Item
                        label={
                          <span>
                            Justifiée{" "}
                            <Tag className="!ml-1" color={data.is_justifiee ? "success" : "default"}>
                              {data.is_justifiee ? "Oui" : "Non"}
                            </Tag>
                          </span>
                        }
                      >
                        {data.processing_analysis ?? "—"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Analyse de cause">
                        {data.cause_analysis ?? "—"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Action corrective">
                        {data.corrective_action ?? "—"}
                      </Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: "affectation",
                  label: "Affectation",
                  disabled: !permissions('voir.action_corrective'),
                  children: <ReclamationCorrectiveActions reclamationId={reclamationId}  />,
                },
                {
                  key: "cloture",
                  label: "Clôture",
                  children: (
                    <Descriptions column={2} size="small" bordered>
                      <Descriptions.Item label="Responsable">
                        {data.responsable ? data.responsable.full_name : "Non assigné"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Créé par">{data.user?.full_name ?? "—"}</Descriptions.Item>
                      <Descriptions.Item label="Clôture prévue">
                        {formatDate(data.planned_closing_date)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Clôture effective">
                        {formatDate(data.closing_date)}
                      </Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: "media",
                  label: `Pièces jointes${data.media?.length ? ` (${data.media.length})` : ""}`,
                  children:
                    data.media?.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {data.media.map((file) => (
                          <a
                            key={file.id}
                            href={file.original_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors group"
                          >
                            <PaperClipOutlined className="text-slate-400 group-hover:text-indigo-500 shrink-0" />
                            <span className="text-sm text-slate-600 truncate flex-1">{file.file_name}</span>
                            <DownloadOutlined className="text-slate-300 group-hover:text-indigo-500 shrink-0" />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-slate-300 gap-2">
                        <InboxOutlined className="text-3xl" />
                        <p className="text-sm text-slate-400">Aucune pièce jointe</p>
                      </div>
                    ),
                },
              ]}
            />
          </div>
        </div>
      )}
    </Modal>
  );
}