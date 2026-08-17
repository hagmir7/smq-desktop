import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function RoleRoute({ allowed = ["admin", "smq"], redirectTo = "/reclamations", children }) {
    const { roles } = useAuth();
    const hasAccess = roles(allowed);
    if (!hasAccess) {
        return <Navigate to={redirectTo} replace />;
    }

    return children;
}