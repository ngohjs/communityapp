import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toApiError } from "@/lib/api/client";
import {
  Profile,
  ProfileUpdatePayload,
  fetchMyProfile,
  fetchProfileById,
  updateMyProfile,
  uploadAvatar,
  updatePrivacy,
  PrivacyUpdatePayload,
  updatePreferences,
  PreferencesUpdatePayload
} from "@/lib/api/profile";

const PROFILE_QUERY_KEY = ["profile", "me"] as const;
export const profileDetailKey = (userId: string) => ["profile", userId] as const;

export function useProfileQuery() {
  const query = useQuery<Profile, Error>({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: fetchMyProfile
  });

  return {
    ...query,
    profile: query.data,
    errorMessage: query.error ? toApiError(query.error).message : null
  };
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation<Profile, Error, ProfileUpdatePayload>({
    mutationFn: updateMyProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, profile);
    }
  });
}

export function useUploadAvatarMutation() {
  const queryClient = useQueryClient();
  return useMutation<Profile, Error, File>({
    mutationFn: uploadAvatar,
    onSuccess: (profile) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, profile);
    }
  });
}

export function useUpdatePrivacyMutation() {
  const queryClient = useQueryClient();
  return useMutation<Profile, Error, PrivacyUpdatePayload, { previousProfile?: Profile }>({
    mutationFn: updatePrivacy,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: PROFILE_QUERY_KEY });
      const previousProfile = queryClient.getQueryData<Profile>(PROFILE_QUERY_KEY);
      if (previousProfile) {
        queryClient.setQueryData(PROFILE_QUERY_KEY, { ...previousProfile, privacy_level: payload.privacy_level });
      }
      return { previousProfile };
    },
    onError: (_err, _payload, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(PROFILE_QUERY_KEY, context.previousProfile);
      }
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, profile);
    }
  });
}

export function useUpdatePreferencesMutation() {
  const queryClient = useQueryClient();
  return useMutation<Profile, Error, PreferencesUpdatePayload, { previousProfile?: Profile }>({
    mutationFn: updatePreferences,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: PROFILE_QUERY_KEY });
      const previousProfile = queryClient.getQueryData<Profile>(PROFILE_QUERY_KEY);
      if (previousProfile) {
        queryClient.setQueryData(PROFILE_QUERY_KEY, {
          ...previousProfile,
          notify_content:
            payload.notify_content ?? previousProfile.notify_content,
          notify_community:
            payload.notify_community ?? previousProfile.notify_community,
          notify_account:
            payload.notify_account ?? previousProfile.notify_account,
        });
      }
      return { previousProfile };
    },
    onError: (_err, _payload, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(PROFILE_QUERY_KEY, context.previousProfile);
      }
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, profile);
    }
  });
}

export function useProfileDetailQuery(userId: string | undefined) {
  return useQuery<Profile, Error>({
    queryKey: profileDetailKey(userId ?? ""),
    queryFn: async () => {
      if (!userId) {
        throw new Error("Missing user id");
      }
      return fetchProfileById(userId);
    },
    enabled: Boolean(userId)
  });
}
