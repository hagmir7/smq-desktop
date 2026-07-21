import React, { useEffect, useState } from "react";
import { Card, Row, Col, Typography, Divider, Spin, Alert } from "antd";
import ReactApexChart from "react-apexcharts";
import axios from "axios";
import { api } from "../utils/api";
import LastReclamations from "../dashobard/LastReclamations";

const { Text, Title } = Typography;

/**
 * Réclamations Dashboard
 * Stack: React + Ant Design + Tailwind CSS + ApexCharts + Axios
 *
 * Install:
 *   npm install antd react-apexcharts apexcharts axios
 *
 * Expects these API endpoints (adjust API_BASE below to match your app):
 *   GET /api/dashboard/states
 *   GET /api/dashboard/reclamations-per-month?year=YYYY
 *   GET /api/dashboard/reclamation-states
 *   GET /api/dashboard/last-reclamations
 */

const MONTH_LABELS = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Jun",
  "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc",
];

const STATUS_COLORS = {
  "Clôturées": "#0f5c4f",
  "Critique": "#ef4444",
  "En cours": "#f59e0b",
};

// ---------- Chart config builders ----------

const buildBarChartOptions = (categories) => ({
  chart: {
    type: "bar",
    toolbar: { show: false },
    fontFamily: "inherit",
  },
  plotOptions: {
    bar: {
      columnWidth: "45%",
      borderRadius: 4,
      distributed: false,
    },
  },
  colors: ["#0f5c4f"],
  dataLabels: { enabled: false },
  grid: {
    show: false,
    padding: { left: 0, right: 0 },
  },
  xaxis: {
    categories,
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: {
      style: { colors: "#9ca3af", fontSize: "12px" },
    },
  },
  yaxis: { show: false },
  tooltip: {
    y: { formatter: (val) => `${val} réclamations` },
  },
  states: {
    normal: { filter: { type: "none" } },
    hover: { filter: { type: "darken", value: 0.9 } },
  },
});

const buildRadialOptions = () => ({
  chart: {
    type: "radialBar",
    sparkline: { enabled: true },
  },
  plotOptions: {
    radialBar: {
      hollow: { size: "72%" },
      track: { background: "#eef1f0" },
      dataLabels: {
        show: true,
        name: { show: false },
        value: {
          show: true,
          fontSize: "20px",
          fontWeight: 700,
          color: "#111827",
          formatter: (val) => `${val}%`,
          offsetY: 8,
        },
      },
    },
  },
  fill: { colors: ["#0f5c4f"] },
  stroke: { lineCap: "round" },
  labels: ["Clôturées"],
});

// ---------- UI subcomponents ----------

const KpiCard = ({ label, value, delta, deltaColor }) => (
  <Card
    bordered={false}
    className="rounded-2xl shadow-sm"
    bodyStyle={{ padding: "20px 22px" }}
  >
    <Text className="text-[12px] tracking-wide text-gray-600 font-semibold uppercase">
      {label}
    </Text>
    <Title level={2} className="!mt-2 !mb-1 !text-gray-900 !font-bold">
      {value}
    </Title>
    <Text className={`text-xs font-medium ${deltaColor}`}>{delta}</Text>
  </Card>
);

const SectionCard = ({ title, children, extraClass = "" }) => (
  <Card
    bordered={false}
    className={`rounded-2xl shadow-sm ${extraClass}`}
    bodyStyle={{ padding: "20px 22px" }}
  >
    <Text className="text-[12px] tracking-wide text-gray-600 font-semibold uppercase">
      {title}
    </Text>
    <div className="mt-4">{children}</div>
  </Card>
);

