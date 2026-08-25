import React, { useState } from "react";
import { Button, Popconfirm, Space, Tooltip, message } from "antd";
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
} from "@ant-design/icons";
import { api } from "../utils/api";

export default function ImprovementStatusActions({
    record,
    permissions,
    onStatusChanged,
}) {
    const [loading, setLoading] = useState(false);

    const changeStatus = async (status) => {
        try {
            setLoading(true);

            if (status === "Approuvé") {
                await api.patch(
                    `improvement-sheets/${record.id}/approve`
                );
            } else if (status === "Annulé") {
                await api.patch(
                    `improvement-sheets/${record.id}/cancel`
                );
            }

            message.success(
                status === "Approuvé"
                    ? "La fiche d’amélioration a été approuvée avec succès."
                    : "La fiche d’amélioration a été annulée avec succès."
            );

            // Reload table
            onStatusChanged?.();

        } catch (error) {
            console.error("Erreur changement statut:", error);

            message.error(
                error?.response?.data?.message ||
                    "Erreur lors du changement de statut."
            );
        } finally {
            setLoading(false);
        }
    };

    /*
     * Les actions sont disponibles uniquement :
     * - lorsque la fiche est "Enregistré"
     * - pour le rôle "dr_general"
     */
    if (record?.statut !== "Enregistré" ) {
        return null;
    }

    return (
        <Space size={2}>

            {/* =========================
                APPROUVER
            ========================== */}
            <Popconfirm
                title="Approuver cette fiche ?"
                description="La fiche sera marquée comme approuvée."
                okText="Approuver"
                cancelText="Retour"
                onConfirm={() => changeStatus("Approuvé")}
            >
                <Tooltip title="Approuver">
                    <Button
                        size="small"
                        type="primary"
                        ghost
                        loading={loading}
                        disabled={
                            !permissions(
                                "approuver.fiche_amelioration"
                            )
                        }
                        icon={<CheckCircleOutlined />}
                    />
                </Tooltip>
            </Popconfirm>

            {/* =========================
                ANNULER
            ========================== */}
            <Popconfirm
                title="Annuler cette fiche ?"
                description="La fiche sera marquée comme annulée."
                okText="Annuler la fiche"
                cancelText="Retour"
                okButtonProps={{
                    danger: true,
                }}
                onConfirm={() => changeStatus("Annulé")}
            >
                <Tooltip title="Annuler">
                    <Button
                        size="small"
                        danger
                        loading={loading}
                        disabled={
                            !permissions(
                                "annuler.fiche_amelioration"
                            )
                        }
                        icon={<CloseCircleOutlined />}
                    />
                </Tooltip>
            </Popconfirm>

        </Space>
    );
}