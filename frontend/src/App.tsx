import { Route, Routes } from "react-router-dom";

import ChangePasswordPage from "./pages/ChangePasswordPage/ChangePasswordPage";
import ForgotPasswordPage from "./pages/ChangePasswordPage/ChangePasswordPage";
import HomePage from "./pages/HomePage/HomePage";
import LandingPage from "./pages/LandingPage/LandingPage";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage/LoginPage";
import Logo from "./components/Logo/Logo";
import { Navigate } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage/RegisterPage";
import { useAuth } from "./context/AppContext";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? <>{children}</> : <Navigate to="/landing" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  return !isLoggedIn ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/landing"
        element={
          <PublicRoute>
            <Layout>
              <LandingPage />
            </Layout>
          </PublicRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout pageTitle="Home">
              <HomePage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/landing" replace />} />
    </Routes>
  );
}
