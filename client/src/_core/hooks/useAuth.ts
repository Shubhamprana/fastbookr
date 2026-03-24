import { supabase } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useEffect, useMemo, useState } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false } = options ?? {};
  const utils = trpc.useUtils();
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().finally(() => {
      if (mounted) {
        setSessionReady(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void utils.auth.me.invalidate();
      if (mounted) {
        setSessionReady(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [utils.auth.me]);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    enabled: sessionReady,
    refetchOnWindowFocus: false,
  });

  const state = useMemo(() => {
    const user = meQuery.data ?? null;
    localStorage.setItem("manus-runtime-user-info", JSON.stringify(user));

    return {
      user,
      loading: !sessionReady || meQuery.isLoading,
      error: meQuery.error ?? null,
      isAuthenticated: Boolean(user),
    };
  }, [meQuery.data, meQuery.error, meQuery.isLoading, sessionReady]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (state.loading) return;
    if (state.user) return;

    window.location.href = "/auth";
  }, [redirectOnUnauthenticated, state.loading, state.user]);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  };

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    login: async () => {
      window.location.href = "/auth";
    },
    logout,
  };
}
