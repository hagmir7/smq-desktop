import { Button, Tooltip, Popconfirm, DatePicker, message } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { useState } from "react";

export default function CloseReclamation({ onCloseAction }) {
    const [completionDate, setCompletionDate] = useState(null);

    const handleConfirm = () => {
        if (!completionDate) {
            message.warning("Veuillez sélectionner une date.");
            return Promise.reject();
        }

        onCloseAction({
            completion_date: completionDate.format("YYYY-MM-DD"),
        });

        setCompletionDate(null);
    };

    return (
        <Popconfirm
            title="Clôturer l'action"
            description={
                <div style={{ marginTop: 8 }}>
                    <p>Sélectionnez la date de clôture :</p>
                    <DatePicker
                        style={{ width: "100%" }}
                        value={completionDate}
                        onChange={setCompletionDate}
                        format="DD/MM/YYYY"
                    />
                </div>
            }
            okText="Enregistrer"
            cancelText="Annuler"
            onConfirm={handleConfirm}
        >
            <Tooltip title="Clôture">
                <Button size="small" icon={<SendOutlined />} />
            </Tooltip>
        </Popconfirm>
    );
}