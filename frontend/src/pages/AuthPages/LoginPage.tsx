import { Link, useNavigate } from "react-router-dom";

import Button from "../../components/Button/Button";
import InputField from "../../components/InputField/InputField";
import { LogIn } from "lucide-react";
import Logo from "../../components/Logo/Logo";
import { useState } from "react";

interface FormState {
  email: string;
  password: string;
}

export default function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({ email: "", password: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: auth logika
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center py-2">
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
            />
            <InputField
              label="Password"
              type="password"
              value={form.password}
              onChange={(v) => setForm((f) => ({ ...f, password: v }))}
              placeholder="••••••••"
            />

            <Button
              variant="primary"
              size="md"
              type="submit"
              className="w-full justify-center mt-2"
            >
              <LogIn size={15} />
              Sign in
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-text-muted mt-4">
          Don't have an account?{" "}
          <Link to="/register" className="text-brand hover:underline">
            Register
          </Link>
        </p>
        <p className="text-center text-xs text-text-muted mt-4">
          <Link
            to="/forgot-password"
            className="text-xs text-brand hover:underline"
          >
            Forgot password?
          </Link>
        </p>
      </div>
    </div>
  );
}
