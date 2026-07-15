/* ---------------------------------------------------------------------
   Corrective Actions API wrapper
   baseURL already includes the trailing /api/, so paths here are
   relative (no leading slash) — e.g. "corrective-actions", not
   "/api/corrective-actions".
--------------------------------------------------------------------- */

import { api } from "./api";

export const correctiveActionsApi = {
    // Takes a single params object: { page, per_page, search, status,
    // effectiveness, service_id, date_from, date_to, ... } and forwards
    // it straight through as the query string. Matches what the
    // CorrectiveActions page's buildParams() produces.
    list: (params = {}) =>
        api.get("corrective-actions", { params }).then((r) => r.data),

    get: (id) =>
        api.get(`corrective-actions/${id}`).then(r => r.data),

    // NOT in the documented spec — assumed endpoint for plain creation.
    // Confirm the real path/verb once known.
    create: (payload) =>
        api.post("corrective-actions", payload).then(r => r.data),

    update: (id, payload) =>
        api.put(`corrective-actions/${id}`, payload).then(r => r.data),

    remove: (id) =>
        api.delete(`corrective-actions/${id}`).then(r => r.data),

    complete: (id, payload) =>
        api.patch(`corrective-actions/${id}/complete`, payload).then(r => r.data),

    createChild: (id, payload) =>
        api.post(`corrective-actions/${id}/children?root_only=1`, payload).then(r => r.data),
};

export function extractErrorMessage(err) {
    return err?.response?.data?.message || err?.message || "Something went wrong.";
}