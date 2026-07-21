import React, { useState, useEffect } from 'react';
import { Spin, Empty, message } from 'antd';
import {
  User,
  Calendar,
  CreditCard,
  Building2,
  Phone,
  Mail,
  Radio,
  FileText,
  Paperclip,
  Download,
} from 'lucide-react';
import dayjs from 'dayjs';
import reclamationApi from '../utils/reclamationApi';

const RECEPTION_STYLES = {
  Whatsapp: { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', ring: 'ring-emerald-600/20' },
  Email: { dot: 'bg-teal-500', text: 'text-teal-700', bg: 'bg-teal-50', ring: 'ring-teal-600/20' },
  Téléphone: { dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50', ring: 'ring-amber-600/20' },
  Courrier: { dot: 'bg-slate-500', text: 'text-slate-700', bg: 'bg-slate-100', ring: 'ring-slate-600/20' },
  Visite: { dot: 'bg-lime-500', text: 'text-lime-700', bg: 'bg-lime-50', ring: 'ring-lime-600/20' },
};

function Field({ icon: Icon, label, children, span }) {
  return (
    <div className={span ? 'col-span-3' : ''}>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-green-50 text-green-600">
          <Icon size={13} strokeWidth={2.25} />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          {label}
        </span>
      </div>
      <div className="text-[15px] text-gray-800 pl-8">{children}</div>
    </div>
  );
}

export default function ShowReclamation({ reclamationId, reclamation }) {
  const [data, setData] = useState(reclamation || null);
  const [loading, setLoading] = useState(!reclamation);

  const fetchReclamation = async () => {
    try {
      setLoading(true);
      const response = await reclamationApi.show(reclamationId);
      setData(response.data);
    } catch (err) {
      message.error('Impossible de charger la réclamation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reclamation) {
      setData(reclamation);
      setLoading(false);
    } else if (reclamationId) {
      fetchReclamation();
    }
  }, [reclamationId, reclamation]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Spin size="large" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-16">
        <Empty description="Aucune réclamation trouvée." />
      </div>
    );
  }

  const formattedDate = data.claimant_date
    ? dayjs(data.claimant_date, 'DD/MM/YYYY').isValid()
      ? dayjs(data.claimant_date, 'DD/MM/YYYY').format('DD MMMM YYYY')
      : data.claimant_date
    : '-';

  const receptionStyle =
    RECEPTION_STYLES[data.reception_method] || {
      dot: 'bg-gray-400',
      text: 'text-gray-700',
      bg: 'bg-gray-50',
      ring: 'ring-gray-600/20',
    };

  const initials = (data.claimant_name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  return (
    <div className="mt-4 w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 rounded-t-xl border border-solid border-gray-100 bg-gradient-to-br from-green-50/60 to-white px-4 py-3">
        <div className="flex items-center gap-3.5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-700 text-white font-semibold text-lg shadow-sm shadow-green-600/20">
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 leading-tight tracking-tight p-0 m-0">
              {data.claimant_name || 'Réclamant inconnu'}
            </h2>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
              <CreditCard size={13} className="text-gray-400" />
              {data.client_code ? `Client ${data.client_code}` : 'Code client non renseigné'}
            </p>
          </div>
        </div>

        {data.reception_method && (
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 ring-inset ${receptionStyle.bg} ${receptionStyle.text} ${receptionStyle.ring}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${receptionStyle.dot}`} />
            {data.reception_method}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="rounded-b-xl border border-t-0 border-gray-100 border-solid px-6 py-7 space-y-8">
        <div className="grid grid-cols-3 gap-x-6 gap-y-6">
          <Field icon={User} label="Nom du réclamant">
            {data.claimant_name || '-'}
          </Field>

          <Field icon={Calendar} label="Date de réclamation">
            {formattedDate}
          </Field>

          <Field icon={CreditCard} label="Code client">
            {data.client_code || '-'}
          </Field>

          <Field icon={Building2} label="Société">
            {data.client_company_name || '-'}
          </Field>

          <Field icon={Phone} label="Téléphone">
            {data.client_phone || '-'}
          </Field>

          <Field icon={Mail} label="Email">
            {data.client_email ? (
              <a
                href={`mailto:${data.client_email}`}
                className="text-green-600 hover:text-green-700 hover:underline underline-offset-2"
              >
                {data.client_email}
              </a>
            ) : (
              '-'
            )}
          </Field>

          <Field icon={Radio} label="Canal de réception">
            {data.reception_method || '-'}
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-gray-100 border-solid bg-gray-50/60 p-4">
            <Field icon={FileText} label="Objet" span>
              <p className="text-base font-medium text-gray-900">{data.object || '-'}</p>
            </Field>
          </div>

          <div className="rounded-lg border border-gray-100 border-solid bg-gray-50/60 p-4">
            <Field icon={FileText} label="Description" span>
              <p className="whitespace-pre-wrap leading-relaxed text-[15px] text-gray-700">
                {data.description || '-'}
              </p>
            </Field>
          </div>
        </div>

        {/* Attachments */}
        <div className="border-t border-gray-100 pt-6">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
            <Paperclip size={13} className="text-green-600" strokeWidth={2.25} />
            <span>Pièces jointes</span>
          </div>

          {data.attachments && data.attachments.length > 0 ? (
            <div className="grid grid-cols-3 gap-2.5">
              {data.attachments.map((a) => (
                <a
                  key={a.id}
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-2.5 rounded-lg border border-solid border-gray-200 px-3.5 py-2.5 text-sm text-gray-700 transition-all hover:border-green-600 hover:bg-green-50/40 hover:text-green-700 hover:shadow-sm"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-400 group-hover:bg-green-100 group-hover:text-green-600 transition-colors">
                    <Paperclip size={13} />
                  </span>
                  <span className="flex-1 truncate">{a.name}</span>
                  <Download size={14} className="text-gray-300 group-hover:text-green-600 transition-colors" />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">Aucune pièce jointe.</p>
          )}
        </div>
      </div>
    </div>
  );
}