import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../utils/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {
    try {
      if (window.electron) {
        const session = await window.electron.getSession();
        if (session?.user) {
          setUser(session.user);
          setAuthLoading(false);
          return;
        }
      }

      const raw = localStorage.getItem("user");
      if (!raw || raw === "undefined" || raw === "null") {
        setUser(null);
      } else {
        setUser(JSON.parse(raw));
      }
    } catch (e) {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };
  const login = async (userData) => {
    setLoading(true);
    setMessage("");

    try {
      const response = await api.post("users/login", userData);

      const { access_token, user } = response.data;

      const authData = {
        roles: (user.roles ?? []).map(role => role.name),
        permissions: (user.permissions ?? []).map(permission => permission.name),
      };

      localStorage.setItem("authToken", access_token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("roles", JSON.stringify(authData));

      await getUser();

      if (window.electron) {
        await window.electron.login({
          access_token,
          user,
          roles: authData,
        });
      }

      return {
        success: true,
        user,
        roles: authData,
      };
    } catch (error) {
      console.error(error);

      const msg =
        error?.response?.data?.message ||
        "Impossible de se connecter au serveur. Veuillez vérifier votre connexion Internet.";

      setMessage(msg);

      return {
        success: false,
        message: msg,
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("roles");
    getUser();

    if (window.electron) {
      await window.electron.logout();
    }
  };

  const roles = (role) => {
    try {
      const rolesData = JSON.parse(localStorage.getItem("roles")) || {};
      const savedRoles = Array.isArray(rolesData.roles) ? rolesData.roles : [];
      const required = Array.isArray(role) ? role : [role];
      return required.some((r) => savedRoles.includes(r));
    } catch {
      return false;
    }
  };

  const permissions = (permission) => {
    try {
      const rolesData = JSON.parse(localStorage.getItem("roles"));
      return !!rolesData?.permissions?.includes(permission);
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{ login, loading, message, user, authLoading, roles, permissions, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);