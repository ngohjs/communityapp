import { Link } from "react-router-dom";

import { useAuth } from "@/providers/AuthProvider";

function HomePage() {
  const { user, isAuthenticated } = useAuth();

  return (
    <section className="flex flex-col gap-10 rounded-3xl border border-slate-800 bg-slate-900/60 p-10 shadow-2xl shadow-indigo-500/20 backdrop-blur">
      <div className="max-w-2xl space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          {isAuthenticated ? `Welcome back, ${user?.first_name}!` : "Welcome to the Community App"}
        </h1>
        <p className="text-base text-slate-300 md:text-lg">
          The frontend now includes live authentication flows wired to the FastAPI backend. Explore the
          registration, verification, login, logout, and password recovery screens to verify the end-to-end
          experience.
        </p>
        <p className="text-sm text-slate-400">
          The next sub-task introduces persistent auth context with token refresh handling so the SPA can stay
          in sync with the backend session.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/auth/login"
          className="rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground shadow-lg shadow-brand/30 transition hover:bg-indigo-500"
        >
          Go to Login
        </Link>
        <Link
          to="/auth/register"
          className="rounded-lg border border-slate-700 px-5 py-3 text-sm font-semibold text-white transition hover:border-slate-500 hover:text-slate-100"
        >
          Register
        </Link>
        <Link
          to="/auth/forgot-password"
          className="rounded-lg border border-slate-800 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white"
        >
          Forgot Password
        </Link>
        <Link
          to="/auth/verify-email"
          className="rounded-lg border border-slate-800 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white"
        >
          Verify Email
        </Link>
        <Link
          to="/auth/logout"
          className="rounded-lg border border-slate-800 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white"
        >
          Logout
        </Link>
      </div>
    </section>
  );
}

export default HomePage;
