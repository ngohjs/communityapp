import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import { TerraAlert, TerraBadge, TerraButton, TerraCard, TerraField, TerraInput } from "@/components/ui/terra";
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
      eyebrow={<TerraBadge tone="success">New member</TerraBadge>}
      action={
        <span className="text-body-sm text-ink-500">
          Already have an account? <Link to="/auth/login" className="text-accent-verdant underline-offset-4">Sign in</Link>
        </span>
      }
      className="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 md:gap-6">
        <TerraField label="First name" htmlFor="first_name" required>
          <TerraInput
            id="first_name"
            type="text"
            name="first_name"
            value={values.first_name}
            onChange={(event) => setValues((prev) => ({ ...prev, first_name: event.target.value }))}
            required
            autoComplete="given-name"
          />
        </TerraField>

        <TerraField label="Last name" htmlFor="last_name" required>
          <TerraInput
            id="last_name"
            type="text"
            name="last_name"
            value={values.last_name}
            onChange={(event) => setValues((prev) => ({ ...prev, last_name: event.target.value }))}
            required
            autoComplete="family-name"
          />
        </TerraField>

        <TerraField label="Email address" htmlFor="email" supportingText="We’ll send verification instructions here" className="md:col-span-2">
          <TerraInput
            id="email"
            type="email"
            name="email"
            value={values.email}
            onChange={(event) => setValues((prev) => ({ ...prev, email: event.target.value }))}
            required
            autoComplete="email"
          />
        </TerraField>

        <TerraField label="Password" htmlFor="password" supportingText="Minimum 8 characters" required>
          <TerraInput
            id="password"
            type="password"
            name="password"
            value={values.password}
            onChange={(event) => setValues((prev) => ({ ...prev, password: event.target.value }))}
            required
            autoComplete="new-password"
            minLength={8}
          />
        </TerraField>

        <TerraField
          label="Confirm password"
          htmlFor="confirm_password"
          status={validationError ? "error" : "default"}
          validationText={validationError ?? undefined}
          required
        >
          <TerraInput
            id="confirm_password"
            type="password"
            name="confirm_password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            autoComplete="new-password"
            minLength={8}
          />
        </TerraField>

        <div className="md:col-span-2 flex justify-end">
          <TerraButton type="submit" isLoading={mutation.isPending} loadingText="Creating account…">
            Create account
          </TerraButton>
        </div>
      </form>

      {error ? (
        <TerraAlert tone="danger" title="Registration failed">
          {error}
        </TerraAlert>
      ) : null}

      {mutation.data ? (
        <TerraAlert tone="success" title="Account created">
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
