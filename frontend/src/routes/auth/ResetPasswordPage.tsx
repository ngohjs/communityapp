import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { apiClient, toApiError } from "@/lib/api/client";

type ResetPasswordPayload = {
  token: string;
  new_password: string;
};

type MessageResponse = {
  message: string;
};

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const mutation = useMutation<MessageResponse, Error, ResetPasswordPayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<MessageResponse>("/auth/reset-password", payload);
      return data;
    }
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationError(null);
    mutation.reset();

    if (password !== confirmPassword) {
      setValidationError("Passwords do not match.");
      return;
    }

    mutation.mutate({ token, new_password: password });
  };

  const error =
    validationError ?? (mutation.error ? toApiError(mutation.error).message : null);

  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-10 shadow-xl shadow-indigo-500/10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-white">Reset password</h1>
        <p className="text-sm text-slate-400">
          Paste the reset token from the password recovery email and choose your new password. Tokens are valid
          for 30 minutes and expire after first use.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 md:gap-6">
        <label className="flex flex-col gap-2 text-sm md:col-span-2">
          <span className="text-slate-300">Reset token</span>
          <input
            type="text"
            name="token"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            required
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/40"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-300">New password</span>
          <input
            type="password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
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
            minLength={8}
            autoComplete="new-password"
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/40"
          />
        </label>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="md:col-span-2 inline-flex items-center justify-center rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground shadow-lg transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {mutation.isPending ? "Resetting password…" : "Reset password"}
        </button>
      </form>

      {error ? (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {mutation.data ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-200">
          <p className="font-semibold text-emerald-100">{mutation.data.message}</p>
          <p className="mt-2 text-emerald-200/70">
            You can now sign in with your new password. Any outstanding reset tokens have been invalidated.
          </p>
        </div>
      ) : null}
    </section>
  );
}

export default ResetPasswordPage;
