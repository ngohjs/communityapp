import { FormEvent, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { apiClient, toApiError } from "@/lib/api/client";

type VerifyResponse = {
  id: string;
  email: string;
  status: string;
  verified: boolean;
};

function VerifyEmailPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") ?? "");

  const mutation = useMutation<VerifyResponse, Error, string>({
    mutationFn: async (verificationToken) => {
      const { data } = await apiClient.get<VerifyResponse>("/auth/verify", {
        params: { token: verificationToken }
      });
      return data;
    }
  });

  useEffect(() => {
    if (token && !mutation.isSuccess && !mutation.isPending) {
      mutation.mutate(token);
    }
    // we deliberately ignore mutation dependencies to avoid re-triggering after success
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.reset();
    mutation.mutate(token);
    setSearchParams(token ? { token } : {});
  };

  const error = mutation.error ? toApiError(mutation.error).message : null;

  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-10 shadow-xl shadow-indigo-500/10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-white">Verify your email</h1>
        <p className="text-sm text-slate-400">
          Paste the verification token you received after registration. Tokens are typically delivered via the
          notification stub until a real email provider is connected.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-300">Verification token</span>
          <input
            type="text"
            name="token"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            required
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/40"
          />
        </label>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="inline-flex items-center justify-center rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground shadow-lg transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {mutation.isPending ? "Verifying…" : "Verify email"}
        </button>
      </form>

      {error ? (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {mutation.data ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-200">
          <p className="font-semibold text-emerald-100">Email verified successfully!</p>
          <ul className="mt-2 space-y-1 text-emerald-200/80">
            <li>
              <strong>Email:</strong> {mutation.data.email}
            </li>
            <li>
              <strong>Status:</strong> {mutation.data.status}
            </li>
            <li>
              <strong>Verified:</strong> {mutation.data.verified ? "Yes" : "No"}
            </li>
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export default VerifyEmailPage;
