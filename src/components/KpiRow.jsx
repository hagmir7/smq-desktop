import React from "react";
import { Row, Col } from "antd";
import KpiCard from "./KpiCard";

const KpiRow = ({ states }) => {
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

  return (
    <Row gutter={[16, 16]}>
      {kpis.map((kpi) => (
        <Col xs={24} sm={12} lg={4} key={kpi.label}>
          <KpiCard {...kpi} />
        </Col>
      ))}
    </Row>
  );
};

export default KpiRow;
