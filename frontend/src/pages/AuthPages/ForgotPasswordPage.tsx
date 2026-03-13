import Button from "../../components/Button/Button";
import InputField from "../../components/InputField/InputField";
import { Link } from "react-router-dom";
import Logo from "../../components/Logo/Logo";
import { Mail } from "lucide-react";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    setError("");
    setSubmitted(true);
    // TODO: call API for reset
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
                <Mail size={18} />
              </div>
              <h1 className="text-lg font-semibold text-text-primary">
                Check your inbox
              </h1>
              <p className="text-sm text-text-muted leading-relaxed">
                If an account exists for{" "}
                <span className="text-text-primary font-medium">{email}</span>,
                you'll receive a password reset link shortly.
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
                Forgot password?
              </h1>
              <p className="text-sm text-text-muted mb-6">
                Enter your email and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <InputField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  error={error}
                />

                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  className="w-full justify-center mt-2"
                >
                  <Mail size={15} />
                  Send reset link
                </Button>
              </form>
            </>
          )}
        </div>

        {!submitted && (
          <p className="text-center text-xs text-text-muted mt-4">
            Remember your password?{" "}
            <Link to="/login" className="text-brand hover:underline">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
