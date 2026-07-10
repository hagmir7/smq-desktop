import React from "react";

export default function InfoRow({ label, value }) {
    return (
        <div>
            <div className="text-xs font-medium text-slate-400">{label}</div>
            <div className="text-sm text-slate-700">{value || "—"}</div>
        </div>
    );
}