import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { apiClient, toApiError } from "@/lib/api/client";

type ForgotPasswordPayload = {
  email: string;
};

type MessageResponse = {
  message: string;
};

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");

  const mutation = useMutation<MessageResponse, Error, ForgotPasswordPayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<MessageResponse>("/auth/forgot-password", payload);
      return data;
    }
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.reset();
    mutation.mutate({ email });
  };

  const error = mutation.error ? toApiError(mutation.error).message : null;

  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-10 shadow-xl shadow-indigo-500/10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-white">Forgot your password?</h1>
        <p className="text-sm text-slate-400">
          Enter the email address associated with your account. We&apos;ll send a reset link via the notification
          stub provider. The token can be used on the reset page to update your password.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-300">Email address</span>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/40"
          />
        </label>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="mt-2 inline-flex items-center justify-center rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground shadow-lg transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {mutation.isPending ? "Sending reset link…" : "Send reset link"}
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
            Check the server logs for the reset token emitted by the stub provider, then continue to the reset form.
          </p>
        </div>
      ) : null}
    </section>
  );
}

export default ForgotPasswordPage;
