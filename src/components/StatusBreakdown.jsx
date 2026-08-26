import React from "react";
import { Typography } from "antd";
import ReactApexChart from "react-apexcharts";

import SectionCard from "./SectionCard";
import { buildRadialOptions } from "../utils/chartOptions";

const { Text } = Typography;

const CLOTURE_STEP = 5;

const StatusBreakdown = ({ statuses = [] }) => {
    // Closed percentage
    const cloturePct =
        statuses.find((s) => s.step === CLOTURE_STEP)?.value ?? 0;

    // Workflow order
    const orderedStatuses = [...statuses].sort(
        (a, b) => (a.step ?? 0) - (b.step ?? 0)
    );

    return (
        <SectionCard title="Statuts">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                {/* Status list */}
                <div className="min-w-0 flex-1">
                    <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-1">
                        {orderedStatuses.map((s) => (
                            <div
                                key={s.label}
                                className="flex min-w-0 items-center gap-2"
                            >
                                <span
                                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                                    style={{
                                        backgroundColor: s.color,
                                    }}
                                />

                                <Text
                                    className="min-w-0 truncate text-sm text-gray-700"
                                    title={`${s.label} ${s.value}%`}
                                >
                                    {s.label}
                                </Text>

                                <Text
                                    strong
                                    className="shrink-0 text-sm text-gray-900"
                                >
                                    {s.value}%
                                </Text>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Radial chart */}
                <div className="flex w-full shrink-0 items-center justify-center sm:w-auto">
                    <ReactApexChart
                        options={buildRadialOptions()}
                        series={[cloturePct]}
                        type="radialBar"
                        height={180}
                        width="100%"
                    />
                </div>
            </div>
        </SectionCard>
    );
};

export default StatusBreakdown;