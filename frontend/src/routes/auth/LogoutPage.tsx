import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { TerraAlert, TerraCard } from "@/components/ui/terra";
import { useAuth } from "@/providers/AuthProvider";

function LogoutPage() {
  const { logout } = useAuth();
  const [status, setStatus] = useState<"pending" | "success">("pending");

  useEffect(() => {
    let mounted = true;
    (async () => {
      await logout();
      if (mounted) {
        setStatus("success");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [logout]);

  return (
    <TerraCard
      title="Logging out"
      eyebrow={<span className="terra-badge">Session</span>}
      action={<span className="text-body-sm text-ink-500">We’ll clear your refresh cookie</span>}
      className="max-w-xl text-center"
    >
      <p className="text-body-sm text-ink-600">
        We’re clearing your refresh session cookie with the backend. This page will update once the request completes.
      </p>

      {status === "pending" ? <TerraAlert tone="info">Signing you out…</TerraAlert> : null}

      {status === "success" ? (
        <TerraAlert tone="info" title="You are now signed out.">
          The refresh cookie is cleared. You can <Link to="/auth/login" className="text-accent-verdant underline">log in again</Link> or return to the {" "}
          <Link to="/" className="text-accent-verdant underline">home page</Link>.
        </TerraAlert>
      ) : null}
    </TerraCard>
  );
}

export default LogoutPage;
