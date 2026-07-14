import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Layout, Table, Tag, Button, Input, Space, Segmented, Empty, Card, Badge,
} from "antd";
import { Search, Loader2, RefreshCw } from "lucide-react";
import dayjs from "dayjs";

import { correctiveActionsApi } from "../utils/correctiveActionsApi";
import { dateFormat, isOverdue } from "../utils/config";

const { Header, Content } = Layout;

const STATUS_META = {
  open: { label: "Ouverte", color: "gold" },
  completed: { label: "Terminée", color: "green" },
};

/**
 * Register / registre view of corrective actions.
 *
 * Unlike the main CorrectiveActions table, this view is a flat register:
 * it deliberately excludes sub-actions (rows with a parent_id) so each
 * line represents one corrective action's own record, not its follow-up
 * chain. Useful for audits/exports where a parent + its children would
 * otherwise appear as duplicated or nested entries.
 */
export default function CorrectiveActionsRegister() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Toutes");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await correctiveActionsApi.list(50);
      const arr = Array.isArray(res) ? res : res?.data;
      setItems(Array.isArray(arr) ? arr : []);
    } catch (e) {
      // surfaced via empty table + retry button; no toast here since
      // this view is often embedded read-only alongside other panels
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Register rule: only top-level actions, no sub-actions — and no
  // "children" field on the rows we keep either. antd's Table treats a
  // `children` array on a row as tree data and will auto-render it as
  // expandable nested rows, so we strip it here rather than just
  // filtering parent_id, or sub-actions would still show up nested
  // under their parent.
  const topLevel = useMemo(
    () => items
      .filter(i => !i.parent_id)
      .map(({ children, ...rest }) => rest),
    [items]
  );

  const filtered = useMemo(() => {
    return topLevel
      .filter(i => statusFilter === "Toutes" || STATUS_META[i.status]?.label === statusFilter)
      .filter(i => !query
        || i.description?.toLowerCase().includes(query.toLowerCase())
        || String(i.id).includes(query));
  }, [topLevel, statusFilter, query]);

  const openCount = topLevel.filter(i => i.status === "open").length;
  const overdueCount = topLevel.filter(isOverdue).length;

  const columns = [
    {
      title: "Reclamation", dataIndex: "reclamation", width: 140,
      render: (reclamation) => reclamation?.code ?? "—",
    },
    {
      title: "Client", dataIndex: "reclamation", width: 90,
      render: (reclamation) => reclamation?.client_code ?? "—",
    },

    {
      title:  <span className="whitespace-nowrap">Date d'enregistrement</span>, dataIndex: "reclamation", width: 90,
      render: (reclamation) => reclamation?.registration_date ?? "—",
    },

    {
      title: "Objet", dataIndex: "reclamation", width: 90,
      render: (reclamation) => <span className="whitespace-nowrap">{reclamation?.object ?? "—"}</span>,
    },


    {
      title: "Actions", dataIndex: "sub_actions_count", width: 100, align: "center",
      render: (count) =>
        count > 0
          ? <Badge count={count} color="blue" showZero={false} />
          : <span className="text-slate-300">0</span>,
    },
    {
      title: "Procusse", dataIndex: "service", width: 90,
      render: (service) => <div className="whitespace-nowrap">{service?.name ?? "—"}</div>,
    },
    {
      title: "Responsable", dataIndex: "responsable", width: 140,
      render: (responsable) => <span className="whitespace-nowrap">{responsable?.full_name ?? "—"}</span>,
    },
    {
      title: <span className="whitespace-nowrap">Date de réalisation</span>, dataIndex: "completion_date", width: 90,
      render: (completion_date) => completion_date ? dateFormat(completion_date) : "—",
    },

    {
      title: <span className="whitespace-nowrap">Fiche d'amélioration</span>, dataIndex: "reclamation", width: 90,
      render: (reclamation) => reclamation?.improvement_sheets || "—",
    },
    {
      title: <span className="whitespace-nowrap">Date de clôture</span>, dataIndex: "reclamation", width: 130,
      render: (reclamation, row) => (
        <span className={isOverdue(row) ? "font-medium text-red-600" : "text-slate-600"}>
          {reclamation.closing_date ? dayjs(reclamation.closing_date).format("DD MMM YYYY") : "—"}
        </span>
      ),
    },
  ];

  return (
    <Layout className="min-h-full bg-slate-100">
      <Header
        className="flex items-center justify-between !bg-white !px-6 border-b border-slate-200"
        style={{ height: 64, lineHeight: "64px" }}
      >
        <div className="leading-tight">
          <div className="text-base font-semibold text-slate-900">Registre des reclamations</div>
          <div className="text-xs text-slate-500">
            {topLevel.length} action(s) · {openCount} ouverte(s) · {overdueCount} en retard
          </div>
        </div>
        <Space>
          <Input
            allowClear
            placeholder="Ref, description..."
            prefix={<Search size={14} className="text-slate-400" />}
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="max-w-xs"
          />
          <Segmented
            options={["Toutes", "Ouverte", "Terminée"]}
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <Button
            icon={loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            onClick={refresh}
          />
        </Space>
      </Header>

      <Content className="mx-auto w-full px-4 py-4">
        <Card size="small" bodyStyle={{ padding: 0 }}>
          <Table
            rowKey="id"
            size="small"
            columns={columns}
            dataSource={filtered}
            loading={loading}
             scroll={{ x: "max-content" }}
            pagination={{ pageSize: 20 }}
            locale={{ emptyText: <Empty description="Aucune action corrective trouvée" /> }}
            // Defensive: even though we already strip `children` from
            // each row above, pointing this at a key that will never
            // exist guarantees antd never tries to render nested rows.
            childrenColumnName="__no_nested_rows__"
          />
        </Card>
      </Content>
    </Layout>
  );
}