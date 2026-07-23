import React from "react";
import { Card, Typography } from "antd";

const { Text, Title } = Typography;

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

export default KpiCard;
