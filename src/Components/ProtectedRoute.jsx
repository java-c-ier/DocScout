import { useAuth } from "../AuthContext";
import { Navigate } from "react-router";

function ProtectedRoute({ children, requiredRole }) {
  const { user, role, authReady } = useAuth();
  if (!authReady) return null;
  if (!user) return <Navigate to="/signin" replace />;
  if (requiredRole && role !== requiredRole) return <Navigate to="/" replace />;
  return children;
}

export default ProtectedRoute;
