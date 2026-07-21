import { Button, Tooltip, Popconfirm, DatePicker, message } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { useState } from "react";
import dayjs from "dayjs";
import { useAuth } from '../contexts/AuthContext';

export default function CloseReclamation({ onCloseAction, record }) {
    const [open, setOpen] = useState(false);
    const [completionDate, setCompletionDate] = useState(
        record?.closing_date ? dayjs(record.closing_date) : null
    );

    const { permissions } = useAuth();

    const resetAndClose = () => {
        setCompletionDate(record?.closing_date ? dayjs(record.closing_date) : null);
        setOpen(false);
    };

    const handleConfirm = async () => {
        if (!completionDate) {
            message.warning("Veuillez sélectionner une date.");
            return; // keep popup open
        }

        try {
            await onCloseAction({
                closing_date: completionDate.format("YYYY-MM-DD"),
            });
            setOpen(false);
        } catch (error) {
            console.error("Error closing reclamation:", error);
            message.error("Une erreur est survenue lors de la clôture de l'action.");
        }
    };

    return (
        <Popconfirm
            open={open}
            onOpenChange={(nextOpen) => {
                if (nextOpen) {
                    setOpen(true);
                } else {
                    resetAndClose();
                }
            }}
            title="Clôturer l'action"
            description={
                <div style={{ marginTop: 8 }}>
                    <p>Sélectionnez la date de clôture :</p>
                    <DatePicker
                        style={{ width: "100%" }}
                        value={completionDate}
                        onChange={setCompletionDate}
                        disabled={record.closing_date}
                        format="DD/MM/YYYY"
                        disabledDate={(current) => current && current > dayjs().endOf("day")}
                    />
                </div>
            }
            okText="Enregistrer"
            cancelText="Annuler"
            onConfirm={handleConfirm}

            onCancel={resetAndClose}
        >
            <Tooltip title="Clôture">
                <Button disabled={!permissions('cloturer.reclamation') || Number(record?.open_corrective_actions_count) > 0} size="small" icon={<SendOutlined />} />
            </Tooltip>
        </Popconfirm >
    );
}