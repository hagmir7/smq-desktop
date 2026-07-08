
import { createBrowserRouter } from "react-router-dom";
import { lazy } from "react";
import Root from "./routes/root";
import ErrorPage from "./routes/error-page";
import ProtectedRoute from "./routes/protected-route";
import Login from "./routes/login";
import MainLayout from "./layouts/MainLayout";
import UpdateUser from "./routes/update-user";
import ShowReclamation from "./routes/show-reclamation";

// Lazy-load route components for code-splitting
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
export const router = createBrowserRouter([
  {
    path: "/",
    element: (<ProtectedRoute><MainLayout /></ProtectedRoute>),
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Home /> },
      {
        path: "dashboard",
        element: <Dashboard />,
        // loader runs before render — great for fetching data
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

      { path: "roles", element: <Roles /> },
      { path: "users", element: <Users /> },
      { path: "connections", element: <Connections /> },
      { path: "layout/update-user/:id", element: <UpdateUser /> },

      
      { path: "*", element: <ErrorPage /> },
    ],
  },

  { path: "login", element: <Login /> },
  { path: "update-user/:id", element: <UpdateUser /> },
]);