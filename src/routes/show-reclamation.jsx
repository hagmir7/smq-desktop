import { Button, Steps, Tag, Result, Skeleton, Tooltip, Breadcrumb } from "antd";
import {
    LeftOutlined,
    RightOutlined,
    ArrowLeftOutlined,
    UserOutlined,
    CalendarOutlined,
    TeamOutlined,
    FlagOutlined,
    CheckCircleFilled,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo } from "react";
import CreateRecalmationForm from "../components/CreateRecalmationForm";
import ReclamationCorrectiveActions from "../components/ReclamationCorrectiveActions";
import reclamationApi from "../utils/reclamationApi";
import { dateFormat } from "../utils/config";
import AnalyseReclamationForm from "../components/AnalyseReclamationForm";
import TraitementReclamationForm from "../components/TraitementReclamationForm";
import ShowReclamationForm from "../components/ShowReclamationForm";

// Central place to map a reclamation's status to a tag color + label.
// Falls back gracefully if the backend sends a status we don't recognize yet.
const STATUS_META = {
    recevable: { color: "red", label: "Recevable" },
    en_analyse: { color: "orange", label: "En analyse" },
    en_traitement: { color: "blue", label: "En traitement" },
    en_cloture: { color: "purple", label: "En clôture" },
    cloturee: { color: "green", label: "Clôturée" },
};

// Hex accents used for the left border / soft glow of the header card,
// keyed the same way as STATUS_META so the two always stay in sync.
const STATUS_ACCENT = {
    recevable: "#ef4444",
    en_analyse: "#f97316",
    en_traitement: "#3b82f6",
    en_cloture: "#a855f7",
    cloturee: "#22c55e",
};

function getStatusMeta(status) {
    return STATUS_META[status] ?? { color: "default", label: status ?? "—" };
}

function getStatusAccent(status) {
    return STATUS_ACCENT[status] ?? "#9ca3af";
}

const STEP_ITEMS = [
    { title: "Création" },
    { title: "Validation" },
    { title: "Analyse" },
    { title: "Affectation" },
    { title: "Clôture" },
];

// A single info tile used in the header summary strip.
// `tone` lets a tile (e.g. a completed closing date) stand out with a
// green success treatment instead of the neutral default.
function InfoTile({ icon, label, value, tone = "default" }) {
    const toneStyles =
        tone === "success"
            ? {
                  wrapper: "border-green-200 bg-green-50/70",
                  iconWrap: "bg-green-100 text-green-600",
                  value: "text-green-800 font-medium",
              }
            : {
                  wrapper: "border-gray-200 bg-white",
                  iconWrap: "bg-gray-100 text-gray-400",
                  value: "text-gray-800",
              };

    return (
        <div
            className={`flex items-start gap-3 rounded-lg border border-solid p-3 shadow-sm transition-shadow hover:shadow-md ${toneStyles.wrapper}`}
        >
            <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${toneStyles.iconWrap}`}>
                {icon}
            </div>
            <div className="min-w-0">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    {label}
                </div>
                <div
                    className={`truncate text-sm ${toneStyles.value}`}
                    title={typeof value === "string" ? value : undefined}
                >
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
    const statusAccent = useMemo(() => getStatusAccent(reclamation?.status), [reclamation?.status]);
    const isClosed = Boolean(reclamation?.closing_date);

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

            <div
                className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border-0 border-l-4 border-solid bg-white p-3 shadow-sm"
                style={{ borderLeftColor: statusAccent }}
            >
                <div className="flex items-center gap-2">
                    <Tooltip title="Retour à la liste">
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={() => navigate("/reclamations")}
                            aria-label="Retour à la liste des réclamations"
                        />
                    </Tooltip>
                    <h2 className="m-0 p-0 text-[16px] font-semibold text-gray-800">
                        Réclamation — {reclamation?.code}
                    </h2>
                </div>
                <Tag color={statusMeta.color} className="rounded-full px-3 py-0.5 text-sm">
                    {isClosed && <CheckCircleFilled className="mr-1" />}
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
                {isClosed ? (
                    <InfoTile
                        icon={<CheckCircleFilled />}
                        label="Clôturée le"
                        value={dateFormat(reclamation?.closing_date)}
                        tone="success"
                    />
                ) : (
                    <InfoTile
                        icon={<FlagOutlined />}
                        label="Clôture prévue"
                        value={dateFormat(reclamation?.planned_closing_date)}
                    />
                )}
            </div>

            <div className="mb-6 rounded-lg border border-solid border-gray-200 bg-white p-4 shadow-sm">
                <Steps
                    size="small"
                    current={current}
                    items={STEP_ITEMS}
                    onChange={setCurrent}
                    className="cursor-pointer"
                />
            </div>

            <div style={{ minHeight: 200 }}>
                {current === 0 && (
                    // <CreateRecalmationForm
                    //     reclamationId={id}
                    //     reclamation={reclamation}
                    //     onUpdated={getReclamation}
                    // />

                    <ShowReclamationForm
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
                    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50/60 p-10 text-center">
                        {isClosed ? (
                            <>
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
                                    <CheckCircleFilled style={{ fontSize: 28 }} />
                                </div>
                                <div>
                                    <div className="text-base font-semibold text-gray-800">
                                        Réclamation clôturée
                                    </div>
                                    <div className="mt-1 text-sm text-gray-500">
                                        Clôturée le {dateFormat(reclamation?.closing_date)}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-gray-400">
                                    <FlagOutlined style={{ fontSize: 24 }} />
                                </div>
                                <div>
                                    <div className="text-base font-semibold text-gray-600">
                                        En attente de clôture
                                    </div>
                                    <div className="mt-1 text-sm text-gray-400">
                                        {reclamation?.planned_closing_date
                                            ? `Clôture prévue le ${dateFormat(reclamation?.planned_closing_date)}`
                                            : "Aucune date de clôture prévue pour le moment"}
                                    </div>
                                </div>
                            </>
                        )}
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