import React from "react";
import { Select } from "antd";
import { YEAR_OPTIONS } from "../utils/config";

const YearFilter = ({ value, onChange }) => (
  <Select
    size="small"
    value={value}
    onChange={onChange}
    options={YEAR_OPTIONS}
    style={{ width: 100 }}
  />
);

export default YearFilter;
