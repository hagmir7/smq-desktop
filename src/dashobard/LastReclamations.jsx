import React from "react";
import { Row, Col, Card, Typography, Tag, Table, Button } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { dateFormat } from "../utils/config";

const { Text } = Typography;

const WORKFLOW_STEPS = {
    1: { label: "Création", color: "default" },
    2: { label: "Validation", color: "blue" },
    3: { label: "Analyse et Traitement", color: "orange" },
    4: { label: "Affectation", color: "purple" },
    5: { label: "Clôturé", color: "green" },
};

const SectionCard = ({ title, extra, children }) => (
    <Card
        variant={false}
        className="rounded-2xl shadow-sm"
        styles={{
            body: {
                padding: "16px",
            },
        }}
    >
        {/* Section header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Text className="text-[12px] font-semibold uppercase tracking-wide text-gray-600">
                {title}
            </Text>

            {extra && (
                <div className="self-start sm:self-auto">
                    {extra}
                </div>
            )}
        </div>

        <div className="mt-3 sm:mt-4">
            {children}
        </div>
    </Card>
);

function getStatusMeta(claim) {
    const step = WORKFLOW_STEPS[claim.workflow_step];

    return step || {
        label: "Inconnu",
        color: "default",
    };
}

const columns = [
    {
        title: "Ref",
        dataIndex: "code",
        key: "code",
        width: 110,
        fixed: "left",

        render: (text, record) => (
            <Link
                to={`/reclamations?reclamation_id=${record.id}`}
                onClick={(e) => e.stopPropagation()}
            >
                <Text
                    strong
                    className="text-gray-900 hover:!text-blue-600"
                >
                    {text}
                </Text>
            </Link>
        ),

        sorter: (a, b) =>
            String(a.code).localeCompare(String(b.code)),
    },

    {
        title: "Client",
        dataIndex: "client_code",
        key: "client_code",
        width: 130,

        render: (text) => (
            <Text className="text-gray-500">
                {text || "—"}
            </Text>
        ),
    },

    {
        title: "Date de création",
        dataIndex: "created_at",
        key: "created_at",
        width: 150,

        render: (created_at) => (
            <Text className="whitespace-nowrap text-gray-500">
                {dateFormat(created_at) || "—"}
            </Text>
        ),
    },

    {
        title: "Objet de réclamation",
        dataIndex: "object",
        key: "object",
        width: 260,

        render: (text) => (
            <Text
                className="block max-w-[260px] truncate text-gray-700"
                title={text}
            >
                {text || "—"}
            </Text>
        ),
    },

    {
        title: "Statut",
        key: "status",
        width: 150,
        align: "right",

        filters: Object.entries(WORKFLOW_STEPS).map(
            ([step, { label }]) => ({
                text: label,
                value: Number(step),
            })
        ),

        onFilter: (value, record) =>
            record.workflow_step === value,

        render: (_, record) => {
            const { label, color } = getStatusMeta(record);

            return (
                <Tag color={color}>
                    {label}
                </Tag>
            );
        },
    },
];

export default function LastReclamations({ recentClaims }) {
    const navigate = useNavigate();

    return (
        <Row
            gutter={[16, 16]}
            className="mt-4"
        >
            <Col xs={24}>
                <SectionCard
                    title="Dernières réclamations"
                    extra={
                        <Link to="/reclamations">
                            <Button
                                type="link"
                                size="small"
                                className="!px-0 !text-green-700"
                            >
                                Voir tout
                                <ArrowRightOutlined />
                            </Button>
                        </Link>
                    }
                >
                    <div className="overflow-hidden rounded-lg border border-solid border-gray-200">
                        <Table
                            rowKey="id"
                            columns={columns}
                            dataSource={recentClaims}
                            pagination={false}
                            size="small"
                            locale={{
                                emptyText:
                                    "Aucune réclamation récente.",
                            }}

                            /* Responsive horizontal scroll */
                            scroll={{
                                x: 800,
                            }}

                            onRow={(record) => ({
                                onClick: () =>
                                    navigate(
                                        `/reclamations?reclamation_id=${record.id}`
                                    ),

                                className:
                                    "cursor-pointer hover:bg-gray-50",
                            })}
                        />
                    </div>
                </SectionCard>
            </Col>
        </Row>
    );
}