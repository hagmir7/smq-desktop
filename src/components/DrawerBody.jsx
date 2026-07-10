import React from "react";
import { Steps, Button, Tabs, Tag, Space } from "antd";
import { ArrowUpRight } from "lucide-react";
import CorrectiveActionEditForm from "./CorrectiveActionEditForm";
import CorrectionActionChildForm from "./CorrectiveActionChildForm";
import CorrectiveActionCompleteForm from "./CorrectiveActionCompleteForm";
import ShowCorrectiveAction from "./ShowCorrectiveAction";


const STATUS_META = {
    open: { label: "Ouverte", color: "gold" },
    completed: { label: "Terminée", color: "green" },
};


export default function DrawerBody({
    item, parent, children, activeTab, setActiveTab,
    onOpenRelated, onUpdate, onComplete, onCreateChild, loading,
}) {
    const currentStep = item.status === "completed" ? 1 : 0;
    const stepItems = [
        { title: "Ouverte" },
        { title: "Terminée" },
        { title: "Suivi", status: children.length > 0 ? "finish" : "wait" },
    ];

    return (
        <div>
            <Steps
                size="small"
                current={children.length > 0 ? 2 : currentStep}
                items={stepItems}
                className="mb-4"
            />

            {parent && (
                <Button
                    type="dashed" size="small" icon={<ArrowUpRight size={12} />}
                    onClick={() => onOpenRelated(parent.id)}
                    className="mb-4"
                >
                    Suivi de l'action #{parent.id}
                </Button>
            )}

            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                    {
                        key: "view", label: "Aperçu",
                        children: (
                            <ShowCorrectiveAction item={item} children={children} />
                        ),
                    },
                    { key: "edit", label: "Modifier", children: <CorrectiveActionEditForm item={item} onSubmit={onUpdate} loading={loading} /> },
                    {
                        key: "complete", label: "Clôturer", disabled: item.status === "completed",
                        children: <CorrectiveActionCompleteForm onSubmit={onComplete} loading={loading} />,
                    },
                    { key: "child", label: "Suivi", children: <CorrectionActionChildForm onSubmit={onCreateChild} loading={loading} /> },
                ]}
            />
        </div>
    );
}