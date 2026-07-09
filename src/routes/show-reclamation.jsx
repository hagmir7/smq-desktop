import { Button, Steps, Tag, Result } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import CreateRecalmationForm from "../components/CreateRecalmationForm";
// import AnalyseReclamationForm  from "../components/AnalyseReclamationForm ";
import ReclamationCorrectiveActions from "../components/ReclamationCorrectiveActions";
import reclamationApi from "../utils/reclamationApi";
import { dateFormat } from "../utils/config";
import AnalyseReclamationForm from "../components/AnalyseReclamationForm";
import TraitementReclamationForm from "../components/TraitementReclamationForm";

export default function ShowReclamation() {
    const [current, setCurrent] = useState(0);
    const [reclamation, setReclamation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const { id } = useParams();
    const navigate = useNavigate();

    const items = [
        { title: "Création" },
        { title: "Analyse" },
        { title: "Traitement" },
        { title: "Affectation" },
        { title: "Clôture" },
    ];

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

    if (loading) {
        return <div className="p-3">Chargement...</div>;
    }

    if (error || !reclamation) {
        return (
            <div className="p-3">
                <Result
                    status="404"
                    title="Réclamation introuvable"
                    subTitle="Cette réclamation n'existe pas ou une erreur est survenue lors du chargement."
                    extra={
                        <Button type="primary" onClick={() => navigate("/reclamations")}>
                            Retour à la liste
                        </Button>
                    }
                />
            </div>
        );
    }

    return (
        <div className="p-3">

            <div className="mb-2 flex justify-between">
                <h2 className="p-0 m-0 text-[18px]">Reclamation - {reclamation?.code}</h2>
                <div className="flex"> <Tag color={'red'}>Recevable</Tag> </div>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="border rounded-md border-green-300 p-2 border-solid shadow-sm bg-green-100">
                    <h2 className="m-0 p-0 text-sm">Client</h2>
                    {reclamation?.client_code} - {reclamation?.client_company_name}
                </div>
                <div className="border rounded-md border-green-300 p-2 border-solid shadow-sm bg-green-100">
                    <h2 className="m-0 p-0 text-sm">Date</h2>
                    {dateFormat(reclamation?.claimant_date)}
                </div>
                <div className="border rounded-md border-green-300 p-2 border-solid shadow-sm bg-green-100">
                    <h2 className="m-0 p-0 text-sm">Responsable</h2>
                    {reclamation?.responsible_code} - {reclamation?.responsible_name}
                </div>
                <div className="border rounded-md border-green-300 p-2 border-solid shadow-sm bg-green-100">
                    <h2 className="m-0 p-0 text-sm">Clôture prévue</h2>
                    {dateFormat(reclamation?.planned_closing_date)}
                </div>
            </div>

            <Steps size="small" current={current} items={items} style={{ marginBottom: 24 }} />
            <div style={{ minHeight: 200 }}>
                {current === 0 && (
                    <div>
                        <CreateRecalmationForm
                            reclamationId={id}
                            reclamation={reclamation}
                            onUpdated={getReclamation}
                        />
                    </div>
                )}
                {current === 1 && <div><AnalyseReclamationForm reclamationId={id} reclamation={reclamation} /> </div>}
                {current === 2 && <div><div>
                    <TraitementReclamationForm
                        reclamationId={id}
                        reclamation={reclamation}

                    />
                </div></div>}
                {current === 3 && <div><ReclamationCorrectiveActions reclamationId={id} /></div>}
                {current === 4 && <div>Contenu étape 5</div>}
            </div>
            <div style={{ marginTop: 24 }} className="flex justify-between">
                {current > 0 ? (
                    <Button onClick={() => setCurrent(current - 1)}>
                        Précédent
                    </Button>
                ) : <div></div>}
                {current < items.length - 1 ? (
                    <Button
                        type="primary"
                        onClick={() => setCurrent(current + 1)}
                        style={{ marginLeft: 8 }}
                    >
                        Suivant
                    </Button>
                ) : <div></div>}
            </div>
        </div>
    );
}