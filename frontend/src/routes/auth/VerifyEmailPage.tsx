import { FormEvent, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { TerraAlert, TerraBadge, TerraButton, TerraCard, TerraField, TerraInput } from "@/components/ui/terra";
import { apiClient, toApiError } from "@/lib/api/client";

type VerifyResponse = {
  id: string;
  email: string;
  status: string;
  verified: boolean;
  activated: boolean;
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
    <TerraCard
      title="Verify your email"
      eyebrow={<TerraBadge tone="success">Account security</TerraBadge>}
      action={<span className="text-body-sm text-ink-500">Tokens typically delivered via the notification stub</span>}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TerraField label="Verification token" htmlFor="token" required>
          <TerraInput
            id="token"
            type="text"
            name="token"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            required
          />
        </TerraField>
        <div className="flex justify-end">
          <TerraButton type="submit" isLoading={mutation.isPending} loadingText="Verifying…">
            Verify email
          </TerraButton>
        </div>
      </form>

      {error ? (
        <TerraAlert tone="danger" title="Verification failed">
          {error}
        </TerraAlert>
      ) : null}

      {mutation.data ? (
        <TerraAlert tone="success" title="Email verified successfully!">
          <ul className="mt-2 space-y-1 text-body-sm">
            <li>
              <strong>Email:</strong> {mutation.data.email}
            </li>
            <li>
              <strong>Status:</strong> {mutation.data.status}
            </li>
            <li>
              <strong>Verified:</strong> {mutation.data.verified ? "Yes" : "No"}
            </li>
            <li>
              <strong>Activation result:</strong> {mutation.data.activated ? "Account activated during this request" : "Already verified"}
            </li>
          </ul>
        </TerraAlert>
      ) : null}
    </TerraCard>
  );
}

export default VerifyEmailPage;
