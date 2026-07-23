import React from "react";
import SectionCard from "./SectionCard";
import ReactApexChart from "react-apexcharts";
import { buildBarChartOptions } from "../utils/chartOptions";


const MonthlyClaimsChart = ({ monthlyClaims }) => (
  <SectionCard title="Réclamations par mois">
    <ReactApexChart
      options={buildBarChartOptions(monthlyClaims.map((m) => m.month))}
      series={[{ name: "Réclamations", data: monthlyClaims.map((m) => m.value) }]}
      type="bar"
      height={230}
    />
  </SectionCard>
);

export default MonthlyClaimsChart;
