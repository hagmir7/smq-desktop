import { useEffect, useState } from "react";
import { MONTH_LABELS } from "../utils/config";
import { api } from "../utils/api";

// Keep in sync with the WORKFLOW_STEPS used across the reclamations UI
// (e.g. LastReclamations.jsx) so status labels/colors stay consistent.
const WORKFLOW_STEPS = {
  1: { label: "Création", color: "#8c8c8c" },
  2: { label: "Validation", color: "#1677ff" },
  3: { label: "Analyse et Traitement", color: "#fa8c16" },
  4: { label: "Affectation", color: "#722ed1" },
  5: { label: "Clôturé", color: "#52c41a" },
};

export function useDashboardData(selectedYear) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [states, setStates] = useState(null);
  const [monthlyClaims, setMonthlyClaims] = useState(
    MONTH_LABELS.map((month) => ({ month, value: 0 }))
  );
  const [statuses, setStatuses] = useState([]);
  const [recentClaims, setRecentClaims] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);

        const [statesRes, monthRes, statusRes, lastRes] = await Promise.all([
          api.get(`dashboard/states`, { params: { year: selectedYear } }),
          api.get(`dashboard/reclamations-per-month`, {
            params: { year: selectedYear },
          }),
          api.get(`dashboard/reclamation-states`, {
            params: { year: selectedYear },
          }),
          api.get(`dashboard/last-reclamations`, {
            params: { year: selectedYear },
          }),
        ]);

        if (!isMounted) return;

        // ---- states (KPIs) ----
        setStates(statesRes.data);

        // ---- monthly chart: { data: { "1": 6, "2": 7, ... } } ----
        const monthData = monthRes.data?.data || {};
        setMonthlyClaims(
          MONTH_LABELS.map((month, idx) => ({
            month,
            value: monthData[idx + 1] ?? 0,
          }))
        );

        // ---- status breakdown, keyed by workflow_step: { "1": 4, "2": 9, "5": 75, ... } ----
        const statusData = statusRes.data?.data || statusRes.data || {};
        setStatuses(
          Object.entries(statusData).map(([step, value]) => {
            const meta = WORKFLOW_STEPS[step] || {
              label: `Étape ${step}`,
              color: "#0f5c4f",
            };
            return {
              step: Number(step),
              label: meta.label,
              value,
              color: meta.color,
            };
          })
        );

        // ---- last 10 reclamations ----
        setRecentClaims(lastRes.data || []);
      } catch (err) {
        if (isMounted) {
          setError(
            err?.response?.data?.message ||
              "Impossible de charger les données du tableau de bord."
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [selectedYear]);

  return { loading, error, states, monthlyClaims, statuses, recentClaims };
}