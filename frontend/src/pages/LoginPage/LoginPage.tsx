import Button from "../../components/Button/Button";
import InputField from "../../components/InputField/InputField";
import { Link } from "react-router-dom";
import { LogIn } from "lucide-react";
import Logo from "../../components/Logo/Logo";
import { useLogin } from "../../services/auth/useLogin/useLogin";
import { useState } from "react";

interface FormState {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { loading, error, handleLogin } = useLogin();

  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [validationErrors, setValidationErrors] = useState<Partial<FormState>>(
    {},
  );

  const validate = (): boolean => {
    const next: Partial<FormState> = {};

    if (!form.email.includes("@")) next.email = "Enter a valid email address.";

    if (!form.password) next.password = "Password is required.";

    setValidationErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    handleLogin({ email: form.email, password: form.password });
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo size="md" />
        </div>

        <div className="bg-bg-surface border border-border rounded-xl px-8 py-8">
          <h1 className="text-lg font-semibold text-text-primary mb-1">
            Welcome back
          </h1>
          <p className="text-sm text-text-muted mb-6">
            Sign in to your Docker Hub account.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <InputField
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => setForm((f) => ({ ...f, email: v }))}
              placeholder="you@example.com"
              error={validationErrors.email}
            />
            <InputField
              label="Password"
              type="password"
              value={form.password}
              onChange={(v) => setForm((f) => ({ ...f, password: v }))}
              placeholder="••••••••"
              error={validationErrors.password}
            />

            {error && <p className="text-xs text-danger">{error}</p>}

            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={loading}
              className="w-full justify-center mt-2"
            >
              <LogIn size={15} />
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-text-muted mt-4">
          Don't have an account?{" "}
          <Link to="/register" className="text-brand hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
