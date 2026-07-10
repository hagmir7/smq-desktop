

/* ---------------------------------------------------------------------
   Corrective Actions API wrapper
   baseURL already includes the trailing /api/, so paths here are
   relative (no leading slash) — e.g. "corrective-actions", not
   "/api/corrective-actions".
--------------------------------------------------------------------- */

import { api } from "./api";

export const correctiveActionsApi = {
    list: (perPage = 20) =>
        api.get("corrective-actions", { params: { per_page: perPage } }).then(r => r.data),

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
        api.post(`corrective-actions/${id}/children`, payload).then(r => r.data),
};

export function extractErrorMessage(err) {
    return err?.response?.data?.message || err?.message || "Something went wrong.";
}