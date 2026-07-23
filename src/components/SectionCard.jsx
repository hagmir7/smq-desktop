import React from "react";
import { Card, Typography } from "antd";

const { Text } = Typography;

const SectionCard = ({ title, children, extraClass = "", extra = null }) => (
  <Card
    bordered={false}
    className={`rounded-2xl shadow-sm ${extraClass}`}
    bodyStyle={{ padding: "20px 22px" }}
  >
    <div className="flex items-center justify-between">
      <Text className="text-[12px] tracking-wide text-gray-600 font-semibold uppercase">
        {title}
      </Text>
      {extra}
    </div>
    <div className="mt-4">{children}</div>
  </Card>
);

export default SectionCard;
