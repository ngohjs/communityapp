import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import { TerraAlert, TerraCard, TerraField, terraButtonClass } from "@/components/ui/terra";
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

  const error = mutation.error ? toApiError(mutation.error).message : lastError ? lastError : null;

  return (
    <TerraCard
      title="Log in"
      eyebrow={<span className="terra-badge">Member access</span>}
      action={
        <span className="text-body-sm text-ink-500">
          Need an account? <Link to="/auth/register" className="text-accent-verdant underline-offset-4">Register instead</Link>
        </span>
      }
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TerraField label="Email address">
          <input
            type="email"
            name="email"
            value={values.email}
            onChange={(event) => setValues((prev) => ({ ...prev, email: event.target.value }))}
            required
            autoComplete="email"
            className="terra-input"
          />
        </TerraField>

        <TerraField label="Password">
          <input
            type="password"
            name="password"
            value={values.password}
            onChange={(event) => setValues((prev) => ({ ...prev, password: event.target.value }))}
            required
            autoComplete="current-password"
            className="terra-input"
          />
        </TerraField>

        <div className="flex items-center justify-between text-body-sm">
          <Link to="/auth/forgot-password" className="text-accent-verdant hover:underline">
            Forgot your password?
          </Link>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={mutation.isPending} className={terraButtonClass("primary")}>
            {mutation.isPending ? "Signing in…" : "Sign in"}
          </button>
        </div>
      </form>

      {error ? (
        <TerraAlert tone="danger" title="Authentication failed">
          {error}
        </TerraAlert>
      ) : null}

      {mutation.data ? (
        <TerraAlert tone="info" title="Success">
          {authMessage}
          <br />
          Your session is active. You can continue browsing protected areas without re-authenticating.
        </TerraAlert>
      ) : null}
    </TerraCard>
  );
}

export default LoginPage;
