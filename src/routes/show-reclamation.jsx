import { Button, Steps, Tag, Result, Skeleton, Tooltip, Breadcrumb } from "antd";
import {
    LeftOutlined,
    RightOutlined,
    ArrowLeftOutlined,
    UserOutlined,
    CalendarOutlined,
    TeamOutlined,
    FlagOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo } from "react";
import CreateRecalmationForm from "../components/CreateRecalmationForm";
import ReclamationCorrectiveActions from "../components/ReclamationCorrectiveActions";
import reclamationApi from "../utils/reclamationApi";
import { dateFormat } from "../utils/config";
import AnalyseReclamationForm from "../components/AnalyseReclamationForm";
import TraitementReclamationForm from "../components/TraitementReclamationForm";

// Central place to map a reclamation's status to a tag color + label.
// Falls back gracefully if the backend sends a status we don't recognize yet.
const STATUS_META = {
    recevable: { color: "red", label: "Recevable" },
    en_analyse: { color: "orange", label: "En analyse" },
    en_traitement: { color: "blue", label: "En traitement" },
    en_cloture: { color: "purple", label: "En clôture" },
    cloturee: { color: "green", label: "Clôturée" },
};

function getStatusMeta(status) {
    return STATUS_META[status] ?? { color: "default", label: status ?? "—" };
}

const STEP_ITEMS = [
    { title: "Création" },
    { title: "Analyse" },
    { title: "Traitement" },
    { title: "Affectation" },
    { title: "Clôture" },
];

// A single info tile used in the header summary strip.
function InfoTile({ icon, label, value }) {
    return (
        <div className="flex items-start gap-2 rounded-md border border-solid border-gray-200 bg-white p-3 shadow-sm">
            <div className="mt-0.5 text-gray-400">{icon}</div>
            <div className="min-w-0">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    {label}
                </div>
                <div className="truncate text-sm text-gray-800" title={typeof value === "string" ? value : undefined}>
                    {value || "—"}
                </div>
            </div>
        </div>
    );
}

export default function ShowReclamation() {
    const [current, setCurrent] = useState(0);
    const [reclamation, setReclamation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const { id } = useParams();
    const navigate = useNavigate();

    const getReclamation = useCallback(async () => {
        try {
            setLoading(true);
            setError(false);
            const response = await reclamationApi.show(id);
            setReclamation(response.data);
        } catch (err) {
            console.error("Failed to fetch reclamation:", err);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        getReclamation();
    }, [getReclamation]);

    // Desktop-app touch: navigate steps with arrow keys, without hijacking
    // typing inside inputs/textareas.
    useEffect(() => {
        function handleKeyDown(e) {
            const tag = document.activeElement?.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable) {
                return;
            }
            if (e.key === "ArrowRight") {
                setCurrent((c) => Math.min(c + 1, STEP_ITEMS.length - 1));
            } else if (e.key === "ArrowLeft") {
                setCurrent((c) => Math.max(c - 1, 0));
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const statusMeta = useMemo(() => getStatusMeta(reclamation?.status), [reclamation?.status]);

    if (loading) {
        return (
            <div className="p-3">
                <Skeleton active paragraph={{ rows: 1 }} className="mb-4" />
                <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton.Input key={i} active block style={{ height: 64 }} />
                    ))}
                </div>
                <Skeleton active paragraph={{ rows: 4 }} />
            </div>
        );
    }

    if (error || !reclamation) {
        return (
            <div className="p-3">
                <Result
                    status="404"
                    title="Réclamation introuvable"
                    subTitle="Cette réclamation n'existe pas ou une erreur est survenue lors du chargement."
                    extra={[
                        <Button key="retry" onClick={getReclamation}>
                            Réessayer
                        </Button>,
                        <Button key="back" type="primary" onClick={() => navigate("/reclamations")}>
                            Retour à la liste
                        </Button>,
                    ]}
                />
            </div>
        );
    }

    return (
        <div className="p-3">
            {/* <Breadcrumb
                className="mb-2"
                items={[
                    { title: <a onClick={() => navigate("/reclamations")}>Réclamations</a> },
                    { title: reclamation?.code },
                ]}
            /> */}

            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Tooltip title="Retour à la liste">
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={() => navigate("/reclamations")}
                            aria-label="Retour à la liste des réclamations"
                        />
                    </Tooltip>
                    <h2 className="m-0 p-0 text-[16px] font-semibold">
                        Réclamation — {reclamation?.code}
                    </h2>
                </div>
                <Tag color={statusMeta.color} className="text-sm">
                    {statusMeta.label}
                </Tag>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <InfoTile
                    icon={<TeamOutlined />}
                    label="Client"
                    value={`${reclamation?.client_code ?? ""} - ${reclamation?.client_company_name ?? ""}`}
                />
                <InfoTile
                    icon={<CalendarOutlined />}
                    label="Date"
                    value={dateFormat(reclamation?.claimant_date)}
                />
                <InfoTile
                    icon={<UserOutlined />}
                    label="Responsable"
                    value={`${reclamation?.responsible_code ?? ""} - ${reclamation?.responsible_name ?? ""}`}
                />
                <InfoTile
                    icon={<FlagOutlined />}
                    label="Clôture prévue"
                    value={dateFormat(reclamation?.planned_closing_date)}
                />
            </div>

            <Steps
                size="small"
                current={current}
                items={STEP_ITEMS}
                onChange={setCurrent}
                className="cursor-pointer"
                style={{ marginBottom: 24 }}
            />

            <div style={{ minHeight: 200 }}>
                {current === 0 && (
                    <CreateRecalmationForm
                        reclamationId={id}
                        reclamation={reclamation}
                        onUpdated={getReclamation}
                    />
                )}
                {current === 1 && (
                    <AnalyseReclamationForm reclamationId={id} reclamation={reclamation} />
                )}
                {current === 2 && (
                    <TraitementReclamationForm reclamationId={id} reclamation={reclamation} />
                )}
                {current === 3 && <ReclamationCorrectiveActions reclamationId={id} />}
                {current === 4 && (
                    <div className="rounded-md border border-dashed border-gray-300 p-6 text-center text-gray-400">
                        Contenu étape 5 — à venir
                    </div>
                )}
            </div>

            {/* Sticky action bar keeps navigation reachable without scrolling,
                which matters once the step content grows tall — a common
                desktop-app affordance. */}
            <div className="sticky bottom-0 mt-6 flex justify-between border-0 border-t border-solid border-gray-200 bg-white/95 py-3 backdrop-blur">
                {current > 0 ? (
                    <Button icon={<LeftOutlined />} onClick={() => setCurrent(current - 1)}>
                        Précédent
                    </Button>
                ) : (
                    <div />
                )}
                {current < STEP_ITEMS.length - 1 ? (
                    <Button
                        type="primary"
                        onClick={() => setCurrent(current + 1)}
                        iconPosition="end"
                        icon={<RightOutlined />}
                    >
                        Suivant
                    </Button>
                ) : (
                    <div />
                )}
            </div>
        </div>
    );
}