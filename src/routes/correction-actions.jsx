import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    ConfigProvider, Layout, Table, Tag, Button, Drawer, Modal, Input,
    Row, Col, Statistic, Space, Segmented, message, Empty, Card,
    Badge,
} from "antd";
import {
    Plus, GitBranch, Search, Loader2, RefreshCw,
} from "lucide-react";
import dayjs from "dayjs";

import "antd/dist/reset.css";
import { correctiveActionsApi, extractErrorMessage } from "../utils/correctiveActionsApi";
import { dateFormat, isOverdue } from "../utils/config";
import DrawerBody from "../components/DrawerBody";
import CreateForm from "../components/CorrectionActionCreateForm";
import RightClickMenu from "../components/ui/RightClickMenu";
import ImprovementSheetModal from "../components/ImprovementSheetModal";

const { Header, Content } = Layout;


const STATUS_META = {
    open: { label: "Ouverte", color: "gold" },
    completed: { label: "Terminée", color: "green" },
};

const theme = {
    token: {
        colorSuccess: "#15803d",
        colorWarning: "#b45309",
        colorError: "#b91c1c",
        borderRadius: 6,
        fontFamily: "'Inter', ui-sans-serif, system-ui",
    },
};

// Static context-menu definition; per-row "id" is stamped on at render time
// so RightClickMenu can build unique keys (e.g. "edit-42") and hand the id
// back to us in onItemClick.
const ROW_MENU_ITEMS = [
    { label: "Modifier", key: "edit" },
    { label: "Marquer comme terminée", key: "complete" },
    { label: "Ajouter une sous-action", key: "child" },
    { label: "Fiche d'améliorationsn", key: "improvement" },
    { type: "divider", key: "divider" },
    { label: "Supprimer", key: "delete", danger: true },
];


/* ------------------------------ App ------------------------------- */

