import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { TerraAlert, TerraBadge, TerraButton, TerraCard, TerraField, TerraInput } from "@/components/ui/terra";
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
    <TerraCard
      title="Forgot your password?"
      eyebrow={<TerraBadge tone="info">Reset access</TerraBadge>}
      action={<span className="text-body-sm text-ink-500">We’ll email a reset token</span>}
      className="max-w-2xl"
    >
      <p className="text-body-sm text-ink-600">
        Enter the email address associated with your account. We’ll send a reset link via the notification stub provider.
        The token can be used on the reset page to update your password.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TerraField label="Email address" htmlFor="email" required>
          <TerraInput
            id="email"
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
        </TerraField>

        <div className="flex justify-end">
          <TerraButton type="submit" isLoading={mutation.isPending} loadingText="Sending reset link…">
            Send reset link
          </TerraButton>
        </div>
      </form>

      {error ? (
        <TerraAlert tone="danger" title="Request failed">
          {error}
        </TerraAlert>
      ) : null}

      {mutation.data ? (
        <TerraAlert tone="success" title="Email dispatched">
          {mutation.data.message}
          <br />
          Check the server logs for the reset token emitted by the stub provider, then continue to the reset form.
        </TerraAlert>
      ) : null}
    </TerraCard>
  );
}

export default ForgotPasswordPage;
