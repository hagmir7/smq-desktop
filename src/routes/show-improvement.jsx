import React from 'react'
import { useParams } from 'react-router-dom'
import ImprovementSheetForm from '../components/ImprovementSheetForm';

export default function ShowImprovement() {

    const { id } = useParams();
    return (
        <div><ImprovementSheetForm id={id} /></div>
    )
}
