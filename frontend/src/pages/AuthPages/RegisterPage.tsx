import { Link, useNavigate } from "react-router-dom";

import Button from "../../components/Button/Button";
import InputField from "../../components/InputField/InputField";
import Logo from "../../components/Logo/Logo";
import { UserPlus } from "lucide-react";
import { useState } from "react";

interface FormState {
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Partial<FormState>>({});

  const validate = (): boolean => {
    const next: Partial<FormState> = {};

    if (!form.email.includes("@")) next.email = "Enter a valid email address.";

    if (form.password.length < 8)
      next.password = "Password must be at least 8 characters.";

    if (form.password !== form.confirmPassword)
      next.confirmPassword = "Passwords do not match.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
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
            Create an account
          </h1>
          <p className="text-sm text-text-muted mb-6">
            Join Docker Hub and start managing your images.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <InputField
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => setForm((f) => ({ ...f, email: v }))}
              placeholder="you@example.com"
              error={errors.email}
            />
            <InputField
              label="Password"
              type="password"
              value={form.password}
              onChange={(v) => setForm((f) => ({ ...f, password: v }))}
              placeholder="••••••••"
              error={errors.password}
            />
            <InputField
              label="Confirm password"
              type="password"
              value={form.confirmPassword}
              onChange={(v) => setForm((f) => ({ ...f, confirmPassword: v }))}
              placeholder="••••••••"
              error={errors.confirmPassword}
            />

            <Button
              variant="primary"
              size="md"
              type="submit"
              className="w-full justify-center mt-2"
            >
              <UserPlus size={15} />
              Create account
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-text-muted mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-brand hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
