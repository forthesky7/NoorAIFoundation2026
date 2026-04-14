import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useAuthStore } from "../lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function useAuth() {
  const token = useAuthStore((state) => state.token);
  const setToken = useAuthStore((state) => state.setToken);
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useGetMe({
    query: {
      enabled: !!token,
      queryKey: getGetMeQueryKey(),
      retry: false,
    },
  });

  useEffect(() => {
    if (error) {
      setToken(null);
      queryClient.removeQueries({ queryKey: getGetMeQueryKey() });
    }
  }, [error, setToken, queryClient]);

  return {
    user: token ? user : null,
    isLoading: !!token && isLoading,
    isAuthenticated: !!token && !!user,
    token,
    setToken,
  };
}
