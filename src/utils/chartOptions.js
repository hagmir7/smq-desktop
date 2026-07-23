export const buildBarChartOptions = (categories) => ({
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

export const buildRadialOptions = () => ({
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
