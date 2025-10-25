import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { TerraAlert, TerraCard, TerraField, terraButtonClass } from "@/components/ui/terra";
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
      eyebrow={<span className="terra-badge">Security</span>}
      action={<span className="text-body-sm text-ink-500">Tokens expire after 30 minutes</span>}
      className="max-w-3xl"
    >
      <p className="text-body-sm text-ink-600">
        Paste the reset token from the password recovery email and choose your new password. Tokens are valid for 30 minutes and expire after first use.
      </p>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 md:gap-6">
        <TerraField label="Reset token" className="md:col-span-2">
          <input
            type="text"
            name="token"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            required
            className="terra-input"
          />
        </TerraField>

        <TerraField label="New password">
          <input
            type="password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
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
            minLength={8}
            autoComplete="new-password"
            className="terra-input"
          />
        </TerraField>

        <div className="md:col-span-2 flex justify-end">
          <button type="submit" disabled={mutation.isPending} className={terraButtonClass("primary")}>
            {mutation.isPending ? "Resetting password…" : "Reset password"}
          </button>
        </div>
      </form>

      {error ? (
        <TerraAlert tone="danger" title="Update failed">
          {error}
        </TerraAlert>
      ) : null}

      {mutation.data ? (
        <TerraAlert tone="info" title="Password updated">
          {mutation.data.message}
          <br />
          You can now sign in with your new password. Any outstanding reset tokens have been invalidated.
        </TerraAlert>
      ) : null}
    </TerraCard>
  );
}

export default ResetPasswordPage;
