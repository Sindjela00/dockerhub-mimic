import { Route, Routes } from "react-router-dom";

import ChangePasswordPage from "./pages/ChangePasswordPage/ChangePasswordPage";
import ForgotPasswordPage from "./pages/ChangePasswordPage/ChangePasswordPage";
import HomePage from "./pages/HomePage/HomePage";
import LandingPage from "./pages/LandingPage/LandingPage";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage/LoginPage";
import { Navigate } from "react-router-dom";
import OrganizationDetailPage from "./pages/OrganizationPage/OrganizationPage";
import OrganizationsPage from "./pages/OrganizationsPage/OrganizationsPage";
import RegisterPage from "./pages/RegisterPage/RegisterPage";
import RepositoriesPage from "./pages/RepositoriesPage/RepositoriesPage";
import RepositoryDetailPage from "./pages/RepositoryPage/RepositoryDetailPage";
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

      <Route
        path="/repositories"
        element={
          <ProtectedRoute>
            <Layout pageTitle="Repositories">
              <RepositoriesPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/repositories/:id"
        element={
          <ProtectedRoute>
            <Layout pageTitle="Repository">
              <RepositoryDetailPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/organizations"
        element={
          <ProtectedRoute>
            <Layout pageTitle="Organizations">
              <OrganizationsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/organizations/:orgName"
        element={
          <ProtectedRoute>
            <Layout pageTitle="Organization">
              <OrganizationDetailPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/landing" replace />} />
    </Routes>
  );
}