// Map a reclamation status string to a display color class
const statusColorClass = (status) => {
  const s = (status || "").toLowerCase();
  if (s.includes("clôtur") || s.includes("cloture")) return "text-gray-400";
  if (s.includes("critique")) return "text-red-500";
  if (s.includes("cours")) return "text-orange-500";
  return "text-emerald-600";
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [states, setStates] = useState(null);
  const [monthlyClaims, setMonthlyClaims] = useState(
    MONTH_LABELS.map((month) => ({ month, value: 0 }))
  );
  const [statuses, setStatuses] = useState([]);
  const [recentClaims, setRecentClaims] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);

        const [statesRes, monthRes, statusRes, lastRes] = await Promise.all([
          api.get(`dashboard/states`),
          api.get(`dashboard/reclamations-per-month`),
          api.get(`dashboard/reclamation-states`),
          api.get(`dashboard/last-reclamations`),
        ]);

        if (!isMounted) return;

        // ---- states (KPIs) ----
        setStates(statesRes.data);

        // ---- monthly chart: { data: { "1": 6, "2": 7, ... } } ----
        const monthData = monthRes.data?.data || {};
        setMonthlyClaims(
          MONTH_LABELS.map((month, idx) => ({
            month,
            value: monthData[idx + 1] ?? 0,
          }))
        );

        // ---- status breakdown: { "Clôturées": 75, "Critique": 8, "En cours": 17 } ----
        const statusData = statusRes.data || {};
        setStatuses(
          Object.entries(statusData).map(([label, value]) => ({
            label,
            value,
            color: STATUS_COLORS[label] || "#0f5c4f",
          }))
        );

        // ---- last 10 reclamations ----
        setRecentClaims(lastRes.data || []);
      } catch (err) {
        if (isMounted) {
          setError(
            err?.response?.data?.message ||
              "Impossible de charger les données du tableau de bord."
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <Spin size="large" tip="Chargement du tableau de bord..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen p-6">
        <Alert type="error" message="Erreur" description={error} showIcon />
      </div>
    );
  }

  const kpis = [
    {
      label: "TOTAL RÉCLAMATIONS",
      value: states?.total_reclamations ?? 0,
      delta: "",
      deltaColor: "text-emerald-600",
    },
    {
      label: "OUVERTES",
      value: states?.open_reclamations ?? 0,
      delta: "",
      deltaColor: "text-red-500",
    },
    {
      label: "ACTIONS CORRECTIVES",
      value: states?.corrective_actions ?? 0,
      delta: "",
      deltaColor: "text-blue-500",
    },
    {
      label: "TAUX CLÔTURE",
      value: `${states?.taux_cloture ?? 0}%`,
      delta: "",
      deltaColor: "text-emerald-600",
    },
    {
      label: "FICHES AMÉLIO",
      value: states?.improvement_sheet ?? 0,
      delta: "",
      deltaColor: "text-orange-500",
    },
  ];

  const cloturePct = statuses.find((s) => s.label === "Clôturées")?.value ?? 0;

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* KPI Row */}
      <Row gutter={[16, 16]}>
        {kpis.map((kpi) => (
          <Col xs={24} sm={12} lg={4} key={kpi.label}>
            <KpiCard {...kpi} />
          </Col>
        ))}
      </Row>

      {/* Chart + Status Row */}
      <Row gutter={[16, 16]} className="mt-4">
        <Col xs={24} lg={16}>
          <SectionCard title="Réclamations par mois">
            <ReactApexChart
              options={buildBarChartOptions(monthlyClaims.map((m) => m.month))}
              series={[{ name: "Réclamations", data: monthlyClaims.map((m) => m.value) }]}
              type="bar"
              height={230}
            />
          </SectionCard>
        </Col>

        <Col xs={24} lg={8}>
          <SectionCard title="Statuts">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-3">
                {statuses.map((s) => (
                  <div key={s.label} className="flex items-center gap-2">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <Text className="text-sm text-gray-700">
                      {s.label} {s.value}%
                    </Text>
                  </div>
                ))}
              </div>
              <div className="w-28 h-28">
                <ReactApexChart
                  options={buildRadialOptions()}
                  series={[cloturePct]}
                  type="radialBar"
                  height={112}
                  width={112}
                />
              </div>
            </div>
          </SectionCard>
        </Col>
      </Row>

     <LastReclamations recentClaims={recentClaims} />
    </div>
  );
}