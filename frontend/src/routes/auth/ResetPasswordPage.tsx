import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { TerraAlert, TerraBadge, TerraButton, TerraCard, TerraField, TerraInput } from "@/components/ui/terra";
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

  const error = validationError ?? (mutation.error ? toApiError(mutation.error).message : null);

  return (
    <TerraCard
      title="Reset password"
      eyebrow={<TerraBadge tone="info">Security</TerraBadge>}
      action={<span className="text-body-sm text-ink-500">Tokens expire after 30 minutes</span>}
      className="max-w-3xl"
    >
      <p className="text-body-sm text-ink-600">
        Paste the reset token from the password recovery email and choose your new password. Tokens are valid for 30 minutes and expire after first use.
      </p>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 md:gap-6">
        <TerraField label="Reset token" htmlFor="token" className="md:col-span-2" required>
          <TerraInput
            id="token"
            type="text"
            name="token"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            required
          />
        </TerraField>

        <TerraField label="New password" htmlFor="password" supportingText="Minimum 8 characters" required>
          <TerraInput
            id="password"
            type="password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
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
            minLength={8}
            autoComplete="new-password"
          />
        </TerraField>

        <div className="md:col-span-2 flex justify-end">
          <TerraButton type="submit" isLoading={mutation.isPending} loadingText="Resetting password…">
            Reset password
          </TerraButton>
        </div>
      </form>

      {error ? (
        <TerraAlert tone="danger" title="Update failed">
          {error}
        </TerraAlert>
      ) : null}

      {mutation.data ? (
        <TerraAlert tone="success" title="Password updated">
          {mutation.data.message}
          <br />
          You can now sign in with your new password. Any outstanding reset tokens have been invalidated.
        </TerraAlert>
      ) : null}
    </TerraCard>
  );
}

export default ResetPasswordPage;
