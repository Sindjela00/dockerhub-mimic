import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Button from "@/components/Button/Button";
import { acceptOrganizationInvite } from "@/services/organizations/organizations.api";
import { useAuth } from "@/context/AppContext";

type Status = "loading" | "success" | "error" | "invalid";

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [status, setStatus] = useState<Status>("loading");
  const [orgName, setOrgName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>(
    "Something went wrong.",
  );

  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const inviteToken = searchParams.get("token");

    if (!inviteToken) {
      setStatus("invalid");
      return;
    }

    if (!isLoggedIn) {
      const returnTo = `/invites/accept?token=${inviteToken}`;
      navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`, {
        replace: true,
      });
      return;
    }

    acceptOrganizationInvite(inviteToken)
      .then((res: any) => {
        setOrgName(res?.organizationName ?? null);
        setStatus("success");
      })
      .catch((err: any) => {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "The invite link is invalid or has expired.";
        setErrorMessage(msg);
        setStatus("error");
      });
  }, [searchParams, isLoggedIn]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-surface border border-border rounded-xl p-8 flex flex-col items-center gap-5 text-center shadow-sm">
          {status === "loading" && (
            <>
              <div className="p-3 rounded-full bg-surface-secondary border border-border">
                <Loader2 size={24} className="text-text-muted animate-spin" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-text-primary">
                  Accepting invite...
                </h1>
                <p className="text-xs text-text-muted mt-1">
                  Please wait while we process your invitation.
                </p>
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <div className="p-3 rounded-full bg-success-muted border border-success">
                <CheckCircle2 size={24} className="text-success" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-text-primary">
                  You're in!
                </h1>
                <p className="text-xs text-text-muted mt-1">
                  {orgName
                    ? `You've successfully joined ${orgName}.`
                    : "You've successfully joined the organization."}
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full pt-1">
                {orgName && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => navigate(`/organizations/${orgName}`)}
                  >
                    Go to organization
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate("/")}
                  className="flex justify-center items-center"
                >
                  <p className="flex text-center">Go to dashboard</p>
                </Button>
              </div>
            </>
          )}

          {(status === "error" || status === "invalid") && (
            <>
              <div className="p-3 rounded-full bg-error-muted border border-error">
                <XCircle size={24} className="text-error" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-text-primary">
                  {status === "invalid"
                    ? "Invalid invite link"
                    : "Invite failed"}
                </h1>
                <p className="text-xs text-text-muted mt-1">
                  {status === "invalid"
                    ? "No invite token found in the URL. Check that you opened the correct link."
                    : errorMessage}
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate("/")}
                className="flex justify-center items-center"
              >
                <p className="flex text-center">Go to dashboard</p>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
