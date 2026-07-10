import React from 'react'
import { Steps, Button, Tabs, Row, Col, Tag, Space } from "antd";
import { ArrowUpRight } from "lucide-react";
import InfoRow from './ui/InfoRow';
import dayjs from "dayjs";

export default function ShowCorrectiveAction({ item, children }) {
    return (
        <div className="space-y-4 text-sm">
            <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Description</div>
                <p className="text-slate-700">{item.description}</p>
            </div>
            <Row gutter={[16, 12]}>
                 <Col span={12}><InfoRow label="Ref." value={item.code} /></Col>
                <Col span={12}><InfoRow label="Réclamation" value={item.reclamation.code} /></Col>
                <Col span={12}><InfoRow label="Client" value={item?.reclamation?.client_code} /></Col>
                <Col span={12}><InfoRow label="Nom de client/ Société" value={item?.reclamation?.client_company_name} /></Col>
                <Col span={12}><InfoRow label="Date d'échéance" value={item.due_date ? dayjs(item.due_date).format("DD MMM YYYY") : "—"} /></Col>
                <Col span={12}><InfoRow label="Responsable" value={item?.responsable?.full_name} /></Col>
                <Col span={12}><InfoRow label="Service" value={`${item?.service?.name} (${item?.service?.code || ''})`} /></Col>
                <Col span={12}><InfoRow label="Type" value={item.type} /></Col>
                <Col span={12}><InfoRow label="Efficacité" value={item.effectiveness} /></Col>
                <Col span={12}><InfoRow label="Date de réalisation" value={item.completion_date ? dayjs(item.due_date).format("DD MMM YYYY") : "—"} /></Col>
                <Col span={12}><InfoRow label="Créé par" value={item.user.full_name} /></Col>
            </Row>
            


            <div className='mt-5'></div>
            <span className='text-gray-400 text-[13px] p-0 m-0 pt-5'>Description</span>
            <div className='p-0 m-0 mt-0 pt-0' style={{marginTop: 0}}>
                {item.description}
            </div>

             <div className='mt-5'></div>
            <span className='text-gray-400 text-[13px] p-0 m-0 pt-5'>Critères d'efficacité</span>
            <div className='p-0 m-0 mt-0 pt-0' style={{marginTop: 0}}>
                {item.effectiveness_criteria}
            </div>


            {item.status === "completed" && (
                <div className="rounded-md bg-emerald-50 px-3 py-3 ring-1 ring-emerald-100">
                    <InfoRow label="Clôturée le" value={item.completion_date ? dayjs(item.completion_date).format("DD MMM YYYY") : "—"} />
                    <InfoRow label="Efficacité" value={item.effectiveness} />
                </div>
            )}
            {children.length > 0 && (
                <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Actions de suivi</div>
                    <Space direction="vertical" className="w-full">
                        {children.map(c => (
                            <Button key={c.id} block className="!flex !items-center !justify-between" onClick={() => onOpenRelated(c.id)}>
                                <span className="text-xs text-slate-500">#{c.id}</span>
                                <span className="mx-2 flex-1 truncate text-left text-xs text-slate-600">{c.description}</span>
                                <Tag color={STATUS_META[c.status]?.color}>{STATUS_META[c.status]?.label || c.status}</Tag>
                            </Button>
                        ))}
                    </Space>
                </div>
            )}
        </div>
    )
}
