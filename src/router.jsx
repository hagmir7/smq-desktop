
import { createBrowserRouter } from "react-router-dom";
import { lazy } from "react";
import Root from "./routes/root";
import ErrorPage from "./routes/error-page";
import ProtectedRoute from "./routes/protected-route";
import Login from "./routes/login";
import MainLayout from "./layouts/MainLayout";

// Lazy-load route components for code-splitting
const Home = lazy(() => import("./routes/home"));
const Dashboard = lazy(() => import("./routes/dashboard"));
const Settings = lazy(() => import("./routes/settings"));

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
      { path: "settings", element: <Settings /> },

      { path: "*", element: <ErrorPage /> },
    ],
  },

  { path: "login", element: <Login /> },
]);