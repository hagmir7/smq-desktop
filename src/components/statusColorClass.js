// Map a reclamation status string to a display color class
export const statusColorClass = (status) => {
  const s = (status || "").toLowerCase();
  if (s.includes("clôtur") || s.includes("cloture")) return "text-gray-400";
  if (s.includes("critique")) return "text-red-500";
  if (s.includes("cours")) return "text-orange-500";
  return "text-emerald-600";
};
