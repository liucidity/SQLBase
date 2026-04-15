import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import Layout from "./components/routes/Layout";
import ProtectedRoute from "./components/routes/ProtectedRoute";
import Home from "./components/pages/Home";
import Login from "./components/pages/Login";
import Register from "./components/pages/Register";
import CreateSchemaPage from "./components/pages/CreateSchema";
import CreateQueriesPage from "./components/pages/CreateQueries";
import CreateSeedsPage from "./components/pages/CreateSeeds";
import CreateChartsPage from "./components/pages/CreateCharts";
import UserDatabases from "./components/pages/UserDatabases";
import GlobalProvider from "./state/GlobalStateProvider";
import { AuthProvider } from "./state/AuthProvider";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GlobalProvider>
          <Routes>
            {/* Auth pages — no sidebar */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* App shell with sidebar */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route
                path="user-databases"
                element={<ProtectedRoute><UserDatabases /></ProtectedRoute>}
              />
              <Route
                path="tables"
                element={<ProtectedRoute><CreateSchemaPage /></ProtectedRoute>}
              />
              <Route
                path="seeds"
                element={<ProtectedRoute><CreateSeedsPage /></ProtectedRoute>}
              />
              <Route
                path="queries"
                element={<ProtectedRoute><CreateQueriesPage /></ProtectedRoute>}
              />
              <Route
                path="charts"
                element={<ProtectedRoute><CreateChartsPage /></ProtectedRoute>}
              />
            </Route>
          </Routes>
        </GlobalProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);
