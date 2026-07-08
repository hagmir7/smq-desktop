import { Button, Steps } from "antd";
import { useParams } from "react-router-dom";
import { useState } from "react";

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
            <Steps size="small" current={current} items={items} style={{ marginBottom: 24 }} />
            <div style={{ minHeight: 200 }}>
                {current === 0 && <div>Contenu étape 1</div>}
                {current === 1 && <div>Contenu étape 2</div>}
                {current === 2 && <div>Contenu étape 3</div>}
                {current === 3 && <div>Contenu étape 4</div>}
                {current === 4 && <div>Contenu étape 5</div>}
            </div>
            <div style={{ marginTop: 24 }} className="flex justify-between">
                {current > 0 && (
                    <Button onClick={() => setCurrent(current - 1)}>
                        Précédent
                    </Button>
                )}
                {current < items.length - 1 && (
                    <Button
                        type="primary"
                        onClick={() => setCurrent(current + 1)}
                        style={{ marginLeft: 8 }}
                    >
                        Suivant
                    </Button>
                )}
            </div>
        </div>
    );
}