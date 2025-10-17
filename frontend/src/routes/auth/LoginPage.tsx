import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import { toApiError } from "@/lib/api/client";
import { useAuth } from "@/providers/AuthProvider";

type LoginPayload = {
  email: string;
  password: string;
};

type LoginResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_expires_at: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    status: string;
  };
};

function LoginPage() {
  const { login, lastError, clearError } = useAuth();
  const [values, setValues] = useState<LoginPayload>({
    email: "",
    password: ""
  });
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  const mutation = useMutation<LoginResponse, Error, LoginPayload>({
    mutationFn: async (payload) => {
      clearError();
      const response = await login(payload);
      return response;
    }
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.reset();
    mutation.mutate(values);
  };

  useEffect(() => {
    if (mutation.data) {
      setAuthMessage(`Welcome back, ${mutation.data.user.first_name}!`);
    }
  }, [mutation.data]);

  const error =
    mutation.error ? toApiError(mutation.error).message : lastError ? lastError : null;

  return (
    <section className="flex flex-col gap-8 rounded-3xl border border-slate-800 bg-slate-900/60 p-10 shadow-xl shadow-indigo-500/10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-white">Log in</h1>
        <p className="text-sm text-slate-400">
          Enter your email and password to access the Community App. Need an account?{" "}
          <Link to="/auth/register" className="font-semibold text-brand">
            Register instead
          </Link>
          .
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-300">Email address</span>
          <input
            type="email"
            name="email"
            value={values.email}
            onChange={(event) => setValues((prev) => ({ ...prev, email: event.target.value }))}
            required
            autoComplete="email"
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/40"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-300">Password</span>
          <input
            type="password"
            name="password"
            value={values.password}
            onChange={(event) => setValues((prev) => ({ ...prev, password: event.target.value }))}
            required
            autoComplete="current-password"
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/40"
          />
        </label>

        <div className="flex items-center justify-between text-sm">
          <Link to="/auth/forgot-password" className="text-brand hover:text-indigo-300">
            Forgot your password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="mt-2 inline-flex items-center justify-center rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground shadow-lg transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {mutation.isPending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {error ? (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {mutation.data ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-200">
          <p className="font-semibold text-emerald-100">{authMessage}</p>
          <p className="mt-1 text-emerald-200/80">
            Your session is active and the refresh token cookie is set. You can continue browsing protected
            areas without re-authenticating.
          </p>
        </div>
      ) : null}
    </section>
  );
}

export default LoginPage;
