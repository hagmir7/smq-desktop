import { createHashRouter } from "react-router-dom";
import { lazy } from "react";
import Root from "./routes/root";
import ErrorPage from "./routes/error-page";
import ProtectedRoute from "./routes/protected-route";
import RoleRoute from "./routes/role-route";
import Login from "./routes/login";
import MainLayout from "./layouts/MainLayout";
import UpdateUser from "./routes/update-user";
import ShowReclamation from "./routes/show-reclamation";
import ShowImprovement from "./routes/show-improvement";
import Services from "./routes/services";
import Notifications from "./routes/notifications";

const Home = lazy(() => import("./routes/home"));
const Dashboard = lazy(() => import("./routes/dashboard"));
const Users = lazy(() => import("./routes/users"));
const Roles = lazy(() => import("./routes/roles"));
const Connections = lazy(() => import("./routes/connections"));
const Reclamations = lazy(() => import("./routes/reclamations"));
const CorrectionActions = lazy(() => import("./routes/correction-actions"));
const Improvements = lazy(() => import("./routes/improvements"));
const Register = lazy(() => import("./routes/register"));
const ImprovementsJournal = lazy(() => import("./routes/improvements-journal"));

export const router = createHashRouter([
  {
    path: "/",
    element: (<ProtectedRoute><MainLayout /></ProtectedRoute>),
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: (<RoleRoute><Home /></RoleRoute>),
      },
      {
        path: "dashboard",
        element: (
          <RoleRoute>
            <Dashboard />
          </RoleRoute>
        ),
        loader: async () => {
          const res = await fetch("/api/dashboard-data");
          if (!res.ok) throw new Response("Failed to load", { status: 500 });
          return res.json();
        },
      },

      { path: "reclamations", element: <Reclamations /> },
      { path: "reclamations/show/:id", element: <ShowReclamation /> },
      { path: "correction-actions", element: <CorrectionActions /> },
      { path: "improvements", element: <Improvements /> },
      { path: "improvements-journal", element: <ImprovementsJournal /> },
      { path: "register", element: <Register /> },

      {
        path: "roles",
        element: (
          <RoleRoute>
            <Roles />
          </RoleRoute>
        ),
      },
      {
        path: "users",
        element: (
          <RoleRoute>
            <Users />
          </RoleRoute>
        ),
      },
      { path: "services", element: <Services /> },
      {
        path: "connections",
        element: (<RoleRoute><Connections /></RoleRoute>),
      },
      { path: "notifications", element: <Notifications /> },
      { path: "layout/update-user/:id", element: <UpdateUser /> },
      { path: "improvements/:id", element: <ShowImprovement /> },

      { path: "*", element: <ErrorPage /> },
    ],
  },

  { path: "login", element: <Login /> },
  { path: "update-user/:id", element: <UpdateUser /> },
]);