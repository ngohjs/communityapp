import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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
    <section className="flex flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-10 text-center shadow-xl shadow-indigo-500/10">
      <h1 className="text-3xl font-semibold text-white">Logging out</h1>
      <p className="text-sm text-slate-400">
        We&apos;re clearing your refresh session cookie with the backend. This page will update once the request
        completes.
      </p>

      {status === "pending" ? (
        <p className="rounded-xl border border-slate-700 bg-slate-900/80 px-5 py-4 text-sm text-slate-300">
          Signing you out…
        </p>
      ) : null}

      {status === "success" ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-200">
          <p className="font-semibold text-emerald-100">You are now signed out.</p>
          <p className="mt-2 text-emerald-200/70">
            The refresh cookie is cleared. You can{" "}
            <Link to="/auth/login" className="font-semibold text-brand">
              log in again
            </Link>{" "}
            or return to the{" "}
            <Link to="/" className="font-semibold text-brand">
              home page
            </Link>
            .
          </p>
        </div>
      ) : null}
    </section>
  );
}

export default LogoutPage;
