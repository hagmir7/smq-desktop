import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Layout,
  Table,
  Button,
  Input,
  Space,
  Segmented,
  Empty,
  Card,
  Badge,
  message,
  DatePicker,
  Select,
  Row,
  Col,
} from "antd";
import { Search, Loader2, RefreshCw, SquareMenu, FileSpreadsheet, X } from "lucide-react";
import dayjs from "dayjs";

import { correctiveActionsApi } from "../utils/correctiveActionsApi";
import { dateFormat, isOverdue } from "../utils/config";
import { api } from "../utils/api";

const { Header, Content } = Layout;

const STATUS_META = {
  open: { label: "Ouverte", color: "gold" },
  completed: { label: "Terminée", color: "green" },
};

const STATUS_PARAM = { Ouverte: "open", Terminée: "completed" };

const EFFECTIVENESS_OPTIONS = [
  { value: "efficace", label: "Efficace" },
  { value: "non_efficace", label: "Non efficace" },
];

const { RangePicker } = DatePicker;

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
  const [effectiveness, setEffectiveness] = useState(undefined);
  const [serviceId, setServiceId] = useState(undefined);
  const [services, setServices] = useState([]);
  const [dateRange, setDateRange] = useState(null);
  const didMountRef = useRef(false);

  // Fetch the services list once for the "Processus" filter Select.
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("services");
        const opts = (data?.data || []).map((item) => ({
          label: item.name,
          value: item.id,
        }));
        setServices(opts);
      } catch (error) {
        message.error(
          error?.response?.data?.message || "Erreur lors du chargement des services."
        );
      }
    })();
  }, []);

  const buildParams = useCallback((search) => {
    const params = { per_page: 50 };
    if (search) params.reclamation_code = search;
    if (statusFilter !== "Toutes") params.status = STATUS_PARAM[statusFilter];
    if (effectiveness) params.effectiveness = effectiveness;
    if (serviceId) params.service_id = serviceId;
    if (dateRange?.[0]) params.date_from = dateRange[0].format("YYYY-MM-DD");
    if (dateRange?.[1]) params.date_to = dateRange[1].format("YYYY-MM-DD");
    return params;
  }, [statusFilter, effectiveness, serviceId, dateRange]);

  const refresh = useCallback(async (search = "") => {
    setLoading(true);
    try {
      const res = await correctiveActionsApi.list(buildParams(search));

      const arr = Array.isArray(res) ? res : res?.data;
      setItems(Array.isArray(arr) ? arr : []);
    } catch (e) {
      console.error("Error fetching corrective actions:", e);
      message.error(e?.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  // Fires on mount and whenever any filter changes (search is debounced
  // separately below via the `query` -> refresh(query) effect).
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      refresh(query.trim());
      return;
    }

    const timeout = setTimeout(() => {
      refresh(query.trim());
    }, 500);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, statusFilter, effectiveness, serviceId, dateRange]);

  const hasActiveFilters = !!(
    query || statusFilter !== "Toutes" || effectiveness || serviceId || dateRange
  );

  function resetFilters() {
    setQuery("");
    setStatusFilter("Toutes");
    setEffectiveness(undefined);
    setServiceId(undefined);
    setDateRange(null);
  }

  const handleExport = useCallback(async () => {
    const params = buildParams(query.trim());

    try {
      const response = await api.get('corrective-actions/register/export', {
        params,
        responseType: 'blob', // <-- required: tells axios not to parse the xlsx as text/JSON
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `registre-des-reclamations-${dayjs().format("YYYY-MM-DD")}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      message.error("Échec de l'export.");
    }
  }, [query, buildParams]);

  // Register rule: only top-level actions, no sub-actions — and no
  // "children" field on the rows we keep either. antd's Table treats a
  // `children` array on a row as tree data and will auto-render it as
  // expandable nested rows, so we strip it here rather than just
  // filtering parent_id, or sub-actions would still show up nested
  // under their parent.
  //
  // All other filtering (status, effectiveness, service, date range,
  // search) is resolved server-side via buildParams, so this stays a
  // pure structural transform — no filtering logic here.
  const topLevel = useMemo(
    () =>
      items
        .filter((i) => !i.parent_id)
        .map(({ children, ...rest }) => rest),
    [items]
  );

  const openCount = topLevel.filter((i) => i.status === "open").length;
  const overdueCount = topLevel.filter(isOverdue).length;

  const columns = [
    {
      title: "Reclamation",
      dataIndex: "reclamation",
      width: 140,
      render: (reclamation) => reclamation?.code ?? "—",
    },
    {
      title: <span className="whitespace-nowrap">Date Reclamation</span>,
      dataIndex: "reclamation",
      width: 90,
      render: (reclamation) => dateFormat(reclamation?.claimant_date) ?? "—",
    },
      {
      title: <span className="whitespace-nowrap">Date d'enregistrement</span>,
      dataIndex: "reclamation",
      width: 90,
      render: (reclamation) => reclamation?.registration_date ? dateFormat(reclamation?.registration_date) : "—",
    },

    {
      title: "Client",
      dataIndex: "reclamation",
      width: 90,
      render: (reclamation) => reclamation?.client_code ?? "—",
    },
  
    {
      title: "Objet",
      dataIndex: "reclamation",
      width: 90,
      render: (reclamation) => (
        <span className="whitespace-nowrap">{reclamation?.object ?? "—"}</span>
      ),
    },
    {
      title: "Actions",
      dataIndex: "children_count",
      width: 100,
      align: "center",
      render: (count) =>
        count > 0 ? (
          <Badge count={count} color="blue" showZero={false} />
        ) : (
          <span className="text-slate-300">0</span>
        ),
    },
    {
      title: "Processus",
      dataIndex: "service",
      width: 90,
      render: (service) => <div className="whitespace-nowrap">{service?.name ?? "—"}</div>,
    },
    {
      title: "Responsable",
      dataIndex: "responsable",
      width: 140,
      render: (responsable) => (
        <span className="whitespace-nowrap">{responsable?.full_name ?? "—"}</span>
      ),
    },
    {
      title: <span className="whitespace-nowrap">Date de réalisation</span>,
      dataIndex: "completion_date",
      width: 90,
      render: (completion_date) => (completion_date ? dateFormat(completion_date) : "—"),
    },
    {
      title: "Efficacité",
      dataIndex: "effectiveness",
      width: 90,
      render: (effectiveness) => <span className="whitespace-nowrap">{effectiveness ?? "—"}</span>,
    },
    {
      title: <span className="whitespace-nowrap">Fiche d'amélioration</span>,
      dataIndex: "reclamation",
      width: 90,
      render: (reclamation) => reclamation?.improvement_sheets || "—",
    },
    {
      title: <span className="whitespace-nowrap">Date de clôture</span>,
      dataIndex: "reclamation",
      width: 130,
      render: (reclamation, row) => (
        <span className={isOverdue(row) ? "font-medium text-red-600" : "text-slate-600"}>
          {reclamation?.closing_date
            ? dayjs(reclamation.closing_date).format("DD MMM YYYY")
            : "—"}
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
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-700 text-white">
            <SquareMenu size={18} />
          </div>
          <div className="leading-tight">
            <div className="text-base font-semibold text-slate-900">Registre de réclamation</div>
            <div className="text-xs text-slate-500">{topLevel.length} action(s)  · {overdueCount} en retard</div>
          </div>
        </div>

        <Space>
          <Button
            icon={<FileSpreadsheet size={14} />}
            onClick={handleExport}
          >
            Exporter
          </Button>

          <Button
            icon={
              loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )
            }
            onClick={() => refresh(query.trim())}
          />
        </Space>
      </Header>

      <Content className="mx-auto w-full px-4 py-4">
        {/* Search & filters */}
        <Card size="small" className="mb-3">
          <Row gutter={[12, 12]} align="middle">
            <Col flex="240px">
              <Input
                allowClear
                placeholder="Ref réclamation..."
                prefix={<Search size={14} className="text-slate-400" />}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onClear={() => setQuery("")}
              />
            </Col>

            <Col flex="270px">
              <RangePicker
                className="w-full"
                placeholder={["Créée après", "Créée avant"]}
                value={dateRange}
                onChange={setDateRange}
                format="DD MMM YYYY"
              />
            </Col>

            <Col flex="200px">
              <Select
                allowClear
                showSearch
                placeholder="Processus"
                className="w-full"
                options={services}
                value={serviceId}
                onChange={setServiceId}
                filterOption={(input, option) =>
                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
              />
            </Col>

            <Col flex="180px">
              <Select
                allowClear
                placeholder="Efficacité"
                className="w-full"
                options={EFFECTIVENESS_OPTIONS}
                value={effectiveness}
                onChange={setEffectiveness}
              />
            </Col>

            {/* <Col>
              <Segmented
                options={["Toutes", "Ouverte", "Terminée"]}
                value={statusFilter}
                onChange={setStatusFilter}
              />
            </Col> */}

            {hasActiveFilters && (
              <Col>
                <Button icon={<X size={14} />} onClick={resetFilters}>
                  Réinitialiser
                </Button>
              </Col>
            )}
          </Row>
        </Card>

        <Card size="small" styles={{ body: {padding: 0} }}>
          <Table
            rowKey="id"
            size="small"
            columns={columns}
            dataSource={topLevel}
            loading={loading}
            scroll={{ x: "max-content" }}
            pagination={{ pageSize: 20 }}
            locale={{ emptyText: <Empty description="Aucune action corrective trouvée" /> }}
            childrenColumnName="__no_nested_rows__"
          />
        </Card>
      </Content>
    </Layout>
  );
}