import React from "react";
import { Typography } from "antd";
import ReactApexChart from "react-apexcharts";
import SectionCard from "./SectionCard";
import { buildRadialOptions } from "../utils/chartOptions";

const { Text } = Typography;

const StatusBreakdown = ({ statuses, cloturePct }) => (
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
      <div className="">
        <ReactApexChart
          options={buildRadialOptions()}
          series={[cloturePct]}
          type="radialBar"
          height={200}
          width={200}
        />
      </div>
    </div>
  </SectionCard>
);

export default StatusBreakdown;
