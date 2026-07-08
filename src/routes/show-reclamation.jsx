import { Button, Steps, Tag } from "antd";
import { useParams } from "react-router-dom";
import { useState } from "react";
import CreateRecalmationForm from "../components/CreateRecalmationForm";
import ReclamationCorrectiveActions from "../components/ReclamationCorrectiveActions";

export default function ShowReclamation() {
    const [current, setCurrent] = useState(0);

    const { id } = useParams();

    const items = [
        { title: "Création" },
        { title: "Analyse" },
        { title: "Traitment" },
        { title: "Affectation" },
        { title: "Clôture" },
    ];

    return (
        <div className="p-3">

            <div className="mb-2 flex justify-between">
                <h2 className="p-0 m-0 text-[18px] ">Reclamation - REC1852</h2>
                <div className="flex"> <Tag color={'red'}>Recevable</Tag> </div>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="border rounded-md border-green-300 p-2 border-solid shadow-sm bg-green-100">
                    <h2 className="m-0 p-0 text-sm">Client</h2>
                    CL150 - INTERCOCINA
                </div>
                <div className="border rounded-md border-green-300 p-2 border-solid shadow-sm bg-green-100">
                    <h2 className="m-0 p-0 text-sm">Date</h2>
                    CL150 - INTERCOCINA
                </div>
                <div className="border rounded-md border-green-300 p-2 border-solid shadow-sm bg-green-100">
                    <h2 className="m-0 p-0 text-sm">Responsable</h2>
                    CL150 - INTERCOCINA
                </div>
                <div className="border rounded-md border-green-300 p-2 border-solid shadow-sm bg-green-100">
                    <h2 className="m-0 p-0 text-sm">Clôture prévue</h2>
                    CL150 - INTERCOCINA
                </div>
            </div>

            <Steps size="small" current={current} items={items} style={{ marginBottom: 24 }} />
            <div style={{ minHeight: 200 }}>
                {current === 0 && <div><CreateRecalmationForm reclamationId={id} /> </div>}
                {current === 1 && <div> <ReclamationCorrectiveActions  reclamationId={id} /> </div>}
                {current === 2 && <div>Contenu étape 3</div>}
                {current === 3 && <div>Contenu étape 4</div>}
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