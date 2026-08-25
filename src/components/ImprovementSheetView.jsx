import React, { useEffect, useState, useCallback } from "react";
import {
    Spin,
    message,
    Row,
    Col,
    Divider,
    Tag,
    Tooltip,
    Button,
    Avatar,
    Space,
    Typography,
    Card,
    Empty,
} from "antd";

import {
    AuditOutlined,
    UserOutlined,
    CalendarOutlined,
    CheckCircleFilled,
    CloseCircleFilled,
    ClockCircleOutlined,
    FileTextOutlined,
    EditOutlined,
    CheckCircleOutlined,
    SaveOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/fr";

import { api } from "../utils/api";
import ImprovementEvaluationModal from "./ImprovementEvaluationModal";
import { useAuth } from "../contexts/AuthContext";
import ImprovementSheetModal from "./ImprovementSheetModal";
import { IMPROVEMENT_SHEET_STATUT_COLORS } from "../utils/config";

dayjs.extend(relativeTime);
dayjs.locale("fr");

const { Text, Title, Paragraph } = Typography;

// ---------------------------------------------------------
// Date Display
// ---------------------------------------------------------

function DateDisplay({ value, emptyText = "Non renseignée" }) {
    if (!value) {
        return <Text type="secondary">{emptyText}</Text>;
    }

    const d = dayjs(value);

    return (
        <Space size={8} align="start">
            <CalendarOutlined className="text-gray-400 mt-1" />

            <div className="leading-tight">
                <div className="font-medium text-slate-800 capitalize">
                    {d.format("dddd D MMMM YYYY")}
                </div>

                <Text type="secondary" className="text-xs">
                    {d.fromNow()}
                </Text>
            </div>
        </Space>
    );
}

// ---------------------------------------------------------
// Field
// ---------------------------------------------------------

function Field({ label, children }) {
    return (
        <div className="mb-4">
            <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                {label}
            </div>

            <div>{children}</div>
        </div>
    );
}

// ---------------------------------------------------------
// Component
// ---------------------------------------------------------

export default function ImprovementSheetView({ id, onEdit }) {
    const [loading, setLoading] = useState(true);
    const [sheet, setSheet] = useState(null);

    const [evaluateOpen, setEvaluateOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [openImprovementSheet, setOpenImprovementSheet] = useState(false);

    // IMPORTANT:
    // Hook must be declared before any conditional return.
    const [registering, setRegistering] = useState(false);

    const { permissions } = useAuth();

    // ---------------------------------------------------------
    // Load data
    // ---------------------------------------------------------

    const loadData = useCallback(async () => {
        setLoading(true);

        try {
            const res = await api.get(`/improvement-sheets/${id}`);

            setSheet(res.data.data || res.data);
        } catch (err) {
            console.error(err);

            message.error(
                "Erreur lors du chargement de la fiche d'amélioration."
            );
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ---------------------------------------------------------
    // Evaluation success
    // ---------------------------------------------------------

    const handleEvaluateSuccess = () => {
        setEvaluateOpen(false);
        loadData();
    };

    // ---------------------------------------------------------
    // Register
    // ---------------------------------------------------------

    const register = async () => {
        if (!sheet?.id || registering) {
            return;
        }

        setRegistering(true);

        try {
            const response = await api.put(
                `improvement-sheets/${sheet.id}/register`
            );

            message.success(
                response?.data?.message ||
                    "Fiche enregistrée avec succès"
            );

            // Reload the sheet so the new status is displayed
            await loadData();
        } catch (error) {
            message.error(
                error?.response?.data?.message ||
                    "Erreur d'enregistrement"
            );
        } finally {
            setRegistering(false);
        }
    };

    // ---------------------------------------------------------
    // Status
    // ---------------------------------------------------------

    const completedStatuses = [
        "Enregistré",
        "Approuvé",
        "En cours",
        "Clôturé",
    ];

    const isCompleted = completedStatuses.includes(sheet?.statut);

    // ---------------------------------------------------------
    // Loading
    // ---------------------------------------------------------

    if (loading) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: 80,
                }}
            >
                <Spin size="large" tip="Chargement..." />
            </div>
        );
    }

    // ---------------------------------------------------------
    // Not found
    // ---------------------------------------------------------

    if (!sheet) {
        return (
            <Empty
                description="Fiche introuvable."
                className="py-20"
            />
        );
    }

    // ---------------------------------------------------------
    // Render
    // ---------------------------------------------------------

    return (
        <div className="px-3">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="flex justify-between items-start mt-3 mb-4">

                <div>
                    <Space align="center" size={10}>

                        <Title level={4} style={{ margin: 0 }}>
                            Fiche d'amélioration
                        </Title>

                        <Tag color="default">
                            {sheet.code}
                        </Tag>

                        <Tag
                            color={
                                IMPROVEMENT_SHEET_STATUT_COLORS[
                                    sheet.statut
                                ] || "default"
                            }
                        >
                            {sheet.statut}
                        </Tag>

                    </Space>

                    <div className="text-xs text-slate-400 mt-1">

                        {sheet.finding_source}

                        {sheet.corrective_action?.code && (
                            <>
                                {" · "}
                                <FileTextOutlined />{" "}
                                {sheet.corrective_action.code}
                            </>
                        )}

                    </div>
                </div>

                {/* =================================================
                    ACTIONS
                ================================================= */}

                <Space>

                    {/* REGISTER BUTTON */}

                    <Button
                        type={isCompleted ? "default" : "primary"}
                        variant={isCompleted ? "outlined" : "solid"}
                        color={isCompleted ? "cyan" : undefined}
                        icon={
                            isCompleted ? (
                                <CheckCircleOutlined />
                            ) : (
                                <SaveOutlined />
                            )
                        }
                        disabled={
                            isCompleted ||
                            !permissions("modifier.fiche_amelioration")
                        }
                        onClick={register}
                        loading={registering}
                    >
                        {isCompleted ? "Enregistré" : "Enregistrer"}
                    </Button>

                    {/* EDIT BUTTON */}

                    <Button
                        disabled={
                            !permissions(
                                "modifier.fiche_amelioration"
                            )
                        }
                        icon={<EditOutlined />}
                        onClick={() => {
                            setEditingRecord(sheet);
                            setOpenImprovementSheet(true);
                        }}
                    >
                        Modifier
                    </Button>

                    {/* EVALUATE BUTTON */}

                    <Tooltip title="Évaluer">

                        <Button
                            type="primary"
                            disabled={
                                !permissions(
                                    "evaluer.fiche_amelioration"
                                )
                            }
                            icon={<AuditOutlined />}
                            onClick={() =>
                                setEvaluateOpen(true)
                            }
                        >
                            Évaluer
                        </Button>

                    </Tooltip>

                </Space>
            </div>

            {/* =================================================
                GENERAL INFORMATION
            ================================================= */}

            <div className="md:flex gap-6">

                <div className="w-full">

                    <Card
                        size="small"
                        className="mb-4"
                        variant
                    >
                        <Divider
                            orientation="left"
                            orientationMargin={0}
                            style={{ marginTop: 0 }}
                        >
                            Informations générales
                        </Divider>

                        <Field label="Description">

                            {sheet.description ? (
                                <Paragraph className="!mb-0 whitespace-pre-line">
                                    {sheet.description}
                                </Paragraph>
                            ) : (
                                <Text type="secondary">
                                    -
                                </Text>
                            )}

                        </Field>

                        <Field label="Causes identifiées">

                            {sheet.cause_analysis ? (
                                <Paragraph className="!mb-0 whitespace-pre-line">
                                    {sheet.cause_analysis}
                                </Paragraph>
                            ) : (
                                <Text type="secondary">
                                    -
                                </Text>
                            )}

                        </Field>

                        <Row gutter={24}>

                            <Col span={12}>

                                <Field label="Créée le">
                                    <DateDisplay
                                        value={
                                            sheet.created_at
                                        }
                                    />
                                </Field>

                            </Col>

                            <Col span={12}>

                                <Field label="Dernière mise à jour">
                                    <DateDisplay
                                        value={
                                            sheet.updated_at
                                        }
                                    />
                                </Field>

                            </Col>

                        </Row>
                    </Card>

                </div>

                {/* =================================================
                    FOLLOW UP
                ================================================= */}

                <div className="w-full">

                    <Card
                        size="small"
                        variant
                    >

                        <Divider
                            orientation="left"
                            orientationMargin={0}
                            style={{ marginTop: 0 }}
                        >
                            Suivi & Évaluation
                        </Divider>

                        <Row gutter={24}>

                            <Col span={12}>

                                <Field label="Efficacité">

                                    {sheet.effectiveness === true ? (

                                        <Tag
                                            icon={
                                                <CheckCircleFilled />
                                            }
                                            color="success"
                                        >
                                            Efficace
                                        </Tag>

                                    ) : sheet.effectiveness === false ? (

                                        <Tag
                                            icon={
                                                <CloseCircleFilled />
                                            }
                                            color="error"
                                        >
                                            Non efficace
                                        </Tag>

                                    ) : (

                                        <Tag
                                            icon={
                                                <ClockCircleOutlined />
                                            }
                                            color="default"
                                        >
                                            En attente
                                        </Tag>

                                    )}

                                </Field>

                            </Col>

                            <Col span={12}>

                                <Field label="Clôturée">

                                    {sheet.closed ? (

                                        <Tag
                                            icon={
                                                <CheckCircleFilled />
                                            }
                                            color="success"
                                        >
                                            Oui
                                        </Tag>

                                    ) : (

                                        <Tag color="default">
                                            Non
                                        </Tag>

                                    )}

                                </Field>

                            </Col>

                        </Row>

                        <Row gutter={24}>

                            <Col span={12}>

                                <Field label="Date d'évaluation">

                                    <DateDisplay
                                        value={
                                            sheet.evaluation_date
                                        }
                                    />

                                </Field>

                            </Col>

                            <Col span={12}>

                                <Field label="Date de clôture">

                                    <DateDisplay
                                        value={
                                            sheet.closing_date
                                        }
                                    />

                                </Field>

                            </Col>

                        </Row>

                        <Field label="Description de l'observation">

                            {sheet.observation_description ? (

                                <Paragraph className="!mb-0 whitespace-pre-line">
                                    {
                                        sheet.observation_description
                                    }
                                </Paragraph>

                            ) : (

                                <Text type="secondary">
                                    -
                                </Text>

                            )}

                        </Field>

                    </Card>

                </div>

            </div>

            {/* =================================================
                RESPONSABLES
            ================================================= */}

            <Card
                size="small"
                variant
            >

                <Divider
                    orientation="left"
                    orientationMargin={0}
                    style={{ marginTop: 0 }}
                >
                    Responsables
                </Divider>

                {sheet.improvement_actions?.length > 0 ? (

                    <Space
                        direction="horizontal"
                        size={12}
                        className="w-full"
                    >

                        {sheet.improvement_actions.map((r) => (

                            <div
                                key={r.id}
                                className="flex items-center justify-between border border-slate-100 rounded-md px-3 py-2"
                            >

                                <Space>

                                    <Avatar
                                        icon={
                                            <UserOutlined />
                                        }
                                    />

                                    <div className="leading-tight">

                                        <div className="font-medium text-slate-800">
                                            {r.responsable
                                                ?.full_name ||
                                                "-"}
                                        </div>

                                        <Text
                                            type="secondary"
                                            className="text-xs"
                                        >
                                            {r.service?.name ||
                                                "Processus non défini"}
                                        </Text>

                                    </div>

                                </Space>

                            </div>

                        ))}

                    </Space>

                ) : (

                    <Text type="secondary">
                        Aucun responsable assigné.
                    </Text>

                )}

            </Card>

            {/* =================================================
                EVALUATION MODAL
            ================================================= */}

            <ImprovementEvaluationModal
                open={evaluateOpen}
                record={sheet}
                onClose={() =>
                    setEvaluateOpen(false)
                }
                onSuccess={
                    handleEvaluateSuccess
                }
            />

            {/* =================================================
                EDIT MODAL
            ================================================= */}

            <ImprovementSheetModal
                open={openImprovementSheet}
                record={editingRecord}
                onClose={() => {
                    setOpenImprovementSheet(false);
                    setEditingRecord(null);
                }}
                onSaved={() => loadData()}
            />

        </div>
    );
}