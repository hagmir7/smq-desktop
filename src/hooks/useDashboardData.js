import { useEffect, useState } from "react";
import { MONTH_LABELS, STATUS_COLORS } from "../utils/config";
import { api } from "../utils/api";

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

        // ---- status breakdown: { "Clôturées": 75, "Critique": 8, "En cours": 17 } ----
        const statusData = statusRes.data || {};
        setStatuses(
          Object.entries(statusData).map(([label, value]) => ({
            label,
            value,
            color: STATUS_COLORS[label] || "#0f5c4f",
          }))
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
