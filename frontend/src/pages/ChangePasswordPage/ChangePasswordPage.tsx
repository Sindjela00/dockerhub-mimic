import Button from "../../components/Button/Button";
import InputField from "../../components/InputField/InputField";
import { KeyRound } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Logo from "../../components/Logo/Logo";
import { useAppContext } from "../../context/AppContext";
import { useChangePassword } from "../../services/auth/useChangePassword/useChangePassword";
import { useState } from "react";

interface FormState {
  email: string;
  oldPassword: string;
  newPassword: string;
}

export default function ChangePasswordPage() {
  const [searchParams] = useSearchParams();
  const forced = searchParams.get("forced") === "true";
  const navigate = useNavigate();
  const {
    auth: { email: currentEmail, username },
    setAuth,
  } = useAppContext();

  const [form, setForm] = useState<FormState>({
    email: forced ? currentEmail : "",
    oldPassword: "",
    newPassword: "",
  });
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [submitted, setSubmitted] = useState(false);
  const { loading, error, handleChangePassword } = useChangePassword();

  const validate = (): boolean => {
    const next: Partial<FormState> = {};

    if (!form.email.includes("@")) next.email = "Enter a valid email address.";

    if (!form.oldPassword) next.oldPassword = "Old password is required.";

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.newPassword))
      next.newPassword =
        "Password must be at least 8 characters long and include uppercase, lowercase letters, and numbers.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const response = await handleChangePassword({
      email: form.email,
      oldPassword: form.oldPassword,
      newPassword: form.newPassword,
    });

    if (!response) return;

    if (forced) {
      setAuth(response.token, response.role, username, false);
      navigate("/", { replace: true });
    } else {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo size="md" />
        </div>

        <div className="bg-bg-surface border border-border rounded-xl px-8 py-8">
          {submitted ? (
            <div className="flex flex-col items-center text-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center
                              bg-success-muted text-success"
              >
                <KeyRound size={18} />
              </div>
              <h1 className="text-lg font-semibold text-text-primary">
                Password changed
              </h1>
              <p className="text-sm text-text-muted leading-relaxed">
                Your password has been updated successfully.
              </p>
              <Link
                to="/login"
                className="mt-2 text-xs text-brand hover:underline"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-text-primary mb-1">
                {forced ? "You must change your password" : "Change password"}
              </h1>
              <p className="text-sm text-text-muted mb-6">
                {forced
                  ? "This is your first login with a temporary password. Set a new password to continue."
                  : "Enter your email and current password to set a new one."}
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {!forced && (
                  <InputField
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                    placeholder="you@example.com"
                    error={errors.email}
                  />
                )}
                <InputField
                  label="Old password"
                  type="password"
                  value={form.oldPassword}
                  onChange={(v) => setForm((f) => ({ ...f, oldPassword: v }))}
                  placeholder="••••••••"
                  error={errors.oldPassword}
                />
                <InputField
                  label="New password"
                  type="password"
                  value={form.newPassword}
                  onChange={(v) => setForm((f) => ({ ...f, newPassword: v }))}
                  placeholder="••••••••"
                  error={errors.newPassword}
                />

                {error && <p className="text-xs text-danger">{error}</p>}

                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  className="w-full justify-center mt-2"
                >
                  <KeyRound size={15} />
                  Change password
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