export default function CorrectiveActions() {


    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("Toutes");

    const [selectedId, setSelectedId] = useState(null);
    const [drawerTab, setDrawerTab] = useState("view");
    const [createOpen, setCreateOpen] = useState(false);

     const [open, setOpen] = useState(false);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const res = await correctiveActionsApi.list(50);
            const arr = Array.isArray(res) ? res : res?.data;
            setItems(Array.isArray(arr) ? arr : []);
        } catch (e) {
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    const filtered = useMemo(() => {
        return items
            .filter(i => statusFilter === "Toutes" || STATUS_META[i.status]?.label === statusFilter)
            .filter(i => !query || i.description?.toLowerCase().includes(query.toLowerCase()) || String(i.id).includes(query));
    }, [items, statusFilter, query]);

    const selected = items.find(i => i.id === selectedId) || null;
    const childrenOf = (id) => items.filter(i => i.parent_id === id);
    const parentOf = (item) => items.find(i => i.id === item?.parent_id);

    function openDrawer(id, tab = "view") { setSelectedId(id); setDrawerTab(tab); }
    function closeDrawer() { setSelectedId(null); }

    async function handleCreate(payload) {
        setLoading(true);
        try {
            await correctiveActionsApi.create(payload);
            await refresh();
            setCreateOpen(false);
            message.success("Action corrective créée.");
        } catch (e) { message.error(extractErrorMessage(e)); } finally { setLoading(false); }
    }

    async function handleUpdate(id, payload) {
        setLoading(true);
        try {
            await correctiveActionsApi.update(id, payload);
            await refresh();
            message.success("Modifications enregistrées.");
        } catch (e) { message.error(extractErrorMessage(e)); } finally { setLoading(false); }
    }

    async function handleDelete(id) {
        setLoading(true);
        try {
            await correctiveActionsApi.remove(id);
            await refresh();
            if (selectedId === id) closeDrawer();
            message.success("Action corrective supprimée.");
        } catch (e) { message.error(extractErrorMessage(e)); } finally { setLoading(false); }
    }

    async function handleComplete(id, payload) {
        setLoading(true);
        try {
            await correctiveActionsApi.complete(id, payload);
            await refresh();
            message.success("Marquée comme terminée.");
            setDrawerTab("view");
        } catch (e) { message.error(extractErrorMessage(e)); } finally { setLoading(false); }
    }

    async function handleCreateChild(parentId, payload) {
        setLoading(true);
        try {
            await correctiveActionsApi.createChild(parentId, payload);
            await refresh();
            message.success("Action de suivi créée.");
            setDrawerTab("view");
        } catch (e) { message.error(extractErrorMessage(e)); } finally { setLoading(false); }
    }

    // Handles clicks coming from the right-click context menu.
    // `key` is the action (edit/complete/child/delete), `id` is the row id
    // that RightClickMenu extracts from the composite key it built.
    const handleRowMenuClick = useCallback((key, id) => {
        const row = items.find(i => String(i.id) === String(id));
        if (!row) return;

        switch (key) {
            case "edit":
                openDrawer(row.id, "edit");
                break;
            case "complete":
                openDrawer(row.id, "complete");
                break;
            case "child":
                openDrawer(row.id, "child");
                break;
            case "improvement":
                setOpen(true)
                setSelectedId(row.id)
                break;
            case "delete":
                Modal.confirm({
                    title: "Supprimer cette action corrective ?",
                    content: row.children?.length > 0
                        ? `Elle a ${row.children.length} suivi(s) lié(s) — le comportement de l'API dans ce cas n'est pas confirmé.`
                        : "Cette action est irréversible.",
                    okText: "Supprimer",
                    okButtonProps: { danger: true },
                    cancelText: "Annuler",
                    onOk: () => handleDelete(row.id),
                });
                break;
            default:
                break;
        }
    }, [items]);

    // Wraps each <tr> so RightClickMenu can attach a contextmenu handler
    // scoped to that specific row, replacing the old actions column.
    const RowWithContextMenu = useCallback((props) => {
        const rowId = props["data-row-key"];
        const row = items.find(i => i.id === rowId);

        const menuItems = ROW_MENU_ITEMS
            .filter(item => item.key !== "complete" || row?.status !== "completed")
            .map(item => ({ ...item, id: rowId }));

        return (
            <RightClickMenu menuItems={menuItems} onItemClick={handleRowMenuClick}>
                <tr {...props} />
            </RightClickMenu>
        );
    }, [items, handleRowMenuClick]);

    const overdueCount = items.filter(isOverdue).length;
    const openCount = items.filter(i => i.status === "open").length;

    const columns = [
        {
            title: "Reclamation", dataIndex: "reclamation", width: 140,
            render: (reclamation) => (
                <span className="flex items-center gap-1">
                    {reclamation?.code ?? "—"}
                </span>
            ),
        },
        {
            title: "Type", dataIndex: "type", width: 90,
            render: (type) => (
                <Badge className="flex items-center gap-1 whitespace-nowrap">
                    {type ?? "—"}
                </Badge>
            ),
        },
        {
            title: "Client", dataIndex: "reclamation", width: 90,
            render: (reclamation) => <div>{reclamation?.client_code ?? "—"}</div>,
        },
        {
            title: "Procusse", dataIndex: "service", width: 90,
            render: (service) => <div className="whitespace-nowrap">{service?.name ?? "—"}</div>,
        },
        {
            title: "Responsable", dataIndex: "responsable", width: 140,
            render: (responsable) => responsable?.full_name ?? "—",
        },
        {
            title: "Statut", dataIndex: "status", width: 130,
            render: (s) => <Tag color={STATUS_META[s]?.color}>{STATUS_META[s]?.label || s}</Tag>,
        },
        {
            title: "Efficacité", dataIndex: "effectiveness", width: 90,
            render: (effectiveness) => effectiveness ?? "—",
        },
        {
            title: "Réalisation", dataIndex: "completion_date", width: 90,
            render: (completion_date) => completion_date ? dateFormat(completion_date) : "—",
        },
        {
            title: "Échéance", dataIndex: "due_date", width: 130,
            render: (d, row) => (
                <span className={isOverdue(row) ? "font-medium text-red-600" : "text-slate-600"}>
                    {d ? dayjs(d).format("DD MMM YYYY") : "—"}
                </span>
            ),
        },
        // "actions" column removed — row actions now live in the right-click
        // context menu (see RowWithContextMenu / ROW_MENU_ITEMS above).
    ];

    return (
        <ConfigProvider theme={theme}>
            <Layout className="min-h-full bg-slate-100">
                <Header className="flex items-center justify-between !bg-white !px-6 border-b border-slate-200" style={{ height: 64, lineHeight: "64px" }}>
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-700 text-white">
                            <GitBranch size={18} />
                        </div>
                        <div className="leading-tight">
                            <div className="text-base font-semibold text-slate-900">Actions correctives</div>
                            <div className="text-xs text-slate-500">Cycle de vie des actions correctives · gestion de la qualité</div>
                        </div>
                    </div>
                    <Space>
                        <Button type="primary" icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
                            Nouvelle
                        </Button>
                    </Space>
                </Header>

                <Content className="mx-auto w-full max-w-7xl px-4 py-4">

                    <div className="mb-4 flex flex-wrap items-center gap-3">
                        <Input
                            allowClear
                            placeholder="Rechercher par description ou identifiant…"
                            prefix={<Search size={14} className="text-slate-400" />}
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            className="max-w-xs"
                        />
                        <Segmented
                            options={["Toutes", "Ouverte", "Terminée"]}
                            value={statusFilter}
                            onChange={setStatusFilter}
                        />
                        <Button icon={loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} onClick={refresh}>
                            Actualiser
                        </Button>
                    </div>

                    <Card size="small" bodyStyle={{ padding: 0 }}>
                        <Table
                            rowKey="id"
                            size="small"
                            columns={columns}
                            dataSource={filtered}
                            loading={loading}
                            pagination={{ pageSize: 20 }}
                            locale={{ emptyText: <Empty description="Aucune action corrective trouvée" /> }}
                            components={{
                                body: {
                                    row: RowWithContextMenu,
                                },
                            }}
                        />
                    </Card>
                </Content>

                {/* Detail drawer */}
                <Drawer
                    open={!!selected}
                    onClose={closeDrawer}
                    title={selected ? <span className="text-sm text-slate-400">{selected.code}</span> : ""}
                    width={440}
                    extra={selected && <Tag color={STATUS_META[selected.status]?.color}>{STATUS_META[selected.status]?.label || selected.status}</Tag>}
                >
                    {selected && (
                        <DrawerBody
                            item={selected}
                            parent={parentOf(selected)}
                            children={childrenOf(selected.id)}
                            activeTab={drawerTab}
                            setActiveTab={setDrawerTab}
                            onOpenRelated={(id) => openDrawer(id, "view")}
                            onUpdate={(payload) => handleUpdate(selected.id, payload)}
                            onComplete={(payload) => handleComplete(selected.id, payload)}
                            onCreateChild={(payload) => handleCreateChild(selected.id, payload)}
                            loading={loading}
                        />
                    )}
                </Drawer>

                {/* Create modal */}
                <Modal
                    open={createOpen}
                    title="Nouvelle action corrective"
                    onCancel={() => setCreateOpen(false)}
                    footer={null}
                    destroyOnClose
                >
                    <CreateForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} loading={loading} />
                </Modal>
            </Layout>

            <ImprovementSheetModal
                open={open}
                onClose={() => setOpen(false)}
                corrective_action_id={selectedId}
            />
        </ConfigProvider>
    );
}