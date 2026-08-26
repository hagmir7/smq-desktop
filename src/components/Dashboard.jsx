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

export default function Dashboard() {
    const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);

    const {
        loading,
        error,
        states,
        monthlyClaims,
        statuses,
        recentClaims,
    } = useDashboardData(selectedYear);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
                <Spin
                    size="large"
                    tip="Chargement du tableau de bord..."
                />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6">
                <Alert
                    type="error"
                    message="Erreur"
                    description={error}
                    showIcon
                />
            </div>
        );
    }

    const cloturePct =
        statuses.find((s) => s.label === "Clôturées")?.value ?? 0;

    return (
        <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6">

            {/* Header */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Title
                    level={4}
                    className="!m-0 !text-gray-900"
                >
                    Tableau de bord
                </Title>

                <div className="w-full sm:w-auto">
                    <YearFilter
                        value={selectedYear}
                        onChange={setSelectedYear}
                    />
                </div>
            </div>

            {/* KPI */}
            <div className="w-full">
                <KpiRow states={states} />
            </div>

            {/* Charts */}
            <Row
                gutter={[16, 16]}
                className="mt-4"
            >
                <Col xs={24} lg={14}>
                    <div className="h-full">
                        <MonthlyClaimsChart
                            monthlyClaims={monthlyClaims}
                        />
                    </div>
                </Col>

                <Col xs={24} lg={10}>
                    <div className="h-full">
                        <StatusBreakdown
                            statuses={statuses}
                            cloturePct={cloturePct}
                        />
                    </div>
                </Col>
            </Row>

            {/* Recent claims */}
            <div className="mt-4 w-full">
                <LastReclamations
                    recentClaims={recentClaims}
                />
            </div>
        </div>
    );
}