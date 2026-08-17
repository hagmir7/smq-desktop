import React from "react";
import { Modal, Steps } from "antd";
import { WORKFLOW_STEPS } from "../utils/config";


export default function WorkflowModal({
  open,
  onClose,
  currentStep = 1,
}) {
  const items = Object.entries(WORKFLOW_STEPS).map(([key, title]) => ({
    title,
    status:
      Number(key) < currentStep
        ? "finish"
        : Number(key) === currentStep
        ? "process"
        : "wait",
  }));

  return (
    <Modal
      title="Workflow"
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      <Steps
        current={currentStep - 1}
        direction="vertical"
        items={items}
      />
    </Modal>
  );
}