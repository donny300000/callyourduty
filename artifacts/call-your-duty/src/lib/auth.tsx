import { createContext, useContext, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetCurrentUser, useLogout, getGetCurrentUserQueryKey, type User } from "@workspace/api-client-react";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue>({ user: null, isLoading: true, logout: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useGetCurrentUser({ query: { retry: false, queryKey: getGetCurrentUserQueryKey() } });
  const logoutMutation = useLogout();

  const logout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        queryClient.clear();
        queryClient.setQueryData(getGetCurrentUserQueryKey(), null);
      },
    });
  };

  return <AuthContext.Provider value={{ user: user ?? null, isLoading, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
