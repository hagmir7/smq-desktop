import React from 'react'
import { useParams } from 'react-router-dom'

import ImprovementActionsTable from '../components/ImprovementActionsTable';
import ImprovementSheetView from '../components/ImprovementSheetView';

export default function ShowImprovement() {

    const { id } = useParams();
    return (
        <div>
            <ImprovementSheetView
                id={id}
            />

            <ImprovementActionsTable improvementSheetId={id} />
        </div>
    )
}
