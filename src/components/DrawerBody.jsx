import React from "react";
import { Button, Tabs, Tag, Space } from "antd";
import { ArrowUpRight } from "lucide-react";
import CorrectiveActionEditForm from "./CorrectiveActionEditForm";
import CorrectionActionChildForm from "./CorrectiveActionChildForm";
import CorrectiveActionCompleteForm from "./CorrectiveActionCompleteForm";
import ShowCorrectiveAction from "./ShowCorrectiveAction";
import { useAuth } from "../contexts/AuthContext";

export default function DrawerBody({
    item, parent, children, activeTab, setActiveTab,
    onOpenRelated, onUpdate, onComplete, onCreateChild, loading,
}) {

    const { permissions } = useAuth();
    return (
        <div>
            {parent && (
                <Button
                    type="dashed" size="small" icon={<ArrowUpRight size={12} />}
                    onClick={() => onOpenRelated(parent.id)}
                    className="mb-4"
                >
                    Suivi de l'action #{parent.code}
                </Button>
            )}

            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                    {
                        key: "view", label: "Aperçu",
                        disabled: !permissions('voir.action_corrective'),
                        children: (
                            <ShowCorrectiveAction item={item} children={children} />
                        ),
                    },
                    {
                        key: "edit",
                        label: "Modifier",
                        disabled: !permissions('modifier.action_corrective'),
                        children: <CorrectiveActionEditForm
                            item={item}
                            onSubmit={onUpdate}
                            loading={loading} />
                    },
                    {
                        key: "complete",
                        label: "Clôturer",
                        disabled: item.status === "completed" || !permissions('cloturer.action_corrective'),
                        children: <CorrectiveActionCompleteForm
                            onSubmit={onComplete}
                            loading={loading}
                            item={item}
                        />,
                    },
                    {
                        key: "child",
                        label: "Sous-action",
                        disabled: !permissions('creer.sous-action_corrective'),
                        children: <CorrectionActionChildForm onSubmit={onCreateChild}
                            loading={loading}
                        />
                    },
                ]}
            />
        </div>
    );
}