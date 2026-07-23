import React, { useState } from "react";
import { Row, Col, Typography, Spin, Alert } from "antd";
import LastReclamations from "../dashobard/LastReclamations";

import KpiRow from "./KpiRow";
import MonthlyClaimsChart from "./MonthlyClaimsChart";
import StatusBreakdown from "./StatusBreakdown";
import { CURRENT_YEAR } from "./../utils/config";
import YearFilter from "./YearFilter";
import { useDashboardData } from "../hooks/useDashboardData";

const { Title } = Typography;

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

export default function Dashboard() {
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);

  const { loading, error, states, monthlyClaims, statuses, recentClaims } =
    useDashboardData(selectedYear);

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <Spin size="large" tip="Chargement du tableau de bord..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="4">
        <Alert type="error" message="Erreur" description={error} showIcon />
      </div>
    );
  }

  const cloturePct = statuses.find((s) => s.label === "Clôturées")?.value ?? 0;

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* Header + Year Filter */}
      <div className="flex items-center justify-between mb-4">
        <Title level={4} className="!mb-0 !text-gray-900 p-0 m-0">
          Tableau de bord
        </Title>
        <YearFilter value={selectedYear} onChange={setSelectedYear} />
      </div>

      {/* KPI Row */}
      <KpiRow states={states} />

      {/* Chart + Status Row */}
      <Row gutter={[16, 16]} className="mt-4">
        <Col xs={24} lg={16}>
          <MonthlyClaimsChart monthlyClaims={monthlyClaims} />
        </Col>

        <Col xs={24} lg={8}>
          <StatusBreakdown statuses={statuses} cloturePct={cloturePct} />
        </Col>
      </Row>

      <LastReclamations recentClaims={recentClaims} />
    </div>
  );
}