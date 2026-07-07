import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, authLoading, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!authLoading && !user && window.electron) {
      logout();
    }
  }, [authLoading, user, logout]);

  if (authLoading) {
    return null; // wait for the IPC/localStorage check to resolve
  }

  if (!user) {
    if (window.electron) {
      return null; // logout in progress via the effect above
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}