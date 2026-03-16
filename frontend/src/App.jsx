import { Route, Routes } from "react-router-dom";

import ForgotPasswordPage from "./pages/AuthPages/ForgotPasswordPage";
import HomePage from "./pages/HomePage/HomePage";
import LandingPage from "./pages/LandingPage/LandingPage";
import Layout from "./components/Layout";
import LoginPage from "./pages/AuthPages/LoginPage";
import Logo from "./components/Logo/Logo";
import RegisterPage from "./pages/AuthPages/RegisterPage";

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Layout pageTitle="Home">
            <HomePage />
          </Layout>
        }
      />
      <Route
        path="/landing"
        element={
          <Layout
            pageTitle={
              <div className="flex gap-2 justify-center items-center">
                <Logo size="sm" />
                <p className="text-sm">Docker hub</p>
              </div>
            }
          >
            <LandingPage />
          </Layout>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    </Routes>
  );
}
