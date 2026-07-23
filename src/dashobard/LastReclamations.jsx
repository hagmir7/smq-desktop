import React from "react";
import { Row, Col, Card, Typography, Tag, Table } from "antd";
import { dateFormat } from "../utils/config";

const { Text } = Typography;

/**
 * LastReclamations — displays the 10 most recent reclamations
 * using Ant Design's <Table /> as the data grid.
 *
 * Props:
 *   recentClaims: Array<{
 *     id: number|string,
 *     code: string,
 *     client_code: string,
 *     claimant_name: string,
 *     priority?: string,        // e.g. "critique"
 *     closing_date?: string|null,
 *   }>
 */

const SectionCard = ({ title, children }) => (
    <Card
        bordered={false}
        className="rounded-2xl shadow-sm"
        bodyStyle={{ padding: "20px 22px" }}
    >
        <Text className="text-[12px] tracking-wide text-gray-600 font-semibold uppercase">
            {title}
        </Text>
        <div className="mt-4">{children}</div>
    </Card>
);

// Derives a status label + Tag color from priority / closing_date
function getStatusMeta(claim) {
    if (claim.closing_date) {
        return { label: "Clôturée", color: "default" };
    }
    if ((claim.priority || "").toLowerCase() === "critique") {
        return { label: "Critique", color: "red" };
    }
    return { label: "En cours", color: "orange" };
}

const columns = [
    {
        title: "Code",
        dataIndex: "code",
        key: "code",
        render: (text) => <Text strong className="text-gray-900">{text}</Text>,
        sorter: (a, b) => String(a.code).localeCompare(String(b.code)),
    },
    {
        title: "Client",
        dataIndex: "client_code",
        key: "client_code",
        render: (text) => <Text className="text-gray-500">{text}</Text>,
    },
    {
        title: "Réclamant",
        dataIndex: "claimant_name",
        key: "claimant_name",
        render: (text) => <Text className="text-gray-500">{text || "—"}</Text>,
    },

    {
        title: "Créé par",
        dataIndex: "user",
        key: "user",
        render: (user) => <Text className="text-gray-500">{user.full_name || "—"}</Text>,
    },

     {
        title: "Créé le",
        dataIndex: "created_at",
        key: "created_at",
        render: (created_at) => <Text className="text-gray-500">{dateFormat(created_at) || "—"}</Text>,
    },

    {
        title: "Statut",
        key: "status",
        align: "right",
        filters: [
            { text: "Clôturée", value: "Clôturée" },
            { text: "Critique", value: "Critique" },
            { text: "En cours", value: "En cours" },
        ],
        onFilter: (value, record) => getStatusMeta(record).label === value,
        render: (_, record) => {
            const { label, color } = getStatusMeta(record);
            return <Tag color={color}>{label}</Tag>;
        },
    },
];

export default function LastReclamations({ recentClaims }) {
    return (
        <Row gutter={[16, 16]} className="mt-4">
            <Col xs={24}>
                <SectionCard title="Dernières réclamations">
                    <div className="border border-solid border-gray-200 rounded-lg border-b-0">
                        <Table
                            rowKey="id"
                            columns={columns}
                            dataSource={recentClaims}
                            pagination={false}
                            size="small"
                            locale={{ emptyText: "Aucune réclamation récente." }}
                        />
                    </div>
                </SectionCard>
            </Col>
        </Row>
    );
}