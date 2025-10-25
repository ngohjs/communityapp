import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import { TerraAlert, TerraCard, TerraField, terraButtonClass } from "@/components/ui/terra";
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
    <TerraCard
      title="Create an account"
      eyebrow={<span className="terra-badge">New member</span>}
      action={
        <span className="text-body-sm text-ink-500">
          Already have an account? <Link to="/auth/login" className="text-accent-verdant underline-offset-4">Sign in</Link>
        </span>
      }
      className="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 md:gap-6">
        <TerraField label="First name">
          <input
            type="text"
            name="first_name"
            value={values.first_name}
            onChange={(event) => setValues((prev) => ({ ...prev, first_name: event.target.value }))}
            required
            autoComplete="given-name"
            className="terra-input"
          />
        </TerraField>

        <TerraField label="Last name">
          <input
            type="text"
            name="last_name"
            value={values.last_name}
            onChange={(event) => setValues((prev) => ({ ...prev, last_name: event.target.value }))}
            required
            autoComplete="family-name"
            className="terra-input"
          />
        </TerraField>

        <TerraField label="Email address" className="md:col-span-2">
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
            autoComplete="new-password"
            minLength={8}
            className="terra-input"
          />
        </TerraField>

        <TerraField label="Confirm password">
          <input
            type="password"
            name="confirm_password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            autoComplete="new-password"
            minLength={8}
            className="terra-input"
          />
        </TerraField>

        <div className="md:col-span-2 flex justify-end">
          <button type="submit" disabled={mutation.isPending} className={terraButtonClass("primary")}>
            {mutation.isPending ? "Creating account…" : "Create account"}
          </button>
        </div>
      </form>

      {error ? (
        <TerraAlert tone="danger" title="Registration failed">
          {error}
        </TerraAlert>
      ) : null}

      {mutation.data ? (
        <TerraAlert tone="info" title="Account created">
          Account created for {mutation.data.email}. Status: {mutation.data.status}.<br />
          Use the verification token below to confirm the account. In production this would be emailed via the notifications service.
          <code className="mt-3 block rounded-md bg-[rgba(46,59,69,0.1)] px-4 py-3 text-xs text-ink-700">
            {mutation.data.verification_token}
          </code>
          <span className="mt-2 block text-xs text-ink-500">
            You can copy the token and visit the <Link to="/auth/verify-email" className="text-accent-verdant underline">verification page</Link> to complete the flow.
          </span>
        </TerraAlert>
      ) : null}
    </TerraCard>
  );
}

export default RegisterPage;
