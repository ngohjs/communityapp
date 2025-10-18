import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import { apiClient, toApiError } from "@/lib/api/client";

type RegisterPayload = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
};

type RegisterResponse = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  status: string;
  created_at: string;
  verification_token: string;
};

function RegisterPage() {
  const [values, setValues] = useState<RegisterPayload>({
    first_name: "",
    last_name: "",
    email: "",
    password: ""
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const mutation = useMutation<RegisterResponse, Error, RegisterPayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<RegisterResponse>("/auth/register", payload);
      return data;
    }
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationError(null);
    mutation.reset();

    if (values.password !== confirmPassword) {
      setValidationError("Passwords do not match.");
      return;
    }

    mutation.mutate(values);
  };

  const error = validationError ?? (mutation.error ? toApiError(mutation.error).message : null);

  return (
    <section className="flex flex-col gap-8 rounded-3xl border border-slate-800 bg-slate-900/60 p-10 shadow-xl shadow-indigo-500/10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-white">Create an account</h1>
        <p className="text-sm text-slate-400">
          Join the Community App to access exclusive content. Already have an account?{" "}
          <Link to="/auth/login" className="font-semibold text-brand">
            Sign in
          </Link>
          .
        </p>
      </header>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 md:gap-6">
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-300">First name</span>
          <input
            type="text"
            name="first_name"
            value={values.first_name}
            onChange={(event) => setValues((prev) => ({ ...prev, first_name: event.target.value }))}
            required
            autoComplete="given-name"
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/40"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-300">Last name</span>
          <input
            type="text"
            name="last_name"
            value={values.last_name}
            onChange={(event) => setValues((prev) => ({ ...prev, last_name: event.target.value }))}
            required
            autoComplete="family-name"
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/40"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm md:col-span-2">
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
            autoComplete="new-password"
            minLength={8}
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/40"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-300">Confirm password</span>
          <input
            type="password"
            name="confirm_password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            autoComplete="new-password"
            minLength={8}
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/40"
          />
        </label>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="md:col-span-2 inline-flex items-center justify-center rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground shadow-lg transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {mutation.isPending ? "Creating account…" : "Create account"}
        </button>
      </form>

      {error ? (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {mutation.data ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-200">
          <p className="font-semibold text-emerald-100">
            Account created for {mutation.data.email}. Status: {mutation.data.status}.
          </p>
          <p className="mt-2 text-emerald-200/80">
            Use the verification token below to confirm the account. In production this would be emailed via the
            notifications service.
          </p>
          <code className="mt-3 block rounded-md bg-slate-950/60 px-4 py-3 text-xs text-emerald-100">
            {mutation.data.verification_token}
          </code>
          <p className="mt-2 text-xs text-emerald-200/70">
            You can copy the token and visit the{" "}
            <Link to="/auth/verify-email" className="font-semibold text-brand">
              verification page
            </Link>{" "}
            to complete the flow.
          </p>
        </div>
      ) : null}
    </section>
  );
}

export default RegisterPage;
