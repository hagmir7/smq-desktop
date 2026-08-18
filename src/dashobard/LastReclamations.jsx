import React from "react";
import { Row, Col, Card, Typography, Tag, Table, Button } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { dateFormat } from "../utils/config";

const { Text } = Typography;


const WORKFLOW_STEPS = {
    1: { label: 'Création', color: 'default' },
    2: { label: 'Validation', color: 'blue' },
    3: { label: 'Analyse et Traitement', color: 'orange' },
    4: { label: 'Affectation', color: 'purple' },
    5: { label: 'Clôturé', color: 'green' },
};


const SectionCard = ({ title, extra, children }) => (
    <Card
        variant={false}
        className="rounded-2xl shadow-sm"
        styles={{ body: { padding: "20px 22px" } }}
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

function getStatusMeta(claim) {
    const step = WORKFLOW_STEPS[claim.workflow_step];
    return step || { label: "Inconnu", color: "default" };
}

const columns = [
    {
        title: "Ref",
        dataIndex: "code",
        key: "code",
        render: (text, record) => (
            <Link
                to={`/reclamations?reclamation_id=${record.id}`}
                onClick={(e) => e.stopPropagation()}
            >
                <Text strong className="text-gray-900 hover:!text-blue-600">
                    {text}
                </Text>
            </Link>
        ),
        sorter: (a, b) => String(a.code).localeCompare(String(b.code)),
    },
    {
        title: "Client",
        dataIndex: "client_code",
        key: "client_code",
        render: (text) => <Text className="text-gray-500">{text}</Text>,
    },
    {
        title: "Date de création",
        dataIndex: "created_at",
        key: "created_at",
        render: (created_at) => <Text className="text-gray-500">{dateFormat(created_at) || "—"}</Text>,
    },
    // {
    //     title: "Réclamant",
    //     dataIndex: "claimant_name",
    //     key: "claimant_name",
    //     render: (text) => <Text className="text-gray-500">{text || "—"}</Text>,
    // },

    {
        title: "Objet de réclamation ",
        dataIndex: "object",
        key: "object",
    },



    {
        title: "Statut",
        key: "status",
        align: "right",
        filters: Object.entries(WORKFLOW_STEPS).map(([step, { label }]) => ({
            text: label,
            value: Number(step),
        })),
        onFilter: (value, record) => record.workflow_step === value,
        render: (_, record) => {
            const { label, color } = getStatusMeta(record);
            return <Tag color={color}>{label}</Tag>;
        },
    },
];

export default function LastReclamations({ recentClaims }) {
    const navigate = useNavigate();

    return (
        <Row gutter={[16, 16]} className="mt-4">
            <Col xs={24}>
                <SectionCard
                    title="Dernières réclamations"
                    extra={
                        <Link to="/reclamations">
                            <Button type="link" size="small" className="!px-0 text-green-700">
                                Voir tout <ArrowRightOutlined />
                            </Button>
                        </Link>
                    }
                >
                    <div className="border border-solid border-gray-200 rounded-lg border-b-0">
                        <Table
                            rowKey="id"
                            columns={columns}
                            dataSource={recentClaims}
                            pagination={false}
                            size="small"
                            locale={{ emptyText: "Aucune réclamation récente." }}
                            onRow={(record) => ({
                                onClick: () =>
                                    navigate(`/reclamations?reclamation_id=${record.id}`),
                                className: "cursor-pointer",
                            })}
                        />
                    </div>
                </SectionCard>
            </Col>
        </Row>
    );
}