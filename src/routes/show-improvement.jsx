import React from 'react'
import { useParams } from 'react-router-dom'
import ImprovementSheetForm from '../components/ImprovementSheetForm';
import ImprovementActionsTable from '../components/ImprovementActionsTable';

export default function ShowImprovement() {

    const { id } = useParams();
    return (
        <div>
            <ImprovementSheetForm id={id} />

            <ImprovementActionsTable improvementSheetId={id} />
        </div>
    )
}
