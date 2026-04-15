import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../state/AuthProvider";

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  // Still checking session
  if (user === undefined) return null;

  // Not authenticated
  if (user === null) return <Navigate to="/login" replace />;

  return children;
};

export default ProtectedRoute;
