import Button from "../../components/Button/Button";
import { FormState } from "./types/types";
import InputField from "../../components/InputField/InputField";
import { Link } from "react-router-dom";
import Logo from "../../components/Logo/Logo";
import { UserPlus } from "lucide-react";
import { useRegister } from "../../services/auth/useRegister/useRegister";
import { useState } from "react";

export default function RegisterPage() {
  const { loading, error, handleRegister } = useRegister();

  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
  });

  const [validationErrors, setValidationErrors] = useState<Partial<FormState>>(
    {},
  );

  const validate = (): boolean => {
    const next: Partial<FormState> = {};

    if (!form.email.includes("@")) next.email = "Enter a valid email address.";

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.password))
      next.password =
        "Password must be at least 8 characters long and include uppercase, lowercase letters, and numbers.";

    if (form.password !== form.confirmPassword)
      next.confirmPassword = "Passwords do not match.";

    if (!form.username || form.username.length < 3)
      next.username = "Username must be at least 3 characters.";

    setValidationErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    handleRegister({
      email: form.email,
      password: form.password,
      username: form.username,
    });
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
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
              label="Username"
              type="text"
              value={form.username}
              onChange={(v) => setForm((f) => ({ ...f, username: v }))}
              placeholder="username"
              error={validationErrors.username}
            />
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
              onChange={(v: any) => setForm((f) => ({ ...f, password: v }))}
              placeholder="••••••••"
              error={validationErrors.password}
            />
            <InputField
              label="Confirm password"
              type="password"
              value={form.confirmPassword}
              onChange={(v: any) =>
                setForm((f) => ({ ...f, confirmPassword: v }))
              }
              placeholder="••••••••"
              error={validationErrors.confirmPassword}
            />

            {error && <p className="text-xs text-danger">{error}</p>}

            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={loading}
              className="w-full justify-center mt-2"
            >
              <UserPlus size={15} />
              {loading ? "Creating account..." : "Create account"}
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
