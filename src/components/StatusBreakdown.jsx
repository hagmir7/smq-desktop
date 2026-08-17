import React from "react";
import { Typography } from "antd";
import ReactApexChart from "react-apexcharts";
import SectionCard from "./SectionCard";
import { buildRadialOptions } from "../utils/chartOptions";

const { Text } = Typography;

// Workflow step considered "closed" for the radial gauge.
// Keep in sync with WORKFLOW_STEPS (5 = "Clôturé") used across the app.
const CLOTURE_STEP = 5;

const StatusBreakdown = ({ statuses }) => {
  // Always derive the "closed" rate from the workflow-step breakdown itself
  // (step 5 = "Clôturé"). A separately-passed prop risks going stale or
  // silently overriding this with 0.
  const cloturePct = statuses.find((s) => s.step === CLOTURE_STEP)?.value ?? 0;

  // Display in workflow order (1 -> 5) when a step is available.
  const orderedStatuses = [...statuses].sort(
    (a, b) => (a.step ?? 0) - (b.step ?? 0)
  );

  return (
    <SectionCard title="Statuts">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-3">
          {orderedStatuses.map((s) => (
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
};

export default StatusBreakdown;